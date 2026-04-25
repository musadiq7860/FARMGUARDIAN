import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { COLORS, CROP_LIST, SOIL_COLORS } from '../utils/constants';
import { getSmartAdvisory, getCropCalendar } from '../services/advisoryService';
import { getWeatherForecast, DISTRICT_COORDS } from '../services/weatherService';
import { getData, saveData } from '../utils/storage';
import Card from '../components/Card';
import Picker from '../components/Picker';

const DISTRICT_LIST = Object.entries(DISTRICT_COORDS).map(([id, v]) => ({
  id,
  nameUr: v.nameUr,
  nameEn: id.charAt(0).toUpperCase() + id.slice(1).replace('_', ' '),
}));

// ─── Tab Bar ────────────────────────────────────────────────────────────────

const TabBar = ({ activeTab, onTabChange }) => (
  <View style={styles.tabBar}>
    <TouchableOpacity
      style={[styles.tab, activeTab === 'mashwara' && styles.tabActive]}
      onPress={() => onTabChange('mashwara')}
    >
      <Text style={[styles.tabText, activeTab === 'mashwara' && styles.tabTextActive]}>
        {'\ud83d\udcac'} مشورہ لیں
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.tab, activeTab === 'plan' && styles.tabActive]}
      onPress={() => onTabChange('plan')}
    >
      <Text style={[styles.tabText, activeTab === 'plan' && styles.tabTextActive]}>
        {'\ud83d\udcc5'} فصل کا پلان
      </Text>
    </TouchableOpacity>
  </View>
);

// ─── Picker Field ────────────────────────────────────────────────────────────

const PickerField = ({ label, value, placeholder, onPress, colorDot }) => (
  <TouchableOpacity style={styles.pickerField} onPress={onPress}>
    <Text style={styles.pickerLabel}>{label}</Text>
    <View style={styles.pickerValue}>
      {colorDot ? <View style={[styles.colorDot, { backgroundColor: colorDot }]} /> : null}
      <Text style={value ? styles.pickerValueText : styles.pickerPlaceholder}>
        {value || placeholder || 'منتخب کریں'}
      </Text>
      <Text style={styles.pickerArrow}>{'\u25bc'}</Text>
    </View>
  </TouchableOpacity>
);

// ─── Weather Card ────────────────────────────────────────────────────────────

const WeatherCard = ({ weather, onRefresh, loading }) => {
  const rainDays = weather.days.filter((d) => d.willRain).map((d) => d.dayUr);
  const rainWarning = rainDays.length > 0;

  return (
    <View style={styles.weatherCard}>
      <View style={styles.weatherHeader}>
        <Text style={styles.weatherTitle}>موسم کی صورتحال</Text>
        <TouchableOpacity onPress={onRefresh} disabled={loading}>
          <Text style={styles.refreshBtn}>{loading ? '...' : '\ud83d\udd04'}</Text>
        </TouchableOpacity>
      </View>

      {weather.districtNameUr && (
        <Text style={styles.fallbackNote}>
          📍 {weather.districtNameUr}
        </Text>
      )}

      <View style={styles.weatherDays}>
        {weather.days.map((day, i) => (
          <View key={i} style={styles.weatherDay}>
            <Text style={styles.weatherDayName}>{day.dayUr}</Text>
            <Text style={styles.weatherEmoji}>{day.emoji}</Text>
            <Text style={styles.weatherTemp}>{day.tempMax}°C</Text>
            <Text style={styles.weatherRain}>{day.rainChance}%</Text>
          </View>
        ))}
      </View>

      {rainWarning && (
        <View style={styles.rainWarning}>
          <Text style={styles.rainWarningText}>
            {'\u26a0\ufe0f'} {rainDays.join(' اور ')} بارش متوقع ہے — آج پانی نہ دیں
          </Text>
        </View>
      )}
    </View>
  );
};

// ─── Fertilizer Checklist ────────────────────────────────────────────────────

const FertilizerChecklist = ({ schedule, checkedIds, onToggle }) => (
  <View>
    {(schedule || []).map((item) => {
      const checked = checkedIds.includes(item.id);
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.checkItem, checked && styles.checkItemDone]}
          onPress={() => onToggle(item.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkmark}>{'\u2713'}</Text>}
          </View>
          <View style={styles.checkContent}>
            <Text style={[styles.checkFert, checked && styles.checkFertDone]}>
              {item.fertUr}
            </Text>
            <Text style={styles.checkWeek}>{item.weekUr}</Text>
            <Text style={styles.checkNote}>{'\ud83d\udccc'} {item.noteUr}</Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Week Card ───────────────────────────────────────────────────────────────

const WeekCard = ({ week }) => {
  const [expanded, setExpanded] = useState(false);
  const hasFert = week.fertUr && week.fertUr !== '—' && week.fertUr !== 'کوئی نہیں';

  return (
    <TouchableOpacity
      style={styles.weekCard}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.85}
    >
      <View style={styles.weekHeader}>
        <View style={styles.weekBadge}>
          <Text style={styles.weekBadgeText}>ہفتہ {week.week}</Text>
        </View>
        <Text style={styles.weekTitle}>{week.titleUr}</Text>
        <Text style={styles.weekChevron}>{expanded ? '\u25b2' : '\u25bc'}</Text>
      </View>

      {expanded && (
        <View style={styles.weekBody}>
          <View style={styles.weekSection}>
            <Text style={styles.weekSectionTitle}>کام</Text>
            {week.tasksUr.map((task, i) => (
              <Text key={i} style={styles.weekTask}>{'\u2022'} {task}</Text>
            ))}
          </View>

          <View style={styles.weekInfoRow}>
            <View style={styles.weekInfoItem}>
              <Text style={styles.weekInfoLabel}>پانی</Text>
              <Text style={styles.weekInfoValue}>{week.waterUr}</Text>
            </View>
            <View style={styles.weekInfoItem}>
              <Text style={styles.weekInfoLabel}>کھاد</Text>
              <Text style={[styles.weekInfoValue, hasFert && styles.weekFertHighlight]}>
                {week.fertUr}
              </Text>
            </View>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ─── Main Screen ─────────────────────────────────────────────────────────────

const AdvisoryScreen = () => {
  const { currentLanguage } = useLanguage();

  const [activeTab, setActiveTab] = useState('mashwara');

  const [cropType, setCropType] = useState('');
  const [soilColor, setSoilColor] = useState('');
  const [district, setDistrict] = useState('lahore');
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [advisory, setAdvisory] = useState(null);
  const [checkedFerts, setCheckedFerts] = useState([]);
  const [advisoryLoading, setAdvisoryLoading] = useState(false);

  const [planCrop, setPlanCrop] = useState('');
  const [cropCalendar, setCropCalendar] = useState(null);

  const [showCropPicker, setShowCropPicker] = useState(false);
  const [showSoilPicker, setShowSoilPicker] = useState(false);
  const [showPlanCropPicker, setShowPlanCropPicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);

  const getDisplayName = (id, list) => {
    const item = list.find((i) => i.id === id);
    return item ? (currentLanguage === 'ur' ? item.nameUr : item.nameEn) : '';
  };

  const handleFetchWeather = async (districtId) => {
    try {
      setWeatherLoading(true);
      const result = await getWeatherForecast(districtId || district);
      setWeather(result);
    } catch (err) {
      Alert.alert('خرابی', err.message || 'موسم کی معلومات حاصل نہیں ہو سکیں');
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleGetAdvisory = async () => {
    if (!cropType) {
      Alert.alert('خرابی', 'براہ کرم فصل منتخب کریں');
      return;
    }
    if (!soilColor) {
      Alert.alert('خرابی', 'براہ کرم مٹی کا رنگ منتخب کریں');
      return;
    }
    try {
      setAdvisoryLoading(true);
      const result = getSmartAdvisory(cropType, soilColor);
      if (!result) {
        Alert.alert('خرابی', 'اس فصل کے لیے مشورہ دستیاب نہیں');
        return;
      }
      const saved = (await getData('fert_checks_' + cropType)) || [];
      setCheckedFerts(saved);
      setAdvisory(result);
    } catch (err) {
      Alert.alert('خرابی', 'مشورہ حاصل نہیں ہو سکا');
    } finally {
      setAdvisoryLoading(false);
    }
  };

  const handleToggleFert = async (id) => {
    const updated = checkedFerts.includes(id)
      ? checkedFerts.filter((f) => f !== id)
      : [...checkedFerts, id];
    setCheckedFerts(updated);
    try {
      await saveData('fert_checks_' + cropType, updated);
    } catch (err) {
      // Storage save failed (e.g. device full) — UI state still updated
    }
  };

  const handleResetAdvisory = () => {
    setAdvisory(null);
    setCropType('');
    setSoilColor('');
    setWeather(null);
    setCheckedFerts([]);
  };

  const handleGetPlan = () => {
    if (!planCrop) {
      Alert.alert('خرابی', 'براہ کرم فصل منتخب کریں');
      return;
    }
    const calendar = getCropCalendar(planCrop);
    if (!calendar) {
      Alert.alert('خرابی', 'اس فصل کا پلان دستیاب نہیں');
      return;
    }
    setCropCalendar(calendar);
  };

  const rainToday = weather?.days[0]?.willRain;
  const rainTomorrow = weather?.days[1]?.willRain;
  const skipIrrigation = rainToday || rainTomorrow;

  return (
    <View style={styles.container}>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'mashwara' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.screenTitle}>مشورہ لیں</Text>

          {!advisory ? (
            <Card>
              <PickerField
                label="فصل منتخب کریں"
                value={getDisplayName(cropType, CROP_LIST)}
                placeholder="فصل چنیں"
                onPress={() => setShowCropPicker(true)}
              />
              <PickerField
                label="مٹی کا رنگ"
                value={getDisplayName(soilColor, SOIL_COLORS)}
                placeholder="مٹی کا رنگ چنیں"
                onPress={() => setShowSoilPicker(true)}
                colorDot={soilColor ? SOIL_COLORS.find((s) => s.id === soilColor)?.color : null}
              />
              <PickerField
                label="ضلع"
                value={getDisplayName(district, DISTRICT_LIST)}
                placeholder="ضلع چنیں"
                onPress={() => setShowDistrictPicker(true)}
              />
              <TouchableOpacity
                style={styles.weatherBtn}
                onPress={() => handleFetchWeather(district)}
                disabled={weatherLoading}
              >
                {weatherLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.weatherBtnText}>
                    {weather ? 'موسم تازہ کریں' : 'موسم چیک کریں (اختیاری)'}
                  </Text>
                )}
              </TouchableOpacity>

              {weather && (
                <WeatherCard
                  weather={weather}
                  onRefresh={() => handleFetchWeather(district)}
                  loading={weatherLoading}
                />
              )}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleGetAdvisory}
                disabled={advisoryLoading}
              >
                {advisoryLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>سفارشات حاصل کریں</Text>
                )}
              </TouchableOpacity>
            </Card>
          ) : (
            <>
              {weather && (
                <WeatherCard
                  weather={weather}
                  onRefresh={() => handleFetchWeather(district)}
                  loading={weatherLoading}
                />
              )}

              <Card>
                <Text style={styles.cardTitle}>آبپاشی</Text>
                {skipIrrigation && (
                  <View style={styles.skipWaterBanner}>
                    <Text style={styles.skipWaterText}>
                      {rainToday && rainTomorrow
                        ? '⛔ آج اور کل بارش متوقع ہے — دونوں دن پانی نہ دیں'
                        : rainToday
                        ? '⛔ آج بارش متوقع ہے — آج پانی نہ دیں'
                        : '⚠️ کل بارش متوقع ہے — کل پانی نہ دیں، آج دے سکتے ہیں'}
                    </Text>
                  </View>
                )}
                {!skipIrrigation && (
                  <View style={styles.safeWaterBanner}>
                    <Text style={styles.safeWaterText}>
                      ✅ اگلے 2 دن بارش نہیں — معمول کے مطابق پانی دیں
                    </Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>وقفہ:</Text>
                  <Text style={styles.infoValue}>{advisory.waterSchedule.daysUr}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>مقدار:</Text>
                  <Text style={styles.infoValue}>{advisory.waterSchedule.amountUr}</Text>
                </View>
                <View style={styles.tipsBox}>
                  <Text style={styles.tipItem}>{'\u2022'} صبح سویرے یا شام کو پانی دیں</Text>
                  <Text style={styles.tipItem}>{'\u2022'} پانی کھڑا نہ ہونے دیں</Text>
                  <Text style={styles.tipItem}>{'\u2022'} بارش کے بعد پانی نہ دیں</Text>
                </View>
              </Card>

              <Card>
                <Text style={styles.cardTitle}>کھاد کا شیڈول</Text>
                <Text style={styles.fertSubtitle}>جب کھاد ڈال دیں تو نشان لگائیں</Text>
                <FertilizerChecklist
                  schedule={advisory.fertilizerSchedule}
                  checkedIds={checkedFerts}
                  onToggle={handleToggleFert}
                />
              </Card>

              <Card>
                <Text style={styles.cardTitle}>عمومی ہدایات</Text>
                <View style={styles.tipsBox}>
                  <Text style={styles.tipItem}>{'\u2022'} کھاد ہمیشہ پانی دینے کے بعد ڈالیں</Text>
                  <Text style={styles.tipItem}>{'\u2022'} کھاد ڈالتے وقت دستانے پہنیں</Text>
                  <Text style={styles.tipItem}>{'\u2022'} کھیت میں کیڑوں کا روزانہ معائنہ کریں</Text>
                  <Text style={styles.tipItem}>{'\u2022'} متاثرہ پودے فوری الگ کریں</Text>
                </View>
              </Card>

              <TouchableOpacity style={styles.resetBtn} onPress={handleResetAdvisory}>
                <Text style={styles.resetBtnText}>نئی سفارش لیں</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {activeTab === 'plan' && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.screenTitle}>فصل کا پلان</Text>

          {!cropCalendar ? (
            <Card>
              <PickerField
                label="فصل منتخب کریں"
                value={getDisplayName(planCrop, CROP_LIST)}
                placeholder="فصل چنیں"
                onPress={() => setShowPlanCropPicker(true)}
              />
              <TouchableOpacity style={styles.primaryBtn} onPress={handleGetPlan}>
                <Text style={styles.primaryBtnText}>مکمل پلان دیکھیں</Text>
              </TouchableOpacity>
            </Card>
          ) : (
            <>
              <View style={styles.calendarHeader}>
                <Text style={styles.calendarCropName}>
                  {getDisplayName(planCrop, CROP_LIST)}
                </Text>
                <View style={styles.calendarMeta}>
                  <Text style={styles.calendarMetaItem}>
                    بوائی: {cropCalendar.sowingMonthsUr}
                  </Text>
                  <Text style={styles.calendarMetaItem}>
                    مدت: {cropCalendar.totalWeeks} ہفتے
                  </Text>
                </View>
              </View>

              <Text style={styles.planHint}>کسی بھی ہفتے پر دبائیں تفصیل دیکھنے کے لیے</Text>

              {cropCalendar.weeks.map((week, i) => (
                <WeekCard key={i} week={week} />
              ))}

              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => { setCropCalendar(null); setPlanCrop(''); }}
              >
                <Text style={styles.resetBtnText}>دوسری فصل کا پلان</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      <Picker
        visible={showCropPicker}
        onClose={() => setShowCropPicker(false)}
        title="فصل منتخب کریں"
        items={CROP_LIST}
        selectedValue={cropType}
        onValueChange={(v) => { setCropType(v); setAdvisory(null); }}
        displayKey={currentLanguage === 'ur' ? 'nameUr' : 'nameEn'}
      />
      <Picker
        visible={showSoilPicker}
        onClose={() => setShowSoilPicker(false)}
        title="مٹی کا رنگ منتخب کریں"
        items={SOIL_COLORS}
        selectedValue={soilColor}
        onValueChange={(v) => { setSoilColor(v); setAdvisory(null); }}
        displayKey={currentLanguage === 'ur' ? 'nameUr' : 'nameEn'}
      />
      <Picker
        visible={showPlanCropPicker}
        onClose={() => setShowPlanCropPicker(false)}
        title="فصل منتخب کریں"
        items={CROP_LIST}
        selectedValue={planCrop}
        onValueChange={(v) => { setPlanCrop(v); setCropCalendar(null); }}
        displayKey={currentLanguage === 'ur' ? 'nameUr' : 'nameEn'}
      />
      <Picker
        visible={showDistrictPicker}
        onClose={() => setShowDistrictPicker(false)}
        title="ضلع منتخب کریں"
        items={DISTRICT_LIST}
        selectedValue={district}
        onValueChange={(v) => {
          setDistrict(v);
          setWeather(null);
        }}
        displayKey={currentLanguage === 'ur' ? 'nameUr' : 'nameEn'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
    textAlign: 'right',
  },
  pickerField: {
    marginBottom: 16,
  },
  pickerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'right',
  },
  pickerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    backgroundColor: COLORS.surface,
  },
  pickerValueText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    textAlign: 'right',
  },
  pickerPlaceholder: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  pickerArrow: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weatherBtn: {
    backgroundColor: '#0288D1',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  resetBtn: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  resetBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  weatherCard: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#90CAF9',
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weatherTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0D47A1',
  },
  refreshBtn: {
    fontSize: 18,
  },
  fallbackNote: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  weatherDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  weatherDay: {
    alignItems: 'center',
    flex: 1,
  },
  weatherDayName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 4,
  },
  weatherEmoji: {
    fontSize: 26,
    marginBottom: 4,
  },
  weatherTemp: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  weatherRain: {
    fontSize: 12,
    color: '#1976D2',
    marginTop: 2,
  },
  rainWarning: {
    marginTop: 10,
    backgroundColor: '#FFF9C4',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F9A825',
  },
  rainWarningText: {
    fontSize: 13,
    color: '#E65100',
    textAlign: 'right',
    lineHeight: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  tipsBox: {
    marginTop: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
  },
  tipItem: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'right',
  },
  skipWaterBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  skipWaterText: {
    fontSize: 14,
    color: '#B71C1C',
    fontWeight: '600',
    textAlign: 'right',
  },
  safeWaterBanner: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  safeWaterText: {
    fontSize: 14,
    color: '#1B5E20',
    fontWeight: '600',
    textAlign: 'right',
  },
  fertSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 12,
    textAlign: 'right',
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  checkItemDone: {
    backgroundColor: '#E8F5E9',
    borderColor: '#81C784',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  checkContent: {
    flex: 1,
  },
  checkFert: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    marginBottom: 2,
  },
  checkFertDone: {
    color: '#388E3C',
  },
  checkWeek: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
    marginBottom: 2,
  },
  checkNote: {
    fontSize: 12,
    color: '#795548',
    textAlign: 'right',
  },
  calendarHeader: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  calendarCropName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  calendarMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  calendarMetaItem: {
    fontSize: 12,
    color: '#C8E6C9',
    textAlign: 'center',
  },
  planHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  weekCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  weekBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 10,
  },
  weekBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  weekTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
  },
  weekChevron: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  weekBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  weekSection: {
    marginTop: 12,
    marginBottom: 10,
  },
  weekSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
    textAlign: 'right',
  },
  weekTask: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    textAlign: 'right',
  },
  weekInfoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  weekInfoItem: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
  },
  weekInfoLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 4,
    textAlign: 'right',
  },
  weekInfoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'right',
  },
  weekFertHighlight: {
    color: '#2E7D32',
  },
});

export default AdvisoryScreen;
