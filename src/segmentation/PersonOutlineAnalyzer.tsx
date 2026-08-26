import React, { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { PoseLandmark } from '../pose/PoseDetector';
import { NormalizedPoint } from '../types';
import { PersonContourDetection } from './guideFromContour';

export type OutlineAnalysisRequest = {
  id: string;
  dataUrl: string;
  sourceUri: string;
  aspectRatio: number;
};

type Props = {
  request: OutlineAnalysisRequest | null;
  onResult: (request: OutlineAnalysisRequest, result: PersonContourDetection) => void;
  onError: (request: OutlineAnalysisRequest, message: string) => void;
};

const MEDIAPIPE_VERSION = '1.0.1';
const SEGMENTER_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';
const POSE_MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;

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

let webAnalyzerPromise: Promise<{ segmenter: any; poseLandmarker: any | null }> | null = null;

/**
 * Expo ImagePicker documents `base64` as JPEG data. Some platforms still report
 * the selected asset's original MIME type (for example PNG/HEIC), so normalize
 * the data URL before passing it to browser decoders.
 */
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
  return pose
    .map((point: any, index: number) => ({
      name: POSE_NAMES[index] ?? `landmark_${index}`,
      x: clamp01(Number(point?.x ?? 0)),
      y: clamp01(Number(point?.y ?? 0)),
      confidence: Number.isFinite(point?.visibility)
        ? Number(point.visibility)
        : Number.isFinite(point?.presence)
          ? Number(point.presence)
          : undefined,
    }))
    .filter((point: PoseLandmark) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

const simplifySide = (points: NormalizedPoint[]) => {
  if (points.length <= 44) return points;
  const step = Math.max(1, Math.ceil(points.length / 44));
  return points.filter((_, index) => index % step === 0 || index === points.length - 1);
};

export function maskToOuterContour(mask: ArrayLike<number>, width: number, height: number): PersonContourDetection {
  const rowStep = Math.max(1, Math.floor(height / 110));
  const left: NormalizedPoint[] = [];
  const right: NormalizedPoint[] = [];
  let foreground = 0;

  for (let y = 0; y < height; y += 1) {
    let minX = width;
    let maxX = -1;
    let rowForeground = 0;

    for (let x = 0; x < width; x += 1) {
      const isPerson = Number(mask[y * width + x]) > 0;
      if (!isPerson) continue;
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

async function createSegmenter(visionTasks: any, vision: any) {
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: SEGMENTER_MODEL_URL, delegate },
    runningMode: 'IMAGE',
    outputCategoryMask: true,
    outputConfidenceMasks: false,
  });
  try {
    return await visionTasks.ImageSegmenter.createFromOptions(vision, options('GPU'));
  } catch {
    return visionTasks.ImageSegmenter.createFromOptions(vision, options('CPU'));
  }
}

async function createPoseLandmarker(visionTasks: any, vision: any) {
  const options = (delegate: 'GPU' | 'CPU') => ({
    baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate },
    runningMode: 'IMAGE',
    numPoses: 1,
    minPoseDetectionConfidence: 0.35,
    minPosePresenceConfidence: 0.25,
    minTrackingConfidence: 0.25,
    outputSegmentationMasks: false,
  });
  try {
    return await visionTasks.PoseLandmarker.createFromOptions(vision, options('GPU'));
  } catch {
    try {
      return await visionTasks.PoseLandmarker.createFromOptions(vision, options('CPU'));
    } catch {
      return null;
    }
  }
}

async function getWebAnalyzer() {
  if (!webAnalyzerPromise) {
    webAnalyzerPromise = (async () => {
      const visionTasks = await import('@mediapipe/tasks-vision');
      const vision = await visionTasks.FilesetResolver.forVisionTasks(WASM_URL);
      const segmenter = await createSegmenter(visionTasks, vision);
      const poseLandmarker = await createPoseLandmarker(visionTasks, vision);
      return { segmenter, poseLandmarker };
    })();
  }
  return webAnalyzerPromise;
}

async function analyzeOnWeb(request: OutlineAnalysisRequest): Promise<PersonContourDetection> {
  const { segmenter, poseLandmarker } = await getWebAnalyzer();
  const ImageCtor = (globalThis as any).Image;
  if (!ImageCtor) throw new Error('Browser image decoding is unavailable.');

  const image = new ImageCtor();
  image.src = normalizePickerDataUrl(request.dataUrl);
  if (typeof image.decode === 'function') await image.decode();
  else await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not decode the selected image.'));
  });

  let poseLandmarks: PoseLandmark[] = [];
  if (poseLandmarker) {
    try {
      poseLandmarks = poseResultToLandmarks(poseLandmarker.detect(image));
    } catch {
      poseLandmarks = [];
    }
  }

  return new Promise<PersonContourDetection>((resolve, reject) => {
    try {
      segmenter.segment(image, (result: any) => {
        try {
          const categoryMask = result.categoryMask;
          if (!categoryMask) throw new Error('MediaPipe did not return a person mask.');
          const data = categoryMask.getAsUint8Array();
          const detection = maskToOuterContour(data, categoryMask.width, categoryMask.height);
          categoryMask.close?.();
          resolve({ ...detection, poseLandmarks });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

function nativeHtml(dataUrl: string) {
  const safeDataUrl = JSON.stringify(normalizePickerDataUrl(dataUrl));
  return `<!doctype html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body>
<script type="module">
import { FilesetResolver, ImageSegmenter, PoseLandmarker } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/+esm';
const SEGMENTER_MODEL = ${JSON.stringify(SEGMENTER_MODEL_URL)};
const POSE_MODEL = ${JSON.stringify(POSE_MODEL_URL)};
const WASM = ${JSON.stringify(WASM_URL)};
const POSE_NAMES = ${JSON.stringify(POSE_NAMES)};
const source = ${safeDataUrl};
const send = (payload) => window.ReactNativeWebView.postMessage(JSON.stringify(payload));
const clamp01 = (value) => Math.max(0, Math.min(1, Number(value) || 0));

function simplify(points) {
  if (points.length <= 44) return points;
  const step = Math.max(1, Math.ceil(points.length / 44));
  return points.filter((_, index) => index % step === 0 || index === points.length - 1);
}

function contourFromMask(mask, width, height) {
  const rowStep = Math.max(1, Math.floor(height / 110));
  const left = [];
  const right = [];
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
  if (left.length < 8 || right.length < 8) throw new Error('No clear person silhouette was found in this photo.');
  return {
    contour: [...simplify(left), ...simplify(right).reverse()],
    maskWidth: width,
    maskHeight: height,
    foregroundRatio: foreground / Math.max(1, width * height),
  };
}

function poseToLandmarks(result) {
  const pose = result?.landmarks?.[0];
  if (!Array.isArray(pose)) return [];
  return pose.map((point, index) => ({
    name: POSE_NAMES[index] || ('landmark_' + index),
    x: clamp01(point?.x),
    y: clamp01(point?.y),
    confidence: Number.isFinite(point?.visibility)
      ? Number(point.visibility)
      : Number.isFinite(point?.presence)
        ? Number(point.presence)
        : undefined,
  }));
}

async function withDelegate(factory) {
  try { return await factory('GPU'); }
  catch (_) { return factory('CPU'); }
}

(async () => {
  try {
    const vision = await FilesetResolver.forVisionTasks(WASM);
    const segmenter = await withDelegate((delegate) => ImageSegmenter.createFromOptions(vision, {
      baseOptions: { modelAssetPath: SEGMENTER_MODEL, delegate },
      runningMode: 'IMAGE',
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    }));

    let poseLandmarker = null;
    try {
      poseLandmarker = await withDelegate((delegate) => PoseLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: POSE_MODEL, delegate },
        runningMode: 'IMAGE',
        numPoses: 1,
        minPoseDetectionConfidence: 0.35,
        minPosePresenceConfidence: 0.25,
        minTrackingConfidence: 0.25,
        outputSegmentationMasks: false,
      }));
    } catch (_) {}

    const image = new Image();
    image.src = source;
    await image.decode();

    let poseLandmarks = [];
    if (poseLandmarker) {
      try { poseLandmarks = poseToLandmarks(poseLandmarker.detect(image)); }
      catch (_) { poseLandmarks = []; }
    }

    segmenter.segment(image, (result) => {
      try {
        const mask = result.categoryMask;
        if (!mask) throw new Error('MediaPipe did not return a person mask.');
        const detection = contourFromMask(mask.getAsUint8Array(), mask.width, mask.height);
        mask.close?.();
        send({ type: 'result', result: { ...detection, poseLandmarks } });
      } catch (error) {
        send({ type: 'error', message: String(error?.message || error) });
      }
    });
  } catch (error) {
    send({ type: 'error', message: String(error?.message || error) });
  }
})();
</script>
</body>
</html>`;
}

export function PersonOutlineAnalyzer({ request, onResult, onError }: Props) {
  useEffect(() => {
    if (!request || Platform.OS !== 'web') return;
    let cancelled = false;
    analyzeOnWeb(request)
      .then((result) => {
        if (!cancelled) onResult(request, result);
      })
      .catch((error) => {
        if (!cancelled) onError(request, error instanceof Error ? error.message : String(error));
      });
    return () => { cancelled = true; };
  }, [request?.id]);

  const html = useMemo(() => request ? nativeHtml(request.dataUrl) : '', [request?.id]);

  if (!request || Platform.OS === 'web') return null;

  return (
    <View pointerEvents="none" style={styles.hidden}>
      <WebView
        key={request.id}
        originWhitelist={['*']}
        source={{ html }}
        javaScriptEnabled
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data);
            if (payload.type === 'result') onResult(request, payload.result as PersonContourDetection);
            else if (payload.type === 'error') onError(request, payload.message || 'Outline analysis failed.');
          } catch {
            onError(request, 'Could not read the outline analyzer result.');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 2,
    height: 2,
    opacity: 0.01,
    left: -20,
    top: -20,
    overflow: 'hidden',
  },
});
