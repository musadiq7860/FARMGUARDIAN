import api from '../utils/api';
import { API_ENDPOINTS } from '../utils/constants';
import cropAdvisoryData from '../data/cropAdvisoryData.json';

const MOCK_MODE = true;

// ─── JSON-driven helpers ───────────────────────────────────────────────────────

/**
 * Returns water schedule + fertilizer checklist for a specific crop + soil type.
 * Used by Smart Mashwara (Mode 1).
 */
export const getSmartAdvisory = (cropType, soilColor) => {
  const cropData = cropAdvisoryData.smartMashwara[cropType];
  if (!cropData) return null;
  const fallbackSoil = 'light_brown';
  return {
    waterSchedule: cropData.waterSchedule[soilColor] || cropData.waterSchedule[fallbackSoil],
    fertilizerSchedule: cropData.fertilizerSchedule,
  };
};

/**
 * Returns the full week-by-week crop calendar for a crop.
 * Used by Crop Plan (Mode 2).
 */
export const getCropCalendar = (cropType) => {
  return cropAdvisoryData.cropCalendar[cropType] || null;
};

const MOCK_IRRIGATION_SCHEDULE = {
  sowing: {
    frequency: 'Every 3-4 days',
    frequencyUr: 'ہر 3-4 دن',
    amount: 'Light watering',
    amountUr: 'ہلکی پانی دینا',
  },
  germination: {
    frequency: 'Every 2-3 days',
    frequencyUr: 'ہر 2-3 دن',
    amount: 'Moderate watering',
    amountUr: 'اوسط پانی دینا',
  },
  vegetative: {
    frequency: 'Every 5-7 days',
    frequencyUr: 'ہر 5-7 دن',
    amount: 'Deep watering',
    amountUr: 'گہرا پانی دینا',
  },
  flowering: {
    frequency: 'Every 4-5 days',
    frequencyUr: 'ہر 4-5 دن',
    amount: 'Regular watering',
    amountUr: 'باقاعدہ پانی دینا',
  },
  fruiting: {
    frequency: 'Every 3-4 days',
    frequencyUr: 'ہر 3-4 دن',
    amount: 'Consistent watering',
    amountUr: 'مسلسل پانی دینا',
  },
  maturity: {
    frequency: 'Every 7-10 days',
    frequencyUr: 'ہر 7-10 دن',
    amount: 'Reduced watering',
    amountUr: 'کم پانی دینا',
  },
  harvest: {
    frequency: 'Stop irrigation',
    frequencyUr: 'پانی بند کریں',
    amount: 'No watering',
    amountUr: 'پانی نہ دیں',
  },
};

const MOCK_FERTILIZER_RECOMMENDATIONS = {
  dark_brown: {
    npk: '20-20-20',
    amount: '50 kg per acre',
    amountUr: '50 کلو فی ایکڑ',
    timing: 'Apply in 2-3 split doses',
    timingUr: '2-3 حصوں میں ڈالیں',
  },
  light_brown: {
    npk: '25-25-15',
    amount: '60 kg per acre',
    amountUr: '60 کلو فی ایکڑ',
    timing: 'Apply in 2-3 split doses',
    timingUr: '2-3 حصوں میں ڈالیں',
  },
  red: {
    npk: '20-30-10',
    amount: '55 kg per acre',
    amountUr: '55 کلو فی ایکڑ',
    timing: 'Apply in 2 split doses',
    timingUr: '2 حصوں میں ڈالیں',
  },
  black: {
    npk: '15-20-20',
    amount: '45 kg per acre',
    amountUr: '45 کلو فی ایکڑ',
    timing: 'Apply in 2 split doses',
    timingUr: '2 حصوں میں ڈالیں',
  },
  gray: {
    npk: '25-25-20',
    amount: '65 kg per acre',
    amountUr: '65 کلو فی ایکڑ',
    timing: 'Apply in 3 split doses',
    timingUr: '3 حصوں میں ڈالیں',
  },
};

// Get advisory recommendations
export const getAdvisoryRecommendations = async (advisoryData) => {
  try {
    const { cropType, cropStage, soilColor, location } = advisoryData;
    
    if (MOCK_MODE) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const irrigation = MOCK_IRRIGATION_SCHEDULE[cropStage] || MOCK_IRRIGATION_SCHEDULE.vegetative;
      const fertilizer = MOCK_FERTILIZER_RECOMMENDATIONS[soilColor] || MOCK_FERTILIZER_RECOMMENDATIONS.light_brown;
      
      return {
        irrigation: {
          frequency: irrigation.frequency,
          frequencyUr: irrigation.frequencyUr,
          amount: irrigation.amount,
          amountUr: irrigation.amountUr,
          tips: [
            'Water early morning or evening',
            'Avoid waterlogging',
            'Check soil moisture before watering',
          ],
          tipsUr: [
            'صبح سویرے یا شام کو پانی دیں',
            'پانی کے جمع ہونے سے بچیں',
            'پانی دینے سے پہلے مٹی کی نمی چیک کریں',
          ],
        },
        fertilizer: {
          npk: fertilizer.npk,
          amount: fertilizer.amount,
          amountUr: fertilizer.amountUr,
          timing: fertilizer.timing,
          timingUr: fertilizer.timingUr,
          tips: [
            'Apply after irrigation or rain',
            'Mix well with soil',
            'Use protective gloves',
          ],
          tipsUr: [
            'پانی یا بارش کے بعد ڈالیں',
            'مٹی کے ساتھ اچھی طرح ملائیں',
            'حفاظتی دستانے استعمال کریں',
          ],
        },
        pestControl: {
          preventive: [
            'Regular field inspection',
            'Remove infected plants',
            'Maintain field hygiene',
          ],
          preventiveUr: [
            'کھیت کا باقاعدہ معائنہ',
            'متاثرہ پودے ہٹائیں',
            'کھیت کی صفائی برقرار رکھیں',
          ],
        },
        generalTips: [
          'Monitor weather forecasts regularly',
          'Keep records of farming activities',
          'Join local farmer groups for knowledge sharing',
          'Use quality seeds from reliable sources',
        ],
        generalTipsUr: [
          'موسم کی پیشن گوئی باقاعدگی سے دیکھیں',
          'کاشتکاری سرگرمیوں کا ریکارڈ رکھیں',
          'علم کے تبادلے کے لیے مقامی کسان گروپس میں شامل ہوں',
          'قابل اعتماد ذرائع سے معیاری بیج استعمال کریں',
        ],
      };
    }
    
    const response = await api.post(API_ENDPOINTS.ADVISORY.GET_RECOMMENDATIONS, advisoryData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

