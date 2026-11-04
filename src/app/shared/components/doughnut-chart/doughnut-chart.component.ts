import {ChangeDetectionStrategy, Component, computed, effect, input, output, signal} from '@angular/core';
import {DecimalPipe} from '@angular/common';

export interface DoughnutItem {
    key: string | null;      // filter value; null = the collective "Other" slice
    label: string;
    count: number;
    percentage: number;
    color?: string;
    isOther?: boolean;
}

/**
 * Ring chart extracted from the internal dashboard's "Case Distribution" card
 * (same geometry: r=44, 12px stroke, rounded caps, 4° gaps, brand ring colours).
 * Clicking the "Other" slice or legend row lists everything it contains.
 */
@Component({
    selector: 'app-doughnut-chart',
    standalone: true,
    imports: [DecimalPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="ring-chart-area">
            <div class="ring-center">
                <svg class="ring-svg" viewBox="0 0 120 120" role="img" [attr.aria-label]="centerLabel()">
                    <circle cx="60" cy="60" r="44" fill="none" stroke="#EEF1F6" stroke-width="12"/>
                    @for (seg of segments(); track seg.label) {
                        <circle cx="60" cy="60" r="44" fill="none" class="seg"
                                [class.dim]="(selected() && seg.key !== selected()) || (showOthers() && !seg.isOther)"
                                [attr.stroke]="seg.color" stroke-width="12" stroke-linecap="round"
                                [attr.stroke-dasharray]="seg.dasharray" [attr.transform]="seg.rotation"
                                (mouseenter)="hover.emit({event: $event, item: seg})"
                                (mousemove)="hover.emit({event: $event, item: seg})"
                                (mouseleave)="hover.emit(null)"
                                (click)="choose(seg)"/>
                    }
                </svg>
                <div class="ring-label-wrap">
                    <span class="ring-big">{{ centerValue() | number }}</span>
                    <span class="ring-small">{{ centerLabel() }}</span>
                </div>
            </div>
            <div class="ring-side">
                @if (showOthers()) {
                    <button type="button" class="ring-back" (click)="showOthers.set(false)">
                        <i class="pi pi-arrow-left"></i> {{ otherLabel() }}
                    </button>
                }
                <ul class="ring-legend">
                    @for (seg of (showOthers() ? otherRows() : segments()); track seg.label) {
                        <li>
                            <button type="button" class="ring-legend-item" [disabled]="!seg.count"
                                    [class.active]="seg.key && seg.key === selected()"
                                    [class.is-other]="seg.isOther"
                                    [attr.title]="seg.label"
                                    (mouseenter)="hover.emit({event: $event, item: seg})"
                                    (mouseleave)="hover.emit(null)"
                                    (click)="choose(seg)">
                                <span class="dot" [style.background]="seg.color"></span>
                                <span class="lbl">{{ seg.label }}</span>
                                <span class="val">{{ seg.count | number }}</span>
                                <span class="pct">{{ seg.percentage }}%</span>
                                @if (seg.isOther) { <i class="pi pi-angle-right more"></i> }
                            </button>
                        </li>
                    } @empty {
                        <li class="ring-empty">No records for this selection</li>
                    }
                </ul>
            </div>
        </div>
    `,
    styleUrl: './doughnut-chart.component.scss',
})
export class DoughnutChartComponent {
    static readonly COLORS = ['#2251CC', '#E8344A', '#0EA5A0', '#F59E0B', '#5B4FCF', '#10B981', '#C919FE', '#0656C5', '#94A3B8'];
    private readonly C = 2 * Math.PI * 44;
    private readonly GAP_DEG = 4;

    items = input<DoughnutItem[]>([]);
    /** Items grouped into the "Other" slice (only those with a count above 0). */
    others = input<DoughnutItem[]>([]);
    centerValue = input<number>(0);
    centerLabel = input<string>('Cases');
    selected = input<string | null | undefined>(null);
    pick = output<DoughnutItem>();
    hover = output<{ event: MouseEvent; item: DoughnutItem } | null>();

    showOthers = signal(false);
    otherLabel = computed(() => this.items().find((i) => i.isOther)?.label ?? 'Other');
    otherRows = computed(() => this.others().filter((o) => o.count > 0).map((o) => ({...o, color: '#94A3B8'})));

    constructor() {
        // a new data set closes the expanded "Other" list unless the selected item lives in it
        effect(() => {
            const sel = this.selected();
            const inOthers = !!sel && this.others().some((o) => o.key === sel);
            this.showOthers.set(inOthers);
        });
    }

    choose(seg: DoughnutItem) {
        if (seg.isOther) {
            if (this.others().length) this.showOthers.update((v) => !v);
            return;
        }
        if (seg.key && seg.count) this.pick.emit(seg);
    }

    segments = computed(() => {
        const items = this.items().filter((i) => i.count > 0);
        const total = items.reduce((s, i) => s + i.count, 0) || 1;
        const gap = items.length > 1 ? (this.GAP_DEG / 360) * this.C : 0;
        let offset = -90;
        return items.map((it, i) => {
            const share = it.count / total;
            const arc = Math.max(0.001, share * this.C - gap);
            const rot = offset;
            offset += share * 360;
            return {
                ...it,
                color: it.color || (it.isOther ? '#94A3B8' : DoughnutChartComponent.COLORS[i % (DoughnutChartComponent.COLORS.length - 1)]),
                dasharray: `${arc.toFixed(3)} ${(this.C - arc).toFixed(3)}`,
                rotation: `rotate(${rot.toFixed(3)} 60 60)`,
            };
        });
    });
}
