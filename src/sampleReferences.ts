import { applySourceDerivedSampleOverride } from './sampleSourceDerivedOverrides';
import { lensHintFromGuide } from './shooting/lensHint';
import { GuideSpec, GuideVisualStyle } from './types';

export type SampleReference = {
  id: string;
  title: string;
  tag: string;
  imageUrl: string;
  sourceUrl: string;
  credit: string;
  guide: GuideSpec;
};

const portrait = (people: GuideSpec['people'], crop: GuideSpec['crop'], lookSpace: GuideSpec['lookSpace']): GuideSpec => ({
  kind: 'portrait',
  mode: 'outline',
  visualStyle: 'sovs',
  people,
  crop,
  lookSpace,
  fidelity: 'approximate',
  aspectRatio: 0.75,
  transform: { dx: 0, dy: 0, scale: 1 },
});

const BASE_REFERENCES: SampleReference[] = [
  {
    id: 'cafe-lean',
    title: 'Cafe lean',
    tag: 'HALF BODY · OUTER SHAPE',
    credit: 'Photo: amin naderloei / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/vxefqB0OwTA',
    imageUrl: 'https://images.unsplash.com/photo-1760551938407-f66c40173749?auto=format&fit=crop&w=900&h=1200&q=82',
    guide: portrait([
      {
        head: { center: { x: 0.56, y: 0.34 }, rx: 0.095, ry: 0.115, facing: 'front' },
        shoulders: { left: { x: 0.32, y: 0.49 }, right: { x: 0.74, y: 0.51 } },
        torso: { top: { x: 0.53, y: 0.50 }, bottom: { x: 0.60, y: 0.77 }, width: 0.34 },
        joints: {
          leftElbow: { x: 0.29, y: 0.59 }, leftWrist: { x: 0.38, y: 0.47 },
          rightElbow: { x: 0.52, y: 0.65 }, rightWrist: { x: 0.43, y: 0.48 },
          leftHip: { x: 0.48, y: 0.76 }, rightHip: { x: 0.67, y: 0.78 },
        },
      },
    ], 'three-quarter', 'center'),
  },
  {
    id: 'street-turn',
    title: 'Look back',
    tag: 'FULL BODY · OUTER SHAPE',
    credit: 'Photo: Rodolfo Sanches Carvalho / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/yq_M_VLGAKk',
    imageUrl: 'https://images.unsplash.com/photo-1510112779932-4e1b71001c26?auto=format&fit=crop&w=900&h=1200&q=82',
    guide: portrait([
      {
        head: { center: { x: 0.57, y: 0.24 }, rx: 0.072, ry: 0.095, facing: 'right' },
        shoulders: { left: { x: 0.44, y: 0.34 }, right: { x: 0.65, y: 0.35 } },
        torso: { top: { x: 0.54, y: 0.35 }, bottom: { x: 0.51, y: 0.61 }, width: 0.20 },
        joints: {
          leftElbow: { x: 0.43, y: 0.50 }, leftWrist: { x: 0.44, y: 0.62 },
          rightElbow: { x: 0.66, y: 0.49 }, rightWrist: { x: 0.62, y: 0.61 },
          leftHip: { x: 0.45, y: 0.61 }, rightHip: { x: 0.57, y: 0.61 },
          leftKnee: { x: 0.46, y: 0.78 }, rightKnee: { x: 0.58, y: 0.78 },
          leftAnkle: { x: 0.44, y: 0.96 }, rightAnkle: { x: 0.59, y: 0.96 },
        },
      },
    ], 'full', 'right'),
  },
  {
    id: 'low-squat',
    title: 'Low squat',
    tag: 'FULL BODY · OUTER SHAPE',
    credit: 'Photo: Victor Dueñas Teixeira / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/6ExulFuSnJI',
    imageUrl: 'https://images.unsplash.com/photo-1509946458702-4378df1e2560?auto=format&fit=crop&w=900&h=1200&q=82',
    guide: portrait([
      {
        head: { center: { x: 0.50, y: 0.27 }, rx: 0.075, ry: 0.095, facing: 'front' },
        shoulders: { left: { x: 0.37, y: 0.38 }, right: { x: 0.62, y: 0.38 } },
        torso: { top: { x: 0.50, y: 0.39 }, bottom: { x: 0.48, y: 0.56 }, width: 0.23 },
        joints: {
          leftElbow: { x: 0.30, y: 0.49 }, leftWrist: { x: 0.39, y: 0.61 },
          rightElbow: { x: 0.67, y: 0.50 }, rightWrist: { x: 0.59, y: 0.62 },
          leftHip: { x: 0.40, y: 0.56 }, rightHip: { x: 0.57, y: 0.56 },
          leftKnee: { x: 0.26, y: 0.72 }, rightKnee: { x: 0.69, y: 0.72 },
          leftAnkle: { x: 0.37, y: 0.88 }, rightAnkle: { x: 0.59, y: 0.88 },
        },
      },
    ], 'full', 'center'),
  },
  {
    id: 'duo-cafe',
    title: 'Duo sit',
    tag: 'TWO PEOPLE · OUTER RELATION',
    credit: 'Photo: Aleksandar Andreev / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/AVUFRV2NZCc',
    imageUrl: 'https://images.unsplash.com/photo-1679136341086-2a9a6bc414aa?auto=format&fit=crop&w=900&h=1200&q=82',
    guide: portrait([
      {
        head: { center: { x: 0.35, y: 0.31 }, rx: 0.07, ry: 0.09, facing: 'right' },
        shoulders: { left: { x: 0.24, y: 0.41 }, right: { x: 0.45, y: 0.42 } },
        torso: { top: { x: 0.35, y: 0.42 }, bottom: { x: 0.35, y: 0.70 }, width: 0.18 },
        joints: { leftHip: { x: 0.29, y: 0.68 }, rightHip: { x: 0.42, y: 0.68 } },
      },
      {
        head: { center: { x: 0.66, y: 0.29 }, rx: 0.07, ry: 0.09, facing: 'left' },
        shoulders: { left: { x: 0.55, y: 0.40 }, right: { x: 0.77, y: 0.41 } },
        torso: { top: { x: 0.66, y: 0.41 }, bottom: { x: 0.65, y: 0.70 }, width: 0.18 },
        joints: { leftHip: { x: 0.59, y: 0.68 }, rightHip: { x: 0.72, y: 0.68 } },
      },
    ], 'three-quarter', 'center'),
  },
  {
    id: 'dessert-trio',
    title: 'Dessert trio',
    tag: 'FOOD · 3 OBJECTS · TRIANGLE',
    credit: 'Photo: Lee Milo / Unsplash',
    sourceUrl: 'https://unsplash.com/photos/EFJnW0ENEoY',
    imageUrl: 'https://images.unsplash.com/photo-1768203628150-0f4acfda2201?auto=format&fit=crop&w=900&h=1200&q=82',
    guide: {
      kind: 'food',
      mode: 'simple',
      visualStyle: 'recompose',
      people: [],
      objects: [
        { center: { x: 0.34, y: 0.61 }, rx: 0.24, ry: 0.18, label: 'CAKE', rotation: -10 },
        { center: { x: 0.66, y: 0.60 }, rx: 0.17, ry: 0.14, label: 'PUDDING' },
        { center: { x: 0.66, y: 0.31 }, rx: 0.15, ry: 0.12, label: 'DRINK' },
      ],
      crop: 'tabletop',
      lookSpace: 'center',
      fidelity: 'approximate',
      aspectRatio: 0.75,
      transform: { dx: 0, dy: 0, scale: 1 },
    },
  },
];

const STYLE_NAMES: { key: GuideVisualStyle; title: string; tag: string }[] = [
  { key: 'sovs', title: 'SOVS-like', tag: 'BENCHMARK · OUTLINE / SILHOUETTE' },
  { key: 'poseoverlay', title: 'PoseOverlay-like', tag: 'BENCHMARK · SKELETON MATCH' },
  { key: 'poseghost', title: 'PoseGhost-like', tag: 'BENCHMARK · GHOST SILHOUETTE' },
  { key: 'recompose', title: 'reCompose-like', tag: 'BENCHMARK · COMPOSITION GUIDE' },
];

const benchmarkBase = BASE_REFERENCES[0];
const STYLE_BENCHMARKS: SampleReference[] = STYLE_NAMES.map(({ key, title, tag }) => ({
  ...benchmarkBase,
  id: `style-${key}`,
  title,
  tag,
  guide: {
    ...benchmarkBase.guide,
    visualStyle: key,
  },
}));

const withShootingMetadata = (sample: SampleReference): SampleReference => {
  const guide = { ...sample.guide };
  guide.fidelity = guide.fidelity ?? 'approximate';
  guide.lensHint = guide.lensHint ?? lensHintFromGuide(guide);
  return { ...sample, guide };
};

export const SAMPLE_REFERENCES: SampleReference[] = [
  ...STYLE_BENCHMARKS,
  ...BASE_REFERENCES,
].map(withShootingMetadata).map(applySourceDerivedSampleOverride);
