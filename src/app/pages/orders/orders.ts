import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ORDER_STATUSES } from '../../core/constants';
import { Icon } from '../../components/icon/icon';
import { OrderTable } from '../../components/order-table/order-table';
import { Stats } from '../../components/stats/stats';
import { TitleBlock } from '../../components/title-block/title-block';
import { ModalService } from '../../services/modal.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleBlock, Stats, OrderTable, Icon],
  templateUrl: './orders.html'
})
export class Orders {
  readonly state = inject(StateService);
  readonly modal = inject(ModalService);
  readonly statuses = ORDER_STATUSES;
  readonly query = signal('');
  readonly filter = signal('all');

  readonly filtered = computed(() =>
    this.state
      .orders()
      .filter(
        (o) =>
          (String(o.id) + this.state.customer(o.customer)?.name).includes(this.query()) &&
          (this.filter() === 'all' || o.status === this.filter())
      )
  );
}
