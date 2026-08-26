import React from 'react';
import { Circle, Ellipse, Line, Rect, Text as SvgText } from 'react-native-svg';
import { GuideAnnotation } from './types';

type Props = {
  annotations?: GuideAnnotation[];
  tx: (x: number) => number;
  ty: (y: number) => number;
  rx: (r: number) => number;
  ry: (r: number) => number;
  stroke: string;
  secondary: string;
  opacity: number;
};

export function CompositionAnnotations({ annotations = [], tx, ty, rx, ry, stroke, secondary, opacity }: Props) {
  return (
    <>
      {annotations.map((annotation, index) => {
        if (annotation.type === 'line') {
          const midX = (annotation.from.x + annotation.to.x) / 2;
          const midY = (annotation.from.y + annotation.to.y) / 2;
          return (
            <React.Fragment key={`annotation-line-${index}`}>
              <Line
                x1={tx(annotation.from.x)} y1={ty(annotation.from.y)}
                x2={tx(annotation.to.x)} y2={ty(annotation.to.y)}
                stroke={stroke} strokeWidth={2.5}
                strokeDasharray={annotation.dashed ? '8 7' : undefined}
                strokeOpacity={opacity * 0.88}
              />
              {annotation.label ? (
                <SvgText
                  x={tx(midX)} y={ty(midY) - 7}
                  fill={secondary} fillOpacity={0.92} fontSize="10" fontWeight="700" textAnchor="middle"
                >{annotation.label}</SvgText>
              ) : null}
            </React.Fragment>
          );
        }

        if (annotation.type === 'zone') {
          return (
            <React.Fragment key={`annotation-zone-${index}`}>
              <Ellipse
                cx={tx(annotation.center.x)} cy={ty(annotation.center.y)}
                rx={rx(annotation.rx)} ry={ry(annotation.ry)}
                fill={stroke} fillOpacity={0.045}
                stroke={stroke} strokeWidth={2.5} strokeDasharray="10 8" strokeOpacity={opacity * 0.9}
                transform={annotation.rotation ? `rotate(${annotation.rotation} ${tx(annotation.center.x)} ${ty(annotation.center.y)})` : undefined}
              />
              {annotation.label ? (
                <SvgText
                  x={tx(annotation.center.x)} y={ty(annotation.center.y) + 4}
                  fill={secondary} fillOpacity={0.94} fontSize="10" fontWeight="700" textAnchor="middle"
                >{annotation.label}</SvgText>
              ) : null}
            </React.Fragment>
          );
        }

        if (annotation.type === 'point') {
          return (
            <React.Fragment key={`annotation-point-${index}`}>
              <Circle
                cx={tx(annotation.position.x)} cy={ty(annotation.position.y)} r={6}
                fill={stroke} fillOpacity={opacity * 0.95}
              />
              {annotation.label ? (
                <SvgText
                  x={tx(annotation.position.x) + 10} y={ty(annotation.position.y) - 8}
                  fill={secondary} fillOpacity={0.94} fontSize="10" fontWeight="700"
                >{annotation.label}</SvgText>
              ) : null}
            </React.Fragment>
          );
        }

        return (
          <React.Fragment key={`annotation-frame-${index}`}>
            <Rect
              x={tx(annotation.left)} y={ty(annotation.top)}
              width={Math.max(4, tx(annotation.right) - tx(annotation.left))}
              height={Math.max(4, ty(annotation.bottom) - ty(annotation.top))}
              fill="none" stroke={stroke} strokeWidth={2.5} strokeDasharray="10 8" strokeOpacity={opacity * 0.9}
            />
            {annotation.label ? (
              <SvgText
                x={tx(annotation.left) + 8} y={ty(annotation.top) + 18}
                fill={secondary} fillOpacity={0.94} fontSize="10" fontWeight="700"
              >{annotation.label}</SvgText>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  );
}
