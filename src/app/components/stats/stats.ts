import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Page } from '../../core/models';
import { NavService } from '../../services/nav.service';
import { StateService } from '../../services/state.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-stats',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './stats.html'
})
export class Stats {
  private readonly state = inject(StateService);
  private readonly nav = inject(NavService);

  readonly links = input<Page[] | null>(null);

  readonly cards = computed(() => {
    const t = this.state.totals();
    return [
      {
        label: 'ออเดอร์วันนี้',
        value: String(this.state.activeOrders().length),
        unit: 'ออเดอร์',
        icon: 'orders',
        foot: t.boxes + ' กล่องพร้อมจัดส่ง'
      },
      {
        label: 'ไรเดอร์ที่ใช้งาน',
        value: String(this.state.routes().length),
        unit: '/ ' + this.state.riders().length + ' คน',
        icon: 'rider',
        foot: 'รับได้สูงสุด 3 ออเดอร์ / คน'
      },
      {
        label: 'ยอดขายรวม',
        value: '฿' + this.state.money(t.sales),
        unit: '',
        icon: 'money',
        foot: 'ราคาขาย 65 บาท / กล่อง'
      },
      {
        label: t.profit < 0 ? 'ขาดทุนโดยประมาณ' : 'กำไรโดยประมาณ',
        value: '฿' + this.state.money(Math.abs(t.profit)),
        unit: '',
        icon: 'profit',
        foot: 'หักต้นทุนและค่าจัดส่งแล้ว'
      }
    ];
  });

  go(index: number): void {
    const links = this.links();
    if (links) this.nav.go(links[index]);
  }

  key(event: KeyboardEvent, index: number): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.go(index);
    }
  }
}
