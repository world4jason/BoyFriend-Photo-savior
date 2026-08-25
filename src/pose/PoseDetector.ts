import { GuideSpec, NormalizedPoint, PersonGuide, PoseJoints } from '../types';

export type PoseLandmark = NormalizedPoint & {
  name: string;
  confidence?: number;
};

export type PoseDetection = {
  landmarks: PoseLandmark[];
  sourceWidth: number;
  sourceHeight: number;
};

/**
 * Adapter boundary for a future MediaPipe / MoveNet / ML Kit implementation.
 * The product UI only consumes GuideSpec and does not depend on a particular ML runtime.
 */
export interface PoseDetector {
  detectReference(uri: string): Promise<PoseDetection>;
}

export interface GuideGenerator {
  fromPose(detection: PoseDetection): GuideSpec;
}

export class HeuristicGuideGenerator implements GuideGenerator {
  fromPose(detection: PoseDetection): GuideSpec {
    const byName = new Map(detection.landmarks.map((p) => [p.name, p]));
    const leftShoulder = byName.get('left_shoulder');
    const rightShoulder = byName.get('right_shoulder');
    const nose = byName.get('nose');
    const leftHip = byName.get('left_hip');
    const rightHip = byName.get('right_hip');

    if (!leftShoulder || !rightShoulder || !nose) {
      throw new Error('Reference pose does not contain enough landmarks to generate a guide.');
    }

    const shoulderMid = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    const hipMid = leftHip && rightHip
      ? { x: (leftHip.x + rightHip.x) / 2, y: (leftHip.y + rightHip.y) / 2 }
      : { x: shoulderMid.x, y: Math.min(0.9, shoulderMid.y + 0.34) };
    const shoulderWidth = Math.max(0.12, Math.abs(rightShoulder.x - leftShoulder.x));
    const faceRx = Math.max(0.045, Math.min(0.12, shoulderWidth * 0.31));

    const maybe = (name: string) => byName.get(name);
    const joints: PoseJoints = {
      leftElbow: maybe('left_elbow'), rightElbow: maybe('right_elbow'),
      leftWrist: maybe('left_wrist'), rightWrist: maybe('right_wrist'),
      leftHip, rightHip,
      leftKnee: maybe('left_knee'), rightKnee: maybe('right_knee'),
      leftAnkle: maybe('left_ankle'), rightAnkle: maybe('right_ankle'),
    };

    const person: PersonGuide = {
      head: {
        center: { x: nose.x, y: Math.max(0.06, nose.y - faceRx * 0.1) },
        rx: faceRx,
        ry: faceRx * 1.28,
        facing: 'front',
      },
      shoulders: { left: leftShoulder, right: rightShoulder },
      torso: { top: shoulderMid, bottom: hipMid, width: shoulderWidth },
      joints,
    };

    return {
      kind: 'portrait',
      mode: 'simple',
      people: [person],
      crop: joints.leftAnkle || joints.rightAnkle ? 'full' : hipMid.y > 0.82 ? 'half' : 'three-quarter',
      lookSpace: nose.x < shoulderMid.x - 0.015 ? 'left' : nose.x > shoulderMid.x + 0.015 ? 'right' : 'center',
      transform: { dx: 0, dy: 0, scale: 1 },
    };
  }
}
