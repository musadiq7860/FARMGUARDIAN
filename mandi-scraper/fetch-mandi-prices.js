import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// AMIS ka city label -> hamari DB ka city name + Urdu naam
const CITY_MAP = {
  'Lahore':      { db: 'Lahore',      ur: 'لاہور' },
  'Faisalabad':  { db: 'Faisalabad',  ur: 'فیصل آباد' },
  'Gujranwala':  { db: 'Gujranwala',  ur: 'گوجرانوالہ' },
  'Sargodha':    { db: 'Sargodha',    ur: 'سرگودھا' },
  'Rawalpindi':  { db: 'Rawalpindi',  ur: 'راولپنڈی' },
  'Multan':      { db: 'Multan',      ur: 'ملتان' },
  'BahawalPur':  { db: 'Bahawalpur',  ur: 'بہاولپور' },
  'Sahiwal':     { db: 'Sahiwal',     ur: 'ساہیوال' },
  'Sialkot':     { db: 'Sialkot',     ur: 'سیالکوٹ' },
  'Sheikhupura': { db: 'Sheikhupura', ur: 'شیخوپورہ' }
};

const CROPS = {
  wheat:  { id: 1,  en: 'Wheat',           ur: 'گندم' },
  rice:   { id: 3,  en: 'Rice (Basmati)',  ur: 'باسمتی چاول' },
  maize:  { id: 17, en: 'Maize',           ur: 'مکئی' },
  potato: { id: 22, en: 'Potato',          ur: 'آلو' },
  tomato: { id: 26, en: 'Tomato',          ur: 'ٹماٹر' }
};

const SANITY_MIN = 500;
const SANITY_MAX = 100000;

function parseNum(s) {
  if (!s) return null;
  const t = s.trim();
  if (t === '-' || t === '') return null;
  const n = Number(t.replace(/,/g, ''));
  return Number.isNaN(n) ? null : n; // NaN ko bhi null treat karo
}

async function scrapeCrop(cropId) {
  const url = `http://www.amis.pk/ViewPrices.aspx?searchType=0&commodityId=${cropId}`;
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const results = {}; // AMIS city label -> price40kg

  $('tr').each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length < 6) return;

    const cityLink = $(cells[0]).find('a[href*="searchType=1"]');
    if (cityLink.length === 0) return;

    const cityName = cityLink.text().trim();
    if (!(cityName in CITY_MAP)) return;

    const min = parseNum($(cells[2]).text());
    const max = parseNum($(cells[3]).text());
    const fqp = parseNum($(cells[4]).text());

    const raw100kg = fqp ?? ((min != null && max != null) ? Math.round((min + max) / 2) : null);
    if (raw100kg == null || Number.isNaN(raw100kg)) return; // "-" ya invalid data, skip

    const price40kg = Math.round(raw100kg * 0.4); // Rs/100kg -> Rs/40kg

    if (price40kg < SANITY_MIN || price40kg > SANITY_MAX || Number.isNaN(price40kg)) {
      console.warn(`Skipping suspicious price: ${cityName} = ${price40kg}`);
      return;
    }

    results[cityName] = price40kg;
  });

  return results;
}

async function main() {
  const { data: existing, error: fetchErr } = await supabase
    .from('mandi_prices')
    .select('crop_id, district_en, price_per_40kg');
  if (fetchErr) throw fetchErr;

  const prevMap = new Map(existing.map(r => [`${r.crop_id}|${r.district_en}`, r.price_per_40kg]));
  const rows = [];

  for (const [cropId, crop] of Object.entries(CROPS)) {
    console.log(`Scraping ${crop.en}...`);
    const prices = await scrapeCrop(crop.id);

    for (const [amisCity, newPrice] of Object.entries(prices)) {
      const city = CITY_MAP[amisCity];
      const key = `${cropId}|${city.db}`;
      const oldPrice = prevMap.get(key);
      const changePercent = oldPrice ? Number((((newPrice - oldPrice) / oldPrice) * 100).toFixed(1)) : 0;

      rows.push({
        crop_id: cropId,
        crop_name_en: crop.en,
        crop_name_ur: crop.ur,
        district_en: city.db,
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
