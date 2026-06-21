const DEFAULT_OFFICE_META = {
  Bangladesh: {
    timezone: 'Asia/Dhaka',
    currency: 'BDT',
    countryCode: 'BD',
    usdRate: 0.0082,
    krwRate: 11.2,
    shiftLabel: 'Morning',
  },
  'South Korea': {
    timezone: 'Asia/Seoul',
    currency: 'KRW',
    countryCode: 'KR',
    usdRate: 0.00073,
    krwRate: 1,
    shiftLabel: 'Head Office',
  },
  'Sri Lanka': {
    timezone: 'Asia/Colombo',
    currency: 'LKR',
    countryCode: 'LK',
    usdRate: 0.0033,
    krwRate: 4.5,
    shiftLabel: 'Morning',
  },
  Vietnam: {
    timezone: 'Asia/Ho_Chi_Minh',
    currency: 'VND',
    countryCode: 'VN',
    usdRate: 0.000039,
    krwRate: 0.053,
    shiftLabel: 'Morning',
  },
};

export function getOfficeMeta(office = {}) {
  const fallback = DEFAULT_OFFICE_META[office.country] || {
    timezone: 'UTC',
    currency: office.currency_code || 'USD',
    countryCode: 'GLOBAL',
    usdRate: 1,
    krwRate: 1365,
    shiftLabel: 'Local',
  };

  return {
    timezone: office.timezone || fallback.timezone,
    currency: office.currency_code || office.local_currency || fallback.currency,
    countryCode: office.country_code || fallback.countryCode,
    usdRate: Number(office.usd_rate || office.exchange_rate_to_usd || fallback.usdRate || 1),
    krwRate: Number(office.krw_rate || office.exchange_rate_to_krw || fallback.krwRate || 1365),
    shiftLabel: office.shift_label || fallback.shiftLabel,
  };
}

export function formatOfficeLocalTime(office) {
  const meta = getOfficeMeta(office);
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: meta.timezone,
  }).format(new Date());
}

export function convertCurrency(value, rate) {
  return Number(value || 0) * Number(rate || 0);
}

export function summarizeOfficeRevenue(offices = [], rows = [], amountKey = 'amount') {
  const byOffice = new Map();

  offices.forEach((office) => {
    const meta = getOfficeMeta(office);
    byOffice.set(office.id, {
      officeId: office.id,
      officeName: office.name,
      country: office.country,
      currency: meta.currency,
      usdRate: meta.usdRate,
      krwRate: meta.krwRate,
      localTotal: 0,
      usdTotal: 0,
      krwTotal: 0,
    });
  });

  rows.forEach((row) => {
    const bucket = byOffice.get(row.office_id);
    if (!bucket) return;
    const amount = Number(row[amountKey] || 0);
    bucket.localTotal += amount;
    bucket.usdTotal += convertCurrency(amount, bucket.usdRate);
    bucket.krwTotal += convertCurrency(amount, bucket.krwRate);
  });

  return Array.from(byOffice.values());
}

export function applyCurrencyRatesToOffices(offices = [], rates = []) {
  const latestByCurrency = new Map();

  rates.forEach((rate) => {
    const code = rate.source_currency;
    const existing = latestByCurrency.get(code);
    if (!existing || new Date(rate.rate_date) > new Date(existing.rate_date)) {
      latestByCurrency.set(code, rate);
    }
  });

  return offices.map((office) => {
    const meta = getOfficeMeta(office);
    const rate = latestByCurrency.get(meta.currency);
    if (!rate) return office;
    return {
      ...office,
      currency_code: meta.currency,
      usd_rate: Number(rate.usd_rate),
      krw_rate: Number(rate.krw_rate),
    };
  });
}
