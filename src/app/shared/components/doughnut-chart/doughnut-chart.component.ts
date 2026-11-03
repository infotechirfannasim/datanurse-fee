import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {DecimalPipe} from '@angular/common';

export interface DoughnutItem {
    key: string | null;      // filter value; null = not selectable (e.g. "Other")
    label: string;
    count: number;
    percentage: number;
    color?: string;
}

/**
 * Ring chart extracted from the internal dashboard's "Case Distribution" card
 * (same geometry: r=44, 12px stroke, rounded caps, 4° gaps, brand ring colours).
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
                                [class.dim]="selected() && seg.key !== selected()"
                                [attr.stroke]="seg.color" stroke-width="12" stroke-linecap="round"
                                [attr.stroke-dasharray]="seg.dasharray" [attr.transform]="seg.rotation"
                                (mouseenter)="hover.emit({event: $event, item: seg})"
                                (mousemove)="hover.emit({event: $event, item: seg})"
                                (mouseleave)="hover.emit(null)"
                                (click)="seg.key && pick.emit(seg)"/>
                    }
                </svg>
                <div class="ring-label-wrap">
                    <span class="ring-big">{{ centerValue() | number }}</span>
                    <span class="ring-small">{{ centerLabel() }}</span>
                </div>
            </div>
            <ul class="ring-legend">
                @for (seg of segments(); track seg.label) {
                    <li>
                        <button type="button" class="ring-legend-item" [disabled]="!seg.key || !seg.count"
                                [class.active]="seg.key && seg.key === selected()"
                                [attr.title]="seg.label"
                                (mouseenter)="hover.emit({event: $event, item: seg})"
                                (mouseleave)="hover.emit(null)"
                                (click)="pick.emit(seg)">
                            <span class="dot" [style.background]="seg.color"></span>
                            <span class="lbl">{{ seg.label }}</span>
                            <span class="val">{{ seg.count | number }}</span>
                            <span class="pct">{{ seg.percentage }}%</span>
                        </button>
                    </li>
                } @empty {
                    <li class="ring-empty">No records for this selection</li>
                }
            </ul>
        </div>
    `,
    styleUrl: './doughnut-chart.component.scss',
})
export class DoughnutChartComponent {
    static readonly COLORS = ['#2251CC', '#E8344A', '#0EA5A0', '#F59E0B', '#5B4FCF', '#10B981', '#C919FE', '#0656C5', '#94A3B8'];
    private readonly C = 2 * Math.PI * 44;
    private readonly GAP_DEG = 4;

    items = input<DoughnutItem[]>([]);
    centerValue = input<number>(0);
    centerLabel = input<string>('Cases');
    selected = input<string | null | undefined>(null);
    pick = output<DoughnutItem>();
    hover = output<{ event: MouseEvent; item: DoughnutItem } | null>();

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
                color: it.color || (it.key ? DoughnutChartComponent.COLORS[i % (DoughnutChartComponent.COLORS.length - 1)] : '#94A3B8'),
                dasharray: `${arc.toFixed(3)} ${(this.C - arc).toFixed(3)}`,
                rotation: `rotate(${rot.toFixed(3)} 60 60)`,
            };
        });
    });
}
