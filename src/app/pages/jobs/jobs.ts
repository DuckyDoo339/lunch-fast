import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Badge } from '../../components/badge/badge';
import { Icon } from '../../components/icon/icon';
import { RiderSelect } from '../../components/rider-select/rider-select';
import { TitleBlock } from '../../components/title-block/title-block';
import { NavService } from '../../services/nav.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-jobs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleBlock, RiderSelect, Badge, Icon],
  templateUrl: './jobs.html'
})
export class Jobs {
  readonly state = inject(StateService);
  private readonly nav = inject(NavService);

  readonly ids = computed(
    () => this.state.routes().find((r) => r.rider === this.state.selected())?.ids ?? []
  );
  readonly route = computed(() => this.state.routes().find((r) => r.rider === this.state.selected()));
  readonly m = computed(() => this.state.routeMetrics(this.ids()));
  readonly boxes = computed(() =>
    this.ids().reduce((s, id) => s + (this.state.order(id)?.boxes || 0), 0)
  );
  readonly done = computed(
    () => this.ids().filter((id) => this.state.order(id)?.status === 'ส่งสำเร็จ').length
  );
  readonly riderName = computed(() => this.state.riders()[this.state.selected()]?.name ?? '');
  readonly statusText = computed(() => {
    const ids = this.ids();
    if (!ids.length) return 'ยังไม่มีใบงาน';
    if (this.done() === ids.length) return 'ส่งครบทุกจุดแล้ว';
    if (ids.some((id) => this.state.order(id)?.status === 'กำลังจัดส่ง')) return 'กำลังจัดส่ง';
    return 'พร้อมรับอาหารที่ร้าน';
  });
  readonly hasAssigned = computed(() =>
    this.ids().some((id) => this.state.order(id)?.status === 'จัดสรรไรเดอร์แล้ว')
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

  orderStatus(id: number): string {
    return this.state.order(id)?.status ?? '';
  }

  timeFor(index: number): string {
    return this.state.timeOf(this.m().deliveries[index].minutes);
  }

  openDelivery(id: number): void {
    this.state.selectedOrder.set(id);
    this.nav.go('delivery');
  }
}
