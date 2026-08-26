import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { GuidePreset, GuideSpec, NormalizedPoint, PersonGuide } from './types';

type Props = {
  guide: GuideSpec;
  width: number;
  height: number;
  opacity?: number;
  visualStyle?: GuidePreset;
};

type PixelPoint = { x: number; y: number };

type VisualConfig = {
  stroke: string;
  secondary: string;
  strokeWidth: number;
  fillOpacity: number;
  dash?: string;
  showGrid: boolean;
  showFrame: boolean;
  showFaceDirection: boolean;
  glowWidth?: number;
};

const VISUALS: Record<GuidePreset, VisualConfig> = {
  sovs: {
    stroke: '#FFFFFF',
    secondary: '#FFFFFF',
    strokeWidth: 6,
    fillOpacity: 0,
    showGrid: false,
    showFrame: false,
    showFaceDirection: true,
  },
  poseoverlay: {
    stroke: '#F8FF61',
    secondary: '#FFFFFF',
    strokeWidth: 4,
    fillOpacity: 0,
    showGrid: false,
    showFrame: false,
    showFaceDirection: true,
  },
  poseghost: {
    stroke: '#FFFFFF',
    secondary: '#FFFFFF',
    strokeWidth: 2.5,
    fillOpacity: 0.16,
    showGrid: false,
    showFrame: false,
    showFaceDirection: false,
    glowWidth: 9,
  },
  recompose: {
    stroke: '#F8FF61',
    secondary: '#FFFFFF',
    strokeWidth: 3,
    fillOpacity: 0.035,
    dash: '12 8',
    showGrid: true,
    showFrame: true,
    showFaceDirection: true,
  },
};

export function GuideOverlay({
  guide,
  width,
  height,
  opacity = 0.94,
  visualStyle,
}: Props) {
  const style = visualStyle ?? guide.visualStyle ?? 'sovs';
  const visual = VISUALS[style];
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

  const contourPath = (contour: NormalizedPoint[]) => {
    if (contour.length < 3) return '';
    return contour.map((p, index) => `${index === 0 ? 'M' : 'L'} ${tx(p.x)} ${ty(p.y)}`).join(' ') + ' Z';
  };

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

    return (
      <React.Fragment key={key}>
        <Line
          x1={pa.x + ox} y1={pa.y + oy} x2={pb.x + ox} y2={pb.y + oy}
          stroke={visual.stroke} strokeWidth={visual.strokeWidth * 0.78}
          strokeLinecap="round" strokeOpacity={opacity} strokeDasharray={visual.dash}
        />
        <Line
          x1={pa.x - ox} y1={pa.y - oy} x2={pb.x - ox} y2={pb.y - oy}
          stroke={visual.stroke} strokeWidth={visual.strokeWidth * 0.78}
          strokeLinecap="round" strokeOpacity={opacity} strokeDasharray={visual.dash}
        />
      </React.Fragment>
    );
  };

  const renderFallbackPersonOutline = (person: PersonGuide, index: number) => {
    const { head, shoulders, torso, joints = {} } = person;
    const hipL = joints.leftHip ?? { x: torso.bottom.x - torso.width * 0.32, y: torso.bottom.y };
    const hipR = joints.rightHip ?? { x: torso.bottom.x + torso.width * 0.32, y: torso.bottom.y };

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
          cx={tx(head.center.x)} cy={ty(head.center.y)} rx={rx(head.rx)} ry={ry(head.ry)}
          fill={visual.stroke} fillOpacity={visual.fillOpacity}
          stroke={visual.stroke} strokeWidth={visual.strokeWidth} strokeOpacity={opacity}
          strokeDasharray={visual.dash}
        />
        <Path
          d={torsoPath}
          fill={visual.stroke} fillOpacity={visual.fillOpacity}
          stroke={visual.stroke} strokeWidth={visual.strokeWidth}
          strokeLinejoin="round" strokeOpacity={opacity} strokeDasharray={visual.dash}
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

  const renderFaceDirection = (person: PersonGuide, key: string) => {
    if (!visual.showFaceDirection || person.head.facing === 'front') return null;
    const faceArrowX = person.head.facing === 'left'
      ? person.head.center.x - 0.085
      : person.head.center.x + 0.085;

    return (
      <React.Fragment key={key}>
        <Line
          x1={tx(person.head.center.x)} y1={ty(person.head.center.y)}
          x2={tx(faceArrowX)} y2={ty(person.head.center.y)}
          stroke={visual.stroke} strokeWidth={2.5} strokeOpacity={opacity * 0.9}
        />
        <Circle cx={tx(faceArrowX)} cy={ty(person.head.center.y)} r={4.5} fill={visual.stroke} fillOpacity={opacity} />
      </React.Fragment>
    );
  };

  const renderSilhouettePerson = (person: PersonGuide, index: number) => {
    const hasContour = Boolean(person.contour && person.contour.length >= 3);
    const d = hasContour ? contourPath(person.contour!) : '';

    return (
      <React.Fragment key={`silhouette-person-${index}`}>
        {hasContour ? (
          <>
            {visual.glowWidth ? (
              <Path
                d={d} fill={visual.stroke} fillOpacity={visual.fillOpacity * 0.9}
                stroke={visual.stroke} strokeWidth={visual.glowWidth}
                strokeOpacity={opacity * 0.18} strokeLinejoin="round" strokeLinecap="round"
              />
            ) : null}
            <Path
              d={d}
              fill={visual.stroke}
              fillOpacity={visual.fillOpacity}
              stroke={visual.stroke}
              strokeWidth={visual.strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeOpacity={opacity}
            />
          </>
        ) : renderFallbackPersonOutline(person, index)}
        {renderFaceDirection(person, `silhouette-face-${index}`)}
      </React.Fragment>
    );
  };

  const renderSkeletonPerson = (person: PersonGuide, index: number) => {
    const joints = person.joints ?? {};
    const hipL = joints.leftHip ?? { x: person.torso.bottom.x - person.torso.width * 0.30, y: person.torso.bottom.y };
    const hipR = joints.rightHip ?? { x: person.torso.bottom.x + person.torso.width * 0.30, y: person.torso.bottom.y };
    const hipMid = { x: (hipL.x + hipR.x) / 2, y: (hipL.y + hipR.y) / 2 };
    const shoulderMid = {
      x: (person.shoulders.left.x + person.shoulders.right.x) / 2,
      y: (person.shoulders.left.y + person.shoulders.right.y) / 2,
    };

    const segments: Array<[NormalizedPoint | undefined, NormalizedPoint | undefined, string]> = [
      [person.head.center, shoulderMid, 'head-neck'],
      [person.shoulders.left, person.shoulders.right, 'shoulders'],
      [shoulderMid, hipMid, 'spine'],
      [hipL, hipR, 'hips'],
      [person.shoulders.left, joints.leftElbow, 'left-upper-arm'],
      [joints.leftElbow, joints.leftWrist, 'left-lower-arm'],
      [person.shoulders.right, joints.rightElbow, 'right-upper-arm'],
      [joints.rightElbow, joints.rightWrist, 'right-lower-arm'],
      [hipL, joints.leftKnee, 'left-thigh'],
      [joints.leftKnee, joints.leftAnkle, 'left-calf'],
      [hipR, joints.rightKnee, 'right-thigh'],
      [joints.rightKnee, joints.rightAnkle, 'right-calf'],
    ];

    const nodes = [
      person.head.center,
      person.shoulders.left,
      person.shoulders.right,
      joints.leftElbow,
      joints.rightElbow,
      joints.leftWrist,
      joints.rightWrist,
      hipL,
      hipR,
      joints.leftKnee,
      joints.rightKnee,
      joints.leftAnkle,
      joints.rightAnkle,
    ].filter(Boolean) as NormalizedPoint[];

    return (
      <React.Fragment key={`skeleton-person-${index}`}>
        <Ellipse
          cx={tx(person.head.center.x)} cy={ty(person.head.center.y)}
          rx={Math.max(8, rx(person.head.rx) * 0.72)} ry={Math.max(10, ry(person.head.ry) * 0.72)}
          fill="none" stroke={visual.stroke} strokeWidth={visual.strokeWidth} strokeOpacity={opacity}
        />
        {segments.map(([a, b, name]) => {
          if (!a || !b) return null;
          return (
            <Line
              key={`${index}-${name}`}
              x1={tx(a.x)} y1={ty(a.y)} x2={tx(b.x)} y2={ty(b.y)}
              stroke={visual.stroke} strokeWidth={visual.strokeWidth}
              strokeLinecap="round" strokeOpacity={opacity}
            />
          );
        })}
        {nodes.map((node, nodeIndex) => (
          <Circle
            key={`${index}-node-${nodeIndex}`}
            cx={tx(node.x)} cy={ty(node.y)} r={4.5}
            fill={visual.secondary} fillOpacity={0.92}
            stroke={visual.stroke} strokeWidth={1.5} strokeOpacity={opacity}
          />
        ))}
        {renderFaceDirection(person, `skeleton-face-${index}`)}
      </React.Fragment>
    );
  };

  const personBounds = (person: PersonGuide) => {
    const points: NormalizedPoint[] = person.contour?.length
      ? person.contour
      : [
          { x: person.head.center.x - person.head.rx, y: person.head.center.y - person.head.ry },
          { x: person.head.center.x + person.head.rx, y: person.head.center.y + person.head.ry },
          person.shoulders.left,
          person.shoulders.right,
          person.joints?.leftWrist ?? person.torso.bottom,
          person.joints?.rightWrist ?? person.torso.bottom,
          person.joints?.leftAnkle ?? person.joints?.leftKnee ?? person.torso.bottom,
          person.joints?.rightAnkle ?? person.joints?.rightKnee ?? person.torso.bottom,
        ];
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    return {
      left: Math.min(...xs), right: Math.max(...xs),
      top: Math.min(...ys), bottom: Math.max(...ys),
    };
  };

  const renderCompositionPerson = (person: PersonGuide, index: number) => {
    const bounds = personBounds(person);
    const lookRight = person.head.facing === 'right' || guide.lookSpace === 'right';
    const lookLeft = person.head.facing === 'left' || guide.lookSpace === 'left';
    const eyeLineY = ty(person.head.center.y);
    const subjectCenterX = (bounds.left + bounds.right) / 2;

    return (
      <React.Fragment key={`composition-person-${index}`}>
        <Rect
          x={tx(bounds.left)} y={ty(bounds.top)}
          width={Math.max(8, tx(bounds.right) - tx(bounds.left))}
          height={Math.max(8, ty(bounds.bottom) - ty(bounds.top))}
          rx={14} fill={visual.stroke} fillOpacity={0.025}
          stroke={visual.stroke} strokeWidth={2.5} strokeDasharray="10 8" strokeOpacity={opacity * 0.85}
        />
        <Line
          x1={tx(Math.max(0, bounds.left - 0.08))} y1={eyeLineY}
          x2={tx(Math.min(1, bounds.right + 0.08))} y2={eyeLineY}
          stroke={visual.stroke} strokeWidth={2.5} strokeOpacity={opacity * 0.9}
        />
        <Circle cx={tx(subjectCenterX)} cy={eyeLineY} r={5} fill={visual.stroke} fillOpacity={opacity} />
        {(lookLeft || lookRight) && (
          <>
            <Line
              x1={tx(person.head.center.x)} y1={eyeLineY}
              x2={tx(lookLeft ? Math.max(0.04, bounds.left - 0.13) : Math.min(0.96, bounds.right + 0.13))}
              y2={eyeLineY}
              stroke={visual.stroke} strokeWidth={2} strokeDasharray="6 6" strokeOpacity={opacity * 0.85}
            />
            <SvgText
              x={tx(lookLeft ? Math.max(0.04, bounds.left - 0.11) : Math.min(0.88, bounds.right + 0.04))}
              y={eyeLineY - 8}
              fill={visual.secondary} fillOpacity={0.86} fontSize="10" fontWeight="700"
            >LOOK SPACE</SvgText>
          </>
        )}
      </React.Fragment>
    );
  };

  const renderPortraits = () => {
    if (style === 'poseoverlay') return guide.people.map(renderSkeletonPerson);
    if (style === 'recompose') {
      return (
        <>
          {guide.people.map(renderCompositionPerson)}
          {guide.people.length > 1 && guide.people.slice(0, -1).map((person, index) => {
            const next = guide.people[index + 1];
            return (
              <Line
                key={`people-relation-${index}`}
                x1={tx(person.head.center.x)} y1={ty(person.head.center.y)}
                x2={tx(next.head.center.x)} y2={ty(next.head.center.y)}
                stroke={visual.stroke} strokeWidth={2} strokeDasharray="6 7" strokeOpacity={0.58}
              />
            );
          })}
        </>
      );
    }
    return guide.people.map(renderSilhouettePerson);
  };

  const objects = guide.objects ?? [];

  return (
    <Svg width={width} height={height} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
      {visual.showFrame && (
        <Rect
          x={frame.x + 1} y={frame.y + 1}
          width={Math.max(0, frame.width - 2)} height={Math.max(0, frame.height - 2)}
          fill="none" stroke={visual.secondary} strokeWidth={1.5} strokeOpacity={0.32}
        />
      )}

      {visual.showGrid && (
        <>
          <Line x1={frame.x + frame.width / 3} y1={frame.y} x2={frame.x + frame.width / 3} y2={frame.y + frame.height} stroke={visual.secondary} strokeOpacity={0.15} />
          <Line x1={frame.x + (frame.width * 2) / 3} y1={frame.y} x2={frame.x + (frame.width * 2) / 3} y2={frame.y + frame.height} stroke={visual.secondary} strokeOpacity={0.15} />
          <Line x1={frame.x} y1={frame.y + frame.height / 3} x2={frame.x + frame.width} y2={frame.y + frame.height / 3} stroke={visual.secondary} strokeOpacity={0.15} />
          <Line x1={frame.x} y1={frame.y + (frame.height * 2) / 3} x2={frame.x + frame.width} y2={frame.y + (frame.height * 2) / 3} stroke={visual.secondary} strokeOpacity={0.15} />
        </>
      )}

      {guide.kind === 'portrait' && renderPortraits()}

      {guide.kind === 'food' && (
        <>
          {objects.length > 1 && objects.slice(0, -1).map((object, i) => {
            const next = objects[i + 1];
            return (
              <Line
                key={`relation-${i}`}
                x1={tx(object.center.x)} y1={ty(object.center.y)}
                x2={tx(next.center.x)} y2={ty(next.center.y)}
                stroke={visual.stroke} strokeWidth={2} strokeDasharray="6 8" strokeOpacity={0.48}
              />
            );
          })}
          {objects.map((object, i) => (
            <React.Fragment key={`object-${i}`}>
              <Ellipse
                cx={tx(object.center.x)} cy={ty(object.center.y)}
                rx={rx(object.rx)} ry={ry(object.ry)}
                fill={visual.stroke}
                fillOpacity={style === 'poseghost' ? 0.12 : guide.mode === 'simple' ? 0.055 : 0}
                stroke={visual.stroke}
                strokeWidth={visual.strokeWidth}
                strokeDasharray={style === 'recompose' ? '12 8' : guide.mode === 'simple' ? '10 8' : undefined}
                strokeOpacity={opacity}
                transform={object.rotation ? `rotate(${object.rotation} ${tx(object.center.x)} ${ty(object.center.y)})` : undefined}
              />
              <SvgText
                x={tx(object.center.x)} y={ty(object.center.y) + 4}
                fill={visual.secondary} fillOpacity={0.92} fontSize="11" fontWeight="700" textAnchor="middle"
              >
                {object.label}
              </SvgText>
            </React.Fragment>
          ))}
        </>
      )}

      {style === 'poseoverlay' && guide.kind === 'portrait' && (
        <SvgText x={frame.x + 14} y={frame.y + 28} fill={visual.secondary} fillOpacity={0.82} fontSize="12" fontWeight="700">
          {`${guide.crop.toUpperCase()} · SKELETON MATCH`}
        </SvgText>
      )}

      {style === 'recompose' && (
        <SvgText x={frame.x + 14} y={frame.y + 28} fill={visual.secondary} fillOpacity={0.82} fontSize="12" fontWeight="700">
          {guide.kind === 'food' ? 'MATCH SIZE + RELATION' : `${guide.crop.toUpperCase()} · COMPOSITION GUIDE`}
        </SvgText>
      )}
    </Svg>
  );
}
