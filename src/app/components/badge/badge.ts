import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { badgeKind } from '../../core/metrics';

@Component({
  selector: 'app-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './badge.html'
})
export class Badge {
  readonly status = input.required<string>();
  readonly kind = computed(() => badgeKind(this.status()));
}
