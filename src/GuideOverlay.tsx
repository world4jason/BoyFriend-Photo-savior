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

type PixelPoint = { x: number; y: number };

export function GuideOverlay({ guide, width, height, opacity = 0.94 }: Props) {
  const transform = guide.transform ?? { dx: 0, dy: 0, scale: 1 };
  const targetAspect = guide.aspectRatio && guide.aspectRatio > 0 ? guide.aspectRatio : 0.75;
  const containerAspect = width / Math.max(1, height);

  const frame = containerAspect > targetAspect
    ? { width: height * targetAspect, height, x: (width - height * targetAspect) / 2, y: 0 }
    : { width, height: width / targetAspect, x: 0, y: (height - width / targetAspect) / 2 };

  const tx = (x: number) => frame.x + (((x - 0.5) * transform.scale) + 0.5 + transform.dx) * frame.width;
  const ty = (y: number) => frame.y + (((y - 0.5) * transform.scale) + 0.5 + transform.dy) * frame.height;
  const rx = (r: number) => r * frame.width * transform.scale;
  const ry = (r: number) => r * frame.height * transform.scale;
  const point = (p?: NormalizedPoint): PixelPoint | null => p ? { x: tx(p.x), y: ty(p.y) } : null;

  const renderTubeSegment = (
    a: NormalizedPoint | undefined,
    b: NormalizedPoint | undefined,
    key: string,
    radiusScale = 1,
  ) => {
    const pa = point(a);
    const pb = point(b);
    if (!pa || !pb) return null;

    const dx = pb.x - pa.x;
    const dy = pb.y - pa.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const radius = Math.max(4, Math.min(11, frame.width * 0.014)) * transform.scale * radiusScale;
    const ox = (-dy / length) * radius;
    const oy = (dx / length) * radius;
    const dash = guide.mode === 'simple' ? '10 8' : undefined;

    return (
      <React.Fragment key={key}>
        <Line
          x1={pa.x + ox} y1={pa.y + oy} x2={pb.x + ox} y2={pb.y + oy}
          stroke={GUIDE} strokeWidth={3.5} strokeLinecap="round" strokeOpacity={opacity} strokeDasharray={dash}
        />
        <Line
          x1={pa.x - ox} y1={pa.y - oy} x2={pb.x - ox} y2={pb.y - oy}
          stroke={GUIDE} strokeWidth={3.5} strokeLinecap="round" strokeOpacity={opacity} strokeDasharray={dash}
        />
      </React.Fragment>
    );
  };

  const contourPath = (contour: NormalizedPoint[]) => {
    if (contour.length < 3) return '';
    return contour.map((p, index) => `${index === 0 ? 'M' : 'L'} ${tx(p.x)} ${ty(p.y)}`).join(' ') + ' Z';
  };

  const renderFallbackPersonOutline = (person: PersonGuide, index: number) => {
    const { head, shoulders, torso, joints = {} } = person;
    const hipL = joints.leftHip ?? { x: torso.bottom.x - torso.width * 0.32, y: torso.bottom.y };
    const hipR = joints.rightHip ?? { x: torso.bottom.x + torso.width * 0.32, y: torso.bottom.y };
    const dash = guide.mode === 'simple' ? '10 8' : undefined;

    const torsoPath = [
      `M ${tx(shoulders.left.x)} ${ty(shoulders.left.y)}`,
      `Q ${tx(torso.top.x)} ${ty(torso.top.y - 0.015)} ${tx(shoulders.right.x)} ${ty(shoulders.right.y)}`,
      `Q ${tx(hipR.x + 0.02)} ${ty((shoulders.right.y + hipR.y) / 2)} ${tx(hipR.x)} ${ty(hipR.y)}`,
      `Q ${tx(torso.bottom.x)} ${ty(torso.bottom.y + 0.025)} ${tx(hipL.x)} ${ty(hipL.y)}`,
      `Q ${tx(hipL.x - 0.02)} ${ty((shoulders.left.y + hipL.y) / 2)} ${tx(shoulders.left.x)} ${ty(shoulders.left.y)}`,
      'Z',
    ].join(' ');

    return (
      <React.Fragment key={`fallback-person-${index}`}>
        <Ellipse
          cx={tx(head.center.x)} cy={ty(head.center.y)}
          rx={rx(head.rx)} ry={ry(head.ry)}
          fill="none" stroke={GUIDE} strokeWidth={4} strokeOpacity={opacity}
          strokeDasharray={dash}
        />
        <Path
          d={torsoPath}
          fill="none" stroke={GUIDE} strokeWidth={4} strokeLinejoin="round" strokeOpacity={opacity}
          strokeDasharray={dash}
        />

        {renderTubeSegment(shoulders.left, joints.leftElbow, `${index}-left-upper-arm`)}
        {renderTubeSegment(joints.leftElbow, joints.leftWrist, `${index}-left-lower-arm`, 0.78)}
        {renderTubeSegment(shoulders.right, joints.rightElbow, `${index}-right-upper-arm`)}
        {renderTubeSegment(joints.rightElbow, joints.rightWrist, `${index}-right-lower-arm`, 0.78)}
        {renderTubeSegment(hipL, joints.leftKnee, `${index}-left-thigh`, 1.05)}
        {renderTubeSegment(joints.leftKnee, joints.leftAnkle, `${index}-left-calf`, 0.82)}
        {renderTubeSegment(hipR, joints.rightKnee, `${index}-right-thigh`, 1.05)}
        {renderTubeSegment(joints.rightKnee, joints.rightAnkle, `${index}-right-calf`, 0.82)}
      </React.Fragment>
    );
  };

  const renderPerson = (person: PersonGuide, index: number) => {
    const head = person.head;
    const faceArrowX = head.facing === 'left'
      ? head.center.x - 0.085
      : head.facing === 'right'
        ? head.center.x + 0.085
        : head.center.x;

    return (
      <React.Fragment key={`person-${index}`}>
        {person.contour && person.contour.length >= 3
          ? (
            <Path
              d={contourPath(person.contour)}
              fill={GUIDE}
              fillOpacity={0.018}
              stroke={GUIDE}
              strokeWidth={4.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeOpacity={opacity}
              strokeDasharray={guide.mode === 'simple' ? '10 8' : undefined}
            />
          )
          : renderFallbackPersonOutline(person, index)}

        {head.facing !== 'front' && (
          <>
            <Line
              x1={tx(head.center.x)} y1={ty(head.center.y)}
              x2={tx(faceArrowX)} y2={ty(head.center.y)}
              stroke={GUIDE} strokeWidth={3} strokeOpacity={opacity * 0.92}
            />
            <Circle cx={tx(faceArrowX)} cy={ty(head.center.y)} r={5} fill={GUIDE} fillOpacity={opacity} />
          </>
        )}
      </React.Fragment>
    );
  };

  const objects = guide.objects ?? [];

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      <Rect
        x={frame.x + 1} y={frame.y + 1}
        width={Math.max(0, frame.width - 2)} height={Math.max(0, frame.height - 2)}
        fill="none" stroke={WHITE} strokeWidth={1.5} strokeOpacity={0.38}
      />
      <Line x1={frame.x + frame.width / 3} y1={frame.y} x2={frame.x + frame.width / 3} y2={frame.y + frame.height} stroke={WHITE} strokeOpacity={0.13} />
      <Line x1={frame.x + (frame.width * 2) / 3} y1={frame.y} x2={frame.x + (frame.width * 2) / 3} y2={frame.y + frame.height} stroke={WHITE} strokeOpacity={0.13} />
      <Line x1={frame.x} y1={frame.y + frame.height / 3} x2={frame.x + frame.width} y2={frame.y + frame.height / 3} stroke={WHITE} strokeOpacity={0.13} />
      <Line x1={frame.x} y1={frame.y + (frame.height * 2) / 3} x2={frame.x + frame.width} y2={frame.y + (frame.height * 2) / 3} stroke={WHITE} strokeOpacity={0.13} />

      {guide.kind === 'portrait' && guide.people.map(renderPerson)}

      {guide.kind === 'food' && (
        <>
          {objects.length > 1 && objects.slice(0, -1).map((object, i) => {
            const next = objects[i + 1];
            return (
              <Line
                key={`relation-${i}`}
                x1={tx(object.center.x)} y1={ty(object.center.y)}
                x2={tx(next.center.x)} y2={ty(next.center.y)}
                stroke={GUIDE} strokeWidth={2} strokeDasharray="6 8" strokeOpacity={0.45}
              />
            );
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
              <SvgText
                x={tx(object.center.x)} y={ty(object.center.y) + 4}
                fill={WHITE} fillOpacity={0.9} fontSize="11" fontWeight="700" textAnchor="middle"
              >
                {object.label}
              </SvgText>
            </React.Fragment>
          ))}
        </>
      )}

      <SvgText x={frame.x + 14} y={frame.y + 28} fill={WHITE} fillOpacity={0.84} fontSize="13" fontWeight="700">
        {guide.kind === 'food'
          ? 'TABLETOP · MATCH SIZE + RELATION'
          : `${guide.crop.toUpperCase()} · OUTER CONTOUR`}
      </SvgText>
    </Svg>
  );
}
