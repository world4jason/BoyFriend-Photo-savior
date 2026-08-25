import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { GuideSpec, NormalizedPoint, PersonGuide } from './types';

type Props = {
  guide: GuideSpec;
  width: number;
  height: number;
  opacity?: number;
};

const GUIDE = '#F8FF61';
const WHITE = '#FFFFFF';

export function GuideOverlay({ guide, width, height, opacity = 0.94 }: Props) {
  const transform = guide.transform ?? { dx: 0, dy: 0, scale: 1 };
  const tx = (x: number) => (((x - 0.5) * transform.scale) + 0.5 + transform.dx) * width;
  const ty = (y: number) => (((y - 0.5) * transform.scale) + 0.5 + transform.dy) * height;
  const rx = (r: number) => r * width * transform.scale;
  const ry = (r: number) => r * height * transform.scale;
  const point = (p?: NormalizedPoint) => p ? { x: tx(p.x), y: ty(p.y) } : null;

  const renderSegment = (a: NormalizedPoint | undefined, b: NormalizedPoint | undefined, key: string, thick = false) => {
    const pa = point(a);
    const pb = point(b);
    if (!pa || !pb) return null;
    return (
      <Line
        key={key}
        x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y}
        stroke={GUIDE}
        strokeWidth={thick ? 7 : 4}
        strokeLinecap="round"
        strokeOpacity={thick ? opacity * 0.72 : opacity}
        strokeDasharray={guide.mode === 'simple' ? '9 8' : undefined}
      />
    );
  };

  const renderPerson = (person: PersonGuide, index: number) => {
    const { head, shoulders, torso, joints = {} } = person;
    const shoulderMid = torso.top;
    const hipL = joints.leftHip ?? { x: torso.bottom.x - torso.width * 0.32, y: torso.bottom.y };
    const hipR = joints.rightHip ?? { x: torso.bottom.x + torso.width * 0.32, y: torso.bottom.y };
    const faceArrowX = head.facing === 'left' ? head.center.x - 0.085 : head.facing === 'right' ? head.center.x + 0.085 : head.center.x;

    const outlinePath = [
      `M ${tx(head.center.x - head.rx * 0.8)} ${ty(head.center.y + head.ry * 0.76)}`,
      `Q ${tx(shoulders.left.x)} ${ty(shoulders.left.y)} ${tx(hipL.x)} ${ty(hipL.y)}`,
      `Q ${tx(torso.bottom.x)} ${ty(torso.bottom.y + 0.035)} ${tx(hipR.x)} ${ty(hipR.y)}`,
      `Q ${tx(shoulders.right.x)} ${ty(shoulders.right.y)} ${tx(head.center.x + head.rx * 0.8)} ${ty(head.center.y + head.ry * 0.76)}`,
    ].join(' ');

    const skeleton = [
      renderSegment(shoulders.left, shoulders.right, `${index}-shoulders`),
      renderSegment(shoulderMid, torso.bottom, `${index}-torso`),
      renderSegment(shoulders.left, joints.leftElbow, `${index}-la1`),
      renderSegment(joints.leftElbow, joints.leftWrist, `${index}-la2`),
      renderSegment(shoulders.right, joints.rightElbow, `${index}-ra1`),
      renderSegment(joints.rightElbow, joints.rightWrist, `${index}-ra2`),
      renderSegment(hipL, hipR, `${index}-hips`),
      renderSegment(hipL, joints.leftKnee, `${index}-ll1`),
      renderSegment(joints.leftKnee, joints.leftAnkle, `${index}-ll2`),
      renderSegment(hipR, joints.rightKnee, `${index}-rl1`),
      renderSegment(joints.rightKnee, joints.rightAnkle, `${index}-rl2`),
    ];

    const thickSkeleton = [
      renderSegment(shoulders.left, joints.leftElbow, `${index}-ola1`, true),
      renderSegment(joints.leftElbow, joints.leftWrist, `${index}-ola2`, true),
      renderSegment(shoulders.right, joints.rightElbow, `${index}-ora1`, true),
      renderSegment(joints.rightElbow, joints.rightWrist, `${index}-ora2`, true),
      renderSegment(hipL, joints.leftKnee, `${index}-oll1`, true),
      renderSegment(joints.leftKnee, joints.leftAnkle, `${index}-oll2`, true),
      renderSegment(hipR, joints.rightKnee, `${index}-orl1`, true),
      renderSegment(joints.rightKnee, joints.rightAnkle, `${index}-orl2`, true),
    ];

    return (
      <React.Fragment key={`person-${index}`}>
        {guide.mode === 'outline' && (
          <>
            <Ellipse cx={tx(head.center.x)} cy={ty(head.center.y)} rx={rx(head.rx)} ry={ry(head.ry)} fill="none" stroke={GUIDE} strokeWidth={4} strokeOpacity={opacity} />
            <Path d={outlinePath} fill="none" stroke={GUIDE} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={opacity * 0.76} />
            {thickSkeleton}
          </>
        )}

        {guide.mode === 'pose' && (
          <>
            <Circle cx={tx(head.center.x)} cy={ty(head.center.y)} r={Math.min(rx(head.rx), ry(head.ry)) * 0.72} fill="none" stroke={GUIDE} strokeWidth={3} strokeOpacity={opacity} />
            {skeleton}
            {Object.values(joints).map((p, i) => p ? <Circle key={`${index}-joint-${i}`} cx={tx(p.x)} cy={ty(p.y)} r={4} fill={GUIDE} fillOpacity={opacity} /> : null)}
          </>
        )}

        {guide.mode === 'simple' && (
          <>
            <Ellipse cx={tx(head.center.x)} cy={ty(head.center.y)} rx={rx(head.rx)} ry={ry(head.ry)} fill="none" stroke={GUIDE} strokeWidth={4} strokeDasharray="10 8" strokeOpacity={opacity} />
            {renderSegment(shoulders.left, shoulders.right, `${index}-simple-shoulders`)}
            {renderSegment(shoulderMid, torso.bottom, `${index}-simple-torso`)}
            {joints.leftWrist && renderSegment(shoulders.left, joints.leftWrist, `${index}-simple-left-arm`)}
            {joints.rightWrist && renderSegment(shoulders.right, joints.rightWrist, `${index}-simple-right-arm`)}
            {joints.leftKnee && renderSegment(hipL, joints.leftKnee, `${index}-simple-left-leg`)}
            {joints.rightKnee && renderSegment(hipR, joints.rightKnee, `${index}-simple-right-leg`)}
          </>
        )}

        {head.facing !== 'front' && (
          <>
            <Line x1={tx(head.center.x)} y1={ty(head.center.y)} x2={tx(faceArrowX)} y2={ty(head.center.y)} stroke={GUIDE} strokeWidth={3} strokeOpacity={opacity} />
            <Circle cx={tx(faceArrowX)} cy={ty(head.center.y)} r={5} fill={GUIDE} fillOpacity={opacity} />
          </>
        )}
      </React.Fragment>
    );
  };

  const objects = guide.objects ?? [];

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      <Rect x={1} y={1} width={width - 2} height={height - 2} fill="none" stroke={WHITE} strokeOpacity={0.18} />
      <Line x1={width / 3} y1={0} x2={width / 3} y2={height} stroke={WHITE} strokeOpacity={0.12} />
      <Line x1={(width * 2) / 3} y1={0} x2={(width * 2) / 3} y2={height} stroke={WHITE} strokeOpacity={0.12} />
      <Line x1={0} y1={height / 3} x2={width} y2={height / 3} stroke={WHITE} strokeOpacity={0.12} />
      <Line x1={0} y1={(height * 2) / 3} x2={width} y2={(height * 2) / 3} stroke={WHITE} strokeOpacity={0.12} />

      {guide.kind === 'portrait' && guide.people.map(renderPerson)}

      {guide.kind === 'food' && (
        <>
          {objects.length > 1 && objects.slice(0, -1).map((object, i) => {
            const next = objects[i + 1];
            return <Line key={`relation-${i}`} x1={tx(object.center.x)} y1={ty(object.center.y)} x2={tx(next.center.x)} y2={ty(next.center.y)} stroke={GUIDE} strokeWidth={2} strokeDasharray="6 8" strokeOpacity={0.45} />;
          })}
          {objects.map((object, i) => (
            <React.Fragment key={`object-${i}`}>
              <Ellipse
                cx={tx(object.center.x)} cy={ty(object.center.y)}
                rx={rx(object.rx)} ry={ry(object.ry)}
                fill={guide.mode === 'simple' ? GUIDE : 'none'}
                fillOpacity={guide.mode === 'simple' ? 0.07 : 0}
                stroke={GUIDE}
                strokeWidth={guide.mode === 'outline' ? 4 : 3}
                strokeDasharray={guide.mode === 'simple' ? '10 8' : undefined}
                strokeOpacity={opacity}
                transform={object.rotation ? `rotate(${object.rotation} ${tx(object.center.x)} ${ty(object.center.y)})` : undefined}
              />
              <SvgText x={tx(object.center.x)} y={ty(object.center.y) + 4} fill={WHITE} fillOpacity={0.9} fontSize="11" fontWeight="700" textAnchor="middle">{object.label}</SvgText>
            </React.Fragment>
          ))}
        </>
      )}

      <SvgText x={14} y={28} fill={WHITE} fillOpacity={0.82} fontSize="13" fontWeight="700">
        {guide.kind === 'food' ? 'TABLETOP · MATCH SIZE + RELATION' : `${guide.crop.toUpperCase()} · LOOK ${guide.lookSpace.toUpperCase()}`}
      </SvgText>
    </Svg>
  );
}
