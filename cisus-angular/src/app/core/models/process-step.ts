export type ProcessStepId =
  'idea' | 'sketch' | 'design' | 'prototype' | 'production' | 'delivery' | 'result';

export interface ProcessStep {
  id: ProcessStepId;
  number: string;
  title: string;
  subtitle: string;
  icon: string;
}

export type ProcessIdeaId = 'portavasos' | 'tablas';

export type ProcessIdeaIllustration = 'coaster' | 'kitchen-board';

export interface ProcessIdea {
  id: ProcessIdeaId;
  label: string;
  illustration: ProcessIdeaIllustration;
  status: 'realized' | 'developing';
}

/**
 * The seven stages are universal; an idea selects which image sequence is shown for them.
 *
 * Portavasos deliberately keeps the legacy targets (`idea`, `sketch`, …) so the already
 * published sequence remains visible without a Storage rename. Every new idea receives an
 * explicit, allow-listed target per stage instead of allowing the browser to choose a path.
 */
export type ProcessMediaTargetId = ProcessStepId | `tablas_${ProcessStepId}`;

export const PROCESS_IDEA_MEDIA_TARGETS: Record<
  ProcessIdeaId,
  Record<ProcessStepId, ProcessMediaTargetId>
> = {
  portavasos: {
    idea: 'idea',
    sketch: 'sketch',
    design: 'design',
    prototype: 'prototype',
    production: 'production',
    delivery: 'delivery',
    result: 'result',
  },
  tablas: {
    idea: 'tablas_idea',
    sketch: 'tablas_sketch',
    design: 'tablas_design',
    prototype: 'tablas_prototype',
    production: 'tablas_production',
    delivery: 'tablas_delivery',
    result: 'tablas_result',
  },
};

export type ProcessImageUrls = Partial<Record<ProcessStepId, string | null>>;

export type ProcessIdeaImageUrls = Partial<Record<ProcessIdeaId, ProcessImageUrls>>;
