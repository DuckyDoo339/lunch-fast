import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ModalService } from '../../services/modal.service';
import { CustomerForm } from '../customer-form/customer-form';
import { OrderForm } from '../order-form/order-form';
import { ShopForm } from '../shop-form/shop-form';
import { Worksheet } from '../worksheet/worksheet';

@Component({
  selector: 'app-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CustomerForm, OrderForm, ShopForm, Worksheet],
  templateUrl: './dialog.html'
})
export class Dialog {
  readonly modal = inject(ModalService);
  private readonly dialogEl = viewChild<ElementRef<HTMLDialogElement>>('dialogEl');

  constructor() {
    effect(() => {
      const el = this.dialogEl()?.nativeElement;
      const state = this.modal.current();
      if (!el) return;
      if (state && !el.open) el.showModal();
      else if (!state && el.open) el.close();
    });
  }
}
