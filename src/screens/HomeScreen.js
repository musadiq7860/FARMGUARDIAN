import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, CROP_LIST } from '../utils/constants';
import { getDiseaseHistory, getYieldHistory } from '../utils/storage';
import Card from '../components/Card';
import HealthStatusBadge from '../components/HealthStatusBadge';
import BrandLogo from '../components/BrandLogo';
import { formatDate } from '../utils/helpers';

const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { t, currentLanguage } = useLanguage();
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadRecentActivity();
  }, []);

  const getCropName = (cropId) => {
    const crop = CROP_LIST.find(c => c.id === cropId);
    if (!crop) return cropId;
    return currentLanguage === 'ur' ? crop.nameUr : crop.nameEn;
  };

  const loadRecentActivity = async () => {
    try {
      const diseaseHistory = await getDiseaseHistory();
      const yieldHistory = await getYieldHistory();
      
      const combined = [
        ...diseaseHistory.slice(0, 3).map(item => ({ ...item, type: 'disease' })),
        ...yieldHistory.slice(0, 3).map(item => ({ ...item, type: 'yield' })),
      ];
      
      combined.sort((a, b) => new Date(b.detectionDate || b.predictionDate) - new Date(a.detectionDate || a.predictionDate));
      setRecentActivity(combined.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const quickActions = [
    {
      id: 'disease',
      title: t('home.detectDisease'),
      icon: '🔬',
      color: COLORS.healthy,
      onPress: () => navigation.navigate('DiseaseDetection'),
    },
    {
      id: 'yield',
      title: t('home.predictYield'),
      icon: '📊',
      color: COLORS.secondary,
      onPress: () => navigation.navigate('YieldPrediction'),
    },
    {
      id: 'advisory',
      title: t('home.soilAdvisory'),
      icon: '💡',
      color: COLORS.primary,
      onPress: () => navigation.navigate('Advisory'),
    },
    {
      id: 'map',
      title: t('home.viewMap'),
      icon: '🗺️',
      color: COLORS.warning,
      onPress: () => navigation.navigate('Map'),
    },
  ];

  return (
    <View style={styles.container}>
    <View style={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{t('home.greeting')}</Text>
          <Text style={styles.userName}>{user?.name || user?.displayName || t('home.defaultFarmerName')}</Text>
        </View>
        <View style={styles.headerLogoWrap}>
          <BrandLogo variant="shield" size="small" style={styles.headerLogo} />
        </View>
      </View>

      <View style={styles.quickActionsContainer}>
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        <View style={styles.quickActions}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[styles.actionCard, { borderLeftColor: action.color }]}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.actionIcon}>{action.icon}</Text>
              <Text style={styles.actionTitle}>{action.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.activityContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('home.recentActivity')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Reports')}>
            <Text style={styles.seeAll}>{t('common.seeAllArrow')}</Text>
          </TouchableOpacity>
        </View>

        {recentActivity.length === 0 ? (
          <Card>
            <Text style={styles.noActivity}>{t('home.noActivity')}</Text>
          </Card>
        ) : (
          recentActivity.map((item, index) => (
            <Card key={index}>
              {item.type === 'disease' ? (
                <View>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityType}>🔬 {t('home.activityDisease')}</Text>
                    <Text style={styles.activityDate}>
                      {formatDate(item.detectionDate)}
                    </Text>
                  </View>
                  <Text style={styles.activityCrop}>{getCropName(item.cropType)}</Text>
                  <HealthStatusBadge status={item.result.status} />
                </View>
              ) : (
                <View>
                  <View style={styles.activityHeader}>
                    <Text style={styles.activityType}>📊 {t('home.activityYield')}</Text>
                    <Text style={styles.activityDate}>
                      {formatDate(item.predictionDate)}
                    </Text>
                  </View>
                  <Text style={styles.activityCrop}>{getCropName(item.cropType)}</Text>
                  <Text style={styles.yieldText}>
                    {item.predictedYield} {item.unit} {t('yield.perAcre')}
                  </Text>
                </View>
              )}
            </Card>
          ))
        )}
      </View>
    </View>
    </View>
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
  header: {
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLogoWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    marginBottom: 0,
  },
  greeting: {
    fontSize: 20,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  activityContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  noActivity: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    fontSize: 16,
    padding: 20,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityType: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  activityDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  activityCrop: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 8,
  },
  yieldText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default HomeScreen;

