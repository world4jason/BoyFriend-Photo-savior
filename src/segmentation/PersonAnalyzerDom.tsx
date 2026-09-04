'use dom';

import { useEffect } from 'react';
import { poseResultToLandmarks } from '../analysis/poseLandmarkSanitizer';
import type { PoseLandmark } from '../pose/PoseDetector';
import type { PersonGuide } from '../types';
import type { PersonContourDetection } from './guideFromContour';
import { extractPersonContourFromMask } from './maskContour';

const SEGMENTER_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';
const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const FACE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
const MEDIAPIPE_VERSION = '1.0.1';
const VISION_MODULE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/vision_bundle.mjs`;
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const VISION_GLOBAL_KEY = '__bfpsMediaPipeVision';
const VISION_ERROR_KEY = '__bfpsMediaPipeVisionError';
const VISION_READY_EVENT = 'bfps-mediapipe-vision-ready';
const VISION_ERROR_EVENT = 'bfps-mediapipe-vision-error';
const VISION_LOADER_ID = 'bfps-mediapipe-vision-loader';

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

type VisionModule = {
  FilesetResolver: {
    forVisionTasks: (wasmPath: string) => Promise<any>;
  };
  ImageSegmenter: {
    createFromOptions: (vision: any, options: any) => Promise<any>;
  };
  PoseLandmarker: {
    createFromOptions: (vision: any, options: any) => Promise<any>;
  };
  FaceLandmarker: {
    createFromOptions: (vision: any, options: any) => Promise<any>;
  };
};

type Analyzer = {
  segmenter: any;
  poseLandmarker: any | null;
  faceLandmarker: any | null;
};

type FaceDirectionResult = {
  direction: PersonGuide['head']['facing'];
  yawDegrees: number;
};

let visionModulePromise: Promise<VisionModule> | null = null;
let analyzerPromise: Promise<Analyzer> | null = null;

/**
 * MediaPipe's published npm ESM currently contains an expression-based
 * `import(t.toString())`. Metro tries to statically resolve that expression and
 * fails during Web export. Google also documents a browser/CDN loading path for
 * Tasks Vision, so this DOM-only component loads the same pinned module at
 * runtime instead of asking Metro to bundle it.
 *
 * The dynamic import lives inside a browser-created module-script string; Metro
 * only sees a string literal and never parses `vision_bundle.mjs`. The same DOM
 * component runs in the browser on Web and in Expo's DOM WebView on native.
 */
function loadVisionModule(): Promise<VisionModule> {
  const root = globalThis as any;
  const existing = root[VISION_GLOBAL_KEY] as VisionModule | undefined;
  if (existing) return Promise.resolve(existing);
  if (visionModulePromise) return visionModulePromise;

  visionModulePromise = new Promise<VisionModule>((resolve, reject) => {
    const cleanupListeners = () => {
      root.removeEventListener?.(VISION_READY_EVENT, onReady);
      root.removeEventListener?.(VISION_ERROR_EVENT, onError);
    };

    const onReady = () => {
      const loaded = root[VISION_GLOBAL_KEY] as VisionModule | undefined;
      cleanupListeners();
      if (loaded) resolve(loaded);
      else reject(new Error('MediaPipe runtime signaled ready without exports.'));
    };

    const onError = () => {
      const message = String(root[VISION_ERROR_KEY] ?? 'Could not load the MediaPipe runtime.');
      cleanupListeners();
      reject(new Error(message));
    };

    root.addEventListener?.(VISION_READY_EVENT, onReady);
    root.addEventListener?.(VISION_ERROR_EVENT, onError);

    const existingLoader = document.getElementById(VISION_LOADER_ID);
    if (existingLoader) return;

    const script = document.createElement('script');
    script.id = VISION_LOADER_ID;
    script.type = 'module';
    script.textContent = `
      import(${JSON.stringify(VISION_MODULE_URL)})
        .then((module) => {
          globalThis[${JSON.stringify(VISION_GLOBAL_KEY)}] = module;
          globalThis.dispatchEvent(new Event(${JSON.stringify(VISION_READY_EVENT)}));
        })
        .catch((error) => {
          globalThis[${JSON.stringify(VISION_ERROR_KEY)}] = error instanceof Error ? error.message : String(error);
          globalThis.dispatchEvent(new Event(${JSON.stringify(VISION_ERROR_EVENT)}));
        });
    `;
    script.addEventListener('error', () => {
      root[VISION_ERROR_KEY] = 'Browser could not execute the MediaPipe module loader.';
      root.dispatchEvent?.(new Event(VISION_ERROR_EVENT));
    }, { once: true });
    document.head.appendChild(script);
  }).catch((error) => {
    visionModulePromise = null;
    document.getElementById(VISION_LOADER_ID)?.remove();
    throw error;
  });

  return visionModulePromise;
}

function normalizePickerDataUrl(dataUrl: string) {
  if (!dataUrl.startsWith('data:')) return dataUrl;
  const comma = dataUrl.indexOf(',');
  if (comma < 0) return dataUrl;
  return `data:image/jpeg;base64,${dataUrl.slice(comma + 1)}`;
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

  const yawDegrees = Math.max(-45, Math.min(45, offset * 95));
  const direction: PersonGuide['head']['facing'] = offset < -0.075
    ? 'left'
    : offset > 0.075
      ? 'right'
      : 'front';

  return { direction, yawDegrees };
}

function maskToOuterContour(mask: ArrayLike<number>, width: number, height: number): PersonContourDetection {
  const result = extractPersonContourFromMask(mask, width, height);
  return {
    contour: result.contour,
    maskWidth: width,
    maskHeight: height,
    foregroundRatio: result.foregroundRatio,
  };
}

async function createWithDelegate<T>(factory: (delegate: 'GPU' | 'CPU') => Promise<T>): Promise<T> {
  try {
    return await factory('GPU');
  } catch {
    return factory('CPU');
  }
}

async function createAnalyzer(): Promise<Analyzer> {
  const { FilesetResolver, ImageSegmenter, PoseLandmarker, FaceLandmarker } = await loadVisionModule();
  const vision = await FilesetResolver.forVisionTasks(WASM_URL);
  const segmenter = await createWithDelegate((delegate) => ImageSegmenter.createFromOptions(vision, {
    baseOptions: { modelAssetPath: SEGMENTER_MODEL_URL, delegate },
    runningMode: 'IMAGE',
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  }));

  let poseLandmarker: any | null = null;
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

  let faceLandmarker: any | null = null;
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
}

async function getAnalyzer(): Promise<Analyzer> {
  if (!analyzerPromise) {
    analyzerPromise = createAnalyzer().catch((error) => {
      // A transient CDN/model initialization failure must not poison every
      // later analysis request for the lifetime of this page/app session.
      analyzerPromise = null;
      throw error;
    });
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
      segmenter.segment(image, (result: any) => {
        const categoryMask = result.categoryMask;
        if (!categoryMask) {
          reject(new Error('MediaPipe did not return a person mask.'));
          return;
        }

        try {
          const data = categoryMask.getAsUint8Array();
          const detection = maskToOuterContour(data, categoryMask.width, categoryMask.height);
          resolve({
            ...detection,
            poseLandmarks,
            faceDirection: faceDirection?.direction,
            faceYawDegrees: faceDirection?.yawDegrees,
          });
        } catch (error) {
          reject(error);
        } finally {
          categoryMask.close?.();
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