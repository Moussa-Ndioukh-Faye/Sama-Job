/**
 * Composant FadeInView
 * Animation de fade-in fluide pour les éléments
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';

export const FadeInView = ({
  duration = 500,
  delay = 0,
  children,
  style,
  ...props
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, duration, delay]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export const SlideInUpView = ({
  duration = 500,
  delay = 0,
  distance = 40,
  children,
  style,
  ...props
}) => {
  const translateY = useRef(new Animated.Value(distance)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, fadeAnim, duration, delay]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export const ScaleInView = ({
  duration = 400,
  delay = 0,
  initialScale = 0.9,
  children,
  style,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(initialScale)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim, duration, delay]);

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};

export const PulseAnimation = ({
  duration = 1000,
  children,
  style,
  ...props
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.sequence([
      Animated.timing(pulseAnim, {
        toValue: 1.05,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: duration / 2,
        useNativeDriver: true,
      }),
    ]);

    Animated.loop(pulse).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: pulseAnim }],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Animated.View>
  );
};
