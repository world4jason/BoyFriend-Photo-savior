import { BenchmarkTemplate } from './benchmarkTemplates';
import { GuideSpec, NormalizedPoint, PersonGuide } from '../types';

const SOURCE = 'https://play.google.com/store/apps/details?id=nz.dev.poseghost';

type PoseFamily =
  | 'selfie-soft'
  | 'selfie-hair'
  | 'selfie-cheek'
  | 'female-stand'
  | 'female-hip'
  | 'female-seated'
  | 'female-walk'
  | 'female-over-shoulder'
  | 'male-relaxed'
  | 'male-pocket'
  | 'male-lean'
  | 'couple-hug'
  | 'couple-handhold'
  | 'couple-twirl'
  | 'couple-back'
  | 'wedding-side'
  | 'wedding-dance'
  | 'wedding-dip'
  | 'group-row'
  | 'group-stagger';

type PoseRecipe = {
  head: NormalizedPoint;
  shoulders: [NormalizedPoint, NormalizedPoint];
  elbows: [NormalizedPoint, NormalizedPoint];
  wrists: [NormalizedPoint, NormalizedPoint];
  hips: [NormalizedPoint, NormalizedPoint];
  knees: [NormalizedPoint, NormalizedPoint];
  ankles: [NormalizedPoint, NormalizedPoint];
  facing?: PersonGuide['head']['facing'];
};

const r = (
  head: [number, number],
  shoulders: [number, number, number, number],
  elbows: [number, number, number, number],
  wrists: [number, number, number, number],
  hips: [number, number, number, number],
  knees: [number, number, number, number],
  ankles: [number, number, number, number],
  facing: PersonGuide['head']['facing'] = 'front',
): PoseRecipe => ({
  head: { x: head[0], y: head[1] },
  shoulders: [{ x: shoulders[0], y: shoulders[1] }, { x: shoulders[2], y: shoulders[3] }],
  elbows: [{ x: elbows[0], y: elbows[1] }, { x: elbows[2], y: elbows[3] }],
  wrists: [{ x: wrists[0], y: wrists[1] }, { x: wrists[2], y: wrists[3] }],
  hips: [{ x: hips[0], y: hips[1] }, { x: hips[2], y: hips[3] }],
  knees: [{ x: knees[0], y: knees[1] }, { x: knees[2], y: knees[3] }],
  ankles: [{ x: ankles[0], y: ankles[1] }, { x: ankles[2], y: ankles[3] }],
  facing,
});

const RECIPES: Record<PoseFamily, PoseRecipe> = {
  'selfie-soft': r([0.50, 0.23], [0.39, 0.35, 0.61, 0.35], [0.34, 0.49, 0.67, 0.48], [0.42, 0.36, 0.60, 0.57], [0.43, 0.62, 0.57, 0.62], [0.43, 0.79, 0.57, 0.79], [0.42, 0.95, 0.58, 0.95]),
  'selfie-hair': r([0.53, 0.23], [0.40, 0.35, 0.63, 0.36], [0.33, 0.48, 0.70, 0.47], [0.43, 0.27, 0.66, 0.61], [0.45, 0.62, 0.59, 0.62], [0.44, 0.80, 0.60, 0.79], [0.43, 0.95, 0.61, 0.95], 'left'),
  'selfie-cheek': r([0.48, 0.24], [0.37, 0.36, 0.59, 0.35], [0.31, 0.49, 0.66, 0.46], [0.43, 0.29, 0.59, 0.61], [0.41, 0.62, 0.55, 0.62], [0.41, 0.80, 0.56, 0.79], [0.40, 0.95, 0.57, 0.95], 'right'),
  'female-stand': r([0.50, 0.19], [0.38, 0.31, 0.62, 0.32], [0.31, 0.46, 0.69, 0.46], [0.29, 0.61, 0.71, 0.61], [0.43, 0.59, 0.57, 0.59], [0.42, 0.77, 0.58, 0.77], [0.40, 0.95, 0.60, 0.95]),
  'female-hip': r([0.52, 0.20], [0.39, 0.31, 0.64, 0.34], [0.31, 0.45, 0.70, 0.48], [0.42, 0.56, 0.62, 0.60], [0.46, 0.59, 0.62, 0.61], [0.45, 0.78, 0.65, 0.75], [0.42, 0.95, 0.70, 0.91], 'left'),
  'female-seated': r([0.50, 0.24], [0.38, 0.36, 0.62, 0.36], [0.31, 0.50, 0.69, 0.50], [0.42, 0.61, 0.59, 0.61], [0.42, 0.62, 0.58, 0.62], [0.30, 0.72, 0.70, 0.73], [0.24, 0.88, 0.76, 0.89]),
  'female-walk': r([0.51, 0.19], [0.39, 0.31, 0.62, 0.32], [0.34, 0.46, 0.67, 0.45], [0.28, 0.59, 0.73, 0.56], [0.44, 0.59, 0.58, 0.59], [0.37, 0.77, 0.64, 0.75], [0.29, 0.95, 0.72, 0.90], 'left'),
  'female-over-shoulder': r([0.58, 0.22], [0.44, 0.34, 0.67, 0.36], [0.39, 0.49, 0.72, 0.49], [0.43, 0.62, 0.67, 0.61], [0.49, 0.61, 0.63, 0.61], [0.48, 0.79, 0.64, 0.79], [0.47, 0.95, 0.65, 0.95], 'left'),
  'male-relaxed': r([0.50, 0.19], [0.37, 0.31, 0.63, 0.31], [0.30, 0.46, 0.70, 0.46], [0.33, 0.61, 0.67, 0.61], [0.42, 0.60, 0.58, 0.60], [0.42, 0.78, 0.58, 0.78], [0.40, 0.95, 0.60, 0.95]),
  'male-pocket': r([0.49, 0.20], [0.36, 0.32, 0.62, 0.32], [0.31, 0.46, 0.67, 0.46], [0.42, 0.59, 0.57, 0.59], [0.42, 0.60, 0.58, 0.60], [0.40, 0.78, 0.61, 0.77], [0.37, 0.95, 0.65, 0.93], 'right'),
  'male-lean': r([0.46, 0.21], [0.34, 0.33, 0.58, 0.30], [0.28, 0.47, 0.64, 0.43], [0.25, 0.61, 0.65, 0.57], [0.38, 0.60, 0.53, 0.58], [0.39, 0.78, 0.55, 0.76], [0.40, 0.95, 0.58, 0.92], 'right'),
  'couple-hug': r([0.50, 0.20], [0.39, 0.32, 0.61, 0.32], [0.32, 0.46, 0.68, 0.46], [0.41, 0.54, 0.59, 0.54], [0.43, 0.59, 0.57, 0.59], [0.42, 0.77, 0.58, 0.77], [0.41, 0.95, 0.59, 0.95]),
  'couple-handhold': r([0.50, 0.20], [0.39, 0.32, 0.61, 0.32], [0.33, 0.47, 0.68, 0.47], [0.27, 0.61, 0.73, 0.61], [0.43, 0.59, 0.57, 0.59], [0.41, 0.77, 0.59, 0.77], [0.39, 0.95, 0.61, 0.95]),
  'couple-twirl': r([0.50, 0.20], [0.39, 0.32, 0.61, 0.32], [0.32, 0.43, 0.68, 0.43], [0.37, 0.24, 0.63, 0.24], [0.43, 0.59, 0.57, 0.59], [0.40, 0.76, 0.61, 0.75], [0.36, 0.94, 0.66, 0.90]),
  'couple-back': r([0.50, 0.20], [0.38, 0.32, 0.62, 0.32], [0.31, 0.46, 0.69, 0.46], [0.29, 0.60, 0.71, 0.60], [0.42, 0.59, 0.58, 0.59], [0.42, 0.78, 0.58, 0.78], [0.40, 0.95, 0.60, 0.95]),
  'wedding-side': r([0.50, 0.20], [0.38, 0.32, 0.62, 0.32], [0.33, 0.47, 0.67, 0.47], [0.38, 0.57, 0.62, 0.57], [0.43, 0.59, 0.57, 0.59], [0.42, 0.77, 0.58, 0.77], [0.40, 0.95, 0.60, 0.95]),
  'wedding-dance': r([0.50, 0.20], [0.38, 0.32, 0.62, 0.32], [0.31, 0.43, 0.69, 0.43], [0.37, 0.27, 0.63, 0.27], [0.43, 0.59, 0.57, 0.59], [0.39, 0.76, 0.62, 0.77], [0.35, 0.94, 0.67, 0.93]),
  'wedding-dip': r([0.55, 0.24], [0.42, 0.35, 0.67, 0.31], [0.35, 0.48, 0.72, 0.43], [0.38, 0.60, 0.68, 0.55], [0.46, 0.61, 0.62, 0.59], [0.42, 0.78, 0.64, 0.75], [0.38, 0.95, 0.69, 0.91], 'left'),
  'group-row': r([0.50, 0.20], [0.38, 0.32, 0.62, 0.32], [0.32, 0.47, 0.68, 0.47], [0.30, 0.61, 0.70, 0.61], [0.43, 0.59, 0.57, 0.59], [0.42, 0.77, 0.58, 0.77], [0.40, 0.95, 0.60, 0.95]),
  'group-stagger': r([0.50, 0.20], [0.38, 0.32, 0.62, 0.32], [0.31, 0.46, 0.69, 0.46], [0.34, 0.60, 0.66, 0.60], [0.43, 0.59, 0.57, 0.59], [0.41, 0.77, 0.59, 0.77], [0.39, 0.95, 0.61, 0.95]),
};

const transformPoint = (point: NormalizedPoint, centerX: number, scale: number, mirror: boolean, yOffset = 0): NormalizedPoint => ({
  x: centerX + (mirror ? -(point.x - 0.5) : point.x - 0.5) * scale,
  y: yOffset + point.y * scale,
});

function person(family: PoseFamily, centerX = 0.5, scale = 1, mirror = false, yOffset = 0): PersonGuide {
  const recipe = RECIPES[family];
  const p = (point: NormalizedPoint) => transformPoint(point, centerX, scale, mirror, yOffset);
  const [shoulderL, shoulderR] = recipe.shoulders.map(p) as [NormalizedPoint, NormalizedPoint];
  const [elbowL, elbowR] = recipe.elbows.map(p) as [NormalizedPoint, NormalizedPoint];
  const [wristL, wristR] = recipe.wrists.map(p) as [NormalizedPoint, NormalizedPoint];
  const [hipL, hipR] = recipe.hips.map(p) as [NormalizedPoint, NormalizedPoint];
  const [kneeL, kneeR] = recipe.knees.map(p) as [NormalizedPoint, NormalizedPoint];
  const [ankleL, ankleR] = recipe.ankles.map(p) as [NormalizedPoint, NormalizedPoint];
  const headCenter = p(recipe.head);
  const facing = mirror
    ? recipe.facing === 'left' ? 'right' : recipe.facing === 'right' ? 'left' : 'front'
    : recipe.facing ?? 'front';

  return {
    head: { center: headCenter, rx: 0.064 * scale, ry: 0.084 * scale, facing },
    shoulders: { left: shoulderL, right: shoulderR },
    torso: {
      top: { x: (shoulderL.x + shoulderR.x) / 2, y: (shoulderL.y + shoulderR.y) / 2 + 0.02 * scale },
      bottom: { x: (hipL.x + hipR.x) / 2, y: (hipL.y + hipR.y) / 2 },
      width: Math.abs(shoulderR.x - shoulderL.x) * 0.88,
    },
    joints: {
      leftElbow: elbowL, rightElbow: elbowR,
      leftWrist: wristL, rightWrist: wristR,
      leftHip: hipL, rightHip: hipR,
      leftKnee: kneeL, rightKnee: kneeR,
      leftAnkle: ankleL, rightAnkle: ankleR,
    },
  };
}

function guide(people: PersonGuide[], crop: GuideSpec['crop'] = 'full'): GuideSpec {
  return {
    kind: 'portrait',
    mode: 'outline',
    visualStyle: 'poseghost',
    people,
    crop,
    lookSpace: 'center',
    aspectRatio: 0.75,
    transform: { dx: 0, dy: 0, scale: 1 },
  };
}

function template(id: string, title: string, category: string, people: PersonGuide[], crop: GuideSpec['crop'] = 'full'): BenchmarkTemplate {
  return {
    id: `pg62-${id}`,
    title,
    category: `Ghost / ${category}`,
    inspiredBy: 'PoseGhost',
    sourceUrl: SOURCE,
    defaultPreset: 'poseghost',
    guide: guide(people, crop),
  };
}

const singles = (
  prefix: string,
  category: string,
  families: PoseFamily[],
  count: number,
  crop: GuideSpec['crop'] = 'full',
) => Array.from({ length: count }, (_, index) => {
  const family = families[index % families.length];
  const mirror = index % 2 === 1;
  const centerX = 0.5 + ((index % 3) - 1) * 0.035;
  const scale = 0.94 + (index % 4) * 0.02;
  const familyLabel = family.replaceAll('-', ' ');
  return template(`${prefix}-${String(index + 1).padStart(2, '0')}`, `${category} · ${familyLabel} ${index + 1}`, category, [person(family, centerX, scale, mirror)], crop);
});

const pairs = (
  prefix: string,
  category: string,
  families: PoseFamily[],
  count: number,
) => Array.from({ length: count }, (_, index) => {
  const family = families[index % families.length];
  const spacing = 0.18 + (index % 3) * 0.018;
  const left = person(family, 0.5 - spacing / 2, 0.82, false, 0.11);
  const right = person(family, 0.5 + spacing / 2, 0.82, true, 0.11);
  return template(`${prefix}-${String(index + 1).padStart(2, '0')}`, `${category} · ${family.replaceAll('-', ' ')} ${index + 1}`, category, [left, right], 'full');
});

const groups = (
  prefix: string,
  category: string,
  count: number,
) => Array.from({ length: count }, (_, index) => {
  const peopleCount = index < 5 ? 3 : 4;
  const centers = peopleCount === 3 ? [0.30, 0.50, 0.70] : [0.22, 0.405, 0.595, 0.78];
  const people = centers.map((center, personIndex) =>
    person(index % 2 === 0 ? 'group-row' : 'group-stagger', center, 0.68 + (personIndex % 2) * 0.035, personIndex % 2 === 1, 0.25 - (personIndex % 2) * 0.025),
  );
  return template(`${prefix}-${String(index + 1).padStart(2, '0')}`, `${category} · ${peopleCount}-person ${index + 1}`, category, people, 'full');
});

/**
 * POC allocation: 62 slots across the six public PoseGhost category families.
 * PoseGhost publicly states the total (62) and six categories, but does not publish
 * a per-category count or all individual overlay names on the Play listing. These
 * are therefore family-based reconstruction slots, not a claim that our 1:1 titles
 * match the commercial library.
 */
export const POSEGHOST_POC_TEMPLATES: BenchmarkTemplate[] = [
  ...singles('selfie', 'Selfie Essentials', ['selfie-soft', 'selfie-hair', 'selfie-cheek'], 8, 'three-quarter'),
  ...singles('female', 'Female Poses', ['female-stand', 'female-hip', 'female-seated', 'female-walk', 'female-over-shoulder'], 14),
  ...singles('male', 'Male Poses', ['male-relaxed', 'male-pocket', 'male-lean'], 10),
  ...pairs('couple', 'Couple Poses', ['couple-hug', 'couple-handhold', 'couple-twirl', 'couple-back'], 12),
  ...pairs('wedding', 'Wedding Poses', ['wedding-side', 'wedding-dance', 'wedding-dip'], 8),
  ...groups('group', 'Friends & Groups', 10),
];

if (POSEGHOST_POC_TEMPLATES.length !== 62) {
  throw new Error(`PoseGhost POC template count must be 62, got ${POSEGHOST_POC_TEMPLATES.length}`);
}
