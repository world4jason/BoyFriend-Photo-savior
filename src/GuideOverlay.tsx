import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, Line, Rect, Text as SvgText } from 'react-native-svg';
import { CompositionAnnotations } from './CompositionAnnotations';
import { ReferenceImageOverlay } from './ReferenceImageOverlay';
import { PortraitGuides, PortraitVisual, PortraitVisualStyle } from './rendering/PortraitGuides';
import { lensHintDetail, lensHintFromGuide, lensHintLabel } from './shooting/lensHint';
import { GuidePreset, GuideSpec } from './types';

type Props = {
  guide: GuideSpec;
  width: number;
  height: number;
  opacity?: number;
  visualStyle?: GuidePreset;
  /** Explicit override. Existing camera call uses opacity=.99, so auto mode keeps backward compatibility. */
  shootingAids?: boolean;
};

type VisualConfig = PortraitVisual & {
  showGrid: boolean;
  showFrame: boolean;
};

const VISUALS: Record<GuidePreset, VisualConfig> = {
  // SOVS-like: a quiet continuous contour, not a widened skeleton.
  sovs: {
    stroke: '#FFFFFF', secondary: '#FFFFFF', strokeWidth: 3.2, fillOpacity: 0,
    showGrid: false, showFrame: false,
  },
  // PoseOverlay-like: explicit pose skeleton and keypoints.
  poseoverlay: {
    stroke: '#F8FF61', secondary: '#FFFFFF', strokeWidth: 3.5, fillOpacity: 0,
    showGrid: false, showFrame: false,
  },
  // PoseGhost-like: coherent silhouette that remains legible at low opacity.
  poseghost: {
    stroke: '#FFFFFF', secondary: '#FFFFFF', strokeWidth: 2.2, fillOpacity: 0.16,
    showGrid: false, showFrame: false,
  },
  recompose: {
    stroke: '#F8FF61', secondary: '#FFFFFF', strokeWidth: 3, fillOpacity: 0.035,
    showGrid: true, showFrame: true,
  },
};

const STYLE_TO_PORTRAIT: Record<GuidePreset, PortraitVisualStyle> = {
  sovs: 'outline',
  poseoverlay: 'skeleton',
  poseghost: 'ghost',
  recompose: 'guide',
};

const REFERENCE_OPACITIES = [0, 0.15, 0.30, 0.50] as const;

export function GuideOverlay({ guide, width, height, opacity = 0.94, visualStyle, shootingAids }: Props) {
  const style = visualStyle ?? guide.visualStyle ?? 'sovs';
  const visual = VISUALS[style];
  const transform = guide.transform ?? { dx: 0, dy: 0, scale: 1 };
  const targetAspect = guide.aspectRatio && guide.aspectRatio > 0 ? guide.aspectRatio : 0.75;
  const containerAspect = width / Math.max(1, height);
  const frame = containerAspect > targetAspect
    ? { width: height * targetAspect, height, x: (width - height * targetAspect) / 2, y: 0 }
    : { width, height: width / targetAspect, x: 0, y: (height - width / targetAspect) / 2 };

  // Existing App.tsx uses opacity=.99 only for the live camera overlay. Keep that
  // as a compatibility inference until App.tsx is split and can pass this prop explicitly.
  const cameraPresentation = shootingAids ?? opacity >= 0.985;
  const [referenceOpacity, setReferenceOpacity] = useState(guide.sourceUri && cameraPresentation ? 0.30 : 0);
  const lensHint = guide.lensHint ?? lensHintFromGuide(guide);

  useEffect(() => {
    setReferenceOpacity(guide.sourceUri && cameraPresentation ? 0.30 : 0);
  }, [guide.sourceUri, cameraPresentation]);

  const tx = (x: number) => frame.x + (((x - 0.5) * transform.scale) + 0.5 + transform.dx) * frame.width;
  const ty = (y: number) => frame.y + (((y - 0.5) * transform.scale) + 0.5 + transform.dy) * frame.height;
  const rx = (r: number) => r * frame.width * transform.scale;
  const ry = (r: number) => r * frame.height * transform.scale;

  const objects = guide.objects ?? [];
  const annotations = guide.annotations ?? [];
  const showBaseGrid = visual.showGrid && (
    guide.kind === 'portrait' || (guide.kind === 'scene' && annotations.length === 0)
  );
  const fidelityLabel = guide.fidelity === 'source-derived'
    ? 'SOURCE-DERIVED'
    : guide.fidelity === 'approximate' ? 'APPROX POC' : null;

  return (
    <View pointerEvents="box-none" style={[overlayStyles.root, { width, height }]}>
      {cameraPresentation && guide.sourceUri ? (
        <ReferenceImageOverlay guide={guide} width={width} height={height} opacity={referenceOpacity} />
      ) : null}

      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {visual.showFrame ? (
          <Rect
            x={frame.x + 1} y={frame.y + 1}
            width={Math.max(0, frame.width - 2)} height={Math.max(0, frame.height - 2)}
            fill="none" stroke={visual.secondary} strokeWidth={1.5} strokeOpacity={0.32}
          />
        ) : null}

        {showBaseGrid ? (
          <>
            <Line x1={frame.x + frame.width / 3} y1={frame.y} x2={frame.x + frame.width / 3} y2={frame.y + frame.height} stroke={visual.secondary} strokeOpacity={0.15} />
            <Line x1={frame.x + (frame.width * 2) / 3} y1={frame.y} x2={frame.x + (frame.width * 2) / 3} y2={frame.y + frame.height} stroke={visual.secondary} strokeOpacity={0.15} />
            <Line x1={frame.x} y1={frame.y + frame.height / 3} x2={frame.x + frame.width} y2={frame.y + frame.height / 3} stroke={visual.secondary} strokeOpacity={0.15} />
            <Line x1={frame.x} y1={frame.y + (frame.height * 2) / 3} x2={frame.x + frame.width} y2={frame.y + (frame.height * 2) / 3} stroke={visual.secondary} strokeOpacity={0.15} />
          </>
        ) : null}

        {guide.kind === 'portrait' ? (
          <PortraitGuides
            guide={guide}
            style={STYLE_TO_PORTRAIT[style]}
            visual={visual}
            opacity={opacity}
            frameWidth={frame.width}
            tx={tx} ty={ty} rx={rx} ry={ry}
          />
        ) : null}

        {style === 'recompose' ? (
          <CompositionAnnotations
            annotations={annotations} tx={tx} ty={ty} rx={rx} ry={ry}
            stroke={visual.stroke} secondary={visual.secondary} opacity={opacity}
          />
        ) : null}

        {guide.kind === 'food' ? (
          <>
            {objects.slice(0, -1).map((object, index) => {
              const next = objects[index + 1];
              return (
                <Line
                  key={`relation-${index}`}
                  x1={tx(object.center.x)} y1={ty(object.center.y)}
                  x2={tx(next.center.x)} y2={ty(next.center.y)}
                  stroke={visual.stroke} strokeWidth={2} strokeDasharray="6 8" strokeOpacity={0.48}
                />
              );
            })}
            {objects.map((object, index) => (
              <React.Fragment key={`object-${index}`}>
                <Ellipse
                  cx={tx(object.center.x)} cy={ty(object.center.y)} rx={rx(object.rx)} ry={ry(object.ry)}
                  fill={visual.stroke} fillOpacity={guide.mode === 'simple' ? 0.055 : 0}
                  stroke={visual.stroke} strokeWidth={visual.strokeWidth}
                  strokeDasharray="12 8" strokeOpacity={opacity}
                  transform={object.rotation ? `rotate(${object.rotation} ${tx(object.center.x)} ${ty(object.center.y)})` : undefined}
                />
                <SvgText
                  x={tx(object.center.x)} y={ty(object.center.y) + 4}
                  fill={visual.secondary} fillOpacity={0.92}
                  fontSize="11" fontWeight="700" textAnchor="middle"
                >{object.label}</SvgText>
              </React.Fragment>
            ))}
          </>
        ) : null}

        {style === 'poseoverlay' && guide.kind === 'portrait' ? (
          <SvgText
            x={frame.x + 14} y={frame.y + 28}
            fill={visual.secondary} fillOpacity={0.82} fontSize="12" fontWeight="700"
          >{`${guide.crop.toUpperCase()} · SKELETON MATCH`}</SvgText>
        ) : null}

        {style === 'recompose' ? (
          <SvgText
            x={frame.x + 14} y={frame.y + 28}
            fill={visual.secondary} fillOpacity={0.82} fontSize="12" fontWeight="700"
          >
            {guide.kind === 'food'
              ? 'MATCH SIZE + RELATION'
              : guide.kind === 'scene'
                ? 'COMPOSITION GUIDE'
                : `${guide.crop.toUpperCase()} · COMPOSITION GUIDE`}
          </SvgText>
        ) : null}

        {fidelityLabel ? (
          <SvgText
            x={frame.x + frame.width - 10}
            y={frame.y + frame.height - 12}
            fill={guide.fidelity === 'source-derived' ? '#85F3A7' : '#FFCF66'}
            fillOpacity={0.90}
            fontSize={Math.max(8, Math.min(11, frame.width * 0.026))}
            fontWeight="800" textAnchor="end"
          >{fidelityLabel}</SvgText>
        ) : null}
      </Svg>

      {cameraPresentation ? (
        <View pointerEvents="box-none" style={overlayStyles.shootingStack}>
          <View pointerEvents="none" style={overlayStyles.lensBadge}>
            <Text style={overlayStyles.lensTitle}>{lensHintLabel(lensHint)}</Text>
            <Text style={overlayStyles.lensDetail}>{lensHintDetail(lensHint)}</Text>
          </View>

          {guide.sourceUri ? (
            <View style={overlayStyles.photoControl}>
              <Text style={overlayStyles.photoLabel}>PHOTO</Text>
              <View style={overlayStyles.photoRow}>
                {REFERENCE_OPACITIES.map((value) => {
                  const active = referenceOpacity === value;
                  return (
                    <Pressable
                      key={value}
                      onPress={() => setReferenceOpacity(value)}
                      style={[overlayStyles.photoChip, active && overlayStyles.photoChipActive]}
                    >
                      <Text style={[overlayStyles.photoChipText, active && overlayStyles.photoChipTextActive]}>
                        {value === 0 ? 'Off' : `${Math.round(value * 100)}%`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const overlayStyles = StyleSheet.create({
  root: { position: 'absolute', left: 0, top: 0 },
  shootingStack: {
    position: 'absolute', left: 12, right: 12, top: 158,
    alignItems: 'center', gap: 6,
  },
  lensBadge: {
    width: '100%', maxWidth: 430,
    backgroundColor: 'rgba(0,0,0,0.66)', borderColor: 'rgba(255,255,255,0.18)', borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, alignItems: 'center',
  },
  lensTitle: { color: '#F8FF61', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  lensDetail: { color: '#E4E6EA', fontSize: 8, lineHeight: 11, marginTop: 2, textAlign: 'center' },
  photoControl: {
    backgroundColor: 'rgba(0,0,0,0.66)', borderColor: 'rgba(255,255,255,0.18)', borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 7, alignItems: 'center',
  },
  photoLabel: { color: '#F8FF61', fontSize: 8, fontWeight: '900', letterSpacing: 0.8, marginBottom: 5 },
  photoRow: { flexDirection: 'row', gap: 4, justifyContent: 'center', flexWrap: 'wrap' },
  photoChip: { paddingHorizontal: 7, paddingVertical: 5, borderRadius: 999, backgroundColor: '#24272D' },
  photoChipActive: { backgroundColor: '#F8FF61' },
  photoChipText: { color: '#FFF', fontSize: 8, fontWeight: '800' },
  photoChipTextActive: { color: '#111315' },
});
