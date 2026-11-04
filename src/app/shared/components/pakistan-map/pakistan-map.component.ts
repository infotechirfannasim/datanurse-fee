import {
    ChangeDetectionStrategy, Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, output, signal, untracked,
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
    private destroyRef = inject(DestroyRef);
    protected readonly Math = Math;

    asset = input.required<PakistanMapAsset>();
    provinces = input<GeoRow[]>([]);
    districts = input<GeoRow[]>([]);
    selectedProvince = input<string | undefined>();
    selectedDistrict = input<string | undefined>();
    exploreProvince = input<string | null>(null);
    action = output<MapAction>();

    /** Blue pastel choropleth: light for few cases, deeper blue for more; zero = pale grey-blue + hatch. */
    static readonly LOW = '#E3ECFB';
    static readonly HIGH = '#4F7BDB';
    static readonly ZERO = '#F2F5FA';

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
        const {LOW, HIGH, ZERO} = PakistanMapComponent;
        return ds.map((d) => {
            const s = states.get(d.id)!;
            return {d, s, fill: s.count ? this.mix(LOW, HIGH, Math.sqrt(s.count / max)) : ZERO};
        });
    });

    /** Blue pastel fill, deepened in proportion to the province's share of cases. */
    provinceFills = computed(() => {
        const states = this.provinceStates();
        const max = Math.max(1, ...[...states.values()].map((s) => s.count ?? 0));
        const out = new Map<string, string>();
        this.asset().provinces.forEach((p) => {
            const c = states.get(p.id)?.count ?? 0;
            const {LOW, HIGH, ZERO} = PakistanMapComponent;
            out.set(p.id, c ? this.mix(LOW, HIGH, Math.sqrt(c / max)) : ZERO);
        });
        return out;
    });

    /** Country frame: Pakistan + disputed territory only (no surroundings). */
    private frame = computed<[number, number, number, number]>(() => {
        const a = this.asset();
        const bx = a.provinces.map((p) => p.bbox);
        const x0 = Math.min(...bx.map((b) => b[0]));
        const y0 = Math.min(...bx.map((b) => b[1]));
        const x1 = Math.max(a.disputed.fadeX1, ...bx.map((b) => b[2]));
        const y1 = Math.max(...bx.map((b) => b[3]));
        const pad = 10;
        return [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2];
    });
    aspect = computed(() => `${this.frame()[2]} / ${this.frame()[3]}`);

    bubbles = computed(() => {
        if (this.exploredFeature()) return [];
        const states = this.provinceStates();
        return this.asset().provinces
            .map((p) => ({p, s: states.get(p.id)!}))
            .filter((x) => (x.s.count ?? 0) > 0)
            .map((x) => ({...x, w: 14 + 8 * String(x.s.count ?? 0).length, cx: x.p.cx, cy: x.p.cy, leader: x.p.leader}));
    });

    scale = computed(() => this.vb()[2] / this.frame()[2]);
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

    /** Rendered width of the map, so count pills stay readable on small screens. */
    private stageWidth = signal(800);
    pillScale = computed(() => {
        const unitsPerPx = this.vb()[2] / Math.max(1, this.stageWidth());
        return Math.max(1, Math.min(2.4, unitsPerPx * 0.95));
    });
    pillTransform(cx: number, cy: number) {
        const s = this.pillScale();
        return `translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`;
    }

    constructor() {
        afterNextRender(() => {
            const el = (this.host.nativeElement as HTMLElement).querySelector('.map-stage');
            if (!el || typeof ResizeObserver === 'undefined') return;
            const ro = new ResizeObserver((e) => this.stageWidth.set(e[0].contentRect.width));
            ro.observe(el);
            this.destroyRef.onDestroy(() => ro.disconnect());
        });
        effect(() => {
            const a = this.asset();
            const f = this.exploredFeature();
            untracked(() => {
                this.popover.set(null);
                const fr = this.frame();
                if (!f) return this.animateTo(fr);
                const [x0, y0, x1, y1] = f.bbox;
                const pad = Math.max(x1 - x0, y1 - y0) * 0.12 + 8;
                let w = x1 - x0 + pad * 2;
                let h = y1 - y0 + pad * 2;
                const ratio = fr[2] / fr[3];
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

    private mix(from: string, to: string, t: number): string {
        const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
        const a = hex(from);
        const b = hex(to);
        const c = a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
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
        // open the tooltip towards the side with room, so it never leaves the screen
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
