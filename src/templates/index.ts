import { BENCHMARK_TEMPLATES as CORE_BENCHMARK_TEMPLATES } from './benchmarkTemplates';
import { POSEGHOST_POC_TEMPLATES } from './poseghostPocTemplates';
import { RECOMPOSE_EXTRA_TEMPLATES } from './recomposeExtraTemplates';

export type { BenchmarkTemplate } from './benchmarkTemplates';

/**
 * Public template catalog used by the MVP library.
 *
 * Ghost mode is intentionally replaced with the 62-slot PoseGhost POC catalog so
 * the mode count reflects the benchmark's public total instead of the earlier
 * small seed set. Other modes keep their existing benchmark-derived seeds.
 */
export const BENCHMARK_TEMPLATES = [
  ...CORE_BENCHMARK_TEMPLATES.filter((template) => template.defaultPreset !== 'poseghost'),
  ...POSEGHOST_POC_TEMPLATES,
  ...RECOMPOSE_EXTRA_TEMPLATES,
];
