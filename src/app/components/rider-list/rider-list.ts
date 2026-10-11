import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { colors } from '../../core/constants';
import { Order } from '../../core/models';
import { StateService } from '../../services/state.service';
import { Badge } from '../badge/badge';

@Component({
  selector: 'app-rider-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  templateUrl: './rider-list.html'
})
export class RiderList {
  readonly state = inject(StateService);

  color(id: number): string {
    return colors[id % 8];
  }

  private ids(riderId: number): number[] {
    return this.state.routes().find((r) => r.rider === riderId)?.ids ?? [];
  }

  private orders(riderId: number): Order[] {
    return this.ids(riderId)
      .map((id) => this.state.order(id))
      .filter((o): o is Order => !!o);
  }

  private done(riderId: number): number {
    return this.orders(riderId).filter((o) => o.status === 'ส่งสำเร็จ').length;
  }

  info(riderId: number): string {
    const ids = this.ids(riderId);
    const boxes = this.orders(riderId).reduce((s, o) => s + o.boxes, 0);
    return `${ids.length} จุดส่ง · ${boxes} กล่อง`;
  }

  progress(riderId: number): number {
    const ids = this.ids(riderId);
    return ids.length ? (this.done(riderId) / ids.length) * 100 : 0;
  }

  status(riderId: number): string {
    const ids = this.ids(riderId);
    const orders = this.orders(riderId);
    if (!ids.length) return 'ว่าง';
    if (this.done(riderId) === ids.length) return 'เสร็จสิ้น';
    if (orders.some((o) => o.status === 'ส่งไม่สำเร็จ')) return 'ต้องติดตาม';
    if (orders.some((o) => o.status === 'กำลังจัดส่ง')) return 'กำลังจัดส่ง';
    return 'พร้อมออกส่ง';
  }
}
