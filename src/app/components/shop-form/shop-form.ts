import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalService } from '../../services/modal.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-shop-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop-form.html'
})
export class ShopForm {
  readonly state = inject(StateService);
  readonly modal = inject(ModalService);

  save(event: Event): void {
    event.preventDefault();
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const data = new FormData(form);
    const ok = this.state.saveShop(Number(data.get('lat')), Number(data.get('lng')));
    if (ok) this.modal.close();
  }
}
