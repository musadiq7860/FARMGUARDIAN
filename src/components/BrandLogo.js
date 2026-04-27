import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const sizes = {
  small: { width: 64, height: 64 },
  medium: { width: 96, height: 96 },
  large: { width: 128, height: 128 },
  hero: { width: 164, height: 164 },
};

const BrandLogo = ({ variant = 'shield', size = 'medium', style }) => {
  const dimension = sizes[size] || sizes.medium;

  const source =
    variant === 'full'
      ? require('../assets/logo-full.png')
      : require('../assets/logo-shield.png');

  return (
    <View style={[styles.container, style]}>
      <Image source={source} style={dimension} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BrandLogo;
