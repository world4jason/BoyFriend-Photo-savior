import { BENCHMARK_TEMPLATES as CORE_BENCHMARK_TEMPLATES } from './benchmarkTemplates';
import { RECOMPOSE_EXTRA_TEMPLATES } from './recomposeExtraTemplates';

export type { BenchmarkTemplate } from './benchmarkTemplates';

/**
 * Public template catalog used by the MVP library.
 * Core benchmark-derived seeds + the remaining public reCompose categories.
 */
export const BENCHMARK_TEMPLATES = [
  ...CORE_BENCHMARK_TEMPLATES,
  ...RECOMPOSE_EXTRA_TEMPLATES,
];
