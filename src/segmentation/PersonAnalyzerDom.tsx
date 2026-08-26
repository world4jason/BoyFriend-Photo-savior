'use dom';

import { useEffect } from 'react';
import { FaceLandmarker, FilesetResolver, ImageSegmenter, PoseLandmarker } from '@mediapipe/tasks-vision';
import type { PoseLandmark } from '../pose/PoseDetector';
import type { NormalizedPoint, PersonGuide } from '../types';
import type { PersonContourDetection } from './guideFromContour';

const SEGMENTER_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';
const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';

const POSE_NAMES = [
  'nose',
  'left_eye_inner', 'left_eye', 'left_eye_outer',
  'right_eye_inner', 'right_eye', 'right_eye_outer',
  'left_ear', 'right_ear',
  'mouth_left', 'mouth_right',
  'left_shoulder', 'right_shoulder',
  'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist',
  'left_pinky', 'right_pinky',
  'left_index', 'right_index',
  'left_thumb', 'right_thumb',
  'left_hip', 'right_hip',
  'left_knee', 'right_knee',
  'left_ankle', 'right_ankle',
  'left_heel', 'right_heel',
  'left_foot_index', 'right_foot_index',
] as const;

export type AnalyzerResultPayload = {
  requestId: string;
  detection: PersonContourDetection;
};

export type AnalyzerErrorPayload = {
  requestId: string;
  message: string;
};

type Props = {
  requestId: string;
  dataUrl: string;
  onResult: (payload: AnalyzerResultPayload) => Promise<void>;
  onError: (payload: AnalyzerErrorPayload) => Promise<void>;
  dom?: import('expo/dom').DOMProps;
};

type Analyzer = {
  segmenter: ImageSegmenter;
  poseLandmarker: PoseLandmarker | null;
  faceLandmarker: FaceLandmarker | null;
};

type FaceDirectionResult = {
  direction: PersonGuide['head']['facing'];
  yawDegrees: number;
};

let analyzerPromise: Promise<Analyzer> | null = null;

function normalizePickerDataUrl(dataUrl: string) {
  if (!dataUrl.startsWith('data:')) return dataUrl;
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return dataUrl;
  return `data:image/jpeg;base64,${dataUrl.slice(comma + 1)}`;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function poseResultToLandmarks(result: any): PoseLandmark[] {
  const pose = result?.landmarks?.[0];
  if (!Array.isArray(pose)) return [];
  return pose.map((point: any, index: number) => ({
    name: POSE_NAMES[index] ?? `landmark_${index}`,
    x: clamp01(Number(point?.x ?? 0)),
    y: clamp01(Number(point?.y ?? 0)),
    confidence: Number.isFinite(point?.visibility)
      ? Number(point.visibility)
      : Number.isFinite(point?.presence)
        ? Number(point.presence)
        : undefined,
  }));
}

/**
 * MediaPipe face mesh landmarks 234 and 454 sit near the two lateral face
 * boundaries, while landmark 1 sits around the nose tip. The normalized nose
 * offset is a useful shooting hint for whether the face points toward frame
 * left/right. It is intentionally treated as an approximate guide, not a
 * calibrated biometric/head-pose measurement.
 */
function faceDirectionFromResult(result: any): FaceDirectionResult | null {
  const face = result?.faceLandmarks?.[0];
  if (!Array.isArray(face) || face.length <= 454) return null;

  const nose = face[1];
  const sideA = face[234];
  const sideB = face[454];
  if (!nose || !sideA || !sideB) return null;

  const leftX = Math.min(Number(sideA.x), Number(sideB.x));
  const rightX = Math.max(Number(sideA.x), Number(sideB.x));
  const faceWidth = rightX - leftX;
  if (!Number.isFinite(faceWidth) || faceWidth < 0.025) return null;

  const centerX = (leftX + rightX) / 2;
  const offset = (Number(nose.x) - centerX) / faceWidth;
  if (!Number.isFinite(offset)) return null;

  // An intentionally conservative pseudo-yaw used only for UI guidance.
  const yawDegrees = Math.max(-45, Math.min(45, offset * 95));
  const direction: PersonGuide['head']['facing'] = offset < -0.075
    ? 'left'
    : offset > 0.075
      ? 'right'
      : 'front';

  return { direction, yawDegrees };
}

const simplifySide = (points: NormalizedPoint[]) => {
  if (points.length <= 44) return points;
  const step = Math.max(1, Math.ceil(points.length / 44));
  return points.filter((_, index) => index % step === 0 || index === points.length - 1);
};

function maskToOuterContour(mask: ArrayLike<number>, width: number, height: number): PersonContourDetection {
  const rowStep = Math.max(1, Math.floor(height / 110));
  const left: NormalizedPoint[] = [];
  const right: NormalizedPoint[] = [];
  let foreground = 0;

  for (let y = 0; y < height; y += 1) {
    let minX = width;
    let maxX = -1;
    let rowForeground = 0;

    for (let x = 0; x < width; x += 1) {
      if (Number(mask[y * width + x]) <= 0) continue;
      foreground += 1;
      rowForeground += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
    }

    if (y % rowStep === 0 && rowForeground > Math.max(2, width * 0.006) && maxX >= minX) {
      left.push({ x: minX / width, y: y / height });
      right.push({ x: maxX / width, y: y / height });
    }
  }

  if (left.length < 8 || right.length < 8) {
    throw new Error('No clear person silhouette was found in this photo.');
  }

  return {
    contour: [...simplifySide(left), ...simplifySide(right).reverse()],
    maskWidth: width,
    maskHeight: height,
    foregroundRatio: foreground / Math.max(1, width * height),
  };
}

async function createWithDelegate<T>(factory: (delegate: 'GPU' | 'CPU') => Promise<T>): Promise<T> {
  try {
    return await factory('GPU');
  } catch {
    return factory('CPU');
  }
}

async function getAnalyzer(): Promise<Analyzer> {
  if (!analyzerPromise) {
    analyzerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      const segmenter = await createWithDelegate((delegate) => ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: SEGMENTER_MODEL_URL, delegate },
        runningMode: 'IMAGE',
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      }));

      let poseLandmarker: PoseLandmarker | null = null;
      try {
        poseLandmarker = await createWithDelegate((delegate) => PoseLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate },
          runningMode: 'IMAGE',
          numPoses: 1,
          minPoseDetectionConfidence: 0.35,
          minPosePresenceConfidence: 0.25,
          minTrackingConfidence: 0.25,
          outputSegmentationMasks: false,
        }));
      } catch {
        // Pose is an enhancement. The segmentation contour remains usable without it.
      }

      let faceLandmarker: FaceLandmarker | null = null;
      try {
        faceLandmarker = await createWithDelegate((delegate) => FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate },
          runningMode: 'IMAGE',
          numFaces: 1,
          minFaceDetectionConfidence: 0.35,
          minFacePresenceConfidence: 0.30,
          minTrackingConfidence: 0.25,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        }));
      } catch {
        // Face direction falls back to coarse pose landmarks.
      }

      return { segmenter, poseLandmarker, faceLandmarker };
    })();
  }
  return analyzerPromise;
}

async function loadImage(dataUrl: string): Promise<any> {
  const ImageCtor = (globalThis as any).Image;
  if (!ImageCtor) throw new Error('Image decoding is unavailable in this runtime.');
  const image = new ImageCtor();
  image.src = normalizePickerDataUrl(dataUrl);
  if (typeof image.decode === 'function') await image.decode();
  else await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not decode the selected image.'));
  });
  return image;
}

async function analyze(dataUrl: string): Promise<PersonContourDetection> {
  const { segmenter, poseLandmarker, faceLandmarker } = await getAnalyzer();
  const image = await loadImage(dataUrl);

  let poseLandmarks: PoseLandmark[] = [];
  if (poseLandmarker) {
    try {
      poseLandmarks = poseResultToLandmarks(poseLandmarker.detect(image));
    } catch {
      poseLandmarks = [];
    }
  }

  let faceDirection: FaceDirectionResult | null = null;
  if (faceLandmarker) {
    try {
      faceDirection = faceDirectionFromResult(faceLandmarker.detect(image));
    } catch {
      faceDirection = null;
    }
  }

  return new Promise<PersonContourDetection>((resolve, reject) => {
    try {
      segmenter.segment(image, (result) => {
        try {
          const categoryMask = result.categoryMask;
          if (!categoryMask) throw new Error('MediaPipe did not return a person mask.');
          const data = categoryMask.getAsUint8Array();
          const detection = maskToOuterContour(data, categoryMask.width, categoryMask.height);
          categoryMask.close?.();
          resolve({
            ...detection,
            poseLandmarks,
            faceDirection: faceDirection?.direction,
            faceYawDegrees: faceDirection?.yawDegrees,
          });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

export default function PersonAnalyzerDom({ requestId, dataUrl, onResult, onError }: Props) {
  useEffect(() => {
    let cancelled = false;
    analyze(dataUrl)
      .then(async (detection) => {
        if (!cancelled) await onResult({ requestId, detection });
      })
      .catch(async (error) => {
        if (!cancelled) {
          await onError({
            requestId,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [requestId, dataUrl]);

  return <div aria-hidden="true" style={{ width: 1, height: 1, overflow: 'hidden', opacity: 0.001 }} />;
}
