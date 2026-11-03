import {ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal} from '@angular/core';
import {DatePipe, DecimalPipe} from '@angular/common';
import {ActivatedRoute, ParamMap, Router, RouterLink} from '@angular/router';
import {HttpErrorResponse} from '@angular/common/http';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {catchError, distinctUntilChanged, map, of, switchMap, tap} from 'rxjs';
import {PublicDashboardService} from './public-dashboard.service';
import {
    FILTER_KEYS, FILTER_LABELS, GeoRow, Period, PublicDashboardData, PublicFilters,
} from './public-dashboard.models';
import {MapAction, PakistanMapComponent} from '../../shared/components/pakistan-map/pakistan-map.component';
import {DoughnutChartComponent, DoughnutItem} from '../../shared/components/doughnut-chart/doughnut-chart.component';

type GeoTab = 'provinces' | 'districts' | 'cities';
interface ExplorerRow {
    level: 'province' | 'district' | 'city';
    code: string; name: string; context: string; count: number; explorable: boolean;
}

const SAFE_VALUE = /^[\w .\-/&()+,]{1,120}$/;
const AGE_CODES = ['NEONATE', 'INFANT', 'TODDLER', 'CHILD', 'ADOLESCENT'];

@Component({
    selector: 'app-public-dashboard',
    standalone: true,
    imports: [DecimalPipe, RouterLink, PakistanMapComponent, DoughnutChartComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './public-dashboard.component.html',
    styleUrl: './public-dashboard.component.scss',
})
export class PublicDashboardComponent {
    private api = inject(PublicDashboardService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private destroyRef = inject(DestroyRef);

    readonly FILTER_LABELS = FILTER_LABELS;
    readonly periods: { value: Period; label: string }[] = [
        {value: 'all', label: 'All'}, {value: 'year', label: 'Year'}, {value: 'month', label: 'Month'},
    ];
    readonly kpiCards = [
        {key: 'totalCases', label: 'Total Cases', icon: 'pi pi-folder-open', accent: '#2251CC', bg: '#EEF2FF'},
        {key: 'totalPatients', label: 'Total Patients', icon: 'pi pi-users', accent: '#0EA5A0', bg: '#F0FDFA'},
        {key: 'totalSurgeons', label: 'Surgeons', icon: 'pi pi-user', accent: '#5B4FCF', bg: '#F5F3FF'},
        {key: 'totalHospitals', label: 'Hospitals', icon: 'pi pi-building', accent: '#F59E0B', bg: '#FFFBEB'},
        {key: 'assistantSurgeons', label: 'Assistant Surgeons', icon: 'pi pi-user-plus', accent: '#E8344A', bg: '#FEF2F2'},
        {key: 'kpos', label: 'KPOs', icon: 'pi pi-id-card', accent: '#0656C5', bg: '#EFF6FF'},
    ] as const;

    state = signal<'loading' | 'ready' | 'expired' | 'error'>('loading');
    refreshing = signal(false);
    data = signal<PublicDashboardData | null>(null);
    filters = signal<PublicFilters>({period: 'all'});
    mapAsset = toSignal(this.api.getMap().pipe(catchError(() => of(null))), {initialValue: null});

    exploreProvince = signal<string | null>(null);
    exploreDistrict = signal<string | null>(null);
    geoTab = signal<GeoTab>('districts');
    expandedSurgeon = signal<string | null>(null);
    expandedHospital = signal<string | null>(null);
    tip = signal<{ x: number; y: number; title: string; lines: string[]; flipX: boolean; flipY: boolean } | null>(null);
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

    // ── URL <-> filter state ─────────────────────────────────────────────────
    private parse(pm: ParamMap): PublicFilters {
        const p = pm.get('period');
        const f: PublicFilters = {period: p === 'month' || p === 'year' ? p : 'all'};
        FILTER_KEYS.forEach((k) => {
            const v = pm.get(k);
            if (!v || !SAFE_VALUE.test(v)) return;
            if (k === 'ageGroup' && !AGE_CODES.includes(v)) return;
            if (k === 'surgeon' && !/^[A-F0-9]{6}$/.test(v)) return;
            (f as any)[k] = v;
        });
        return f;
    }

    private navigate(f: PublicFilters) {
        const queryParams: Record<string, string> = {};
        if (f.period !== 'all') queryParams['period'] = f.period;
        FILTER_KEYS.forEach((k) => { if (f[k]) queryParams[k] = String(f[k]); });
        this.router.navigate([], {relativeTo: this.route, queryParams});
    }

    setPeriod(period: Period) {
        if (period !== this.filters().period) this.navigate({...this.filters(), period});
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
        this.navigate({period: 'all'});
    }

    activeFilters = computed(() => {
        const f = this.filters();
        return FILTER_KEYS.filter((k) => f[k]).map((k) => ({
            key: k, code: String(f[k]), label: this.labels.get(`${k}:${f[k]}`) || this.fallbackLabel(k, String(f[k])),
        }));
    });

    private fallbackLabel(key: string, code: string) {
        if (key === 'surgeon') return `Surgeon ${code}`;
        return code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    }

    private learnLabels(d: PublicDashboardData) {
        d.geography.provinces.forEach((r) => this.labels.set(`province:${r.code}`, r.name));
        d.geography.districts.forEach((r) => this.labels.set(`district:${r.code}`, r.name));
        d.geography.cities.forEach((r) => this.labels.set(`city:${r.code}`, r.name));
        d.hospitals?.forEach((h) => this.labels.set(`hospital:${h.code}`, h.name));
        d.demographics?.ageGroups.forEach((a) => this.labels.set(`ageGroup:${a.code}`, a.label));
        d.demographics?.gender.forEach((g) => this.labels.set(`gender:${g.code}`, g.label));
        d.payers?.items.forEach((p) => this.labels.set(`payer:${p.code}`, p.name));
        d.theatre?.locations.items.forEach((p) => this.labels.set(`theatre:${p.code}`, p.name));
        d.procedures?.items.forEach((p) => p.code && this.labels.set(`procedure:${p.code}`, p.name));
        d.diagnoses?.items.forEach((p) => p.code && this.labels.set(`diagnosis:${p.code}`, p.name));
        this.labels.set('payer:NOT_RECORDED', 'Not recorded');
    }

    // ── geography explorer (separate from global filters) ───────────────────
    private provinceName = (code?: string | null) => this.data()?.geography.provinces.find((p) => p.code === code)?.name ?? '';
    private districtRow = (code?: string | null) => this.data()?.geography.districts.find((d) => d.code === code);

    exploreLevel = computed<'country' | 'province' | 'district'>(() =>
        this.exploreDistrict() ? 'district' : this.exploreProvince() ? 'province' : 'country');

    geoTabs = computed<GeoTab[]>(() => {
        const l = this.exploreLevel();
        return l === 'country' ? ['provinces', 'districts', 'cities'] : l === 'province' ? ['districts', 'cities'] : ['cities'];
    });

    activeGeoTab = computed<GeoTab>(() => (this.geoTabs().includes(this.geoTab()) ? this.geoTab() : this.geoTabs()[0]));

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

    explorerMax = computed(() => Math.max(1, ...this.explorerRows().map((r) => r.count)));
    explorerTotal = computed(() => this.explorerRows().reduce((s, r) => s + r.count, 0));
    // ── In Theatre / Who Pays: only categories with at least one case ────────
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

    // ── story line above the map ──────────────────────────────────────────────
    story = computed(() => {
        const d = this.data();
        if (!d) return null;
        const k = d.kpis;
        const f = this.filters();
        const g = d.geography;
        const plural = (n: number, one: string, many: string) => `${n.toLocaleString()} ${n === 1 ? one : many}`;
        const place = f.city ? g.cities.find((c) => c.code === f.city)?.name
            : f.district ? g.districts.find((x) => x.code === f.district)?.name
                : f.province ? g.provinces.find((x) => x.code === f.province)?.name : null;
        const when = f.period === 'year' ? 'this year' : f.period === 'month' ? 'this month' : null;
        const scope = [place ? `from ${place}` : null, when].filter(Boolean).join(' ');

        const withCases = g.provinces.filter((p) => p.count > 0);
        const geoTotal = withCases.reduce((s, p) => s + p.count, 0);
        const topProv = withCases[0];
        const topDist = g.districts.find((x) => x.count > 0);
        const others = FILTER_KEYS.filter((x) => f[x] && !['province', 'district', 'city'].includes(x)).length;

        const stats: { value: string; label: string }[] = [
            {value: k.totalSurgeons.toLocaleString(), label: k.totalSurgeons === 1 ? 'surgeon contributing' : 'surgeons contributing'},
        ];
        if (place) {
            // a location is selected: describe it relative to its parent area (same non-geographic filters)
            const prov = g.provinces.find((x) => x.code === f.province);
            const dist = g.districts.find((x) => x.code === f.district);
            const city = g.cities.find((x) => x.code === f.city);
            const [own, parent, parentName] = city ? [city.count, dist?.count ?? 0, dist?.name ?? '']
                : dist ? [dist.count, prov?.count ?? 0, prov?.name ?? ''] : [prov?.count ?? 0, geoTotal, 'Pakistan'];
            stats.push({value: k.totalHospitals.toLocaleString(), label: k.totalHospitals === 1 ? 'hospital treating these patients' : 'hospitals treating these patients'});
            if (parent) stats.push({value: `${Math.round((own / parent) * 100)}%`, label: `of ${parentName}'s cases in this view`});
            stats.push({value: k.assistantSurgeons.toLocaleString(), label: k.assistantSurgeons === 1 ? 'assistant surgeon involved' : 'assistant surgeons involved'});
        } else {
            stats.push({value: `${withCases.length} of ${g.provinces.length}`, label: 'provinces & territories represented'});
            if (topProv && geoTotal) {
                stats.push({value: `${Math.round((topProv.count / geoTotal) * 100)}%`, label: `of cases from ${topProv.name}`});
            }
            if (topDist) stats.push({value: topDist.count.toLocaleString(), label: `cases from ${topDist.name}, the leading district`});
        }

        return {
            cases: plural(k.totalCases, 'operation', 'operations'),
            patients: plural(k.totalPatients, 'child', 'children'),
            hospitals: plural(k.totalHospitals, 'hospital', 'hospitals'),
            scope,
            lead: k.totalCases === 0
                ? 'No operations match this selection yet. Broaden the filters or reset to see the national picture.'
                : others || place || when
                    ? `This view is narrowed by your selection. Every card below now describes the same ${plural(k.totalCases, 'operation', 'operations')}.`
                    : `A national registry for congenital heart surgery in Pakistan starts here. This is what ${plural(k.totalSurgeons, 'surgeon', 'surgeons')}, `
                    + `supported by ${plural(k.assistantSurgeons, 'assistant surgeon', 'assistant surgeons')} and ${plural(k.kpos, 'KPO', 'KPOs')}, `
                    + `have recorded so far — and how much of the country is still missing from it.`,
            stats,
        };
    });
    representedProvinces = computed(() => (this.data()?.geography.provinces ?? []).filter((p) => p.count > 0).length);

    goTo(level: 'country' | 'province' | 'district') {
        if (level === 'country') { this.exploreProvince.set(null); this.exploreDistrict.set(null); this.geoTab.set('districts'); }
        if (level === 'province') { this.exploreDistrict.set(null); this.geoTab.set('districts'); }
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

    // ── chart helpers ────────────────────────────────────────────────────────
    procedureItems = computed<DoughnutItem[]>(() => (this.data()?.procedures?.items ?? [])
        .map((i) => ({key: i.code, label: i.name, count: i.count, percentage: i.percentage})));
    diagnosisItems = computed<DoughnutItem[]>(() => (this.data()?.diagnoses?.items ?? [])
        .map((i) => ({key: i.code, label: i.name, count: i.count, percentage: i.percentage})));

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

    cpbAxis = computed(() => {
        const items = this.data()?.theatre?.cpbByProcedure?.items ?? [];
        const ticks = this.niceTicks(Math.max(30, ...items.map((i) => i.max)));
        return {ticks, max: ticks[ticks.length - 1] || 1};
    });

    maxOf(list: { count: number }[] | undefined) {
        return Math.max(1, ...(list ?? []).map((x) => x.count));
    }

    activitySubtitle = computed(() => {
        const a = this.data()?.activity;
        if (!a) return '';
        if (a.granularity === 'day') return 'Cases per day, this month (by surgery date)';
        if (this.filters().period === 'year') return 'Cases per month, this year (by surgery date)';
        return a.granularity === 'year' ? 'Cases per year, all recorded surgery dates' : 'Cases per month, all recorded surgery dates';
    });

    // ── tooltip (fixed layer above all tabs and sticky bars) ─────────────────
    showTip(ev: MouseEvent, title: string, ...lines: string[]) {
        this.tip.set({
            x: ev.clientX, y: ev.clientY, title, lines,
            flipX: ev.clientX > window.innerWidth - 290,
            flipY: ev.clientY > window.innerHeight - (60 + lines.length * 18),
        });
    }
    hideTip() { this.tip.set(null); }
    fmt(n: number | null | undefined) { return (n ?? 0).toLocaleString(); }

    onDoughnutHover(e: { event: MouseEvent; item: DoughnutItem } | null, unit: string) {
        if (!e) return this.hideTip();
        this.showTip(e.event, e.item.label, `${e.item.count.toLocaleString()} ${unit}`, `${e.item.percentage}% of all recorded ${unit}`);
    }

    kpiValue(key: string): number {
        return (this.data()?.kpis as any)?.[key] ?? 0;
    }

    toggleSurgeon(code: string) { this.expandedSurgeon.update((c) => (c === code ? null : code)); }
    toggleHospital(code: string) { this.expandedHospital.update((c) => (c === code ? null : code)); }

    reload() { location.reload(); }

    trackCode = (_: number, x: { code: string | null }) => x.code;
}
