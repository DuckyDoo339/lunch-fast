import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ModalService } from '../../services/modal.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-worksheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './worksheet.html'
})
export class Worksheet {
  readonly state = inject(StateService);
  readonly modal = inject(ModalService);

  readonly id = input.required<number>();

  riderName(): string {
    return this.state.riders()[this.id()]?.name ?? '';
  }

  ids(): number[] {
    return this.state.routes().find((r) => r.rider === this.id())?.ids ?? [];
  }

  boxes(): number {
    return this.ids().reduce((n, id) => n + (this.state.order(id)?.boxes ?? 0), 0);
  }

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
    return this.state.timeOf(this.state.routeMetrics(this.ids()).deliveries[index].minutes);
  }
}
