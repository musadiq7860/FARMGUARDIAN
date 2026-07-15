import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const CITIES = {
  Lahore:      { id: 1,  ur: 'لاہور' },
  Faisalabad:  { id: 2,  ur: 'فیصل آباد' },
  Gujranwala:  { id: 3,  ur: 'گوجرانوالہ' },
  Sargodha:    { id: 5,  ur: 'سرگودھا' },
  Rawalpindi:  { id: 6,  ur: 'راولپنڈی' },
  Multan:      { id: 7,  ur: 'ملتان' },
  Bahawalpur:  { id: 20, ur: 'بہاولپور' },
  Sahiwal:     { id: 13, ur: 'ساہیوال' },
  Sialkot:     { id: 57, ur: 'سیالکوٹ' },
  Sheikhupura: { id: 78, ur: 'شیخوپورہ' }
};

const CROPS = {
  wheat:  { id: 1,  en: 'Wheat',          ur: 'گندم' },
  rice:   { id: 3,  en: 'Rice (Basmati)', ur: 'باسمتی چاول' },
  maize:  { id: 17, en: 'Maize',          ur: 'مکئی' },
  potato: { id: 21, en: 'Potato',         ur: 'آلو' },
  tomato: { id: 26, en: 'Tomato',         ur: 'ٹماٹر' }
};

// sanity range for a converted 40kg price — agar isse bahar aaye to skip/flag karo
const SANITY_MIN = 500;
const SANITY_MAX = 100000;

async function scrapeCity(cityId) {
  const url = `http://www.amis.pk/ViewPrices.aspx?searchType=1&commodityId=${cityId}`;
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  const lines = $('body').text().split('\n').map(l => l.trim()).filter(Boolean);

  const results = {};
  for (const [cropId, crop] of Object.entries(CROPS)) {
    const match = lines.find(l => l.includes(`commodityId=${crop.id}&`) && l.includes('Graph'));
    if (!match) continue;
    const numbers = (match.match(/-?\d[\d,]*/g) || []).map(n => n === '-' ? null : Number(n.replace(/,/g, '')));
    const [min, max, avg] = numbers;
    if (min == null && max == null) continue;

    // AMIS gives Rs/100kg — convert to Rs/40kg
    const raw100kg = avg ?? Math.round(((min ?? 0) + (max ?? 0)) / 2);
    const price40kg = Math.round(raw100kg * 0.4);

    if (price40kg < SANITY_MIN || price40kg > SANITY_MAX) {
      console.warn(`Skipping suspicious price: ${cropId} @ city ${cityId} = ${price40kg}`);
      continue;
    }

    results[cropId] = price40kg;
  }
  return results;
}

async function main() {
  const { data: existing, error: fetchErr } = await supabase
    .from('mandi_prices')
    .select('crop_id, district_en, price_per_40kg');
  if (fetchErr) throw fetchErr;

  const prevMap = new Map(existing.map(r => [`${r.crop_id}|${r.district_en}`, r.price_per_40kg]));
  const rows = [];

  for (const [cityName, city] of Object.entries(CITIES)) {
    console.log(`Scraping ${cityName}...`);
    const prices = await scrapeCity(city.id);

    for (const [cropId, newPrice] of Object.entries(prices)) {
      const crop = CROPS[cropId];
      const key = `${cropId}|${cityName}`;
      const oldPrice = prevMap.get(key);
      const changePercent = oldPrice ? Number((((newPrice - oldPrice) / oldPrice) * 100).toFixed(1)) : 0;

      rows.push({
        crop_id: cropId,
        crop_name_en: crop.en,
        crop_name_ur: crop.ur,
        district_en: cityName,
        district_ur: city.ur,
        price_per_40kg: newPrice,
        change_percent: changePercent,
        updated_at: new Date().toISOString()
      });
    }
    await new Promise(r => setTimeout(r, 1500)); // rate-limit safety
  }

  if (rows.length === 0) { console.log('No data scraped.'); return; }

  const { error } = await supabase
    .from('mandi_prices')
    .upsert(rows, { onConflict: 'crop_id,district_en' });

  if (error) { console.error(error); process.exit(1); }
  console.log(`Updated ${rows.length} rows.`);
}

main();
