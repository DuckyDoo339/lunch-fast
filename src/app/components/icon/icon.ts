import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { iconPaths } from '../../core/icons';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.html'
})
export class Icon {
  readonly name = input.required<string>();
  readonly path = computed(() => iconPaths[this.name()] ?? iconPaths['jobs']);
}
