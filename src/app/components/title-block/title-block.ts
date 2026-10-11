import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-title-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="heading">
    <div>
      <div class="eyebrow">{{ eyebrow() }}</div>
      <h1>{{ title() }}</h1>
      <div class="sub">{{ sub() }}</div>
    </div>
    <div><ng-content /></div>
  </div>`
})
export class TitleBlock {
  private readonly state = inject(StateService);

  readonly title = input.required<string>();
  readonly sub = input.required<string>();
  readonly eyebrow = computed(() =>
    this.state.role() === 'rider' ? 'ON THE ROAD / ไรเดอร์' : 'RESTAURANT / มื้อเที่ยงวันนี้'
  );
}
