import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Customer, Order } from '../../core/models';
import { Badge } from '../../components/badge/badge';
import { Icon } from '../../components/icon/icon';
import { RiderSelect } from '../../components/rider-select/rider-select';
import { TitleBlock } from '../../components/title-block/title-block';
import { NavService } from '../../services/nav.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-delivery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleBlock, RiderSelect, Badge, Icon],
  templateUrl: './delivery.html'
})
export class Delivery {
  readonly state = inject(StateService);
  private readonly nav = inject(NavService);

  readonly order = computed<Order | undefined>(() => {
    const route = this.state.routes().find((r) => r.rider === this.state.selected());
    const selected = this.state.selectedOrder();
    return (
      this.state.orders().find((o) => o.id === selected && route?.ids.includes(o.id)) ??
      this.state.orders().find((o) => o.id === route?.ids[0])
    );
  });

  customer(o: Order): Customer | undefined {
    return this.state.customer(o.customer);
  }

  lat(o: Order): string {
    return (this.customer(o)?.lat ?? 0).toFixed(5);
  }

  lng(o: Order): string {
    return (this.customer(o)?.lng ?? 0).toFixed(5);
  }

  mapsHref(o: Order): string {
    const c = this.customer(o);
    return c
      ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}&travelmode=driving`
      : '#';
  }

  goJobs(): void {
    this.nav.go('jobs');
  }

  statusNote(o: Order): string {
    return ['ส่งสำเร็จ', 'ส่งไม่สำเร็จ'].includes(o.status)
      ? 'บันทึกผลจัดส่งแล้ว หากต้องแก้ไขกรุณาติดต่อเจ้าของร้าน'
      : 'รับอาหารและกดเริ่มจัดส่งจากหน้าใบงานก่อนบันทึกผล';
  }
}
