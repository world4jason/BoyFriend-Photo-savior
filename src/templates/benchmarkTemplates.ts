import { GuidePreset, GuideSpec, PersonGuide } from '../types';

export type BenchmarkTemplate = {
  id: string;
  title: string;
  category: string;
  inspiredBy: 'PoseOverlay' | 'SOVS2' | 'PoseGhost' | 'reCompose';
  sourceUrl: string;
  defaultPreset: GuidePreset;
  guide: GuideSpec;
};

const portrait = (
  people: PersonGuide[],
  crop: GuideSpec['crop'],
  lookSpace: GuideSpec['lookSpace'],
  preset: GuidePreset,
): GuideSpec => ({
  kind: 'portrait',
  mode: 'outline',
  visualStyle: preset,
  people,
  crop,
  lookSpace,
  aspectRatio: 0.75,
  transform: { dx: 0, dy: 0, scale: 1 },
});

const baseHead = (x: number, y: number, facing: PersonGuide['head']['facing'] = 'front') => ({
  center: { x, y }, rx: 0.065, ry: 0.085, facing,
});

export const BENCHMARK_TEMPLATES: BenchmarkTemplate[] = [
  {
    id: 'power-stance',
    title: 'Power stance',
    category: 'Solo / standing',
    inspiredBy: 'PoseOverlay',
    sourceUrl: 'https://poseoverlay.com/',
    defaultPreset: 'poseoverlay',
    guide: portrait([{
      head: baseHead(0.50, 0.20),
      shoulders: { left: { x: 0.38, y: 0.31 }, right: { x: 0.62, y: 0.31 } },
      torso: { top: { x: 0.50, y: 0.33 }, bottom: { x: 0.50, y: 0.58 }, width: 0.22 },
      joints: {
        leftElbow: { x: 0.31, y: 0.44 }, leftWrist: { x: 0.41, y: 0.55 },
        rightElbow: { x: 0.69, y: 0.44 }, rightWrist: { x: 0.59, y: 0.55 },
        leftHip: { x: 0.43, y: 0.58 }, rightHip: { x: 0.57, y: 0.58 },
        leftKnee: { x: 0.40, y: 0.76 }, rightKnee: { x: 0.60, y: 0.76 },
        leftAnkle: { x: 0.36, y: 0.95 }, rightAnkle: { x: 0.64, y: 0.95 },
      },
    }], 'full', 'center', 'poseoverlay'),
  },
  {
    id: 'casual-walk',
    title: 'Casual walk',
    category: 'Solo / movement',
    inspiredBy: 'PoseOverlay',
    sourceUrl: 'https://poseoverlay.com/',
    defaultPreset: 'poseoverlay',
    guide: portrait([{
      head: baseHead(0.52, 0.20, 'left'),
      shoulders: { left: { x: 0.41, y: 0.31 }, right: { x: 0.62, y: 0.32 } },
      torso: { top: { x: 0.52, y: 0.33 }, bottom: { x: 0.51, y: 0.59 }, width: 0.20 },
      joints: {
        leftElbow: { x: 0.36, y: 0.46 }, leftWrist: { x: 0.32, y: 0.60 },
        rightElbow: { x: 0.66, y: 0.45 }, rightWrist: { x: 0.72, y: 0.56 },
        leftHip: { x: 0.45, y: 0.59 }, rightHip: { x: 0.57, y: 0.59 },
        leftKnee: { x: 0.39, y: 0.77 }, rightKnee: { x: 0.62, y: 0.75 },
        leftAnkle: { x: 0.31, y: 0.94 }, rightAnkle: { x: 0.69, y: 0.90 },
      },
    }], 'full', 'left', 'poseoverlay'),
  },
  {
    id: 'step-in-relaxed',
    title: 'Relaxed full body',
    category: 'Solo / silhouette',
    inspiredBy: 'SOVS2',
    sourceUrl: 'https://apppage.net/preview/me.sovs.sovs2',
    defaultPreset: 'sovs',
    guide: portrait([{
      head: baseHead(0.43, 0.22, 'right'),
      shoulders: { left: { x: 0.33, y: 0.34 }, right: { x: 0.54, y: 0.34 } },
      torso: { top: { x: 0.43, y: 0.35 }, bottom: { x: 0.46, y: 0.61 }, width: 0.19 },
      joints: {
        leftElbow: { x: 0.30, y: 0.49 }, leftWrist: { x: 0.33, y: 0.62 },
        rightElbow: { x: 0.58, y: 0.49 }, rightWrist: { x: 0.55, y: 0.63 },
        leftHip: { x: 0.40, y: 0.60 }, rightHip: { x: 0.52, y: 0.61 },
        leftKnee: { x: 0.41, y: 0.78 }, rightKnee: { x: 0.54, y: 0.79 },
        leftAnkle: { x: 0.40, y: 0.95 }, rightAnkle: { x: 0.58, y: 0.94 },
      },
    }], 'full', 'right', 'sovs'),
  },
  {
    id: 'ghost-over-shoulder',
    title: 'Over the shoulder',
    category: 'Solo / ghost silhouette',
    inspiredBy: 'PoseGhost',
    sourceUrl: 'https://play.google.com/store/apps/details?id=nz.dev.poseghost',
    defaultPreset: 'poseghost',
    guide: portrait([{
      head: baseHead(0.60, 0.25, 'left'),
      shoulders: { left: { x: 0.47, y: 0.36 }, right: { x: 0.68, y: 0.35 } },
      torso: { top: { x: 0.58, y: 0.37 }, bottom: { x: 0.55, y: 0.66 }, width: 0.20 },
      joints: {
        leftElbow: { x: 0.45, y: 0.51 }, leftWrist: { x: 0.48, y: 0.66 },
        rightElbow: { x: 0.70, y: 0.50 }, rightWrist: { x: 0.65, y: 0.61 },
        leftHip: { x: 0.50, y: 0.65 }, rightHip: { x: 0.61, y: 0.65 },
        leftKnee: { x: 0.49, y: 0.81 }, rightKnee: { x: 0.61, y: 0.81 },
        leftAnkle: { x: 0.48, y: 0.95 }, rightAnkle: { x: 0.62, y: 0.95 },
      },
    }], 'full', 'left', 'poseghost'),
  },
  {
    id: 'portrait-look-space',
    title: 'Portrait look space',
    category: 'Portrait / composition',
    inspiredBy: 'reCompose',
    sourceUrl: 'https://recompose.camera/',
    defaultPreset: 'recompose',
    guide: portrait([{
      head: baseHead(0.68, 0.30, 'left'),
      shoulders: { left: { x: 0.56, y: 0.43 }, right: { x: 0.80, y: 0.43 } },
      torso: { top: { x: 0.68, y: 0.44 }, bottom: { x: 0.68, y: 0.77 }, width: 0.23 },
      joints: { leftHip: { x: 0.61, y: 0.75 }, rightHip: { x: 0.75, y: 0.75 } },
    }], 'three-quarter', 'left', 'recompose'),
  },
  {
    id: 'two-person-stagger',
    title: 'Two-person stagger',
    category: 'Portrait / two people',
    inspiredBy: 'reCompose',
    sourceUrl: 'https://recompose.camera/',
    defaultPreset: 'recompose',
    guide: portrait([
      {
        head: baseHead(0.40, 0.31, 'right'),
        shoulders: { left: { x: 0.30, y: 0.42 }, right: { x: 0.50, y: 0.42 } },
        torso: { top: { x: 0.40, y: 0.43 }, bottom: { x: 0.40, y: 0.72 }, width: 0.18 },
      },
      {
        head: baseHead(0.63, 0.24, 'left'),
        shoulders: { left: { x: 0.53, y: 0.35 }, right: { x: 0.73, y: 0.35 } },
        torso: { top: { x: 0.63, y: 0.36 }, bottom: { x: 0.63, y: 0.66 }, width: 0.18 },
      },
    ], 'three-quarter', 'center', 'recompose'),
  },
  {
    id: 'plate-and-glass',
    title: 'Plate + glass',
    category: 'Food / two objects',
    inspiredBy: 'reCompose',
    sourceUrl: 'https://recompose.camera/',
    defaultPreset: 'recompose',
    guide: {
      kind: 'food', mode: 'simple', visualStyle: 'recompose', people: [],
      objects: [
        { center: { x: 0.42, y: 0.58 }, rx: 0.27, ry: 0.20, label: 'PLATE' },
        { center: { x: 0.72, y: 0.30 }, rx: 0.12, ry: 0.15, label: 'GLASS' },
      ],
      crop: 'tabletop', lookSpace: 'center', aspectRatio: 0.75,
      transform: { dx: 0, dy: 0, scale: 1 },
    },
  },
  {
    id: 'food-triangle',
    title: 'Three-object triangle',
    category: 'Food / three objects',
    inspiredBy: 'reCompose',
    sourceUrl: 'https://recompose.camera/',
    defaultPreset: 'recompose',
    guide: {
      kind: 'food', mode: 'simple', visualStyle: 'recompose', people: [],
      objects: [
        { center: { x: 0.34, y: 0.62 }, rx: 0.22, ry: 0.17, label: 'HERO' },
        { center: { x: 0.67, y: 0.59 }, rx: 0.15, ry: 0.12, label: 'SECOND' },
        { center: { x: 0.63, y: 0.31 }, rx: 0.13, ry: 0.11, label: 'THIRD' },
      ],
      crop: 'tabletop', lookSpace: 'center', aspectRatio: 0.75,
      transform: { dx: 0, dy: 0, scale: 1 },
    },
  },
];
