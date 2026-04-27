const OPENWEATHER_API_KEY = 'e0cb2cb35fa34d3f2cf317599343f978';
const OPENWEATHER_FORECAST_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// Punjab district coordinates — no GPS needed
export const DISTRICT_COORDS = {
  lahore:        { lat: 31.5497, lon: 74.3436, nameUr: 'لاہور' },
  faisalabad:    { lat: 31.4180, lon: 73.0791, nameUr: 'فیصل آباد' },
  multan:        { lat: 30.1978, lon: 71.4711, nameUr: 'ملتان' },
  rawalpindi:    { lat: 33.5651, lon: 73.0169, nameUr: 'راولپنڈی' },
  gujranwala:    { lat: 32.1877, lon: 74.1945, nameUr: 'گوجرانوالہ' },
  sialkot:       { lat: 32.4945, lon: 74.5229, nameUr: 'سیالکوٹ' },
  bahawalpur:    { lat: 29.3956, lon: 71.6836, nameUr: 'بہاولپور' },
  sargodha:      { lat: 32.0836, lon: 72.6711, nameUr: 'سرگودھا' },
  sheikhupura:   { lat: 31.7167, lon: 73.9850, nameUr: 'شیخوپورہ' },
  jhang:         { lat: 31.2681, lon: 72.3181, nameUr: 'جھنگ' },
  rahim_yar_khan:{ lat: 28.4212, lon: 70.2957, nameUr: 'رحیم یار خان' },
  sahiwal:       { lat: 30.6682, lon: 73.1066, nameUr: 'ساہیوال' },
};

const getDescriptionUr = (id, description) => {
  if (id >= 200 && id < 300) return { descUr: 'طوفان', emoji: '⛈️' };
  if (id >= 300 && id < 400) return { descUr: 'بوندا باندی', emoji: '🌦️' };
  if (id >= 500 && id < 600) {
    if (id === 500) return { descUr: 'ہلکی بارش', emoji: '🌧️' };
    if (id === 501) return { descUr: 'معتدل بارش', emoji: '🌧️' };
    return { descUr: 'گھنی بارش', emoji: '🌧️' };
  }
  if (id >= 600 && id < 700) return { descUr: 'برف باری', emoji: '🌨️' };
  if (id >= 700 && id < 800) return { descUr: 'دھند', emoji: '🌫️' };
  if (id === 800) return { descUr: 'صاف آسمان', emoji: '☀️' };
  if (id === 801) return { descUr: 'تھوڑے بادل', emoji: '🌤️' };
  if (id === 802) return { descUr: 'جزوی ابر آلود', emoji: '⛅' };
  if (id >= 803) return { descUr: 'ابر آلود', emoji: '☁️' };
  return { descUr: description || 'معلوم نہیں', emoji: '🌡️' };
};

/**
 * Fetches 3-day weather forecast for a Punjab district.
 * No GPS / no permissions — uses fixed district coordinates.
 * @param {string} districtId  - key from DISTRICT_COORDS (default: 'lahore')
 */
export const getWeatherForecast = async (districtId = 'lahore') => {
  const coords = DISTRICT_COORDS[districtId] || DISTRICT_COORDS.lahore;

  if (!OPENWEATHER_API_KEY) {
    // Return mock weather so the Advisory screen works without an API key
    return getMockWeather(coords, districtId);
  }

  const url =
    `${OPENWEATHER_FORECAST_URL}?lat=${coords.lat}&lon=${coords.lon}` +
    `&appid=${OPENWEATHER_API_KEY}&units=metric&cnt=24`;

  let data;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('bad response');
    data = await response.json();
  } catch (_) {
    throw new Error('موسم کی معلومات حاصل نہیں ہو سکیں — انٹرنیٹ چیک کریں');
  }

  const byDate = {};
  for (const item of data.list) {
    const date = item.dt_txt.split(' ')[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(item);
  }

  const DAY_NAMES_UR = ['آج', 'کل', 'پرسوں'];
  const sortedDates = Object.keys(byDate).sort().slice(0, 3);

  const days = sortedDates.map((date, i) => {
    const slots = byDate[date];
    const rep = slots.find(s => s.dt_txt.includes('12:00:00')) || slots[0];
    const id = rep.weather[0].id;
    const { descUr, emoji } = getDescriptionUr(id, rep.weather[0].description);
    const tempMax = Math.round(Math.max(...slots.map(s => s.main.temp_max)));
    const rainChance = Math.round(Math.max(...slots.map(s => s.pop ?? 0)) * 100);
    return {
      date,
      dayUr: DAY_NAMES_UR[i] || date,
      tempMax,
      rainChance,
      descUr,
      emoji,
      willRain: rainChance >= 50,
    };
  });

  return { days, districtNameUr: coords.nameUr };
};

const getMockWeather = (coords, districtId) => {
  const DAY_NAMES_UR = ['آج', 'کل', 'پرسوں'];
  const days = [
    { date: '2026-04-27', dayUr: DAY_NAMES_UR[0], tempMax: 36, rainChance: 10, descUr: 'صاف آسمان', emoji: '☀️', willRain: false },
    { date: '2026-04-28', dayUr: DAY_NAMES_UR[1], tempMax: 34, rainChance: 20, descUr: 'تھوڑے بادل', emoji: '🌤️', willRain: false },
    { date: '2026-04-29', dayUr: DAY_NAMES_UR[2], tempMax: 30, rainChance: 60, descUr: 'ہلکی بارش', emoji: '🌧️', willRain: true },
  ];
  return { days, districtNameUr: coords.nameUr, isMock: true };
};
