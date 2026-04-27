import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { COLORS } from '../utils/constants';
import { signUpWithEmail } from '../services/authService';
import BrandLogo from '../components/BrandLogo';
import Button from '../components/Button';
import Input from '../components/Input';

const SignUpScreen = ({ navigation }) => {
  const { t } = useLanguage();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailConfirmSent, setEmailConfirmSent] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!email.trim()) {
      newErrors.email = t('auth.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = t('auth.invalidEmail');
    }
    
    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    } else if (password.length < 6) {
      newErrors.password = t('auth.passwordTooShort');
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordsDontMatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSignUp = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const result = await signUpWithEmail(email, password);
      
      if (result.success) {
        if (result.needsConfirmation) {
          // Show confirmation banner; don't navigate yet
          setEmailConfirmSent(true);
        } else {
          // Auto-confirmed (e.g. test env) – go to profile setup
          navigation.navigate('ProfileSetup', {
            userData: result.user,
            token: result.token,
          });
        }
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.message || t('auth.signUpFailed')
      );
    } finally {
      setLoading(false);
    }
  };



  const handleFacebookSignUp = async () => {
    // Facebook auth removed – not used with Supabase
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <BrandLogo variant="full" size="large" style={{ marginBottom: 16 }} />
          <Text style={styles.title}>{t('auth.createAccount')}</Text>
          <Text style={styles.subtitle}>{t('auth.joinFarmGuardian')}</Text>
        </View>

        {/* Email Confirmation Banner */}
        {emailConfirmSent && (
          <View style={styles.confirmationBanner}>
            <Text style={styles.confirmationIcon}>📧</Text>
            <View style={styles.confirmationTextContainer}>
              <Text style={styles.confirmationTitle}>{t('auth.checkEmailTitle')}</Text>
              <Text style={styles.confirmationSubtitle}>
                {t('auth.checkEmailBody', { email })}
              </Text>
            </View>
          </View>
        )}



        {/* Email/Password Form – hidden after confirmation sent */}
        {!emailConfirmSent && (
        <View style={styles.form}>
          <Input
            label={t('auth.email')}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email) setErrors({ ...errors, email: '' });
            }}
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />

          <Input
            label={t('auth.password')}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) setErrors({ ...errors, password: '' });
            }}
            placeholder={t('auth.passwordPlaceholder')}
            secureTextEntry
            error={errors.password}
          />

          <Input
            label={t('auth.confirmPassword')}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
            }}
            placeholder={t('auth.confirmPasswordPlaceholder')}
            secureTextEntry
            error={errors.confirmPassword}
          />

          <Button
            title={t('auth.signUp')}
            onPress={handleEmailSignUp}
            loading={loading}
            style={styles.signUpButton}
          />
        </View>
        )}

        {/* Terms and Privacy */}
        {!emailConfirmSent && (
        <Text style={styles.termsText}>
          {t('auth.bySigningUp')} {' '}
          <Text style={styles.termsLink}>{t('auth.termsOfService')}</Text>
          {' '}{t('auth.and')}{' '}
          <Text style={styles.termsLink}>{t('auth.privacyPolicy')}</Text>
        </Text>
        )}

        {/* Login Link */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.alreadyHaveAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  form: {
    marginBottom: 16,
  },
  signUpButton: {
    marginTop: 16,
  },
  termsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  confirmationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  confirmationIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  confirmationTextContainer: {
    flex: 1,
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  confirmationSubtitle: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});

export default SignUpScreen;

