import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Icon } from '../../components/icon/icon';
import { LiveMap } from '../../components/live-map/live-map';
import { TitleBlock } from '../../components/title-block/title-block';
import { ModalService } from '../../services/modal.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-customers',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleBlock, LiveMap, Icon],
  templateUrl: './customers.html'
})
export class Customers {
  readonly state = inject(StateService);
  readonly modal = inject(ModalService);
  readonly query = signal('');

  readonly list = computed(() =>
    this.state.customers().filter((c) => (c.name + c.phone + c.address).includes(this.query()))
  );
}
