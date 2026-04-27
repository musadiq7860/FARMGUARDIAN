import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS } from '../utils/constants';
import BrandLogo from '../components/BrandLogo';
import Button from '../components/Button';

const WelcomeScreen = ({ navigation }) => {
  const { loginAsGuest } = useAuth();
  const { t } = useLanguage();

  const handleGuestMode = () => {
    loginAsGuest();
    navigation.replace('MainApp');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <BrandLogo variant="full" size="hero" style={{ marginBottom: 16 }} />
          <Text style={styles.title}>{t('common.appName')}</Text>
          <Text style={styles.subtitle}>{t('auth.welcomeMessage')}</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.greeting}>{t('auth.welcome')}</Text>
          
          <View style={styles.buttonsContainer}>
            <Button
              title={t('auth.login')}
              onPress={() => navigation.navigate('Login')}
              style={styles.button}
            />

            <Button
              title={t('auth.signUp')}
              onPress={() => navigation.navigate('SignUp')}
              variant="outline"
              style={styles.button}
            />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{t('auth.orLoginWithEmail')}</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity 
            style={styles.guestButton}
            onPress={handleGuestMode}
          >
            <Text style={styles.guestButtonText}>{t('auth.continueAsGuest')}</Text>
          </TouchableOpacity>
        </View>

        {/* Features List */}
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>{t('home.quickActions')}</Text>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔍</Text>
            <Text style={styles.featureText}>{t('home.detectDisease')}</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <Text style={styles.featureText}>{t('home.predictYield')}</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🌱</Text>
            <Text style={styles.featureText}>{t('home.soilAdvisory')}</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🗺️</Text>
            <Text style={styles.featureText}>{t('home.viewMap')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  content: {
    marginBottom: 40,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 32,
    textAlign: 'center',
  },
  buttonsContainer: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  guestButton: {
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
  },
  guestButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  features: {
    marginTop: 24,
    padding: 20,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
});

export default WelcomeScreen;

