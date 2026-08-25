import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { GuideSpec } from './types';

type Props = {
  guide: GuideSpec;
  width: number;
  height: number;
  opacity?: number;
};

export function GuideOverlay({ guide, width, height, opacity = 0.92 }: Props) {
  const px = (x: number) => x * width;
  const py = (y: number) => y * height;
  const head = guide.head;
  const shoulderL = guide.shoulders.left;
  const shoulderR = guide.shoulders.right;
  const torso = guide.torso;
  const stroke = '#F8FF61';
  const soft = '#FFFFFF';

  const faceArrowEndX = head.facing === 'left'
    ? head.center.x - 0.09
    : head.facing === 'right'
      ? head.center.x + 0.09
      : head.center.x;

  const outlinePath = [
    `M ${px(head.center.x - head.rx * 0.85)} ${py(head.center.y + head.ry * 0.82)}`,
    `Q ${px(shoulderL.x)} ${py(shoulderL.y)} ${px(shoulderL.x - 0.05)} ${py(shoulderL.y + 0.12)}`,
    `Q ${px(torso.bottom.x - torso.width * 0.55)} ${py(torso.bottom.y)} ${px(torso.bottom.x)} ${py(torso.bottom.y)}`,
    `Q ${px(torso.bottom.x + torso.width * 0.55)} ${py(torso.bottom.y)} ${px(shoulderR.x + 0.05)} ${py(shoulderR.y + 0.12)}`,
    `Q ${px(shoulderR.x)} ${py(shoulderR.y)} ${px(head.center.x + head.rx * 0.85)} ${py(head.center.y + head.ry * 0.82)}`,
  ].join(' ');

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      <Rect x={1} y={1} width={width - 2} height={height - 2} fill="none" stroke={soft} strokeOpacity={0.18} />
      <Line x1={width / 3} y1={0} x2={width / 3} y2={height} stroke={soft} strokeOpacity={0.12} />
      <Line x1={(width * 2) / 3} y1={0} x2={(width * 2) / 3} y2={height} stroke={soft} strokeOpacity={0.12} />
      <Line x1={0} y1={height / 3} x2={width} y2={height / 3} stroke={soft} strokeOpacity={0.12} />
      <Line x1={0} y1={(height * 2) / 3} x2={width} y2={(height * 2) / 3} stroke={soft} strokeOpacity={0.12} />

      {guide.mode === 'outline' && (
        <>
          <Ellipse
            cx={px(head.center.x)} cy={py(head.center.y)}
            rx={px(head.rx)} ry={py(head.ry)}
            fill="none" stroke={stroke} strokeWidth={3} strokeOpacity={opacity}
          />
          <Path d={outlinePath} fill="none" stroke={stroke} strokeWidth={4} strokeLinecap="round" strokeOpacity={opacity} />
        </>
      )}

      {guide.mode === 'pose' && (
        <>
          <Circle cx={px(head.center.x)} cy={py(head.center.y)} r={Math.min(px(head.rx), py(head.ry)) * 0.72} fill="none" stroke={stroke} strokeWidth={3} strokeOpacity={opacity} />
          <Line x1={px(shoulderL.x)} y1={py(shoulderL.y)} x2={px(shoulderR.x)} y2={py(shoulderR.y)} stroke={stroke} strokeWidth={4} strokeOpacity={opacity} />
          <Line x1={px(torso.top.x)} y1={py(torso.top.y)} x2={px(torso.bottom.x)} y2={py(torso.bottom.y)} stroke={stroke} strokeWidth={4} strokeOpacity={opacity} />
          <Line x1={px(shoulderL.x)} y1={py(shoulderL.y)} x2={px(shoulderL.x - 0.09)} y2={py(shoulderL.y + 0.20)} stroke={stroke} strokeWidth={4} strokeOpacity={opacity} />
          <Line x1={px(shoulderR.x)} y1={py(shoulderR.y)} x2={px(shoulderR.x + 0.07)} y2={py(shoulderR.y + 0.18)} stroke={stroke} strokeWidth={4} strokeOpacity={opacity} />
        </>
      )}

      {guide.mode === 'simple' && (
        <>
          <Ellipse
            cx={px(head.center.x)} cy={py(head.center.y)}
            rx={px(head.rx)} ry={py(head.ry)}
            fill="none" stroke={stroke} strokeWidth={4} strokeDasharray="10 8" strokeOpacity={opacity}
          />
          <Line x1={px(shoulderL.x)} y1={py(shoulderL.y)} x2={px(shoulderR.x)} y2={py(shoulderR.y)} stroke={stroke} strokeWidth={5} strokeLinecap="round" strokeOpacity={opacity} />
          <Line x1={px(torso.top.x)} y1={py(torso.top.y)} x2={px(torso.bottom.x)} y2={py(torso.bottom.y)} stroke={stroke} strokeWidth={3} strokeDasharray="8 8" strokeOpacity={opacity * 0.8} />
        </>
      )}

      {head.facing !== 'front' && (
        <>
          <Line
            x1={px(head.center.x)} y1={py(head.center.y)}
            x2={px(faceArrowEndX)} y2={py(head.center.y)}
            stroke={stroke} strokeWidth={3} strokeOpacity={opacity}
          />
          <Circle cx={px(faceArrowEndX)} cy={py(head.center.y)} r={5} fill={stroke} fillOpacity={opacity} />
        </>
      )}

      <SvgText x={14} y={28} fill="#FFFFFF" fillOpacity={0.75} fontSize="13">{guide.crop.toUpperCase()} · LOOK {guide.lookSpace.toUpperCase()}</SvgText>
    </Svg>
  );
}
