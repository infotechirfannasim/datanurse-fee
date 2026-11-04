import {
    AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal, viewChild,
} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {ActivatedRoute, ParamMap, Router, RouterLink} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {catchError, distinctUntilChanged, map, of, switchMap, tap} from 'rxjs';
import {PublicDashboardService} from './public-dashboard.service';
import {
    DistItem, FILTER_KEYS, FILTER_LABELS, Mean, PublicDashboardData, PublicFilters, Scope,
} from './public-dashboard.models';
import {MapAction, PakistanMapComponent} from '../../shared/components/pakistan-map/pakistan-map.component';
import {DoughnutChartComponent, DoughnutItem} from '../../shared/components/doughnut-chart/doughnut-chart.component';

type GeoTab = 'provinces' | 'districts' | 'cities';
interface ExplorerRow {
    level: 'province' | 'district' | 'city';
    code: string; name: string; context: string; count: number; explorable: boolean;
}

const SAFE_VALUE = /^[\w .\-/&()+,]{1,120}$/;
const ENUMS: Partial<Record<keyof PublicFilters, string[]>> = {
    ageGroup: ['NEONATE', 'INFANT', 'TODDLER', 'CHILD', 'ADOLESCENT'],
    birthWeight: ['VLBW', 'LBW', 'NBW', 'HBW'],
    opWeight: ['W0', 'W1', 'W2', 'W3', 'W4', 'W5'],
    induction: ['IV', 'INH', 'IM'],
};
const SPLASH_MS = 2000;
/** Story line: how long the registry has been collecting data ("… in 4 months"). Display only — no date filter is applied. */
const REGISTRY_MONTHS: number = 4;
const MOVE_MS = 1100;

@Component({
    selector: 'app-public-dashboard',
    standalone: true,
    imports: [DecimalPipe, RouterLink, PakistanMapComponent, DoughnutChartComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './public-dashboard.component.html',
    styleUrl: './public-dashboard.component.scss',
})
export class PublicDashboardComponent implements AfterViewInit {
    private api = inject(PublicDashboardService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    /**
     * Sections hidden on client request (Nov 2026). The API still returns their data;
     * set a flag to true to show the section again.
     */
    readonly show = {
        kpis: false,               // top status cards
        surgeonsHospitals: false,  // Surgeons + Hospitals cards
        activity: false,           // Surgical Activity Over Time
        geoTabs: false,            // Provinces / Districts / Cities tabs (breadcrumb navigation is used instead)
    };

    readonly FILTER_LABELS = FILTER_LABELS;
    readonly scopes: { value: Scope; label: string }[] = [
        {value: 'national', label: 'National'}, {value: 'personal', label: 'Personal'},
    ];
    readonly kpiCards = [
        {key: 'totalCases', label: 'Total Cases', icon: 'pi pi-folder-open', bg: '#EEF2FF', fg: '#2251CC'},
        {key: 'totalPatients', label: 'Total Patients', icon: 'pi pi-users', bg: '#F0FDFA', fg: '#0EA5A0'},
        {key: 'totalSurgeons', label: 'Surgeons', icon: 'pi pi-user', bg: '#F5F3FF', fg: '#5B4FCF'},
        {key: 'totalHospitals', label: 'Hospitals', icon: 'pi pi-building', bg: '#FFFBEB', fg: '#F59E0B'},
        {key: 'assistantSurgeons', label: 'Assistant Surgeons', icon: 'pi pi-user-plus', bg: '#FEF2F2', fg: '#E8344A'},
        {key: 'kpos', label: 'KPOs', icon: 'pi pi-id-card', bg: '#EFF6FF', fg: '#0656C5'},
    ] as const;
    /** Distinct colour per payer category. */
    readonly PAYER_COLORS = ['#2251CC', '#0EA5A0', '#F59E0B', '#E8344A', '#5B4FCF', '#10B981', '#C919FE', '#0656C5', '#D2683F', '#64748B'];
    readonly GROUP_COLORS = ['#E8344A', '#F59E0B', '#5B4FCF', '#0EA5A0', '#2251CC', '#10B981', '#C919FE', '#64748B'];
    readonly CPB_AXIS_MAX = 200;
    readonly cpbTicks = [0, 50, 100, 150, 200];

    state = signal<'loading' | 'ready' | 'expired' | 'error'>('loading');
    refreshing = signal(false);
    data = signal<PublicDashboardData | null>(null);
    filters = signal<PublicFilters>({scope: 'national'});
    mapAsset = toSignal(this.api.getMap().pipe(catchError(() => of(null))), {initialValue: null});

    exploreProvince = signal<string | null>(null);
    exploreDistrict = signal<string | null>(null);
    geoTab = signal<GeoTab>('provinces');
    expandedSurgeon = signal<string | null>(null);
    expandedHospital = signal<string | null>(null);
    /** Which collective "Other …" rows are opened (cpb, complications, agents). */
    openOthers = signal<Record<string, boolean>>({});
    tip = signal<{ x: number; y: number; title: string; lines: string[]; flipX: boolean; flipY: boolean } | null>(null);

    // ── splash: Infotech logo full screen for 2 s, then the screen shrinks into the header slot ──
    splash = signal<'show' | 'move' | 'done'>('show');
    private splashPanel = viewChild<ElementRef<HTMLElement>>('splashPanel');
    private splashLogo = viewChild<ElementRef<HTMLElement>>('splashLogo');
    private brandSlot = viewChild<ElementRef<HTMLElement>>('brandSlot');

    /** Labels for active-filter chips (codes -> display names), learnt from responses and clicks. */
    private labels = new Map<string, string>();

    constructor() {
        this.route.queryParamMap.pipe(
            map((pm) => this.parse(pm)),
            distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
            tap((f) => { this.filters.set(f); this.refreshing.set(true); }),
            // switchMap cancels any in-flight request, so a stale response can never overwrite a newer one
            switchMap((f) => this.api.getDashboard(f).pipe(
                map((d) => ({d, err: null as HttpErrorResponse | null})),
                catchError((err: HttpErrorResponse) => of({d: null, err})),
            )),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe(({d, err}) => {
            this.refreshing.set(false);
            if (err) {
                this.state.set(err.status === 410 ? 'expired' : 'error');
                if (err.status === 400) this.resetAll();
                return;
            }
            this.learnLabels(d!);
            this.data.set(d);
            this.state.set('ready');
        });
    }

    ngAfterViewInit() {
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        const t1 = setTimeout(() => {
            this.splash.set('move');   // dashboard fades in underneath
            const ms = reduce || this.state() === 'expired' ? 0 : this.flyToHeader();
            const t2 = setTimeout(() => this.splash.set('done'), ms);
            this.destroyRef.onDestroy(() => clearTimeout(t2));
        }, reduce ? 300 : SPLASH_MS);
        this.destroyRef.onDestroy(() => clearTimeout(t1));
    }

    /**
     * The full-screen panel closes (clip-path) onto the header logo slot while the big logo
     * shrinks and travels to the same spot, so the whole splash "goes back" into the header.
     */
    private flyToHeader(): number {
        const panel = this.splashPanel()?.nativeElement;
        const logo = this.splashLogo()?.nativeElement;
        const slot = this.brandSlot()?.nativeElement;
        if (!panel || !logo || !slot || typeof panel.animate !== 'function') return 0;
        const from = logo.getBoundingClientRect();
        const to = slot.getBoundingClientRect();
        if (!to.width || !from.width) return 0;
        const vw = window.innerWidth; const vh = window.innerHeight; const pad = 8;
        const dx = to.left + to.width / 2 - (from.left + from.width / 2);
        const dy = to.top + to.height / 2 - (from.top + from.height / 2);
        const k = to.width / from.width;
        const ease = 'cubic-bezier(.76, 0, .24, 1)';
        const inset = (t: number, r: number, b: number, l: number, rad: number) => `inset(${t}px ${r}px ${b}px ${l}px round ${rad}px)`;
        panel.animate([
            {clipPath: inset(0, 0, 0, 0, 0)},
            {clipPath: inset(Math.max(0, to.top - pad), Math.max(0, vw - to.right - pad), Math.max(0, vh - to.bottom - pad), Math.max(0, to.left - pad), 12)},
        ], {duration: MOVE_MS, easing: ease, fill: 'forwards'});
        logo.animate([
            {transform: 'translate(0, 0) scale(1)'},
            {transform: `translate(${dx}px, ${dy}px) scale(${k})`},
        ], {duration: MOVE_MS, easing: ease, fill: 'forwards'});
        return MOVE_MS;
    }

    // ── URL <-> filter state ─────────────────────────────────────────────────
    private parse(pm: ParamMap): PublicFilters {
        const f: PublicFilters = {scope: pm.get('scope') === 'personal' ? 'personal' : 'national'};
        FILTER_KEYS.forEach((k) => {
            const v = pm.get(k);
            if (!v || !SAFE_VALUE.test(v)) return;
            if (ENUMS[k] && !ENUMS[k]!.includes(v)) return;
            if (k === 'surgeon' && !/^[A-F0-9]{6}$/.test(v)) return;
            (f as any)[k] = v;
        });
        return f;
    }

    private navigate(f: PublicFilters) {
        const queryParams: Record<string, string> = {};
        if (f.scope === 'personal') queryParams['scope'] = 'personal';
        FILTER_KEYS.forEach((k) => { if (f[k]) queryParams[k] = String(f[k]); });
        this.router.navigate([], {relativeTo: this.route, queryParams});
    }

    setScope(scope: Scope) {
        if (scope !== this.filters().scope) this.navigate({...this.filters(), scope});
    }

    /** Toggle a global filter. Geographic selections keep the hierarchy consistent. */
    toggle(key: keyof PublicFilters, code: string | null | undefined, label?: string) {
        if (!code) return;
        const f: PublicFilters = {...this.filters()};
        if (label) this.labels.set(`${key}:${code}`, label);
        const same = f[key] === code;
        if (key === 'province') {
            delete f.district; delete f.city;
            if (same) delete f.province; else f.province = code;
        } else if (key === 'district') {
            delete f.city;
            if (same) delete f.district;
            else { f.district = code; const d = this.districtRow(code); if (d?.province) f.province = d.province; }
        } else if (key === 'city') {
            if (same) delete f.city;
            else {
                f.city = code;
                const c = this.data()?.geography.cities.find((x) => x.code === code);
                if (c?.district) f.district = c.district;
                if (c?.province) f.province = c.province;
            }
        } else if (same) {
            delete (f as any)[key];
        } else {
            (f as any)[key] = code;
        }
        this.tip.set(null);
        this.navigate(f);
    }

    removeFilter(key: keyof PublicFilters) {
        const f: PublicFilters = {...this.filters()};
        delete (f as any)[key];
        if (key === 'province') { delete f.district; delete f.city; }
        if (key === 'district') delete f.city;
        this.navigate(f);
    }

    resetAll() {
        this.exploreProvince.set(null);
        this.exploreDistrict.set(null);
        this.navigate({scope: this.filters().scope});
    }

    activeFilters = computed(() => {
        const f = this.filters();
        return FILTER_KEYS.filter((k) => f[k]).map((k) => ({
            key: k, code: String(f[k]), label: this.labels.get(`${k}:${f[k]}`) || this.fallbackLabel(String(f[k])),
        }));
    });

    private fallbackLabel(code: string) {
        const t = code.replace(/_/g, ' ').toLowerCase();
        return t.charAt(0).toUpperCase() + t.slice(1);
    }

    private learnLabels(d: PublicDashboardData) {
        const put = (key: string, code: string | null | undefined, name: string) => code && this.labels.set(`${key}:${code}`, name);
        d.geography.provinces.forEach((r) => put('province', r.code, r.name));
        d.geography.districts.forEach((r) => put('district', r.code, r.name));
        d.geography.cities.forEach((r) => put('city', r.code, r.name));
        d.hospitals?.forEach((h) => put('hospital', h.code, h.name));
        d.demographics?.ageGroups.forEach((a) => put('ageGroup', a.code, a.label));
        d.demographics?.gender.forEach((g) => put('gender', g.code, g.label));
        d.payers?.items.forEach((p) => put('payer', p.code, p.name));
        d.theatre?.locations.items.forEach((p) => put('theatre', p.code, p.name));
        [...(d.procedures?.items ?? []), ...(d.procedures?.others ?? [])].forEach((p) => put('procedure', p.code, p.name));
        [...(d.diagnoses?.items ?? []), ...(d.diagnoses?.others ?? [])].forEach((p) => put('diagnosis', p.code, p.name));
        [...(d.complications?.items ?? []), ...(d.complications?.others ?? [])].forEach((p) => put('complication', p.code, p.name));
        [...(d.anaesthesia?.agents ?? []), ...(d.anaesthesia?.agentOthers ?? [])].forEach((p) => put('anaesAgent', p.code, p.name));
        d.anaesthesia?.techniques.forEach((t) => put('induction', t.code, t.name));
        d.weights?.birth.bands.forEach((b) => put('birthWeight', b.code, b.label));
        d.weights?.operation.bands.forEach((b) => put('opWeight', b.code, b.label));
        this.labels.set('payer:NOT_RECORDED', 'Not recorded');
    }

    // ── story line ───────────────────────────────────────────────────────────
    story = computed(() => {
        const d = this.data();
        if (!d) return null;
        const n = d.kpis.totalCases;
        const f = this.filters();
        const g = d.geography;
        const place = f.city ? g.cities.find((c) => c.code === f.city)?.name
            : f.district ? g.districts.find((x) => x.code === f.district)?.name
            : f.province ? g.provinces.find((x) => x.code === f.province)?.name : null;
        const otherFilters = FILTER_KEYS.some((k) => f[k] && !['province', 'district', 'city'].includes(k));
        const personal = f.scope === 'personal';
        const ops = `${n.toLocaleString()} ${n === 1 ? 'operation' : 'operations'}`;
        const span = REGISTRY_MONTHS === 1 ? 'in one month' : `in ${REGISTRY_MONTHS} months`;
        const regions = g.provinces.filter((p) => p.count > 0).length;
        const reach = `${regions} ${regions === 1 ? 'province or territory' : 'provinces & territories'}`;

        if (!n) {
            return {ops: 'No operations', rest: place ? `from ${place}` : 'match this selection', span: '',
                lead: 'Broaden the selection or reset the filters to see the full picture.'};
        }
        if (otherFilters || place) {
            return {ops, rest: place ? `from ${place}${otherFilters ? ' match your selection' : ''}` : 'match your selection', span: '',
                lead: `Every card below now describes these ${ops}.`};
        }
        return personal
            ? {ops, rest: 'in your personal registry', span,
                lead: 'Every operation you led, assisted, reviewed or recorded on DataNurse, in one place.'}
            : {ops, rest: 'recorded across Pakistan', span,
                lead: `Congenital heart surgery teams record every operation on DataNurse. Pakistan’s national registry already reaches ${reach}, and it grows every week.`};
    });

    // ── geography explorer: Pakistan › Province › District (separate from filters) ──
    private provinceName = (code?: string | null) => this.data()?.geography.provinces.find((p) => p.code === code)?.name ?? '';
    private districtRow = (code?: string | null) => this.data()?.geography.districts.find((d) => d.code === code);

    exploreLevel = computed<'country' | 'province' | 'district'>(() =>
        this.exploreDistrict() ? 'district' : this.exploreProvince() ? 'province' : 'country');

    geoTabs = computed<GeoTab[]>(() => {
        const l = this.exploreLevel();
        return l === 'country' ? ['provinces', 'districts', 'cities'] : l === 'province' ? ['districts', 'cities'] : ['cities'];
    });

    /** With tabs hidden, the level decides the list: Pakistan → provinces, province → districts, district → cities. */
    activeGeoTab = computed<GeoTab>(() => {
        if (!this.show.geoTabs) {
            const l = this.exploreLevel();
            return l === 'country' ? 'provinces' : l === 'province' ? 'districts' : 'cities';
        }
        return this.geoTabs().includes(this.geoTab()) ? this.geoTab() : this.geoTabs()[0];
    });

    levelTitle = computed(() => {
        const t = this.activeGeoTab();
        const where = this.breadcrumb()[this.breadcrumb().length - 1].label;
        return `${t === 'provinces' ? 'Provinces & territories' : t === 'districts' ? 'Districts' : 'Cities'} in ${where}`;
    });

    breadcrumb = computed(() => {
        const out: { label: string; level: 'country' | 'province' | 'district' }[] = [{label: 'Pakistan', level: 'country'}];
        if (this.exploreProvince()) out.push({label: this.provinceName(this.exploreProvince()), level: 'province'});
        if (this.exploreDistrict()) out.push({label: this.districtRow(this.exploreDistrict())?.name ?? '', level: 'district'});
        return out;
    });

    explorerRows = computed<ExplorerRow[]>(() => {
        const g = this.data()?.geography;
        if (!g) return [];
        const pv = this.exploreProvince();
        const dt = this.exploreDistrict();
        // only locations with at least one recorded case are listed
        const hasDistricts = new Set(g.districts.filter((d) => d.count > 0).map((d) => d.province));
        const hasCities = new Set(g.cities.filter((c) => c.count > 0).map((c) => c.district));
        const dName = new Map(g.districts.map((d) => [d.code, d.name]));
        const pName = new Map(g.provinces.map((p) => [p.code, p.name]));
        switch (this.activeGeoTab()) {
            case 'provinces':
                return g.provinces.filter((p) => p.count > 0).map((p) => ({level: 'province', code: p.code, name: p.name, context: '',
                    count: p.count, explorable: hasDistricts.has(p.code)}));
            case 'districts':
                return g.districts.filter((d) => d.count > 0 && (!pv || d.province === pv)).map((d) => ({level: 'district', code: d.code,
                    name: d.name, context: pv ? '' : pName.get(d.province ?? '') ?? '', count: d.count,
                    explorable: hasCities.has(d.code)}));
            default:
                return g.cities.filter((c) => c.count > 0 && (dt ? c.district === dt : !pv || c.province === pv)).map((c) => ({
                    level: 'city', code: c.code, name: c.name, count: c.count, explorable: false,
                    context: dt ? '' : [dName.get(c.district ?? ''), pv ? '' : pName.get(c.province ?? '')].filter(Boolean).join(', '),
                }));
        }
    });

    /**
     * Coverage summary under the explorer list (pinned to the bottom): how much of the area the
     * registry already covers and which location leads. Fills the space when the list is short.
     */
    coverage = computed(() => {
        const g = this.data()?.geography;
        if (!g) return null;
        const pv = this.exploreProvince(); const dt = this.exploreDistrict();
        const ds = g.districts.filter((d) => !pv || d.province === pv);
        const cs = g.cities.filter((c) => (dt ? c.district === dt : !pv || c.province === pv));
        const rows = this.explorerRows();
        const total = rows.reduce((s, r) => s + r.count, 0);
        const lead = rows[0];
        const tile = (label: string, list: { count: number }[]) => ({label, value: list.filter((x) => x.count > 0).length, of: list.length});
        const tiles = dt ? [tile('Cities with cases', cs)]
            : pv ? [tile('Districts with cases', ds), tile('Cities with cases', cs)]
            : [tile('Provinces & territories', g.provinces), tile('Districts with cases', g.districts), tile('Cities with cases', g.cities)];
        return {
            tiles, total,
            lead: lead && total ? {name: lead.name, share: Math.round((lead.count / total) * 1000) / 10, count: lead.count} : null,
        };
    });

    explorerMax = computed(() => Math.max(1, ...this.explorerRows().map((r) => r.count)));

    goTo(level: 'country' | 'province' | 'district') {
        if (level === 'country') { this.exploreProvince.set(null); this.exploreDistrict.set(null); }
        if (level === 'province') this.exploreDistrict.set(null);
    }

    explore(row: ExplorerRow) {
        if (row.level === 'province') { this.exploreProvince.set(row.code); this.exploreDistrict.set(null); this.geoTab.set('districts'); }
        if (row.level === 'district') {
            const d = this.districtRow(row.code);
            this.exploreProvince.set(d?.province ?? null);
            this.exploreDistrict.set(row.code);
            this.geoTab.set('cities');
        }
    }

    selectRow(row: ExplorerRow) {
        if (row.count > 0) this.toggle(row.level, row.code, row.name);
    }

    isRowSelected(row: ExplorerRow) {
        return this.filters()[row.level] === row.code;
    }

    onMapAction(a: MapAction) {
        if (a.action === 'explore') {
            this.exploreProvince.set(a.code); this.exploreDistrict.set(null); this.geoTab.set('districts');
        } else {
            this.toggle(a.level, a.code);
        }
    }

    // ── cards ────────────────────────────────────────────────────────────────
    private asDoughnut = (i: DistItem): DoughnutItem => ({key: i.code, label: i.name, count: i.count, percentage: i.percentage, isOther: i.isOther});
    procedureItems = computed(() => (this.data()?.procedures?.items ?? []).map(this.asDoughnut));
    procedureOthers = computed(() => (this.data()?.procedures?.others ?? []).map(this.asDoughnut));
    diagnosisItems = computed(() => (this.data()?.diagnoses?.items ?? []).map(this.asDoughnut));
    diagnosisOthers = computed(() => (this.data()?.diagnoses?.others ?? []).map(this.asDoughnut));

    /** In Theatre / Who Pays: only categories with at least one case. */
    theatreView = computed(() => {
        const t = this.data()?.theatre;
        if (!t) return null;
        return {
            ...t,
            locations: {...t.locations, items: t.locations.items.filter((i) => i.count > 0)},
            operationTypes: {...t.operationTypes, items: t.operationTypes.items.filter((i) => i.count > 0)},
            urgency: t.urgency.filter((u) => u.count > 0),
            indicators: t.indicators.filter((i) => i.denominator > 0),
        };
    });
    payerItems = computed(() => (this.data()?.payers?.items ?? []).filter((p) => p.count > 0));

    /** Mean bypass / cross-clamp per primary procedure; "Other" rows only when opened. */
    cpbRows = computed(() => {
        const c = this.data()?.theatre?.cpbByProcedure;
        if (!c) return [];
        return this.openOthers()['cpb'] ? c.others : c.items;
    });

    /** Bypass vs cross-clamp: grouped columns per time band. */
    timeBands = computed(() => {
        const t = this.data()?.theatre?.times;
        if (!t) return [];
        const max = Math.max(1, ...t.cpb.bands.map((b) => b.count), ...t.crossClamp.bands.map((b) => b.count));
        return t.cpb.bands.map((b, i) => ({
            label: b.label, cpb: b.count, xc: t.crossClamp.bands[i]?.count ?? 0,
            cpbH: (b.count / max) * 100, xcH: ((t.crossClamp.bands[i]?.count ?? 0) / max) * 100,
        }));
    });

    weightMax = computed(() => {
        const w = this.data()?.weights;
        return {
            birth: Math.max(1, ...(w?.birth.bands ?? []).map((b) => b.count)),
            op: Math.max(1, ...(w?.operation.bands ?? []).map((b) => b.count)),
        };
    });

    complicationRows = computed(() => {
        const c = this.data()?.complications;
        if (!c) return [];
        const rows = c.items.filter((i) => i.count > 0);
        return this.openOthers()['complications'] ? c.others : rows;
    });

    /** Complications by primary procedure: share of assessed cases with ≥1 complication (or with the selected one). */
    procCompRows = computed(() => {
        const c = this.data()?.complications;
        if (!c?.byProcedure) return [];
        const code = this.filters().complication;
        const list = this.openOthers()['procComp'] ? c.byProcedureOthers : c.byProcedure;
        return list.map((p) => {
            const hit = code ? p.complications.find((x) => x.code === code)?.count ?? 0 : p.withAny;
            return {...p, hit, share: p.assessed ? Math.round((hit / p.assessed) * 1000) / 10 : 0};
        });
    });
    selectedComplication = computed(() => {
        const code = this.filters().complication;
        const c = this.data()?.complications;
        return code && c ? [...c.items, ...c.others].find((i) => i.code === code) ?? null : null;
    });

    agentRows = computed(() => {
        const a = this.data()?.anaesthesia;
        if (!a) return [];
        const rows = a.agents.filter((i) => i.count > 0);
        return this.openOthers()['agents'] ? a.agentOthers : rows;
    });
    /** Anaesthesia adverse events: top 8 + "Other" (swaps in place). */
    adverseRows = computed(() => {
        const a = this.data()?.anaesthesia?.adverse;
        if (!a) return [];
        if (this.openOthers()['adverse']) return a.others ?? [];
        const rows: DistItem[] = [...(a.items ?? [])];
        const rest = a.others ?? [];
        if (rest.length && !rows.some((r) => r.isOther)) {
            rows.push({code: null, name: `Other adverse events (${rest.length})`, count: rest.reduce((s, r) => s + r.count, 0), percentage: 0, isOther: true} as DistItem);
        }
        return rows;
    });

    /** Bars in the "Other" lists keep the same scale as the top list (largest real item). */
    adverseMax = computed(() => this.maxOf([...(this.data()?.anaesthesia?.adverse?.items ?? []).filter((i) => !i.isOther), ...(this.data()?.anaesthesia?.adverse?.others ?? [])]));
    complicationMax = computed(() => this.maxOf([...(this.data()?.complications?.items ?? []).filter((i) => !i.isOther), ...(this.data()?.complications?.others ?? [])]));

    ops(n: number) { return `${this.fmt(n)} ${n === 1 ? 'operation' : 'operations'}`; }

    selectedAgent = computed(() => {
        const code = this.filters().anaesAgent;
        const a = this.data()?.anaesthesia;
        return code && a ? [...a.agents, ...a.agentOthers].find((i) => i.code === code) ?? null : null;
    });
    selectedTechnique = computed(() => {
        const code = this.filters().induction;
        return code ? this.data()?.anaesthesia?.techniques.find((t) => t.code === code) ?? null : null;
    });

    // Surgical Activity Over Time (hidden via show.activity; kept for later)
    activityBars = computed(() => {
        const pts = this.data()?.activity?.points ?? [];
        const W = 1000; const H = 220; const pad = 4;
        const max = Math.max(1, ...pts.map((p) => p.count));
        const step = pts.length ? W / pts.length : W;
        const every = Math.max(1, Math.ceil(pts.length / 12));
        const ticks = this.niceTicks(max);
        const top = ticks[ticks.length - 1] || 1;
        return {
            W, H, ticks: ticks.map((t) => ({v: t, y: H - (t / top) * H})),
            bars: pts.map((p, i) => {
                const h = (p.count / top) * H;
                return {...p, x: i * step + pad / 2, w: Math.max(1, step - pad), y: H - h, h, showLabel: i % every === 0,
                    minor: i % every === 0 && (i / every) % 3 !== 0};
            }),
            total: pts.reduce((s, p) => s + p.count, 0),
        };
    });

    private niceTicks(max: number): number[] {
        const raw = max / 4;
        const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
        const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) || mag;
        const out: number[] = [];
        for (let v = 0; v <= max + step - 1e-9; v += step) out.push(Math.round(v * 100) / 100);
        return out.length > 1 ? out : [0, 1];
    }

    /** Height of each list when "Other" is opened: the full list swaps in place and scrolls inside it, the card never grows. */
    swapH: Record<string, number> = {};

    toggleOthers(key: string, list?: HTMLElement) {
        if (list && !this.openOthers()[key]) this.swapH[key] = Math.max(list.offsetHeight, 220);
        this.hideTip();
        this.openOthers.update((o) => ({...o, [key]: !o[key]}));
    }

    maxOf(list: { count: number }[] | undefined) {
        return Math.max(1, ...(list ?? []).map((x) => x.count));
    }

    /** Bar width on the 0–200 min axis; longer values fill the bar and show their real number. */
    cpbWidth(v: number | null) {
        return v ? Math.min(100, (v / this.CPB_AXIS_MAX) * 100) : 0;
    }

    // ── tooltip (fixed layer above all tabs and sticky bars) ─────────────────
    showTip(ev: MouseEvent, title: string, ...lines: string[]) {
        // open towards the side with room so the tooltip never leaves the screen
        this.tip.set({
            x: ev.clientX, y: ev.clientY, title, lines,
            flipX: ev.clientX > window.innerWidth - 290,
            flipY: ev.clientY > window.innerHeight - (60 + lines.length * 18),
        });
    }
    hideTip() { this.tip.set(null); }
    fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString(); }

    /** Tooltip with the mean formula: mean = sum ÷ n. */
    meanTip(ev: MouseEvent, title: string, m: Mean | null | undefined, unit: string) {
        if (!m || !m.n) return this.showTip(ev, title, 'No values recorded');
        this.showTip(ev, title, `Mean = ${this.fmt(m.mean)} ${unit}`,
            `Formula: sum ÷ number of cases`, `= ${this.fmt(m.sum)} ${unit} ÷ ${this.fmt(m.n)}`);
    }

    onDoughnutHover(e: { event: MouseEvent; item: DoughnutItem } | null, unit: string) {
        if (!e) return this.hideTip();
        this.showTip(e.event, e.item.label, `${e.item.count.toLocaleString()} ${unit}`, `${e.item.percentage}% of all recorded ${unit}`,
            ...(e.item.isOther ? ['Click to see what is included'] : []));
    }

    kpiValue(key: string): number {
        return (this.data()?.kpis as any)?.[key] ?? 0;
    }

    toggleSurgeon(code: string) { this.expandedSurgeon.update((c) => (c === code ? null : code)); }
    toggleHospital(code: string) { this.expandedHospital.update((c) => (c === code ? null : code)); }

    reload() { location.reload(); }
}
