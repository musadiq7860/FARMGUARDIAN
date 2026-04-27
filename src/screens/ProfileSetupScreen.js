import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, CROP_LIST, DISTRICTS } from '../utils/constants';
import { updateUserProfile } from '../services/authService';
import Button from '../components/Button';
import Input from '../components/Input';
import Picker from '../components/Picker';
import { supabase } from '../config/supabase';

const ProfileSetupScreen = ({ route, navigation }) => {
  const { userData: routeUserData, token: routeToken } = route.params || {};
  const { user: contextUser, token: contextToken, register } = useAuth();
  const { t, currentLanguage } = useLanguage();

  // Use route params if available (from Google / normal flow), otherwise fall back to context user
  const userData = routeUserData || contextUser;
  const token = routeToken || contextToken;
  
  const [name, setName] = useState(userData?.displayName || userData?.name || '');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [totalLand, setTotalLand] = useState('');
  const [cropsGrown, setCropsGrown] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = t('auth.nameRequired');
    }
    
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = t('auth.phoneRequired');
    } else if (!/^03\d{9}$/.test(phoneNumber)) {
      newErrors.phoneNumber = t('auth.invalidPhone');
    }
    
    if (!city.trim()) {
      newErrors.city = t('auth.cityRequired');
    }
    
    if (!district) {
      newErrors.district = t('auth.districtRequired');
    }
    
    if (!village.trim()) {
      newErrors.village = t('auth.villageRequired');
    }
    
    if (!totalLand.trim()) {
      newErrors.totalLand = t('auth.totalLandRequired');
    } else if (isNaN(totalLand) || parseFloat(totalLand) <= 0) {
      newErrors.totalLand = t('auth.invalidLandSize');
    }
    
    if (cropsGrown.length === 0) {
      newErrors.cropsGrown = t('auth.selectAtLeastOneCrop');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleComplete = async () => {
    if (!validateForm()) {
      Alert.alert(t('common.error'), t('errors.invalidInput'));
      return;
    }

    try {
      setLoading(true);
      
      // Get UID from userData prop or from current Supabase session
      let uid = userData?.uid || userData?.id;
      let accessToken = token;
      if (!uid) {
        const { data: { user: supaUser } } = await supabase.auth.getUser();
        uid = supaUser?.id;
      }
      if (!accessToken) {
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token || null;
      }

      const profileData = {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        city: city.trim(),
        district,
        village: village.trim(),
        totalLand: parseFloat(totalLand),
        cropsGrown,
        email: userData?.email || '',
        uid,
        photoURL: userData?.photoURL || '',
      };
      
      const result = await updateUserProfile(uid, profileData);
      
      if (result.success) {
        await register(result.user, accessToken);
        Alert.alert(
          t('common.success'),
          t('auth.profileCompleted'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.replace('MainApp'),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error.message || t('errors.somethingWrong')
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleCrop = (cropId) => {
    if (cropsGrown.includes(cropId)) {
      setCropsGrown(cropsGrown.filter(id => id !== cropId));
    } else {
      setCropsGrown([...cropsGrown, cropId]);
    }
    if (errors.cropsGrown) {
      setErrors({ ...errors, cropsGrown: '' });
    }
  };

  const getDistrictName = () => {
    const dist = DISTRICTS.find(d => d.id === district);
    return dist ? (currentLanguage === 'ur' ? dist.nameUr : dist.nameEn) : '';
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.icon}>👨‍🌾</Text>
          <Text style={styles.title}>{t('auth.completeProfile')}</Text>
          <Text style={styles.subtitle}>{t('auth.tellUsAboutYourFarm')}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label={t('auth.fullName')}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name) setErrors({ ...errors, name: '' });
            }}
            placeholder={t('auth.namePlaceholder')}
            error={errors.name}
          />

          <Input
            label={t('auth.phoneNumber')}
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
            }}
            placeholder={t('auth.phoneNumberPlaceholder')}
            keyboardType="phone-pad"
            maxLength={11}
            error={errors.phoneNumber}
          />

          <Input
            label={t('auth.city')}
            value={city}
            onChangeText={(text) => {
              setCity(text);
              if (errors.city) setErrors({ ...errors, city: '' });
            }}
            placeholder={t('auth.cityPlaceholder')}
            error={errors.city}
          />

          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowDistrictPicker(true)}
          >
            <Text style={styles.pickerLabel}>{t('auth.district')}</Text>
            <View style={[
              styles.pickerValue,
              errors.district && styles.pickerValueError
            ]}>
              <Text style={district ? styles.pickerValueText : styles.pickerPlaceholder}>
                {getDistrictName() || t('auth.selectDistrict')}
              </Text>
              <Text style={styles.pickerArrow}>▼</Text>
            </View>
            {errors.district && (
              <Text style={styles.errorText}>{errors.district}</Text>
            )}
          </TouchableOpacity>

          <Input
            label={t('auth.village')}
            value={village}
            onChangeText={(text) => {
              setVillage(text);
              if (errors.village) setErrors({ ...errors, village: '' });
            }}
            placeholder={t('auth.villagePlaceholder')}
            error={errors.village}
          />

          <Input
            label={t('auth.totalLand')}
            value={totalLand}
            onChangeText={(text) => {
              setTotalLand(text);
              if (errors.totalLand) setErrors({ ...errors, totalLand: '' });
            }}
            placeholder={t('auth.totalLandPlaceholder')}
            keyboardType="numeric"
            error={errors.totalLand}
          />

          {/* Crops Selection */}
          <View style={styles.cropsSection}>
            <Text style={styles.cropsLabel}>{t('auth.cropsGrown')}</Text>
            <Text style={styles.cropsSubtitle}>{t('auth.selectCrops')}</Text>
            
            <View style={styles.cropsContainer}>
              {CROP_LIST.map((crop) => (
                <TouchableOpacity
                  key={crop.id}
                  style={[
                    styles.cropChip,
                    cropsGrown.includes(crop.id) && styles.cropChipSelected,
                  ]}
                  onPress={() => toggleCrop(crop.id)}
                >
                  <Text style={styles.cropIcon}>{crop.icon}</Text>
                  <Text style={[
                    styles.cropName,
                    cropsGrown.includes(crop.id) && styles.cropNameSelected
                  ]}>
                    {currentLanguage === 'ur' ? crop.nameUr : crop.nameEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {errors.cropsGrown && (
              <Text style={styles.errorText}>{errors.cropsGrown}</Text>
            )}
          </View>

          <Button
            title={t('auth.completeSetup')}
            onPress={handleComplete}
            loading={loading}
            style={styles.button}
          />
        </View>

        <Picker
          visible={showDistrictPicker}
          onClose={() => setShowDistrictPicker(false)}
          title={t('auth.district')}
          items={DISTRICTS}
          selectedValue={district}
          onValueChange={(value) => {
            setDistrict(value);
            if (errors.district) setErrors({ ...errors, district: '' });
          }}
          displayKey={currentLanguage === 'ur' ? 'nameUr' : 'nameEn'}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
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
    flex: 1,
  },
  pickerButton: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  pickerValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: COLORS.surface,
  },
  pickerValueError: {
    borderColor: COLORS.error,
  },
  pickerValueText: {
    fontSize: 16,
    color: COLORS.text,
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  pickerArrow: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cropsSection: {
    marginBottom: 24,
  },
  cropsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  cropsSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  cropsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    marginRight: 8,
    marginBottom: 8,
  },
  cropChipSelected: {
    backgroundColor: `${COLORS.primary}15`,
    borderColor: COLORS.primary,
  },
  cropIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cropName: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  cropNameSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  button: {
    marginTop: 24,
    marginBottom: 32,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});

export default ProfileSetupScreen;

