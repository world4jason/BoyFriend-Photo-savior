import { lensHintFromGuide } from '../shooting/lensHint';
import { BENCHMARK_TEMPLATES as CORE_BENCHMARK_TEMPLATES } from './benchmarkTemplates';
import { POSEGHOST_POC_TEMPLATES } from './poseghostPocTemplates';
import { RECOMPOSE_EXTRA_TEMPLATES } from './recomposeExtraTemplates';

export type { BenchmarkTemplate } from './benchmarkTemplates';

/**
 * Public template catalog used by the MVP library.
 *
 * Existing benchmark seeds are geometry reconstructions, not source-extracted
 * copies of the displayed reference poses. Until a template is explicitly
 * replaced by source-derived geometry it is labeled approximate and receives a
 * non-binding starting-lens hint from its framing/crop.
 */
const withPocMetadata = <T extends { guide: any }>(template: T): T => ({
  ...template,
  guide: {
    ...template.guide,
    fidelity: template.guide.fidelity ?? 'approximate',
    lensHint: template.guide.lensHint ?? lensHintFromGuide(template.guide),
  },
});

export const BENCHMARK_TEMPLATES = [
  ...CORE_BENCHMARK_TEMPLATES.filter((template) => template.defaultPreset !== 'poseghost'),
  ...POSEGHOST_POC_TEMPLATES,
  ...RECOMPOSE_EXTRA_TEMPLATES,
].map(withPocMetadata);
