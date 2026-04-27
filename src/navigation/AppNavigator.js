import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../utils/constants';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

// Auth Screens
import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OTPVerificationScreen from '../screens/OTPVerificationScreen';
import RegistrationScreen from '../screens/RegistrationScreen';

// Main App
import BottomTabNavigator from './BottomTabNavigator';

// Additional Screens
import MapScreen from '../screens/MapScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AdminScreen from '../screens/AdminScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { t } = useLanguage();
  const { user, token, isGuest, isProfileComplete } = useAuth();

  // Determine the initial route based on auth + profile state
  const getInitialRoute = () => {
    if (!token && !isGuest) return 'Welcome';
    if (token && !isGuest && !isProfileComplete) return 'ProfileSetup';
    return 'MainApp';
  };
  
  return (
    <Stack.Navigator
      initialRouteName={getInitialRoute()}
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 20,
        },
      }}
    >
      <Stack.Screen
        name="Welcome"
        component={WelcomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfileSetup"
        component={ProfileSetupScreen}
        options={{ 
          title: t('auth.completeProfile'),
          headerLeft: null,
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ 
          title: t('auth.forgotPassword'),
        }}
      />
      <Stack.Screen
        name="OTPVerification"
        component={OTPVerificationScreen}
        options={{ title: t('auth.verifyOTP') }}
      />
      <Stack.Screen
        name="Registration"
        component={RegistrationScreen}
        options={{ title: t('auth.register') }}
      />
      <Stack.Screen
        name="MainApp"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Map"
        component={MapScreen}
        options={{ title: t('map.title') }}
      />
      <Stack.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: t('reports.title') }}
      />
      <Stack.Screen
        name="Admin"
        component={AdminScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;

