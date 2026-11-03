import {
    ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, input, output, signal, untracked,
} from '@angular/core';
import {DecimalPipe} from '@angular/common';
import {
    GeoRow, MapDistrict, MapProvince, PakistanMapAsset, geoKey,
} from '../../../pages/public-dashboard/public-dashboard.models';

interface FeatureState {
    id: string;
    name: string;
    codes: string[];       // matched LOV codes (database driven)
    primary: string | null;
    count: number | null;  // null = no matching LOV record
}

export interface MapAction {
    action: 'select' | 'explore';
    level: 'province' | 'district';
    code: string;
}

/**
 * Interactive political map of Pakistan, drawn from verified boundary data and
 * styled after the Government of Pakistan political map (Survey of Pakistan, 2020).
 * Map features are matched to LOV records by normalised name/code + documented aliases;
 * no LOV values are hard-coded here.
 */
@Component({
    selector: 'app-pakistan-map',
    standalone: true,
    imports: [DecimalPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './pakistan-map.component.html',
    styleUrl: './pakistan-map.component.scss',
})
export class PakistanMapComponent {
    private host = inject(ElementRef<HTMLElement>);
    protected readonly Math = Math;

    asset = input.required<PakistanMapAsset>();
    provinces = input<GeoRow[]>([]);
    districts = input<GeoRow[]>([]);
    selectedProvince = input<string | undefined>();
    selectedDistrict = input<string | undefined>();
    exploreProvince = input<string | null>(null);
    action = output<MapAction>();

    hover = signal<{ x: number; y: number; title: string; sub: string; count: number | null; flipX: boolean; flipY: boolean } | null>(null);
    popover = signal<{ x: number; y: number; level: 'province' | 'district'; state: FeatureState } | null>(null);
    vb = signal<[number, number, number, number]>([0, 0, 1000, 775]);
    private anim = 0;

    // ── feature ↔ LOV matching ────────────────────────────────────────────────
    private provinceFeatureOf = computed(() => {
        const out = new Map<string, MapProvince>();
        const feats = this.asset().provinces;
        for (const row of this.provinces()) {
            const keys = [geoKey(row.name), geoKey(row.code)];
            const f = feats.find((p) => keys.some((k) => p.aliases.includes(k) || geoKey(p.name) === k));
            if (f) out.set(row.code, f);
        }
        return out;
    });

    provinceStates = computed(() => {
        const m = new Map<string, FeatureState>();
        this.asset().provinces.forEach((p) => m.set(p.id, {id: p.id, name: p.name, codes: [], primary: null, count: null}));
        const rows = new Map(this.provinces().map((r) => [r.code, r]));
        this.provinceFeatureOf().forEach((f, code) => {
            const s = m.get(f.id)!;
            const r = rows.get(code)!;
            s.codes.push(code);
            s.count = (s.count ?? 0) + r.count;
            s.name = s.codes.length === 1 ? r.name : s.name;
            if (!s.primary || r.count > (rows.get(s.primary)?.count ?? 0)) s.primary = code;
        });
        return m;
    });

    private districtStates = computed(() => {
        const m = new Map<string, FeatureState>();
        const feats = this.asset().districts;
        feats.forEach((d) => m.set(d.id, {id: d.id, name: d.name, codes: [], primary: null, count: null}));
        const provFeat = this.provinceFeatureOf();
        for (const row of this.districts()) {
            const parentFeat = row.province ? provFeat.get(row.province)?.id : undefined;
            const keys = [geoKey(row.name), geoKey(row.code)];
            const f = feats.find((d) => (!parentFeat || d.province === parentFeat) && keys.some((k) => d.aliases.includes(k)));
            if (!f) continue;
            const s = m.get(f.id)!;
            s.codes.push(row.code);
            s.count = (s.count ?? 0) + row.count;
            if (s.codes.length === 1) s.name = row.name;
            if (!s.primary || row.count > (this.districts().find((x) => x.code === s.primary)?.count ?? 0)) s.primary = row.code;
        }
        return m;
    });

    exploredFeature = computed<MapProvince | null>(() => {
        const code = this.exploreProvince();
        return code ? this.provinceFeatureOf().get(code) ?? null : null;
    });

    visibleDistricts = computed(() => {
        const f = this.exploredFeature();
        if (!f) return [];
        const states = this.districtStates();
        const ds = this.asset().districts.filter((d) => d.province === f.id);
        const max = Math.max(1, ...ds.map((d) => states.get(d.id)?.count ?? 0));
        return ds.map((d) => {
            const s = states.get(d.id)!;
            return {d, s, fill: this.choropleth(s.count, max)};
        });
    });

    bubbles = computed(() => {
        if (this.exploredFeature()) return [];
        const states = this.provinceStates();
        const max = Math.max(1, ...[...states.values()].map((s) => s.count ?? 0));
        return this.asset().provinces
            .map((p) => ({p, s: states.get(p.id)!}))
            .filter((x) => (x.s.count ?? 0) > 0)
            .map((x) => {
                const small = x.p.id === 'PK-IS';
                const r = (small ? 9 : 12) + (small ? 6 : 16) * Math.sqrt((x.s.count ?? 0) / max);
                return {...x, r, cx: x.p.cx, cy: x.p.cy, leader: x.p.leader};
            });
    });

    scale = computed(() => this.vb()[2] / this.asset().width);
    vbString = computed(() => this.vb().map((v) => v.toFixed(1)).join(' '));

    selectedProvinceFeature = computed(() => {
        const c = this.selectedProvince();
        return c ? this.provinceFeatureOf().get(c)?.id ?? null : null;
    });
    selectedDistrictFeature = computed(() => {
        const c = this.selectedDistrict();
        if (!c) return null;
        for (const [id, s] of this.districtStates()) if (s.codes.includes(c)) return id;
        return null;
    });

    constructor() {
        effect(() => {
            const a = this.asset();
            const f = this.exploredFeature();
            untracked(() => {
                this.popover.set(null);
                if (!f) return this.animateTo([0, 0, a.width, a.height]);
                const [x0, y0, x1, y1] = f.bbox;
                const pad = Math.max(x1 - x0, y1 - y0) * 0.12 + 8;
                let w = x1 - x0 + pad * 2;
                let h = y1 - y0 + pad * 2;
                const ratio = a.width / a.height;
                if (w / h > ratio) h = w / ratio; else w = h * ratio;
                const cx = (x0 + x1) / 2;
                const cy = (y0 + y1) / 2;
                this.animateTo([cx - w / 2, cy - h / 2, w, h]);
            });
        });
    }

    private animateTo(target: [number, number, number, number]) {
        cancelAnimationFrame(this.anim);
        const from = this.vb();
        const t0 = performance.now();
        const D = 380;
        const step = (t: number) => {
            const k = Math.min(1, (t - t0) / D);
            const e = 1 - Math.pow(1 - k, 3);
            this.vb.set(from.map((v, i) => v + (target[i] - v) * e) as [number, number, number, number]);
            if (k < 1) this.anim = requestAnimationFrame(step);
        };
        this.anim = requestAnimationFrame(step);
    }

    private choropleth(count: number | null, max: number): string {
        if (!count) return '#FFFFFF';
        const t = Math.sqrt(count / max);
        const a = [234, 241, 253];
        const b = [6, 86, 197];
        const c = a.map((v, i) => Math.round(v + (b[i] - v) * (0.15 + 0.85 * t)));
        return `rgb(${c[0]},${c[1]},${c[2]})`;
    }

    // ── interaction ───────────────────────────────────────────────────────────
    private local(ev: MouseEvent) {
        const r = (this.host.nativeElement as HTMLElement).querySelector('.map-stage')!.getBoundingClientRect();
        return {x: ev.clientX - r.left, y: ev.clientY - r.top, clientX: ev.clientX, clientY: ev.clientY};
    }

    onHover(ev: MouseEvent, level: 'province' | 'district', id: string) {
        const s = (level === 'province' ? this.provinceStates() : this.districtStates()).get(id);
        if (!s) return;
        const p = this.local(ev);
        let sub: string;
        if (s.count === null) sub = 'Not configured in the registry';
        else if (s.count === 0) sub = 'No recorded cases';
        else sub = level === 'province' && !this.exploredFeature() ? 'Click to select or explore' : 'Click to select';
        this.hover.set({x: p.clientX, y: p.clientY, title: s.name, sub, count: s.count,
            flipX: p.clientX > window.innerWidth - 270, flipY: p.clientY > window.innerHeight - 110});
    }

    onClick(ev: MouseEvent, level: 'province' | 'district', id: string) {
        ev.stopPropagation();
        const s = (level === 'province' ? this.provinceStates() : this.districtStates()).get(id);
        if (!s || !s.primary) return;
        const p = this.local(ev);
        this.hover.set(null);
        this.popover.set({x: p.x, y: p.y, level, state: s});
    }

    onKey(ev: KeyboardEvent, level: 'province' | 'district', id: string) {
        if (ev.key !== 'Enter' && ev.key !== ' ') return;
        ev.preventDefault();
        const s = (level === 'province' ? this.provinceStates() : this.districtStates()).get(id);
        const el = ev.target as SVGGraphicsElement;
        const stage = (this.host.nativeElement as HTMLElement).querySelector('.map-stage')!.getBoundingClientRect();
        const b = el.getBoundingClientRect();
        if (s?.primary) this.popover.set({x: b.left - stage.left + b.width / 2, y: b.top - stage.top + b.height / 2, level, state: s});
    }

    doAction(action: 'select' | 'explore') {
        const p = this.popover();
        if (!p?.state.primary) return;
        this.popover.set(null);
        this.action.emit({action, level: p.level, code: p.state.primary});
    }

    closePopover() { this.popover.set(null); }

    trackProv = (_: number, p: MapProvince) => p.id;
    trackDist = (_: number, x: { d: MapDistrict }) => x.d.id;
}
