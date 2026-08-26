import React, { useEffect, useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
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

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm';

let webSegmenterPromise: Promise<any> | null = null;

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

  const contour = [
    ...simplifySide(left),
    ...simplifySide(right).reverse(),
  ];

  return {
    contour,
    maskWidth: width,
    maskHeight: height,
    foregroundRatio: foreground / Math.max(1, width * height),
  };
}

async function getWebSegmenter() {
  if (!webSegmenterPromise) {
    webSegmenterPromise = (async () => {
      const visionTasks = await import('@mediapipe/tasks-vision');
      const vision = await visionTasks.FilesetResolver.forVisionTasks(WASM_URL);
      try {
        return await visionTasks.ImageSegmenter.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          runningMode: 'IMAGE',
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });
      } catch {
        return visionTasks.ImageSegmenter.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
          runningMode: 'IMAGE',
          outputCategoryMask: true,
          outputConfidenceMasks: false,
        });
      }
    })();
  }
  return webSegmenterPromise;
}

async function analyzeOnWeb(request: OutlineAnalysisRequest): Promise<PersonContourDetection> {
  const segmenter = await getWebSegmenter();
  const ImageCtor = (globalThis as any).Image;
  if (!ImageCtor) throw new Error('Browser image decoding is unavailable.');

  const image = new ImageCtor();
  image.src = request.dataUrl;
  if (typeof image.decode === 'function') await image.decode();
  else await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error('Could not decode the selected image.'));
  });

  return new Promise<PersonContourDetection>((resolve, reject) => {
    try {
      segmenter.segment(image, (result: any) => {
        try {
          const categoryMask = result.categoryMask;
          if (!categoryMask) throw new Error('MediaPipe did not return a person mask.');
          const data = categoryMask.getAsUint8Array();
          const detection = maskToOuterContour(data, categoryMask.width, categoryMask.height);
          categoryMask.close?.();
          resolve(detection);
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
  const safeDataUrl = JSON.stringify(dataUrl);
  return `<!doctype html>
<html>
<head><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body>
<script type="module">
import { FilesetResolver, ImageSegmenter } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm';
const MODEL = ${JSON.stringify(MODEL_URL)};
const WASM = ${JSON.stringify(WASM_URL)};
const source = ${safeDataUrl};
const send = (payload) => window.ReactNativeWebView.postMessage(JSON.stringify(payload));

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

(async () => {
  try {
    const vision = await FilesetResolver.forVisionTasks(WASM);
    let segmenter;
    try {
      segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' },
        runningMode: 'IMAGE',
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      });
    } catch (_) {
      segmenter = await ImageSegmenter.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'CPU' },
        runningMode: 'IMAGE',
        outputCategoryMask: true,
        outputConfidenceMasks: false,
      });
    }

    const image = new Image();
    image.src = source;
    await image.decode();
    segmenter.segment(image, (result) => {
      try {
        const mask = result.categoryMask;
        if (!mask) throw new Error('MediaPipe did not return a person mask.');
        const detection = contourFromMask(mask.getAsUint8Array(), mask.width, mask.height);
        mask.close?.();
        send({ type: 'result', result: detection });
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
