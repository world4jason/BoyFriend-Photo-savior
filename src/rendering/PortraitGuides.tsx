import React from 'react';
import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import type { GuideSpec, NormalizedPoint, PersonGuide } from '../types';

export type PortraitVisualStyle = 'outline' | 'skeleton' | 'ghost' | 'guide';

export type PortraitVisual = {
  stroke: string;
  secondary: string;
  strokeWidth: number;
  fillOpacity: number;
};

type PixelPoint = { x: number; y: number };

type Props = {
  guide: GuideSpec;
  style: PortraitVisualStyle;
  visual: PortraitVisual;
  opacity: number;
  frameWidth: number;
  tx: (x: number) => number;
  ty: (y: number) => number;
  rx: (r: number) => number;
  ry: (r: number) => number;
};

const midpoint = (a: PixelPoint, b: PixelPoint): PixelPoint => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
});

function smoothClosedPixelPath(points: PixelPoint[]): string {
  if (points.length < 3) return '';
  const firstMid = midpoint(points[points.length - 1], points[0]);
  const commands = [`M ${firstMid.x} ${firstMid.y}`];
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const mid = midpoint(current, next);
    commands.push(`Q ${current.x} ${current.y} ${mid.x} ${mid.y}`);
  }
  commands.push('Z');
  return commands.join(' ');
}

function chainEnvelopePath(points: PixelPoint[], radii: number[]): string {
  if (points.length < 2 || points.length !== radii.length) return '';

  const left: PixelPoint[] = [];
  const right: PixelPoint[] = [];

  points.forEach((point, index) => {
    const prev = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const length = Math.max(1, Math.hypot(dx, dy));
    const nx = -dy / length;
    const ny = dx / length;
    const radius = radii[index];
    left.push({ x: point.x + nx * radius, y: point.y + ny * radius });
    right.push({ x: point.x - nx * radius, y: point.y - ny * radius });
  });

  return smoothClosedPixelPath([...left, ...right.reverse()]);
}

export function smoothSourceContourPath(
  contour: NormalizedPoint[],
  tx: (x: number) => number,
  ty: (y: number) => number,
): string {
  if (contour.length < 3) return '';
  return smoothClosedPixelPath(contour.map((point) => ({ x: tx(point.x), y: ty(point.y) })));
}

export function PortraitGuides({ guide, style, visual, opacity, frameWidth, tx, ty, rx, ry }: Props) {
  const pixel = (point?: NormalizedPoint): PixelPoint | null => point ? { x: tx(point.x), y: ty(point.y) } : null;

  const fallbackEnvelope = (person: PersonGuide, index: number) => {
    const joints = person.joints ?? {};
    const hips = [
      joints.leftHip ?? { x: person.torso.bottom.x - person.torso.width * 0.32, y: person.torso.bottom.y },
      joints.rightHip ?? { x: person.torso.bottom.x + person.torso.width * 0.32, y: person.torso.bottom.y },
    ];
    const shoulders = [person.shoulders.left, person.shoulders.right];
    const visualLeftShoulder = shoulders[0].x <= shoulders[1].x ? shoulders[0] : shoulders[1];
    const visualRightShoulder = shoulders[0].x <= shoulders[1].x ? shoulders[1] : shoulders[0];
    const visualLeftHip = hips[0].x <= hips[1].x ? hips[0] : hips[1];
    const visualRightHip = hips[0].x <= hips[1].x ? hips[1] : hips[0];

    const torsoPoints: PixelPoint[] = [
      pixel(visualLeftShoulder)!, pixel(visualRightShoulder)!, pixel(visualRightHip)!, pixel(visualLeftHip)!,
    ];
    const torsoPath = smoothClosedPixelPath(torsoPoints);

    const base = Math.max(4.5, Math.min(12, frameWidth * 0.018));
    const armRadii = [base * 1.00, base * 0.78, base * 0.52];
    const legRadii = [base * 1.35, base * 1.06, base * 0.72];

    const limbPath = (chain: Array<NormalizedPoint | undefined>, radii: number[]) => {
      if (chain.some((point) => !point)) return '';
      return chainEnvelopePath(chain.map((point) => pixel(point)!), radii);
    };

    const paths = [
      limbPath([person.shoulders.left, joints.leftElbow, joints.leftWrist], armRadii),
      limbPath([person.shoulders.right, joints.rightElbow, joints.rightWrist], armRadii),
      limbPath([hips[0], joints.leftKnee, joints.leftAnkle], legRadii),
      limbPath([hips[1], joints.rightKnee, joints.rightAnkle], legRadii),
    ].filter(Boolean);

    const fillOpacity = style === 'ghost' ? Math.max(0.14, visual.fillOpacity) : 0;
    const lineOpacity = style === 'ghost' ? Math.max(0.48, opacity * 0.72) : opacity;

    return (
      <React.Fragment key={`fallback-${index}`}>
        <Ellipse
          cx={tx(person.head.center.x)} cy={ty(person.head.center.y)}
          rx={rx(person.head.rx)} ry={ry(person.head.ry)}
          fill={visual.stroke} fillOpacity={fillOpacity}
          stroke={visual.stroke} strokeWidth={visual.strokeWidth} strokeOpacity={lineOpacity}
        />
        <Path
          d={torsoPath} fill={visual.stroke} fillOpacity={fillOpacity}
          stroke={visual.stroke} strokeWidth={visual.strokeWidth} strokeOpacity={lineOpacity}
          strokeLinejoin="round" strokeLinecap="round"
        />
        {paths.map((path, pathIndex) => (
          <Path
            key={`limb-${index}-${pathIndex}`} d={path}
            fill={visual.stroke} fillOpacity={fillOpacity}
            stroke={visual.stroke} strokeWidth={visual.strokeWidth} strokeOpacity={lineOpacity}
            strokeLinejoin="round" strokeLinecap="round"
          />
        ))}
      </React.Fragment>
    );
  };

  const silhouettePerson = (person: PersonGuide, index: number) => {
    const hasContour = Boolean(person.contour && person.contour.length >= 3);
    if (!hasContour) return fallbackEnvelope(person, index);
    const path = smoothSourceContourPath(person.contour!, tx, ty);
    const fillOpacity = style === 'ghost' ? Math.max(0.14, visual.fillOpacity) : 0;
    const lineOpacity = style === 'ghost' ? Math.max(0.52, opacity * 0.74) : opacity;
    return (
      <Path
        key={`source-contour-${index}`}
        d={path}
        fill={visual.stroke} fillOpacity={fillOpacity}
        stroke={visual.stroke} strokeWidth={visual.strokeWidth} strokeOpacity={lineOpacity}
        strokeLinejoin="round" strokeLinecap="round"
      />
    );
  };

  const skeletonPerson = (person: PersonGuide, index: number) => {
    const joints = person.joints ?? {};
    const hipL = joints.leftHip ?? { x: person.torso.bottom.x - person.torso.width * 0.30, y: person.torso.bottom.y };
    const hipR = joints.rightHip ?? { x: person.torso.bottom.x + person.torso.width * 0.30, y: person.torso.bottom.y };
    const hipMid = { x: (hipL.x + hipR.x) / 2, y: (hipL.y + hipR.y) / 2 };
    const shoulderMid = {
      x: (person.shoulders.left.x + person.shoulders.right.x) / 2,
      y: (person.shoulders.left.y + person.shoulders.right.y) / 2,
    };
    const segments: Array<[NormalizedPoint | undefined, NormalizedPoint | undefined, string]> = [
      [person.head.center, shoulderMid, 'neck'], [person.shoulders.left, person.shoulders.right, 'shoulders'],
      [shoulderMid, hipMid, 'spine'], [hipL, hipR, 'hips'],
      [person.shoulders.left, joints.leftElbow, 'lua'], [joints.leftElbow, joints.leftWrist, 'lla'],
      [person.shoulders.right, joints.rightElbow, 'rua'], [joints.rightElbow, joints.rightWrist, 'rla'],
      [hipL, joints.leftKnee, 'lt'], [joints.leftKnee, joints.leftAnkle, 'lc'],
      [hipR, joints.rightKnee, 'rt'], [joints.rightKnee, joints.rightAnkle, 'rc'],
    ];
    const nodes = [
      person.head.center, person.shoulders.left, person.shoulders.right, joints.leftElbow, joints.rightElbow,
      joints.leftWrist, joints.rightWrist, hipL, hipR, joints.leftKnee, joints.rightKnee, joints.leftAnkle, joints.rightAnkle,
    ].filter(Boolean) as NormalizedPoint[];

    return (
      <React.Fragment key={`skeleton-${index}`}>
        <Ellipse
          cx={tx(person.head.center.x)} cy={ty(person.head.center.y)}
          rx={Math.max(8, rx(person.head.rx) * 0.72)} ry={Math.max(10, ry(person.head.ry) * 0.72)}
          fill="none" stroke={visual.stroke} strokeWidth={visual.strokeWidth} strokeOpacity={opacity}
        />
        {segments.map(([a, b, name]) => a && b ? (
          <Line
            key={`${index}-${name}`} x1={tx(a.x)} y1={ty(a.y)} x2={tx(b.x)} y2={ty(b.y)}
            stroke={visual.stroke} strokeWidth={visual.strokeWidth} strokeLinecap="round" strokeOpacity={opacity}
          />
        ) : null)}
        {nodes.map((node, nodeIndex) => (
          <Circle
            key={`${index}-node-${nodeIndex}`} cx={tx(node.x)} cy={ty(node.y)} r={4.25}
            fill={visual.secondary} fillOpacity={0.94} stroke={visual.stroke} strokeWidth={1.4} strokeOpacity={opacity}
          />
        ))}
      </React.Fragment>
    );
  };

  const personBounds = (person: PersonGuide) => {
    const points: NormalizedPoint[] = person.contour?.length ? person.contour : [
      { x: person.head.center.x - person.head.rx, y: person.head.center.y - person.head.ry },
      { x: person.head.center.x + person.head.rx, y: person.head.center.y + person.head.ry },
      person.shoulders.left, person.shoulders.right,
      person.joints?.leftWrist ?? person.torso.bottom, person.joints?.rightWrist ?? person.torso.bottom,
      person.joints?.leftAnkle ?? person.joints?.leftKnee ?? person.torso.bottom,
      person.joints?.rightAnkle ?? person.joints?.rightKnee ?? person.torso.bottom,
    ];
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    return { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
  };

  const compositionPerson = (person: PersonGuide, index: number) => {
    const bounds = personBounds(person);
    const eyeLineY = ty(person.head.center.y);
    const lookLeft = person.head.facing === 'left' || guide.lookSpace === 'left';
    const lookRight = person.head.facing === 'right' || guide.lookSpace === 'right';
    return (
      <React.Fragment key={`composition-${index}`}>
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
        {(lookLeft || lookRight) ? (
          <>
            <Line
              x1={tx(person.head.center.x)} y1={eyeLineY}
              x2={tx(lookLeft ? Math.max(0.04, bounds.left - 0.13) : Math.min(0.96, bounds.right + 0.13))}
              y2={eyeLineY} stroke={visual.stroke} strokeWidth={2} strokeDasharray="6 6" strokeOpacity={opacity * 0.85}
            />
            <SvgText
              x={tx(lookLeft ? Math.max(0.04, bounds.left - 0.11) : Math.min(0.88, bounds.right + 0.04))}
              y={eyeLineY - 8} fill={visual.secondary} fillOpacity={0.86} fontSize="10" fontWeight="700"
            >LOOK SPACE</SvgText>
          </>
        ) : null}
      </React.Fragment>
    );
  };

  if (style === 'skeleton') return <>{guide.people.map(skeletonPerson)}</>;
  if (style === 'guide') {
    return (
      <>
        {guide.people.map(compositionPerson)}
        {guide.people.slice(0, -1).map((person, index) => {
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
  return <>{guide.people.map(silhouettePerson)}</>;
}
