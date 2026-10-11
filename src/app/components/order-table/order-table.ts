import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Order } from '../../core/models';
import { ModalService } from '../../services/modal.service';
import { StateService } from '../../services/state.service';
import { Badge } from '../badge/badge';

@Component({
  selector: 'app-order-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  templateUrl: './order-table.html'
})
export class OrderTable {
  private readonly state = inject(StateService);
  private readonly modal = inject(ModalService);

  readonly orders = input.required<Order[]>();
  readonly actions = input(false);

  name(o: Order): string {
    return this.state.customer(o.customer)?.name ?? '';
  }

  address(o: Order): string {
    return this.state.customer(o.customer)?.address ?? '';
  }

  rider(id: number): string {
    const route = this.state.routeForOrder(id);
    return route ? (this.state.riders()[route.rider]?.name ?? '') : '—';
  }

  edit(id: number): void {
    this.modal.openOrder(id);
  }

  remove(id: number): void {
    this.state.removeOrder(id);
  }
}
