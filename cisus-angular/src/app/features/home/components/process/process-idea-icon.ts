import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { ProcessIdeaIllustration } from '../../../../core/models/process-step';

/** Original supplied vectors. The trace belongs to the product outline, never its button. */
@Component({
  selector: 'app-process-idea-icon',
  templateUrl: './process-idea-icon.html',
  styleUrl: './process-idea-icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProcessIdeaIcon {
  readonly illustration = input.required<ProcessIdeaIllustration>();
  readonly instanceId = input.required<string>();
  protected readonly gradientId = computed(() => `idea-trace-${this.instanceId()}`);
}
