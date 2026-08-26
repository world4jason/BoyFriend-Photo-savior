import { GuideSpec, NormalizedPoint, PersonGuide } from '../types';

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

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function applyTransform(point: NormalizedPoint, guide: GuideSpec): NormalizedPoint {
  const transform = guide.transform ?? { dx: 0, dy: 0, scale: 1 };
  return {
    x: ((point.x - 0.5) * transform.scale) + 0.5 + transform.dx,
    y: ((point.y - 0.5) * transform.scale) + 0.5 + transform.dy,
  };
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
  const jointEntries: [string, NormalizedPoint | undefined][] = [
    ['left_elbow', joints.leftElbow],
    ['right_elbow', joints.rightElbow],
    ['left_wrist', joints.leftWrist],
    ['right_wrist', joints.rightWrist],
    ['left_hip', joints.leftHip],
    ['right_hip', joints.rightHip],
    ['left_knee', joints.leftKnee],
    ['right_knee', joints.rightKnee],
    ['left_ankle', joints.leftAnkle],
    ['right_ankle', joints.rightAnkle],
  ];
  jointEntries.forEach(([name, point]) => {
    if (point) points.push({ name, point });
  });

  return points;
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

function transformedPersonBox(guide: GuideSpec, person: PersonGuide): Box {
  return boxFromPoints(personPoints(person).map(({ point }) => applyTransform(point, guide)));
}

function relativePoseScore(targetGuide: GuideSpec, target: PersonGuide, live: PersonGuide): { score?: number; worst?: string; dy?: number } {
  const targetBox = transformedPersonBox(targetGuide, target);
  const liveBox = transformedPersonBox({ ...targetGuide, transform: { dx: 0, dy: 0, scale: 1 } }, live);
  const targetNamed = new Map(personPoints(target).map(({ name, point }) => [name, applyTransform(point, targetGuide)]));
  const liveNamed = new Map(personPoints(live).map(({ name, point }) => [name, point]));

  const jointNames = [
    'left_shoulder', 'right_shoulder',
    'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist',
    'left_hip', 'right_hip',
    'left_knee', 'right_knee',
    'left_ankle', 'right_ankle',
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

  if (count < 4) return {};
  const averageDistance = distanceSum / count;
  return {
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

  const targetBox = transformedPersonBox(targetGuide, target);
  const liveIdentity: GuideSpec = { ...liveGuide, transform: { dx: 0, dy: 0, scale: 1 } };
  const liveBox = transformedPersonBox(liveIdentity, live);

  const dx = liveBox.center.x - targetBox.center.x;
  const dy = liveBox.center.y - targetBox.center.y;
  const centerError = Math.hypot(dx, dy);
  const framingScore = clamp01(1 - centerError / 0.20);

  const heightRatio = liveBox.height / Math.max(0.001, targetBox.height);
  const scaleError = Math.abs(Math.log(Math.max(0.05, heightRatio)));
  const scaleScore = clamp01(1 - scaleError / 0.52);

  const pose = relativePoseScore(targetGuide, target, live);
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
  if (pose.score != null) weighted.push([pose.score, 0.23]);
  if (faceScore != null) weighted.push([faceScore, 0.12]);

  const weightTotal = weighted.reduce((sum, [, weight]) => sum + weight, 0);
  const rawScore = weighted.reduce((sum, [componentScore, weight]) => sum + componentScore * weight, 0) / Math.max(0.001, weightTotal);
  const score = Math.round(clamp01(rawScore) * 100);

  const componentsGood = framingScore >= 0.76
    && scaleScore >= 0.76
    && (pose.score == null || pose.score >= 0.72)
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
