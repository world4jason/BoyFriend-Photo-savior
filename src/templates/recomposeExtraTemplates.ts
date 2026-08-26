import { BenchmarkTemplate } from './benchmarkTemplates';
import { GuideAnnotation, GuideSpec, PersonGuide } from '../types';

const RECOMPOSE = 'https://recompose.camera/';

const head = (x: number, y: number, facing: PersonGuide['head']['facing'] = 'front') => ({
  center: { x, y }, rx: 0.064, ry: 0.084, facing,
});

const selfiePerson = (x: number, facing: PersonGuide['head']['facing'] = 'front'): PersonGuide => ({
  head: head(x, 0.31, facing),
  shoulders: { left: { x: x - 0.14, y: 0.45 }, right: { x: x + 0.14, y: 0.45 } },
  torso: { top: { x, y: 0.46 }, bottom: { x, y: 0.82 }, width: 0.25 },
  joints: { leftHip: { x: x - 0.08, y: 0.80 }, rightHip: { x: x + 0.08, y: 0.80 } },
});

const portrait = (people: PersonGuide[], lookSpace: GuideSpec['lookSpace'] = 'center'): GuideSpec => ({
  kind: 'portrait', mode: 'outline', visualStyle: 'recompose', people,
  crop: 'three-quarter', lookSpace, aspectRatio: 0.75,
  transform: { dx: 0, dy: 0, scale: 1 },
});

const scene = (annotations: GuideAnnotation[]): GuideSpec => ({
  kind: 'scene', mode: 'simple', visualStyle: 'recompose', people: [], annotations,
  crop: 'scene', lookSpace: 'center', aspectRatio: 0.75,
  transform: { dx: 0, dy: 0, scale: 1 },
});

export const RECOMPOSE_EXTRA_TEMPLATES: BenchmarkTemplate[] = [
  // Selfie — official public list: off-center framing, duos, look space.
  {
    id: 'gd-selfie-off-center', title: 'Off-center selfie', category: 'Guide / Selfie', inspiredBy: 'reCompose',
    sourceUrl: RECOMPOSE, defaultPreset: 'recompose', guide: portrait([selfiePerson(0.34, 'right')], 'right'),
  },
  {
    id: 'gd-selfie-duo', title: 'Selfie duo', category: 'Guide / Selfie', inspiredBy: 'reCompose',
    sourceUrl: RECOMPOSE, defaultPreset: 'recompose', guide: portrait([selfiePerson(0.39, 'right'), selfiePerson(0.65, 'left')]),
  },
  {
    id: 'gd-selfie-look-space', title: 'Selfie look space', category: 'Guide / Selfie', inspiredBy: 'reCompose',
    sourceUrl: RECOMPOSE, defaultPreset: 'recompose', guide: portrait([selfiePerson(0.68, 'left')], 'left'),
  },

  // Pets — official public list: eye-level, looking room, tiny-against-big.
  {
    id: 'gd-pet-eye-level', title: 'Pet eye-level', category: 'Guide / Pets', inspiredBy: 'reCompose',
    sourceUrl: RECOMPOSE, defaultPreset: 'recompose', guide: scene([
      { type: 'line', from: { x: 0.08, y: 0.53 }, to: { x: 0.92, y: 0.53 }, label: 'EYE LEVEL' },
      { type: 'zone', center: { x: 0.50, y: 0.59 }, rx: 0.20, ry: 0.18, label: 'PET' },
    ]),
  },
  {
    id: 'gd-pet-looking-room', title: 'Pet looking room', category: 'Guide / Pets', inspiredBy: 'reCompose',
    sourceUrl: RECOMPOSE, defaultPreset: 'recompose', guide: scene([
      { type: 'zone', center: { x: 0.70, y: 0.58 }, rx: 0.18, ry: 0.19, label: 'PET' },
      { type: 'line', from: { x: 0.59, y: 0.53 }, to: { x: 0.14, y: 0.53 }, label: 'LOOK SPACE', dashed: true },
    ]),
  },
  {
    id: 'gd-pet-tiny-big', title: 'Tiny against big', category: 'Guide / Pets', inspiredBy: 'reCompose',
    sourceUrl: RECOMPOSE, defaultPreset: 'recompose', guide: scene([
      { type: 'frame', left: 0.08, top: 0.08, right: 0.92, bottom: 0.90, label: 'BIG ENVIRONMENT' },
      { type: 'zone', center: { x: 0.68, y: 0.78 }, rx: 0.07, ry: 0.08, label: 'PET' },
    ]),
  },

  // Family — official public list: candid framing, staggered group heads, kid-height.
  {
    id: 'gd-family-candid', title: 'Family candid frame', category: 'Guide / Family', inspiredBy: 'reCompose',
    sourceUrl: RECOMPOSE, defaultPreset: 'recompose', guide: scene([
      { type: 'frame', left: 0.12, top: 0.17, right: 0.88, bottom: 0.88, label: 'ACTION AREA' },
      { type: 'point', position: { x: 0.68, y: 0.40 }, label: 'MOMENT' },
    ]),
  },
  {
    id: 'gd-family-stagger-heads', title: 'Staggered group heads', category: 'Guide / Family', inspiredBy: 'reCompose',
    sourceUrl: RECOMPOSE, defaultPreset: 'recompose', guide: scene([
      { type: 'point', position: { x: 0.26, y: 0.37 }, label: 'HEAD' },
      { type: 'point', position: { x: 0.48, y: 0.28 }, label: 'HEAD' },
      { type: 'point', position: { x: 0.70, y: 0.41 }, label: 'HEAD' },
      { type: 'point', position: { x: 0.43, y: 0.53 }, label: 'HEAD' },
    ]),
  },
  {
    id: 'gd-family-kid-height', title: 'Kid-height shot', category: 'Guide / Family', inspiredBy: 'reCompose',
    sourceUrl: RECOMPOSE, defaultPreset: 'recompose', guide: scene([
      { type: 'line', from: { x: 0.08, y: 0.63 }, to: { x: 0.92, y: 0.63 }, label: 'CAMERA AT KID HEIGHT' },
      { type: 'zone', center: { x: 0.50, y: 0.58 }, rx: 0.16, ry: 0.22, label: 'KID' },
    ]),
  },
];
