import { Component, inject } from '@angular/core';
import { MarketingContent } from '../../../../core/services/marketing-content';

@Component({
  imports: [],
  selector: 'app-process',
  styleUrl: './process.scss',
  templateUrl: './process.html',
})
export class Process {
  protected readonly steps = inject(MarketingContent).processSteps;
}
