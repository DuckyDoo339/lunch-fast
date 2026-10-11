import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Icon } from '../../components/icon/icon';
import { Stats } from '../../components/stats/stats';
import { TitleBlock } from '../../components/title-block/title-block';
import { colors } from '../../core/constants';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleBlock, Stats, Icon],
  templateUrl: './reports.html'
})
export class Reports {
  readonly state = inject(StateService);
  readonly colors = colors;

  readonly t = computed(() => this.state.totals());
  readonly lateCount = computed(() => this.state.routes().filter((r) => this.state.isLate(r)).length);
  readonly costRows = computed(() =>
    this.state.routes().flatMap((r) =>
      this.state.routeMetrics(r.ids).deliveries.map((d) => {
        const o = this.state.order(d.id);
        return {
          key: r.rider + '-' + d.id,
          rider: r.rider,
          id: d.id,
          d: d.d,
          boxes: o?.boxes ?? 0,
          cost: d.d * (o?.boxes ?? 0) * 2
        };
      })
    )
  );

  riderName(id: number): string {
    return this.state.riders()[id]?.name ?? '';
  }

  barWidth(ids: number[]): number {
    return Math.min(100, (this.state.routeMetrics(ids).distance / 8) * 100);
  }

  ceil(value: number): number {
    return Math.ceil(value);
  }

  abs(value: number): number {
    return Math.abs(value);
  }
}
