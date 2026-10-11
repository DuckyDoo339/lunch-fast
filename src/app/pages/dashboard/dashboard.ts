import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Page } from '../../core/models';
import { Icon } from '../../components/icon/icon';
import { LiveMap } from '../../components/live-map/live-map';
import { OrderTable } from '../../components/order-table/order-table';
import { RiderList } from '../../components/rider-list/rider-list';
import { Stats } from '../../components/stats/stats';
import { TitleBlock } from '../../components/title-block/title-block';
import { NavService } from '../../services/nav.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleBlock, Stats, LiveMap, RiderList, OrderTable, Icon],
  templateUrl: './dashboard.html'
})
export class Dashboard {
  readonly state = inject(StateService);
  readonly nav = inject(NavService);

  readonly statLinks: Page[] = ['orders', 'routes', 'reports', 'reports'];
  readonly t = computed(() => this.state.totals());
  readonly lateCount = computed(() => this.state.routes().filter((r) => this.state.isLate(r)).length);
  readonly waiting = computed(() => this.state.activeOrders().filter((o) => o.status === 'รอจัดส่ง').length);
  readonly recentOrders = computed(() => this.state.orders().slice(-5).reverse());
  readonly done = computed(() => this.state.activeOrders().filter((o) => o.status === 'ส่งสำเร็จ').length);
  readonly failed = computed(() => this.state.activeOrders().filter((o) => o.status === 'ส่งไม่สำเร็จ').length);
  readonly shipping = computed(() => this.state.activeOrders().filter((o) => o.status === 'กำลังจัดส่ง').length);
  readonly pct = computed(() => {
    const total = this.state.activeOrders().length;
    return total ? Math.round((this.done() / total) * 100) : 0;
  });

  readonly dateText = computed(() =>
    new Intl.DateTimeFormat('th-TH', { dateStyle: 'full' }).format(new Date())
  );
}
