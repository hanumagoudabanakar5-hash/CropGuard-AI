
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ImageBackground,
  useWindowDimensions,
} from 'react-native';

const LEAF_IMAGE =
  'https://images.unsplash.com/photo-1741591916933-2b06011023cc?auto=format&fit=crop&fm=jpg&q=80&w=2000';

const PARTICLES = [
  { top: '12%', left: '8%', size: 5 },
  { top: '22%', left: '88%', size: 4 },
  { top: '38%', left: '16%', size: 4 },
  { top: '48%', left: '92%', size: 5 },
  { top: '65%', left: '7%', size: 4 },
  { top: '76%', left: '84%', size: 5 },
  { top: '88%', left: '24%', size: 4 },
  { top: '15%', left: '68%', size: 3 },
  { top: '58%', left: '72%', size: 4 },
  { top: '92%', left: '65%', size: 3 },
];

export default function CyberBackground() {
  const { width, height } = useWindowDimensions();

  const scanPosition = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const scanAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanPosition, {
          toValue: 1,
          duration: 4500,
          useNativeDriver: true,
        }),
        Animated.timing(scanPosition, {
          toValue: 0,
          duration: 4500,
          useNativeDriver: true,
        }),
      ])
    );

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );

    scanAnimation.start();
    pulseAnimation.start();

    return () => {
      scanAnimation.stop();
      pulseAnimation.stop();
    };
  }, [scanPosition, pulse]);

  const scanTranslateY = scanPosition.interpolate({
    inputRange: [0, 1],
    outputRange: [0, Math.max(height - 100, 0)],
  });

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.85],
  });

  return (
    <View pointerEvents="none" style={styles.container}>
      {/* White base */}
      <View style={styles.base} />

      {/* Realistic green leaf background */}
      <ImageBackground
        source={{ uri: LEAF_IMAGE }}
        resizeMode="cover"
        style={styles.photo}
        imageStyle={styles.photoImage}
      >
        <View style={styles.photoWash} />
      </ImageBackground>

      {/* Soft green glow */}
      <View style={styles.topGlow} />
      <View style={styles.bottomGlow} />

      {/* Digital grid */}
      <View style={styles.grid}>
        {Array.from({ length: Math.ceil(width / 42) }).map((_, index) => (
          <View
            key={`vertical-${index}`}
            style={[
              styles.verticalLine,
              { left: index * 42 },
            ]}
          />
        ))}

        {Array.from({ length: Math.ceil(height / 42) }).map((_, index) => (
          <View
            key={`horizontal-${index}`}
            style={[
              styles.horizontalLine,
              { top: index * 42 },
            ]}
          />
        ))}
      </View>

      {/* Animated scanning line */}
      <Animated.View
        style={[
          styles.scanLine,
          {
            transform: [{ translateY: scanTranslateY }],
          },
        ]}
      />

      {/* Floating green particles */}
      {PARTICLES.map((particle, index) => (
        <Animated.View
          key={`particle-${index}`}
          style={[
            styles.particle,
            {
              top: particle.top,
              left: particle.left,
              width: particle.size,
              height: particle.size,
              opacity: pulseOpacity,
            },
          ]}
        />
      ))}

      {/* Decorative leaf symbols */}
      <Text style={[styles.leaf, styles.leafOne]}>❧</Text>
      <Text style={[styles.leaf, styles.leafTwo]}>❧</Text>
      <Text style={[styles.leaf, styles.leafThree]}>❧</Text>

      {/* Corner technology markers */}
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />

      {/* Bottom watermark */}
      <Text style={styles.watermark}>
        CHIP TO CROP  •  AI AGRICULTURE
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    backgroundColor: '#F7FFF9',
  },

  base: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F7FFF9',
  },

  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  photoImage: {
    opacity: 0.28,
  },

  photoWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.48)',
  },

  topGlow: {
    position: 'absolute',
    top: -130,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0,200,83,0.07)',
  },

  bottomGlow: {
    position: 'absolute',
    bottom: -150,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(0,155,72,0.07)',
  },

  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  verticalLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0,155,72,0.045)',
  },

  horizontalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0,155,72,0.045)',
  },

  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,200,83,0.20)',
    shadowColor: '#00C853',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 3,
  },

  particle: {
    position: 'absolute',
    borderRadius: 10,
    backgroundColor: '#00C853',
    shadowColor: '#00C853',
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },

  leaf: {
    position: 'absolute',
    color: 'rgba(0,130,55,0.13)',
  },

  leafOne: {
    top: '8%',
    left: '3%',
    fontSize: 65,
    transform: [{ rotate: '-25deg' }],
  },

  leafTwo: {
    top: '48%',
    right: '2%',
    fontSize: 75,
    transform: [{ rotate: '35deg' }],
  },

  leafThree: {
    bottom: '9%',
    left: '8%',
    fontSize: 55,
    transform: [{ rotate: '15deg' }],
  },

  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: 'rgba(0,155,72,0.30)',
  },

  topLeft: {
    top: 12,
    left: 12,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },

  topRight: {
    top: 12,
    right: 12,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },

  bottomLeft: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },

  bottomRight: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },

  watermark: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: 'rgba(0,100,45,0.15)',
    fontSize: 9,
    letterSpacing: 2,
  },
});
