import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, CROP_LIST } from '../utils/constants';
import { detectDisease } from '../services/diseaseService';
import { releaseModel } from '../services/tfliteService';
import diseaseSprayData from '../data/diseaseSprayData.json';
import Button from '../components/Button';
import Card from '../components/Card';
import CropSelector from '../components/CropSelector';
import HealthStatusBadge from '../components/HealthStatusBadge';
import Loader from '../components/Loader';

const DiseaseDetectionScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [result, setResult] = useState(null);

  // Release the loaded model from memory when leaving the screen
  useEffect(() => {
    return () => {
      if (selectedCrop) {
        releaseModel(selectedCrop);
      }
    };
  }, [selectedCrop]);

  const handleTakePhoto = () => {
    if (!selectedCrop) {
      Alert.alert(t('common.error'), t('disease.selectCropFirst'));
      return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
      },
      (response) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert(t('common.error'), response.errorMessage);
          return;
        }
        if (response.assets && response.assets[0]) {
          setImageUri(response.assets[0].uri);
          setResult(null);
        }
      }
    );
  };

  const handlePickImage = () => {
    if (!selectedCrop) {
      Alert.alert(t('common.error'), t('disease.selectCropFirst'));
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      (response) => {
        if (response.didCancel) {
          return;
        }
        if (response.errorCode) {
          Alert.alert(t('common.error'), response.errorMessage);
          return;
        }
        if (response.assets && response.assets[0]) {
          setImageUri(response.assets[0].uri);
          setResult(null);
        }
      }
    );
  };

  const handleDetect = async () => {
    if (!imageUri) {
      Alert.alert(t('common.error'), 'براہ کرم پہلے تصویر منتخب کریں');
      return;
    }

    try {
      setDetecting(true);
      const detection = await detectDisease(imageUri, selectedCrop, user?.id);
      setResult(detection);
    } catch (error) {
      Alert.alert(t('common.error'), error.message || t('errors.somethingWrong'));
    } finally {
      setDetecting(false);
    }
  };

  const handleScanAnother = () => {
    setImageUri(null);
    setResult(null);
    setSelectedCrop(null);
  };

  if (detecting) {
    return (
      <View style={styles.loadingContainer}>
        <Loader />
        <Text style={styles.analyzingText}>{t('disease.analyzing')}</Text>
      </View>
    );
  }

  if (result) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Card title={t('disease.result')}>
          {imageUri && (
            <Image source={{ uri: imageUri }} style={styles.resultImage} />
          )}
          
          <View style={styles.resultContent}>
            <HealthStatusBadge status={result.result.status} size="large" />
            
            <View style={styles.diseaseInfo}>
              <Text style={styles.diseaseLabel}>{t('disease.diseaseName')}:</Text>
              <Text style={styles.diseaseName}>{result.result.diseaseNameUrdu}</Text>
            </View>

            <View style={styles.confidenceBar}>
              <Text style={styles.confidenceLabel}>{t('disease.confidence')}:</Text>
              <View style={styles.confidenceProgress}>
                <View
                  style={[
                    styles.confidenceFill,
                    { width: `${result.result.confidence * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.confidenceText}>
                {(result.result.confidence * 100).toFixed(0)}%
              </Text>
            </View>

            <View style={styles.recommendations}>
              <Text style={styles.recommendationsTitle}>
                {t('disease.recommendations')}:
              </Text>
              {result.result.recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <Text style={styles.recommendationBullet}>•</Text>
                  <Text style={styles.recommendationText}>{rec}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {result.result.status !== 'healthy' && (() => {
          const sprayInfo = diseaseSprayData[result.cropType]?.[result.result.diseaseName];
          if (!sprayInfo) return null;
          const isNoSpray = sprayInfo.amountPerAcreUr === '—';
          return (
            <Card title="علاج">
              <View style={styles.sprayRow}>
                <Text style={styles.sprayLabel}>دوائی:</Text>
                <Text style={styles.sprayValue}>{sprayInfo.sprayNameUr}</Text>
              </View>
              {!isNoSpray && (
                <View style={styles.sprayRow}>
                  <Text style={styles.sprayLabel}>مقدار:</Text>
                  <Text style={styles.sprayValue}>{sprayInfo.amountPerAcreUr}</Text>
                </View>
              )}
              <View style={styles.sprayRow}>
                <Text style={styles.sprayLabel}>وقت:</Text>
                <Text style={styles.sprayValue}>{sprayInfo.timingUr}</Text>
              </View>
              <View style={styles.sprayRow}>
                <Text style={styles.sprayLabel}>تعدد:</Text>
                <Text style={styles.sprayValue}>{sprayInfo.frequencyUr}</Text>
              </View>
              <View style={styles.sprayCaution}>
                <Text style={styles.sprayCautionText}>{sprayInfo.cautionUr}</Text>
              </View>
              {sprayInfo.altSprayUr && sprayInfo.altSprayUr !== '—' && (
                <View style={styles.sprayAlt}>
                  <Text style={styles.sprayAltText}>{sprayInfo.altSprayUr}</Text>
                </View>
              )}
            </Card>
          );
        })()}

        <Button
          title={t('disease.scanAnother')}
          onPress={handleScanAnother}
          style={styles.button}
        />

        <Button
          title={t('disease.viewHistory')}
          onPress={() => navigation.navigate('Reports')}
          variant="outline"
          style={styles.button}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t('disease.title')}</Text>
      
      <Card>
        <Text style={styles.label}>{t('disease.selectCrop')}</Text>
        <CropSelector
          selectedCrop={selectedCrop}
          onSelectCrop={setSelectedCrop}
          crops={CROP_LIST}
        />
      </Card>

      {imageUri && (
        <Card>
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        </Card>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handleTakePhoto}
        >
          <Text style={styles.imageButtonIcon}>📷</Text>
          <Text style={styles.imageButtonText}>{t('disease.takePicture')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.imageButton}
          onPress={handlePickImage}
        >
          <Text style={styles.imageButtonIcon}>🖼️</Text>
          <Text style={styles.imageButtonText}>{t('disease.uploadPicture')}</Text>
        </TouchableOpacity>
      </View>

      {imageUri && (
        <Button
          title="تجزیہ شروع کریں"
          onPress={handleDetect}
          style={styles.button}
        />
      )}

      <Button
        title={t('disease.viewHistory')}
        onPress={() => navigation.navigate('Reports')}
        variant="outline"
        style={styles.button}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imageButton: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  imageButtonIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  previewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  button: {
    marginTop: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  analyzingText: {
    marginTop: 16,
    fontSize: 18,
    color: COLORS.text,
  },
  resultImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  resultContent: {
    marginTop: 8,
  },
  diseaseInfo: {
    marginTop: 16,
    marginBottom: 16,
  },
  diseaseLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  diseaseName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  confidenceBar: {
    marginBottom: 16,
  },
  confidenceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  confidenceProgress: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  recommendations: {
    marginTop: 16,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  recommendationBullet: {
    fontSize: 16,
    color: COLORS.text,
    marginRight: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  sprayRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    alignItems: 'flex-start',
  },
  sprayLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    width: 55,
  },
  sprayValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  sprayCaution: {
    marginTop: 12,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  sprayCautionText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 20,
    textAlign: 'right',
  },
  sprayAlt: {
    marginTop: 8,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
  },
  sprayAltText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
});

export default DiseaseDetectionScreen;

