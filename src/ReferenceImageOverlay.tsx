import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import type { GuideSpec } from './types';

type Props = {
  guide: GuideSpec;
  width: number;
  height: number;
  opacity: number;
};

export function ReferenceImageOverlay({ guide, width, height, opacity }: Props) {
  if (!guide.sourceUri || opacity <= 0) return null;

  const transform = guide.transform ?? { dx: 0, dy: 0, scale: 1 };
  const targetAspect = guide.aspectRatio && guide.aspectRatio > 0 ? guide.aspectRatio : 0.75;
  const containerAspect = width / Math.max(1, height);
  const frame = containerAspect > targetAspect
    ? { width: height * targetAspect, height, x: (width - height * targetAspect) / 2, y: 0 }
    : { width, height: width / targetAspect, x: 0, y: (height - width / targetAspect) / 2 };

  // Same normalized transform used by GuideOverlay:
  // x' = ((x - .5) * scale) + .5 + dx
  const imageWidth = frame.width * transform.scale;
  const imageHeight = frame.height * transform.scale;
  const left = frame.x + (0.5 + transform.dx - 0.5 * transform.scale) * frame.width;
  const top = frame.y + (0.5 + transform.dy - 0.5 * transform.scale) * frame.height;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Image
        source={{ uri: guide.sourceUri }}
        resizeMode="stretch"
        style={{ position: 'absolute', left, top, width: imageWidth, height: imageHeight, opacity }}
      />
    </View>
  );
}
