import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Svg, { Path } from "react-native-svg";

import type { MaskProps, SvgMaskPathFunction, ValueXY } from "../types";
import { useCopilot } from "../index";
import Const from "../Const";

const AnimatedSvgPath = Animated.createAnimatedComponent(Path);
const windowDimensions = Dimensions.get("window");

const defaultSvgPath: SvgMaskPathFunction = ({
  size,
  position,
  canvasSize,
}): string => {
  const cornerRadius = Number(Const.radiusBorder[Const.activeCoPilotStep]) || 0;
  const positionX = (position.x as any)._value as number;
  const positionY = (position.y as any)._value as number;
  const sizeX = (size.x as any)._value as number;
  const sizeY = (size.y as any)._value as number;
  return `M0,0H${canvasSize.x}V${canvasSize.y}H0V0ZM${positionX + cornerRadius}, ${positionY}H${positionX + sizeX - cornerRadius}Q${positionX + sizeX}, ${positionY} ${positionX + sizeX}, ${positionY + cornerRadius}V${positionY + sizeY - cornerRadius}Q${positionX + sizeX}, ${positionY + sizeY} ${positionX + sizeX - cornerRadius}, ${positionY + sizeY}H${positionX + cornerRadius}Q${positionX}, ${positionY + sizeY} ${positionX}, ${positionY + sizeY - cornerRadius}V${positionY + cornerRadius}Q${positionX}, ${positionY} ${positionX + cornerRadius}, ${positionY}Z`;
};

export const SvgMask = ({
  size,
  position,
  style,
  easing = Easing.linear,
  animationDuration = 500,
  animated,
  backdropColor,
  svgMaskPath = defaultSvgPath,
  onClick,
  currentStep,
}: MaskProps) => {
  const [canvasSize, setCanvasSize] = useState<ValueXY>({
    x: (windowDimensions.width - 100),
    y: (windowDimensions.height - 100),
  });
  const sizeValue = useRef<Animated.ValueXY>(
    new Animated.ValueXY(size)
  ).current;
  const positionValue = useRef<Animated.ValueXY>(
    new Animated.ValueXY(position)
  ).current;
  const maskRef = useRef<any>(null);

  const animationListener = useCallback(() => {
    const d: string = svgMaskPath({
      size: sizeValue,
      position: positionValue,
      canvasSize,
      step: currentStep
    });

    if (maskRef.current) {
      maskRef.current.setNativeProps({ d });
    }
  }, [canvasSize, currentStep, svgMaskPath, positionValue, sizeValue]);

  const animate = useCallback(
    (toSize: ValueXY = size, toPosition: ValueXY = position) => {
      if (animated) {
        Animated.parallel([
          Animated.timing(sizeValue, {
            toValue: toSize,
            duration: animationDuration,
            easing,
            useNativeDriver: false,
          }),
          Animated.timing(positionValue, {
            toValue: toPosition,
            duration: animationDuration,
            easing,
            useNativeDriver: false,
          }),
        ]).start();
      } else {
        sizeValue.setValue(toSize);
        positionValue.setValue(toPosition);
      }
    },
    [
      animated,
      animationDuration,
      easing,
      positionValue,
      position,
      size,
      sizeValue,
    ]
  );

  useEffect(() => {
    const id = positionValue.addListener(animationListener);
    return () => {
      positionValue.removeListener(id);
    };
  }, [animationListener, positionValue]);

  useEffect(() => {
    if (size && position) {
      animate(size, position);
    }
  }, [animate, position, size]);

  const handleLayout = ({
    nativeEvent: {
      layout: { width, height },
    },
  }: LayoutChangeEvent) => {
    setCanvasSize({
      x: width,
      y: height,
    });
  };

  return (
    <View
      style={style}
      onLayout={handleLayout}
      onStartShouldSetResponder={onClick}
    >
      {canvasSize ? (
        <Svg pointerEvents="none" width={canvasSize.x} height={canvasSize.y}>
          <AnimatedSvgPath
            ref={maskRef}
            fill={backdropColor}
            fillRule="evenodd"
            strokeWidth={1}
            d={svgMaskPath({
              size: sizeValue,
              position: positionValue,
              canvasSize,
              step: currentStep
            })}
          />
        </Svg>
      ) : null}
    </View>
  );
};
