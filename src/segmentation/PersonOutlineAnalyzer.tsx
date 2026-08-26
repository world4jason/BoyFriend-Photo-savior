import React from 'react';
import PersonAnalyzerDom, {
  AnalyzerErrorPayload,
  AnalyzerResultPayload,
} from './PersonAnalyzerDom';
import { PersonContourDetection } from './guideFromContour';

export type OutlineAnalysisRequest = {
  id: string;
  dataUrl: string;
  sourceUri: string;
  aspectRatio: number;
  /** Camera-session identity for live analysis requests; absent for reference analysis. */
  sessionId?: number;
  /** Local cache files that can be deleted after analysis completes. */
  cleanupUris?: string[];
};

type Props = {
  request: OutlineAnalysisRequest | null;
  onResult: (request: OutlineAnalysisRequest, result: PersonContourDetection) => void | Promise<void>;
  onError: (request: OutlineAnalysisRequest, message: string) => void | Promise<void>;
};

/**
 * Universal wrapper around the DOM MediaPipe analyzer.
 *
 * - Web: PersonAnalyzerDom executes as regular browser DOM.
 * - iOS / Android: Expo SDK 57 hosts the same component in @expo/dom-webview.
 *
 * This keeps the ML implementation identical on all three targets and avoids
 * separate Swift/Kotlin bridges during MVP development.
 */
export function PersonOutlineAnalyzer({ request, onResult, onError }: Props) {
  if (!request) return null;

  const handleResult = async (payload: AnalyzerResultPayload) => {
    if (payload.requestId !== request.id) return;
    await onResult(request, payload.detection);
  };

  const handleError = async (payload: AnalyzerErrorPayload) => {
    if (payload.requestId !== request.id) return;
    await onError(request, payload.message || 'Outline analysis failed.');
  };

  return (
    <PersonAnalyzerDom
      key={request.id}
      requestId={request.id}
      dataUrl={request.dataUrl}
      onResult={handleResult}
      onError={handleError}
      dom={{
        scrollEnabled: false,
        containerStyle: {
          position: 'absolute',
          width: 2,
          height: 2,
          left: -20,
          top: -20,
          opacity: 0.01,
        },
      }}
    />
  );
}
