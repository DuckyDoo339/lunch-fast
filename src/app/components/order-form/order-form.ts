import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal } from '@angular/core';
import { ORDER_STATUSES, STARTED_STATUSES } from '../../core/constants';
import { Order } from '../../core/models';
import { ModalService } from '../../services/modal.service';
import { StateService } from '../../services/state.service';
import { Badge } from '../badge/badge';

@Component({
  selector: 'app-order-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge],
  templateUrl: './order-form.html'
})
export class OrderForm {
  readonly state = inject(StateService);
  readonly modal = inject(ModalService);

  readonly id = input<number | null>(null);
  readonly statuses = ORDER_STATUSES;

  readonly o = computed<Order>(
    () =>
      this.state.order(this.id()) ?? {
        id: 0,
        customer: this.state.customers()[0]?.id ?? 0,
        boxes: 1,
        status: 'รอจัดส่ง'
      }
  );
  readonly status = linkedSignal(() => this.o().status);
  readonly started = computed(() => STARTED_STATUSES.includes(this.o().status));
  readonly reasonShown = computed(() => ['ส่งไม่สำเร็จ', 'ยกเลิก'].includes(this.status()));
  readonly routeNote = computed(() => {
    const id = this.id();
    const route = id != null ? this.state.routeForOrder(id) : undefined;
    return route
      ? `ใบงาน LF-R${route.rider + 1} · ไรเดอร์ ${this.state.riders()[route.rider]?.name ?? ''}`
      : 'ยังไม่มีใบงาน · คำนวณเส้นทางก่อนเลือกสถานะจัดสรรหรือจัดส่ง';
  });

  save(event: Event): void {
    event.preventDefault();
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    const ok = this.state.saveOrder(
      {
        customer: Number(data.get('customer')),
        boxes: Number(data.get('boxes')),
        status: this.status(),
        reason: String(data.get('reason') ?? '')
      },
      this.id()
    );
    if (ok) this.modal.close();
  }
}
