import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Icon } from '../../components/icon/icon';
import { LiveMap } from '../../components/live-map/live-map';
import { RouteCard } from '../../components/route-card/route-card';
import { TitleBlock } from '../../components/title-block/title-block';
import { ModalService } from '../../services/modal.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-routes-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleBlock, LiveMap, RouteCard, Icon],
  templateUrl: './routes-page.html'
})
export class RoutesPage {
  readonly state = inject(StateService);
  readonly modal = inject(ModalService);

  readonly waiting = computed(() => this.state.activeOrders().filter((o) => o.status === 'รอจัดส่ง').length);

  setDepart(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.state.settings.update((s) => ({ ...s, depart: value }));
  }

  setDelay(event: Event): void {
    const value = Math.max(0, Math.min(30, Number((event.target as HTMLInputElement).value)));
    this.state.settings.update((s) => ({ ...s, delay: value }));
  }
}
