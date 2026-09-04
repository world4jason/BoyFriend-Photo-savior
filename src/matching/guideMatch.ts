import type { GuideSpec, NormalizedPoint, PersonGuide, PoseJoints } from '../types';

export type MatchStatus = 'searching' | 'adjust' | 'close' | 'matched';

export type MatchFeedback = {
  score: number;
  framingScore: number;
  scaleScore: number;
  poseScore?: number;
  faceScore?: number;
  status: MatchStatus;
  hint: string;
  detail: string;
};

type Box = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
  center: NormalizedPoint;
};

type NamedPoint = { name: string; point: NormalizedPoint };

type PoseCoverage = {
  targetAnchorCount: number;
  liveCoveredAnchorCount: number;
  requiredLiveAnchorCount: number;
  sufficient: boolean;
};

type PoseComparison = PoseCoverage & {
  score?: number;
  worst?: string;
  dy?: number;
};

const OPTIONAL_POSE_ANCHORS: readonly [string, keyof PoseJoints][] = [
  ['left_elbow', 'leftElbow'],
  ['right_elbow', 'rightElbow'],
  ['left_wrist', 'leftWrist'],
  ['right_wrist', 'rightWrist'],
  ['left_hip', 'leftHip'],
  ['right_hip', 'rightHip'],
  ['left_knee', 'leftKnee'],
  ['right_knee', 'rightKnee'],
  ['left_ankle', 'leftAnkle'],
  ['right_ankle', 'rightAnkle'],
] as const;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

/**
 * Map a normalized source-frame point into the same aspect-fit frame used by
 * GuideOverlay when the camera/container aspect differs from the reference.
 */
function fitPointToAspect(
  point: NormalizedPoint,
  sourceAspect?: number,
  containerAspect?: number,
): NormalizedPoint {
  if (!sourceAspect || sourceAspect <= 0 || !containerAspect || containerAspect <= 0) return point;
  if (Math.abs(sourceAspect - containerAspect) < 0.0001) return point;

  if (containerAspect > sourceAspect) {
    const frameWidth = sourceAspect / containerAspect;
    return {
      x: (1 - frameWidth) / 2 + point.x * frameWidth,
      y: point.y,
    };
  }

  const frameHeight = containerAspect / sourceAspect;
  return {
    x: point.x,
    y: (1 - frameHeight) / 2 + point.y * frameHeight,
  };
}

function applyTransform(
  point: NormalizedPoint,
  guide: GuideSpec,
  containerAspect?: number,
): NormalizedPoint {
  const transform = guide.transform ?? { dx: 0, dy: 0, scale: 1 };
  const transformed = {
    x: ((point.x - 0.5) * transform.scale) + 0.5 + transform.dx,
    y: ((point.y - 0.5) * transform.scale) + 0.5 + transform.dy,
  };
  return fitPointToAspect(transformed, guide.aspectRatio, containerAspect);
}

function personPoints(person: PersonGuide): NamedPoint[] {
  const points: NamedPoint[] = [];

  if (person.contour?.length) {
    person.contour.forEach((point, index) => points.push({ name: `contour_${index}`, point }));
  } else {
    const { center, rx, ry } = person.head;
    points.push(
      { name: 'head_left', point: { x: center.x - rx, y: center.y } },
      { name: 'head_right', point: { x: center.x + rx, y: center.y } },
      { name: 'head_top', point: { x: center.x, y: center.y - ry } },
      { name: 'head_bottom', point: { x: center.x, y: center.y + ry } },
    );
  }

  points.push(
    { name: 'head', point: person.head.center },
    { name: 'left_shoulder', point: person.shoulders.left },
    { name: 'right_shoulder', point: person.shoulders.right },
    { name: 'torso_top', point: person.torso.top },
    { name: 'torso_bottom', point: person.torso.bottom },
  );

  const joints = person.joints ?? {};
  OPTIONAL_POSE_ANCHORS.forEach(([name, key]) => {
    const point = joints[key];
    if (point) points.push({ name, point });
  });

  return points;
}

function poseCoverage(target: PersonGuide, live: PersonGuide): PoseCoverage {
  const targetJoints = target.joints ?? {};
  const liveJoints = live.joints ?? {};
  const targetKeys = OPTIONAL_POSE_ANCHORS
    .filter(([, key]) => Boolean(targetJoints[key]))
    .map(([, key]) => key);
  const targetAnchorCount = targetKeys.length;
  const liveCoveredAnchorCount = targetKeys.filter((key) => Boolean(liveJoints[key])).length;

  if (targetAnchorCount < 2) {
    return {
      targetAnchorCount,
      liveCoveredAnchorCount,
      requiredLiveAnchorCount: 0,
      sufficient: true,
    };
  }

  const requiredLiveAnchorCount = Math.min(
    targetAnchorCount,
    Math.max(2, Math.ceil(targetAnchorCount * 0.60)),
  );

  return {
    targetAnchorCount,
    liveCoveredAnchorCount,
    requiredLiveAnchorCount,
    sufficient: liveCoveredAnchorCount >= requiredLiveAnchorCount,
  };
}

function boxFromPoints(points: NormalizedPoint[]): Box {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  return {
    left,
    top,
    right,
    bottom,
    width: Math.max(0.001, right - left),
    height: Math.max(0.001, bottom - top),
    center: { x: (left + right) / 2, y: (top + bottom) / 2 },
  };
}

function transformedPersonBox(
  guide: GuideSpec,
  person: PersonGuide,
  containerAspect?: number,
): Box {
  return boxFromPoints(personPoints(person).map(({ point }) => applyTransform(point, guide, containerAspect)));
}

function relativePoseScore(
  targetGuide: GuideSpec,
  target: PersonGuide,
  liveGuide: GuideSpec,
  live: PersonGuide,
): PoseComparison {
  const coverage = poseCoverage(target, live);
  const liveAspect = liveGuide.aspectRatio ?? targetGuide.aspectRatio;
  const targetBox = transformedPersonBox(targetGuide, target, liveAspect);
  const liveIdentity: GuideSpec = { ...liveGuide, transform: { dx: 0, dy: 0, scale: 1 } };
  const liveBox = transformedPersonBox(liveIdentity, live, liveAspect);
  const targetNamed = new Map(personPoints(target).map(({ name, point }) => [name, applyTransform(point, targetGuide, liveAspect)]));
  const liveNamed = new Map(personPoints(live).map(({ name, point }) => [name, point]));

  const jointNames = [
    'left_shoulder', 'right_shoulder',
    ...OPTIONAL_POSE_ANCHORS.map(([name]) => name),
  ];

  let distanceSum = 0;
  let count = 0;
  let worstName: string | undefined;
  let worstDistance = -1;
  let worstDy = 0;

  for (const name of jointNames) {
    const targetPoint = targetNamed.get(name);
    const livePoint = liveNamed.get(name);
    if (!targetPoint || !livePoint) continue;

    const tx = (targetPoint.x - targetBox.center.x) / targetBox.height;
    const ty = (targetPoint.y - targetBox.center.y) / targetBox.height;
    const lx = (livePoint.x - liveBox.center.x) / liveBox.height;
    const ly = (livePoint.y - liveBox.center.y) / liveBox.height;
    const distance = Math.hypot(tx - lx, ty - ly);

    distanceSum += distance;
    count += 1;
    if (distance > worstDistance) {
      worstDistance = distance;
      worstName = name;
      worstDy = ly - ty;
    }
  }

  if (count < 4 || !coverage.sufficient) return coverage;
  const averageDistance = distanceSum / count;
  return {
    ...coverage,
    score: clamp01(1 - averageDistance / 0.23),
    worst: worstName,
    dy: worstDy,
  };
}

function humanizeJoint(name?: string) {
  if (!name) return 'pose';
  return name.replaceAll('_', ' ');
}

export function scorePortraitMatch(targetGuide: GuideSpec, liveGuide: GuideSpec): MatchFeedback {
  if (targetGuide.people.length !== 1) {
    return {
      score: 0,
      framingScore: 0,
      scaleScore: 0,
      status: 'searching',
      hint: 'Manual guide only',
      detail: 'Live Coach currently supports one-person targets. Use the overlay manually for duo or group shots.',
    };
  }

  const target = targetGuide.people[0];
  const live = liveGuide.people[0];
  if (!target || !live) {
    return {
      score: 0,
      framingScore: 0,
      scaleScore: 0,
      status: 'searching',
      hint: 'Find the subject',
      detail: 'Keep one person clearly visible in the frame.',
    };
  }

  // The renderer aspect-fits the reference geometry into the camera frame. The
  // matcher must compare in that same coordinate space or a 3:4 target shown
  // in a 9:16 camera can look aligned while still receiving wrong scale hints.
  const liveAspect = liveGuide.aspectRatio ?? targetGuide.aspectRatio;
  const targetBox = transformedPersonBox(targetGuide, target, liveAspect);
  const liveIdentity: GuideSpec = { ...liveGuide, transform: { dx: 0, dy: 0, scale: 1 } };
  const liveBox = transformedPersonBox(liveIdentity, live, liveAspect);

  const dx = liveBox.center.x - targetBox.center.x;
  const dy = liveBox.center.y - targetBox.center.y;
  const centerError = Math.hypot(dx, dy);
  const framingScore = clamp01(1 - centerError / 0.20);

  const heightRatio = liveBox.height / Math.max(0.001, targetBox.height);
  const scaleError = Math.abs(Math.log(Math.max(0.05, heightRatio)));
  const scaleScore = clamp01(1 - scaleError / 0.52);

  const pose = relativePoseScore(targetGuide, target, liveGuide, live);
  // A target with explicit optional joints encodes pose intent. Missing most of
  // those joints must not silently turn matching into framing-only and unlock
  // Stable Match / Auto Capture. relativePoseScore only exposes a score after
  // majority target-anchor coverage is available.
  const poseRequired = pose.targetAnchorCount >= 2;
  const targetFacing = target.head.facing;
  const liveFacing = live.head.facing;
  let faceScore: number | undefined;
  if (targetFacing !== 'front') {
    faceScore = targetFacing === liveFacing ? 1 : liveFacing === 'front' ? 0.55 : 0.1;
  }

  const weighted: [number, number][] = [
    [framingScore, 0.38],
    [scaleScore, 0.27],
  ];
  if (pose.score != null) {
    weighted.push([pose.score, 0.23]);
  } else if (poseRequired) {
    // Required-but-unverified pose intent is not an optional signal. Keep its
    // weight in the headline aggregate as unsatisfied instead of renormalizing
    // perfect framing/scale into a misleading 100% score.
    weighted.push([0, 0.23]);
  }
  if (faceScore != null) weighted.push([faceScore, 0.12]);

  const weightTotal = weighted.reduce((sum, [, weight]) => sum + weight, 0);
  const rawScore = weighted.reduce((sum, [componentScore, weight]) => sum + componentScore * weight, 0) / Math.max(0.001, weightTotal);
  const score = Math.round(clamp01(rawScore) * 100);

  const poseGood = poseRequired ? pose.score != null && pose.score >= 0.72 : pose.score == null || pose.score >= 0.72;
  const componentsGood = framingScore >= 0.76
    && scaleScore >= 0.76
    && poseGood
    && (faceScore == null || faceScore >= 0.80);
  const matched = score >= 86 && componentsGood;

  let hint = 'Hold it';
  let detail = 'Framing is close. Fine-tune the pose and face direction.';

  if (Math.abs(dx) > 0.055) {
    hint = dx > 0 ? 'Subject → left' : 'Subject → right';
    detail = 'Match the horizontal position of the target outline.';
  } else if (Math.abs(dy) > 0.060) {
    hint = dy > 0 ? 'Subject ↑' : 'Subject ↓';
    detail = 'Match the vertical position of the target outline.';
  } else if (heightRatio < 0.88) {
    hint = 'Move closer';
    detail = 'The subject is smaller than the reference framing.';
  } else if (heightRatio > 1.14) {
    hint = 'Step back';
    detail = 'The subject is larger than the reference framing.';
  } else if (targetFacing !== 'front' && targetFacing !== liveFacing) {
    hint = targetFacing === 'left' ? 'Face ← left' : 'Face → right';
    detail = 'Match the head direction from the reference.';
  } else if (poseRequired && pose.score == null) {
    hint = 'Show the full pose';
    detail = 'Keep shoulders and enough arm/leg landmarks visible so the target pose can be verified.';
  } else if (pose.score != null && pose.score < 0.72 && pose.worst) {
    const joint = humanizeJoint(pose.worst);
    if (pose.dy != null && Math.abs(pose.dy) > 0.10 && pose.worst.includes('wrist')) {
      hint = pose.dy > 0 ? `Raise ${joint}` : `Lower ${joint}`;
    } else {
      hint = `Adjust ${joint}`;
    }
    detail = 'Framing is close; now match the body shape.';
  } else if (matched) {
    hint = '✓ Match';
    detail = 'Composition is close enough to shoot.';
  }

  const status: MatchStatus = matched
    ? 'matched'
    : score >= 74
      ? 'close'
      : 'adjust';

  return {
    score,
    framingScore: Math.round(framingScore * 100),
    scaleScore: Math.round(scaleScore * 100),
    poseScore: pose.score == null ? undefined : Math.round(pose.score * 100),
    faceScore: faceScore == null ? undefined : Math.round(faceScore * 100),
    status,
    hint,
    detail,
  };
}
