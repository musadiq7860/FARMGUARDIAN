  import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  icon = null,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const styles = [buttonStyles.button, buttonStyles[size]];
    
    if (variant === 'primary') {
      styles.push(buttonStyles.primary);
    } else if (variant === 'secondary') {
      styles.push(buttonStyles.secondary);
    } else if (variant === 'outline') {
      styles.push(buttonStyles.outline);
    }
    
    if (disabled) {
      styles.push(buttonStyles.disabled);
    }
    
    if (style) {
      styles.push(style);
    }
    
    return styles;
  };
  
  const getTextStyle = () => {
    const styles = [buttonStyles.text];
    
    if (variant === 'outline') {
      styles.push(buttonStyles.outlineText);
    } else {
      styles.push(buttonStyles.primaryText);
    }
    
    if (textStyle) {
      styles.push(textStyle);
    }
    
    return styles;
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {icon && <View style={buttonStyles.icon}>{icon}</View>}
      <Text style={getTextStyle()}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
};

const buttonStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  disabled: {
    backgroundColor: COLORS.disabled,
    opacity: 0.6,
  },
  small: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 18,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  outlineText: {
    color: COLORS.primary,
  },
  icon: {
    marginRight: 8,
  },
});

export default Button;

