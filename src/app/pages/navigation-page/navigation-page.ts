import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Icon } from '../../components/icon/icon';
import { LiveMap } from '../../components/live-map/live-map';
import { RiderSelect } from '../../components/rider-select/rider-select';
import { TitleBlock } from '../../components/title-block/title-block';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-navigation-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleBlock, RiderSelect, LiveMap, Icon],
  templateUrl: './navigation-page.html'
})
export class NavigationPage {
  readonly state = inject(StateService);

  readonly ids = computed(
    () => this.state.routes().find((r) => r.rider === this.state.selected())?.ids ?? []
  );

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

  mapsHref(id: number): string {
    const o = this.state.order(id);
    const c = o ? this.state.customer(o.customer) : undefined;
    return c
      ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}&travelmode=driving`
      : '#';
  }
}
