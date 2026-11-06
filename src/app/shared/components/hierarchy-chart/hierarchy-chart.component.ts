import {ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked} from '@angular/core';
import {DecimalPipe} from '@angular/common';

export interface HierItem { key: string; code: string; name: string; count: number; percentage: number; share: number; }
export interface HierSub { key: string; name: string; count: number; percentage: number; share: number; children: HierItem[]; }
export interface HierGroup { key: string; name: string; count: number; percentage: number; share: number; children: HierSub[]; }
export type HierLevel = 'group' | 'sub' | 'item';
export interface HierPick { level: HierLevel; groupKey: string; subKey?: string; code: string; name: string; }

interface Seg { key: string; groupKey: string; subKey?: string; level: 'group' | 'sub'; name: string; count: number; share: number;
    parentPct: number; parentName: string; color: string; grad: string; d: string; hit: string; delay: number;
    label: string | null; lx: number; ly: number; }

/** Bright, distinct group colours; sub-groups use lighter tints of their group's colour. */
const PALETTE = ['#2251CC', '#E8344A', '#0EA5A0', '#F59E0B', '#7C3AED', '#10B981', '#EC4899', '#0EA5E9', '#F97316', '#64748B',
    '#A16207', '#14B8A6', '#9333EA', '#DC2626', '#0891B2'];
const CX = 150; const R0 = 66; const R1 = 108; const R2 = 112; const R3 = 144; const GAP = 0.012; // radians
const RM = (R1 + R2) / 2; // hit areas of the two rings meet here, so there is no dead gap between them
const MIN_LABEL = 0.32; // radians: segments narrower than this get no % label

/**
 * Two-ring sunburst (inner = groups, outer = sub-groups) with an expandable
 * group > sub-group > item list. Every level can be picked (it sets a dashboard filter);
 * the chevron only opens / closes a row.
 */
@Component({
    selector: 'app-hierarchy-chart',
    standalone: true,
    imports: [DecimalPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './hierarchy-chart.component.html',
    styleUrl: './hierarchy-chart.component.scss',
    host: {'[class.side]': "layout() === 'side'", '[class.large]': "size() === 'large'"},
})
export class HierarchyChartComponent {
    groups = input<HierGroup[]>([]);
    total = input(0);
    centerLabel = input('Total');
    unit = input('cases');
    groupNoun = input('groups');
    /** what the group % means (shown on hover of the % header) */
    pctHint = input('Group: share of all. Sub-group: share of its group. Item: share of its sub-group.');
    layout = input<'stack' | 'side'>('stack');
    size = input<'normal' | 'large'>('normal');
    selectedGroup = input<string | undefined>();
    selectedSub = input<string | undefined>();
    selected = input<string | undefined>();
    pick = output<HierPick>();

    hovered = signal<Seg | null>(null);
    private leaveTimer: ReturnType<typeof setTimeout> | undefined;
    /**
     * Hover runs on fixed, invisible hit areas (no gaps, never scaled), so the growing
     * segment can't slide out from under the pointer. Leaving is delayed a moment so
     * crossing from one segment to the next doesn't flash the whole chart.
     */
    enter(s: Seg) { clearTimeout(this.leaveTimer); if (this.hovered()?.key !== s.key) this.hovered.set(s); }
    leave() { clearTimeout(this.leaveTimer); this.leaveTimer = setTimeout(() => this.hovered.set(null), 90); }
    open = signal<Set<string>>(new Set());
    readonly uid = 'hc' + Math.random().toString(36).slice(2, 8);

    constructor() {
        // open the path of whatever is selected (nothing is opened by default)
        effect(() => {
            const gs = this.groups(); const sel = this.selected(); const sg = this.selectedGroup(); const ss = this.selectedSub();
            untracked(() => {
                const next = new Set(this.open());
                for (const g of gs) {
                    if (sg && g.key === sg) next.add(g.key);
                    for (const s of g.children) {
                        if (ss && s.key === ss) next.add(g.key);
                        if (sel && s.children.some((i) => i.code === sel)) { next.add(g.key); next.add(g.key + '|' + s.key); }
                    }
                }
                this.open.set(next);
            });
        });
    }

    colorOf = computed(() => new Map(this.groups().map((g, i) => [g.key, PALETTE[i % PALETTE.length]])));
    hasSelection = computed(() => !!(this.selectedGroup() || this.selectedSub() || this.selected()));

    /** The selected group / sub-group / item, shown in the centre while nothing is hovered. */
    selectedNode = computed(() => {
        const sg = this.selectedGroup(), ss = this.selectedSub(), si = this.selected();
        if (!sg && !ss && !si) return null;
        for (const g of this.groups()) {
            if (sg && g.key === sg) return {name: g.name, count: g.count, note: `${g.share}% of all`};
            for (const s of g.children) {
                if (ss && s.key === ss) return {name: s.name, count: s.count, note: `${s.percentage}% of ${g.name}`};
                const i = si ? s.children.find((x) => x.code === si) : undefined;
                if (i) return {name: i.name, count: i.count, note: `${i.share}% of all`};
            }
        }
        return null;
    });

    segments = computed<Seg[]>(() => {
        const total = this.groups().reduce((t, g) => t + g.count, 0);
        if (!total) return [];
        const out: Seg[] = [];
        let a = -Math.PI / 2; let n = 0; let gi = 0;
        for (const g of this.groups()) {
            const span = (g.count / total) * Math.PI * 2;
            const color = this.colorOf().get(g.key)!;
            const mid = a + span / 2; const rl = (R0 + R1) / 2;
            out.push({key: g.key, groupKey: g.key, level: 'group', name: g.name, count: g.count, share: g.share, parentPct: g.percentage,
                parentName: '', color, grad: `url(#${this.uid}-g${gi++})`, d: this.arc(a, a + span, R0, R1), hit: this.arc(a, a + span, R0 - 2, RM, 0), delay: n * 45,
                label: span >= MIN_LABEL ? `${Math.round(g.percentage)}%` : null, lx: CX + rl * Math.cos(mid), ly: CX + rl * Math.sin(mid)});
            n++;
            let b = a;
            g.children.forEach((s, j) => {
                const sp = (s.count / g.count) * span;
                const sm = b + sp / 2; const rs = (R2 + R3) / 2;
                out.push({key: g.key + '|' + s.key, groupKey: g.key, subKey: s.key, level: 'sub', name: s.name, count: s.count, share: s.share,
                    parentPct: s.percentage, parentName: g.name, color: this.tint(color, 0.2 + (j % 4) * 0.15), grad: '',
                    d: this.arc(b, b + sp, R2, R3), hit: this.arc(b, b + sp, RM, R3 + 8, 0), delay: 260 + n * 22,
                    label: null, lx: CX + rs * Math.cos(sm), ly: CX + rs * Math.sin(sm)});
                b += sp; n++;
            });
            a += span;
        }
        return out;
    });

    /** gradient stops for the group ring (lighter at the inner edge) */
    gradients = computed(() => this.segments().filter((s) => s.level === 'group').map((s, i) => ({id: `${this.uid}-g${i}`, from: this.tint(s.color, 0.3), to: s.color})));

    isOpen(key: string) { return this.open().has(key); }
    toggle(key: string, ev?: Event) {
        ev?.stopPropagation();
        const next = new Set(this.open());
        next.has(key) ? next.delete(key) : next.add(key);
        this.open.set(next);
    }

    isSel(level: HierLevel, key: string) {
        return level === 'group' ? this.selectedGroup() === key : level === 'sub' ? this.selectedSub() === key : this.selected() === key;
    }
    /** a segment is "on" when nothing is selected, or it is (part of) the selection */
    segOn(s: Seg) {
        if (!this.hasSelection()) return true;
        if (this.selectedGroup()) return s.groupKey === this.selectedGroup();
        if (this.selectedSub()) return s.subKey === this.selectedSub() || (s.level === 'group' && this.groups().find((g) => g.key === s.groupKey)?.children.some((c) => c.key === this.selectedSub()));
        const sel = this.selected();
        const g = this.groups().find((x) => x.key === s.groupKey);
        return s.level === 'group' ? !!g?.children.some((c) => c.children.some((i) => i.code === sel))
            : !!g?.children.find((c) => c.key === s.subKey)?.children.some((i) => i.code === sel);
    }

    choose(level: HierLevel, g: HierGroup, s?: HierSub, i?: HierItem) {
        const next = new Set(this.open());
        next.add(g.key); if (s && level !== 'sub') next.add(g.key + '|' + s.key);
        this.open.set(next);
        this.pick.emit({level, groupKey: g.key, subKey: s?.key, code: level === 'group' ? g.key : level === 'sub' ? s!.key : i!.code,
            name: level === 'group' ? g.name : level === 'sub' ? s!.name : i!.name});
    }

    chooseSeg(seg: Seg) {
        const g = this.groups().find((x) => x.key === seg.groupKey)!;
        if (seg.level === 'group') this.choose('group', g);
        else this.choose('sub', g, g.children.find((c) => c.key === seg.subKey));
        setTimeout(() => document.getElementById(this.uid + '-' + this.domId(seg.key))?.scrollIntoView({block: 'nearest', behavior: 'smooth'}), 40);
    }

    domId(k: string) { return k.replace(/[^\w-]/g, '_'); }

    private arc(a0: number, a1: number, r0: number, r1: number, gap = GAP): string {
        if (gap && a1 - a0 > gap * 2) { a0 += gap; a1 -= gap; }
        if (a1 - a0 >= Math.PI * 2 - 1e-6) a1 = a0 + Math.PI * 2 - 1e-4;
        const p = (r: number, t: number) => `${(CX + r * Math.cos(t)).toFixed(2)} ${(CX + r * Math.sin(t)).toFixed(2)}`;
        const large = a1 - a0 > Math.PI ? 1 : 0;
        return `M ${p(r1, a0)} A ${r1} ${r1} 0 ${large} 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 ${large} 0 ${p(r0, a0)} Z`;
    }

    private tint(hex: string, t: number): string {
        const n = parseInt(hex.slice(1), 16);
        const mix = (c: number) => Math.round(c + (255 - c) * t);
        return `rgb(${mix(n >> 16)}, ${mix((n >> 8) & 255)}, ${mix(n & 255)})`;
    }
}
