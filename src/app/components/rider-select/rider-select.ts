import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-rider-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './rider-select.html'
})
export class RiderSelect {
  readonly state = inject(StateService);

  select(event: Event): void {
    this.state.selectRider(Number((event.target as HTMLSelectElement).value));
  }
}
