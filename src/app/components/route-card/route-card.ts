import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { colors } from '../../core/constants';
import { DeliveryRoute } from '../../core/models';
import { Icon } from '../icon/icon';
import { ModalService } from '../../services/modal.service';
import { StateService } from '../../services/state.service';
import { Badge } from '../badge/badge';

@Component({
  selector: 'app-route-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, Icon],
  templateUrl: './route-card.html'
})
export class RouteCard {
  private readonly state = inject(StateService);
  private readonly modal = inject(ModalService);

  readonly route = input.required<DeliveryRoute>();

  readonly metrics = computed(() => this.state.routeMetrics(this.route().ids));
  readonly late = computed(() => this.state.isLate(this.route()));
  readonly color = computed(() => colors[this.route().rider % 8]);
  readonly riderName = computed(() => this.state.riders()[this.route().rider]?.name ?? '');
  readonly boxes = computed(() =>
    this.route().ids.reduce((s, id) => s + (this.state.order(id)?.boxes || 0), 0)
  );

  customerName(id: number): string {
    const o = this.state.order(id);
    return o ? (this.state.customer(o.customer)?.name ?? '') : '';
  }

  customerAddress(id: number): string {
    const o = this.state.order(id);
    return o ? (this.state.customer(o.customer)?.address ?? '') : '';
  }

  orderBoxes(id: number): number {
    return this.state.order(id)?.boxes ?? 0;
  }

  timeAt(index: number): string {
    return this.state.timeOf(this.metrics().deliveries[index].minutes);
  }

  minutes(): number {
    return Math.ceil(this.metrics().time);
  }

  previewWorksheet(): void {
    if (this.state.role() !== 'owner') return;
    this.modal.openWorksheet(this.route().rider);
  }
}
