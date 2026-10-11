/* ==========================================================================
   Tender · Currency Desk — app logic
   No dependencies. Rates: fawazahmed0/exchange-api (primary, 200+ incl. crypto
   & metals) and Frankfurter/ECB (long history for majors).
   ========================================================================== */
'use strict';

(() => {
  /* ------------------------------------------------------------------
   * Helpers
   * ------------------------------------------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const PREFIX = 'tender.v1.';
  const store = {
    get(k, d) {
      try { const v = localStorage.getItem(PREFIX + k); return v == null ? d : JSON.parse(v); } catch { return d; }
    },
    set(k, v) { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch { /* storage full / blocked */ } },
    clear() {
      try { Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
    },
  };

  // Dates (all in UTC "YYYY-MM-DD")
  const iso = (d) => d.toISOString().slice(0, 10);
  const parseISO = (s) => new Date(s + 'T00:00:00Z');
  const addDays = (s, n) => { const d = parseISO(s); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
  const todayISO = () => iso(new Date());
  const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 864e5);

  const ICON = {
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5"/></svg>',
    grip: '<svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    redo: '<svg viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.34 5.66M20 4v7h-7"/></svg>',
  };

  /* ------------------------------------------------------------------
   * Currency catalogue — CODE|Name|flag country|symbol
   * ------------------------------------------------------------------ */
  const FIAT_SRC = `AED|UAE Dirham|ae|د.إ
AFN|Afghan Afghani|af|؋
ALL|Albanian Lek|al|L
AMD|Armenian Dram|am|֏
ANG|Netherlands Antillean Guilder|cw|ƒ
AOA|Angolan Kwanza|ao|Kz
ARS|Argentine Peso|ar|$
AUD|Australian Dollar|au|A$
AWG|Aruban Florin|aw|ƒ
AZN|Azerbaijani Manat|az|₼
BAM|Bosnia-Herzegovina Mark|ba|KM
BBD|Barbadian Dollar|bb|Bds$
BDT|Bangladeshi Taka|bd|৳
BGN|Bulgarian Lev|bg|лв
BHD|Bahraini Dinar|bh|BD
BIF|Burundian Franc|bi|FBu
BMD|Bermudian Dollar|bm|$
BND|Brunei Dollar|bn|B$
BOB|Bolivian Boliviano|bo|Bs
BRL|Brazilian Real|br|R$
BSD|Bahamian Dollar|bs|B$
BTN|Bhutanese Ngultrum|bt|Nu
BWP|Botswana Pula|bw|P
BYN|Belarusian Ruble|by|Br
BZD|Belize Dollar|bz|BZ$
CAD|Canadian Dollar|ca|C$
CDF|Congolese Franc|cd|FC
CHF|Swiss Franc|ch|CHF
CLP|Chilean Peso|cl|$
CNY|Chinese Yuan|cn|¥
COP|Colombian Peso|co|$
CRC|Costa Rican Colón|cr|₡
CUP|Cuban Peso|cu|$
CVE|Cape Verdean Escudo|cv|Esc
CZK|Czech Koruna|cz|Kč
DJF|Djiboutian Franc|dj|Fdj
DKK|Danish Krone|dk|kr
DOP|Dominican Peso|do|RD$
DZD|Algerian Dinar|dz|DA
EGP|Egyptian Pound|eg|E£
ERN|Eritrean Nakfa|er|Nfk
ETB|Ethiopian Birr|et|Br
EUR|Euro|eu|€
FJD|Fijian Dollar|fj|FJ$
FKP|Falkland Islands Pound|fk|£
GBP|British Pound|gb|£
GEL|Georgian Lari|ge|₾
GHS|Ghanaian Cedi|gh|₵
GIP|Gibraltar Pound|gi|£
GMD|Gambian Dalasi|gm|D
GNF|Guinean Franc|gn|FG
GTQ|Guatemalan Quetzal|gt|Q
GYD|Guyanese Dollar|gy|G$
HKD|Hong Kong Dollar|hk|HK$
HNL|Honduran Lempira|hn|L
HTG|Haitian Gourde|ht|G
HUF|Hungarian Forint|hu|Ft
IDR|Indonesian Rupiah|id|Rp
ILS|Israeli New Shekel|il|₪
INR|Indian Rupee|in|₹
IQD|Iraqi Dinar|iq|ع.د
IRR|Iranian Rial|ir|﷼
ISK|Icelandic Króna|is|kr
JMD|Jamaican Dollar|jm|J$
JOD|Jordanian Dinar|jo|JD
JPY|Japanese Yen|jp|¥
KES|Kenyan Shilling|ke|KSh
KGS|Kyrgyzstani Som|kg|с
KHR|Cambodian Riel|kh|៛
KMF|Comorian Franc|km|CF
KPW|North Korean Won|kp|₩
KRW|South Korean Won|kr|₩
KWD|Kuwaiti Dinar|kw|KD
KYD|Cayman Islands Dollar|ky|CI$
KZT|Kazakhstani Tenge|kz|₸
LAK|Lao Kip|la|₭
LBP|Lebanese Pound|lb|L£
LKR|Sri Lankan Rupee|lk|Rs
LRD|Liberian Dollar|lr|L$
LSL|Lesotho Loti|ls|L
LYD|Libyan Dinar|ly|LD
MAD|Moroccan Dirham|ma|DH
MDL|Moldovan Leu|md|L
MGA|Malagasy Ariary|mg|Ar
MKD|Macedonian Denar|mk|ден
MMK|Myanmar Kyat|mm|K
MNT|Mongolian Tögrög|mn|₮
MOP|Macanese Pataca|mo|MOP$
MRU|Mauritanian Ouguiya|mr|UM
MUR|Mauritian Rupee|mu|₨
MVR|Maldivian Rufiyaa|mv|Rf
MWK|Malawian Kwacha|mw|MK
MXN|Mexican Peso|mx|Mex$
MYR|Malaysian Ringgit|my|RM
MZN|Mozambican Metical|mz|MT
NAD|Namibian Dollar|na|N$
NGN|Nigerian Naira|ng|₦
NIO|Nicaraguan Córdoba|ni|C$
NOK|Norwegian Krone|no|kr
NPR|Nepalese Rupee|np|रू
NZD|New Zealand Dollar|nz|NZ$
OMR|Omani Rial|om|OR
PAB|Panamanian Balboa|pa|B/.
PEN|Peruvian Sol|pe|S/
PGK|Papua New Guinean Kina|pg|K
PHP|Philippine Peso|ph|₱
PKR|Pakistani Rupee|pk|Rs
PLN|Polish Złoty|pl|zł
PYG|Paraguayan Guaraní|py|₲
QAR|Qatari Riyal|qa|QR
RON|Romanian Leu|ro|lei
RSD|Serbian Dinar|rs|дин
RUB|Russian Ruble|ru|₽
RWF|Rwandan Franc|rw|FRw
SAR|Saudi Riyal|sa|SR
SBD|Solomon Islands Dollar|sb|SI$
SCR|Seychellois Rupee|sc|SR
SDG|Sudanese Pound|sd|SDG
SEK|Swedish Krona|se|kr
SGD|Singapore Dollar|sg|S$
SHP|Saint Helena Pound|sh|£
SLE|Sierra Leonean Leone|sl|Le
SOS|Somali Shilling|so|Sh
SRD|Surinamese Dollar|sr|$
SSP|South Sudanese Pound|ss|SS£
STN|São Tomé & Príncipe Dobra|st|Db
SYP|Syrian Pound|sy|£S
SZL|Eswatini Lilangeni|sz|E
THB|Thai Baht|th|฿
TJS|Tajikistani Somoni|tj|SM
TMT|Turkmenistani Manat|tm|m
TND|Tunisian Dinar|tn|DT
TOP|Tongan Paʻanga|to|T$
TRY|Turkish Lira|tr|₺
TTD|Trinidad & Tobago Dollar|tt|TT$
TWD|New Taiwan Dollar|tw|NT$
TZS|Tanzanian Shilling|tz|TSh
UAH|Ukrainian Hryvnia|ua|₴
UGX|Ugandan Shilling|ug|USh
USD|US Dollar|us|$
UYU|Uruguayan Peso|uy|$U
UZS|Uzbekistani Som|uz|soʻm
VES|Venezuelan Bolívar|ve|Bs.S
VND|Vietnamese Đồng|vn|₫
VUV|Vanuatu Vatu|vu|VT
WST|Samoan Tālā|ws|WS$
XAF|Central African CFA Franc|cm|FCFA
XCD|East Caribbean Dollar|ag|EC$
XOF|West African CFA Franc|sn|CFA
XPF|CFP Franc|pf|₣
YER|Yemeni Rial|ye|﷼
ZAR|South African Rand|za|R
ZMW|Zambian Kwacha|zm|ZK`;

  const CRYPTO_SRC = `BTC|Bitcoin||₿
ETH|Ethereum||Ξ
USDT|Tether||₮
USDC|USD Coin||$
BNB|BNB||B
SOL|Solana||◎
XRP|XRP||✕
ADA|Cardano||₳
DOGE|Dogecoin||Ð
TRX|TRON||T
TON|Toncoin||◆
DOT|Polkadot||●
LTC|Litecoin||Ł
BCH|Bitcoin Cash||Ƀ
LINK|Chainlink||⬡
AVAX|Avalanche||A
XLM|Stellar||*
XMR|Monero||ɱ
ATOM|Cosmos||⚛
SHIB|Shiba Inu||S
DAI|Dai||◈`;

  const METAL_SRC = `XAU|Gold · troy ounce||Au
XAG|Silver · troy ounce||Ag
XPT|Platinum · troy ounce||Pt
XPD|Palladium · troy ounce||Pd`;

  const parseList = (src, type) => src.split('\n').map((l) => {
    const [code, name, cc, sym] = l.split('|');
    return { code, name, cc: cc || '', sym: sym || code, type };
  });
  const CATALOGUE = [...parseList(FIAT_SRC, 'fiat'), ...parseList(CRYPTO_SRC, 'crypto'), ...parseList(METAL_SRC, 'metal')];
  const META = Object.fromEntries(CATALOGUE.map((c) => [c.code, c]));
  const meta = (code) => META[code] || { code, name: code, cc: '', sym: code, type: 'fiat' };

  // Country names for search (“japan” → JPY). Uses Intl when available.
  let regionNames = null;
  try { regionNames = new Intl.DisplayNames(['en'], { type: 'region' }); } catch { /* old browser */ }
  CATALOGUE.forEach((c) => {
    let country = '';
    if (c.cc && c.cc !== 'eu' && regionNames) { try { country = regionNames.of(c.cc.toUpperCase()) || ''; } catch { /* ignore */ } }
    if (c.code === 'EUR') country = 'Eurozone Europe Germany France Italy Spain Netherlands';
    if (c.code === 'XOF') country = 'Senegal Ivory Coast Mali Burkina Faso Benin Niger Togo';
    if (c.code === 'XAF') country = 'Cameroon Gabon Chad Congo';
    if (c.code === 'XCD') country = 'Antigua Grenada Dominica Saint Lucia';
    c.country = country;
    c.search = `${c.code} ${c.name} ${country} ${c.sym}`.toLowerCase();
  });

  const EUROZONE = new Set('at be hr cy ee fi fr de gr ie it lv lt lu mt nl pt sk si es'.split(' '));
  const FRANKFURTER = new Set('AUD BGN BRL CAD CHF CNY CZK DKK EUR GBP HKD HUF IDR ILS INR ISK JPY KRW MXN MYR NOK NZD PHP PLN RON SEK SGD THB TRY USD ZAR'.split(' '));
  const FAWAZ_EARLIEST = '2024-03-02';
  const FRANK_EARLIEST = '1999-01-04';

  // Last-resort sample (units per 1 USD). Only used if we have never been online.
  // Last-resort sample (units per 1 USD), mid-October 2026. Only used if we have never been online.
  const SAMPLE_RATES = {
    USD: 1, EUR: 0.8927, GBP: 0.7554, JPY: 158.29, INR: 96.62, NPR: 154.68, CAD: 1.426, AUD: 1.4318, CHF: 0.8305,
    CNY: 6.6927, SGD: 1.2801, AED: 3.6727, HKD: 7.8481, NZD: 1.7818, MXN: 18.414, ZAR: 16.514, KRW: 1340.44,
    THB: 33.539, PHP: 62.739, PLN: 3.9175, TRY: 49.282, NGN: 1329.47, UAH: 44.923, XAF: 585.54,
    BTC: 0.0000120650, ETH: 0.000399629, USDT: 1.001, SOL: 0.0091066, XRP: 0.71556, ADA: 4.0399, DOGE: 11.6918,
  };

  /* ------------------------------------------------------------------
   * State
   * ------------------------------------------------------------------ */
  const DEFAULT_SETTINGS = { theme: 'system', locale: 'auto', precision: 'auto', refresh: 60000, source: 'realtime', crypto: true, flap: true };

  const guessHomeCurrency = () => {
    try {
      const langs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en-US'];
      for (const l of langs) {
        const region = (l.split('-')[1] || '').toLowerCase();
        if (!region) continue;
        if (EUROZONE.has(region)) return 'EUR';
        const hit = CATALOGUE.find((c) => c.type === 'fiat' && c.cc === region);
        if (hit) return hit.code;
      }
    } catch { /* ignore */ }
    return 'USD';
  };

  const LOCALES = ['auto', 'en-US', 'en-IN', 'de-DE', 'fr-FR', 'de-CH'];
  const PRECISIONS = ['auto', '0', '1', '2', '3', '4', '6', '8'];
  const REFRESHES = [0, 30000, 60000, 300000, 900000, 3600000];
  const RANGES = [7, 30, 90, 182, 365, 1826];
  const TABS = ['compare', 'cheat', 'pairs', 'history', 'tally', 'alerts'];
  function sanitizeSettings(raw) {
    const s = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) };
    if (!['system', 'light', 'dark'].includes(s.theme)) s.theme = 'system';
    if (!LOCALES.includes(s.locale)) s.locale = 'auto';
    s.precision = String(s.precision); if (!PRECISIONS.includes(s.precision)) s.precision = 'auto';
    // settings saved before real-time existed → turn on minute updates once
    if (raw && typeof raw === 'object' && !('source' in raw)) s.refresh = 60000;
    s.refresh = +s.refresh; if (!REFRESHES.includes(s.refresh)) s.refresh = 60000;
    if (!['realtime', 'daily'].includes(s.source)) s.source = 'realtime';
    s.crypto = s.crypto !== false; s.flap = s.flap !== false;
    return s;
  }
  const arrOf = (v, d) => (Array.isArray(v) ? v : d);
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  function sanitizeTally(t) {
    const o = t && typeof t === 'object' ? t : {};
    const items = (Array.isArray(o.items) ? o.items : [])
      .filter((i) => i && typeof i.code === 'string' && META[i.code] && typeof i.a === 'number' && Number.isFinite(i.a) && i.a >= 0)
      .slice(0, 300)
      .map((i) => ({ id: typeof i.id === 'string' ? i.id.slice(0, 20) : uid(), a: i.a, code: i.code, note: typeof i.note === 'string' ? i.note.slice(0, 40) : '' }));
    const tip = +o.tip;
    return { items, tip: Number.isFinite(tip) && tip >= 0 ? Math.min(tip, 100) : 0, code: typeof o.code === 'string' && META[o.code] ? o.code : null };
  }

  const home = guessHomeCurrency();
  const state = {
    from: store.get('from', 'USD'),
    to: store.get('to', home === 'USD' ? 'EUR' : home),
    lastEdited: 'from',
    settings: sanitizeSettings(store.get('settings', {})),
    rates: null,          // { CODE: units per USD }
    prevRates: null,      // previous day, for 24h change
    ratesDate: null,      // date the rates are for
    fetchedAt: 0,
    source: 'loading',    // live | cache | sample | loading
    histDate: '',         // when set, converter uses historical rates
    histRates: null,
    histActualDate: '',
    starred: arrOf(store.get('starred', ['USD', 'EUR', 'GBP', 'NPR', 'BTC']), ['USD', 'EUR', 'GBP', 'NPR', 'BTC']),
    recent: arrOf(store.get('recent', []), []),
    compare: arrOf(store.get('compare', ['EUR', 'GBP', 'JPY', 'INR', 'NPR', 'AUD', 'CAD', 'CHF', 'CNY', 'BTC']), ['EUR', 'GBP', 'JPY', 'INR', 'NPR', 'AUD', 'CAD', 'CHF', 'CNY', 'BTC']),
    pairs: arrOf(store.get('pairs', []), []),
    history: arrOf(store.get('history', []), []),
    alerts: arrOf(store.get('alerts', []), []),
    custom: store.get('custom', {}),
    fees: { margin: 0, flat: 0, ...store.get('fees', {}) },
    range: RANGES.includes(store.get('range', 30)) ? store.get('range', 30) : 30,
    tally: sanitizeTally(store.get('tally', null)),
    tab: TABS.includes(store.get('tab', 'compare')) ? store.get('tab', 'compare') : 'compare',
    serial: store.get('serial', 1),
  };
  if (!META[state.from]) state.from = 'USD';
  if (!META[state.to]) state.to = 'EUR';

  // Deep-link: ?from=USD&to=NPR&amount=250
  const urlParams = new URLSearchParams(location.search);
  const qp = (k) => (urlParams.get(k) || '').toUpperCase();
  if (META[qp('from')]) state.from = qp('from');
  if (META[qp('to')]) state.to = qp('to');
  const initialAmount = urlParams.get('amount') || urlParams.get('amt') || store.get('amount', '100');

  const save = {
    pair() { store.set('from', state.from); store.set('to', state.to); },
    settings() { store.set('settings', state.settings); },
  };

  /* ------------------------------------------------------------------
   * DOM refs
   * ------------------------------------------------------------------ */
  const el = {
    root: document.documentElement,
    status: $('#status'), statusText: $('#statusText'), refreshBtn: $('#refreshBtn'),
    themeBtn: $('#themeBtn'), helpBtn: $('#helpBtn'), settingsBtn: $('#settingsBtn'),
    fromBtn: $('#fromBtn'), toBtn: $('#toBtn'), fromAmount: $('#fromAmount'), toAmount: $('#toAmount'),
    fromPreview: $('#fromPreview'), toPreview: $('#toPreview'), flap: $('#flap'), words: $('#words'),
    swapBtn: $('#swapBtn'), rateStrip: $('#rateStrip'), chips: $('#quickChips'), serial: $('#serial'), modeBadge: $('#modeBadge'),
    copyBtn: $('#copyBtn'), shareBtn: $('#shareBtn'), favPairBtn: $('#favPairBtn'), speakBtn: $('#speakBtn'), voiceBtn: $('#voiceBtn'),
    feeMargin: $('#feeMargin'), feeFlat: $('#feeFlat'), feeFlatCode: $('#feeFlatCode'), feeOut: $('#feeOut'), feesMeta: $('#feesMeta'), feePresets: $('#feePresets'),
    customToggle: $('#customToggle'), customRate: $('#customRate'), customRateLabel: $('#customRateLabel'), customRateCode: $('#customRateCode'),
    customHint: $('#customHint'), customMeta: $('#customMeta'), customLabel: $('#customLabel'),
    histDate: $('#histDate'), histClear: $('#histClear'), dateMeta: $('#dateMeta'), dateHint: $('#dateHint'), datePresets: $('#datePresets'),
    chartTitle: $('#chartTitle'), chartRate: $('#chartRate'), chartDelta: $('#chartDelta'), rangeSeg: $('#rangeSeg'),
    chartBox: $('#chartBox'), canvas: $('#chart'), chartTip: $('#chartTip'), chartState: $('#chartState'), chartNote: $('#chartNote'),
    stOpen: $('#stOpen'), stHigh: $('#stHigh'), stLow: $('#stLow'), stAvg: $('#stAvg'), stVol: $('#stVol'),
    tabs: $('#tabs'), compareList: $('#compareList'), compareLead: $('#compareLead'), addCompareBtn: $('#addCompareBtn'),
    cheat: $('#cheat'), printBtn: $('#printBtn'), pairsList: $('#pairsList'), historyList: $('#historyList'),
    exportHistoryBtn: $('#exportHistoryBtn'), clearHistoryBtn: $('#clearHistoryBtn'),
    alertForm: $('#alertForm'), alertPair: $('#alertPair'), alertCond: $('#alertCond'), alertValue: $('#alertValue'), alertList: $('#alertList'), notifyBtn: $('#notifyBtn'),
    cntCompare: $('#cntCompare'), cntPairs: $('#cntPairs'), cntHistory: $('#cntHistory'), cntAlerts: $('#cntAlerts'),
    picker: $('#picker'), pickerTitle: $('#pickerTitle'), pickerSearch: $('#pickerSearch'), pickerList: $('#pickerList'), pickerFilters: $('#pickerFilters'),
    settings: $('#settings'), help: $('#help'), themeSeg: $('#themeSeg'),
    setLocale: $('#setLocale'), setPrecision: $('#setPrecision'), setRefresh: $('#setRefresh'), setCrypto: $('#setCrypto'), setMotion: $('#setMotion'),
    exportDataBtn: $('#exportDataBtn'), importData: $('#importData'), resetBtn: $('#resetBtn'),
    toasts: $('#toasts'),
    setSource: $('#setSource'), sourceHint: $('#sourceHint'), installBtn: $('#installBtn'), fileModeNote: $('#fileModeNote'),
    tallyAddBtn: $('#tallyAddBtn'), cntTally: $('#cntTally'), tallyForm: $('#tallyForm'), tallyCcy: $('#tallyCcy'),
    tallyAmount: $('#tallyAmount'), tallyNote: $('#tallyNote'), tallySubmit: $('#tallySubmit'), tallyCancel: $('#tallyCancel'),
    tallyErr: $('#tallyErr'), tallyList: $('#tallyList'), tallyTip: $('#tallyTip'), tipPresets: $('#tipPresets'),
    tallySum: $('#tallySum'), tallyLead: $('#tallyLead'), tallyCopyBtn: $('#tallyCopyBtn'), tallyClearBtn: $('#tallyClearBtn'),
  };

  /* ------------------------------------------------------------------
   * Number formatting & parsing
   * ------------------------------------------------------------------ */
  const fmtCache = new Map();
  let localeInfo = null;

  function resolveLocale() {
    const wanted = state.settings.locale === 'auto' ? (navigator.language || 'en-US') : state.settings.locale;
    let tag = 'en-US';
    try {
      const nf = new Intl.NumberFormat(wanted, { numberingSystem: 'latn' });
      const parts = nf.formatToParts(1234567.5);
      const dec = (parts.find((p) => p.type === 'decimal') || {}).value;
      // Only accept locales whose decimal mark we can parse back reliably.
      if (dec === '.' || dec === ',') tag = nf.resolvedOptions().locale;
    } catch { /* fall back */ }
    const parts = new Intl.NumberFormat(tag, { numberingSystem: 'latn' }).formatToParts(1234567.5);
    localeInfo = {
      tag,
      decimal: (parts.find((p) => p.type === 'decimal') || { value: '.' }).value,
      group: (parts.find((p) => p.type === 'group') || { value: ',' }).value,
    };
    fmtCache.clear();
  }

  function nf(min, max, grouping = true) {
    const key = `${min}|${max}|${grouping}`;
    let f = fmtCache.get(key);
    if (!f) {
      f = new Intl.NumberFormat(localeInfo.tag, {
        numberingSystem: 'latn', minimumFractionDigits: min, maximumFractionDigits: max, useGrouping: grouping,
      });
      fmtCache.set(key, f);
    }
    return f;
  }

  const minorCache = {};
  function minorUnits(code) {
    if (code in minorCache) return minorCache[code];
    const m = meta(code);
    let d = 2;
    if (m.type === 'fiat') {
      try { d = new Intl.NumberFormat('en', { style: 'currency', currency: code }).resolvedOptions().maximumFractionDigits; } catch { d = 2; }
    } else d = m.type === 'metal' ? 4 : 8;
    return (minorCache[code] = d);
  }

  /** Decimal places to show for a value in a currency. */
  function digitsFor(value, code) {
    if (state.settings.precision !== 'auto') { const p = +state.settings.precision; return { min: p, max: p }; }
    const m = meta(code);
    const abs = Math.abs(value);
    const sig = abs > 0 && abs < 1 ? clamp(Math.ceil(-Math.log10(abs)) + 3, 2, 10) : 0;
    if (m.type === 'fiat') {
      const mu = minorUnits(code);
      return { min: mu, max: Math.max(mu, sig) };
    }
    const max = abs >= 1000 ? 2 : abs >= 1 ? 4 : Math.max(4, sig);
    return { min: 0, max: Math.min(max, 10) };
  }

  function fmtMoney(value, code, grouping = true) {
    if (!isNum(value)) return '—';
    const { min, max } = digitsFor(value, code);
    return nf(min, max, grouping).format(value);
  }

  function fmtRate(r) {
    if (!isNum(r)) return '—';
    const abs = Math.abs(r);
    if (abs >= 100000) return nf(0, 2).format(r);
    if (abs === 0) return '0';
    const key = 'sig6';
    let f = fmtCache.get(key);
    if (!f) { f = new Intl.NumberFormat(localeInfo.tag, { numberingSystem: 'latn', maximumSignificantDigits: 6 }); fmtCache.set(key, f); }
    return f.format(r);
  }

  const fmtPct = (p, d = 2) => (isNum(p) ? `${p > 0 ? '+' : p < 0 ? '−' : ''}${nf(d, d).format(Math.abs(p))}%` : '—');
  const fmtCompact = (v) => {
    try { return new Intl.NumberFormat(localeInfo.tag, { numberingSystem: 'latn', notation: 'compact', maximumFractionDigits: 2 }).format(v); } catch { return String(v); }
  };

  /** Normalise one numeric token like "1,234.50" / "1.234,50" / "1 234,5" into a JS number string. */
  function normalizeNumber(tok) {
    const s = tok.replace(/['’\s  ]/g, '');
    const hasDot = s.includes('.');
    const hasComma = s.includes(',');
    if (hasDot && hasComma) {
      const lastDot = s.lastIndexOf('.'); const lastComma = s.lastIndexOf(',');
      const decimal = lastDot > lastComma ? '.' : ',';
      const group = decimal === '.' ? ',' : '.';
      return s.split(group).join('').replace(decimal, '.');
    }
    const sep = hasDot ? '.' : hasComma ? ',' : '';
    if (!sep) return s;
    const pieces = s.split(sep);
    if (pieces.length > 2) {
      // several identical separators → grouping (1,234,567 or 1.234.567)
      // allows 1,234,567 and Indian 12,34,567 (2-digit middle groups, 3-digit last group)
      const last = pieces.length - 1;
      return pieces.every((p, i) => (i === 0 ? p.length >= 1 && p.length <= 3 : i === last ? p.length === 3 : p.length === 2 || p.length === 3))
        ? pieces.join('') : NaN;
    }
    // single separator: grouping only if it IS the locale group mark and exactly 3 digits follow
    if (sep === localeInfo.group && pieces[1].length === 3 && pieces[0].length > 0) return pieces.join('');
    return `${pieces[0] || '0'}.${pieces[1]}`;
  }

  /**
   * Safe calculator: + - * / x × ÷ ^ ( ) % and k/m/b suffixes.
   * "80 + 15%" → 92 (percent of the left operand).
   * Returns { value, expr, error }.
   */
  function evaluate(input) {
    let src = String(input ?? '')
      .replace(/\p{Sc}/gu, '')                                      // currency symbols
      .replace(/\b[a-zA-Z]{3,4}\b/g, (w) => (META[w.toUpperCase()] ? '' : w)) // ISO codes like "USD" or "usd"
      .replace(/[−–—]/g, '-').replace(/[×✕]/g, '*').replace(/÷/g, '/')
      .trim();
    if (!src) return { value: NaN, empty: true };
    // In numbers, spaces may be thousand separators ("1 234,5") — join digit runs separated by single spaces.
    src = src.replace(/(\d)[\s  ](?=\d{3}\b)/g, '$1');
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      const ch = src[i];
      if (/\s/.test(ch)) { i++; continue; }
      const num = /^(?:\d[\d.,'’]*|[.,]\d+)/.exec(src.slice(i));
      if (num) {
        // trailing separators ("12." while typing) are ignored
        const raw = num[0].replace(/[.,'’]+$/, '');
        const n = normalizeNumber(raw);
        let v = typeof n === 'string' && /^\d*\.?\d+$|^\d+\.?$/.test(n) ? parseFloat(n) : NaN;
        if (!isNum(v)) return { value: NaN, error: 'Unreadable number' };
        i += num[0].length;
        const suf = /^[kKmMbB](?![a-wyzA-WYZ])/.exec(src.slice(i));
        if (suf) {
          v *= { k: 1e3, m: 1e6, b: 1e9 }[suf[0].toLowerCase()];
          tokens.push({ t: 'n', v, suffixed: true });
          i++;
        } else tokens.push({ t: 'n', v });
        continue;
      }
      if ('+-*/^()%xX'.includes(ch)) { tokens.push({ t: ch === 'x' || ch === 'X' ? '*' : ch }); i++; continue; }
      return { value: NaN, error: `Unexpected “${ch}”` };
    }

    let p = 0;
    const peek = () => tokens[p] && tokens[p].t;
    const fail = (m) => { throw new Error(m); };

    function parseExpr() {
      let left = parseTerm();
      while (peek() === '+' || peek() === '-') {
        const op = tokens[p++].t;
        const right = parseTerm();
        const rv = right.pct ? left.v * right.v : right.v;
        left = { v: op === '+' ? left.v + rv : left.v - rv };
      }
      return left;
    }
    function parseTerm() {
      let left = parseFactor();
      while (peek() === '*' || peek() === '/' || peek() === '(' || peek() === 'n') {
        let op = '*';
        if (peek() === '*' || peek() === '/') op = tokens[p++].t;
        else if (peek() === 'n') fail('Missing operator');
        const right = parseFactor();
        if (op === '/') { if (right.v === 0) fail('Division by zero'); left = { v: left.v / right.v }; }
        else left = { v: left.v * right.v };
      }
      return left;
    }
    function parseFactor() {
      const base = parseUnary();
      if (peek() === '^') { p++; const exp = parseFactor(); return { v: Math.pow(base.v, exp.v) }; }
      return base;
    }
    function parseUnary() {
      if (peek() === '-') { p++; const u = parseUnary(); return { v: -u.v, pct: u.pct }; }
      if (peek() === '+') { p++; return parseUnary(); }
      return parsePostfix();
    }
    function parsePostfix() {
      let r = parsePrimary();
      while (peek() === '%') { p++; r = { v: r.v / 100, pct: true }; }
      return r;
    }
    function parsePrimary() {
      const tk = tokens[p];
      if (!tk) fail('Incomplete expression');
      if (tk.t === 'n') { p++; return { v: tk.v }; }
      if (tk.t === '(') {
        p++;
        const r = parseExpr();
        if (peek() !== ')') { if (p >= tokens.length) return r; fail('Missing “)”'); } // allow unclosed while typing
        p++;
        return r;
      }
      fail(`Unexpected “${tk.t}”`);
    }

    try {
      const r = parseExpr();
      if (p < tokens.length) fail(`Unexpected “${tokens[p].t}”`);
      const v = r.v;
      if (!isNum(v)) return { value: NaN, error: 'Result too large' };
      const expr = tokens.length > 1 || tokens.some((t) => t.suffixed);
      return { value: v, expr };
    } catch (e) {
      return { value: NaN, error: e.message };
    }
  }

  /** Plain, editable representation of a value for an input (no grouping). */
  function toInputString(v, code) {
    if (!isNum(v)) return '';
    const saved = state.settings.precision;
    state.settings.precision = 'auto';          // inputs keep full precision, whatever the display setting
    const { max } = digitsFor(v, code);
    state.settings.precision = saved;
    return nf(0, max, false).format(v);
  }

  /* ------------------------------------------------------------------
   * Amount → words (English)
   * ------------------------------------------------------------------ */
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const SCALES = ['', 'thousand', 'million', 'billion', 'trillion'];
  function under1000(n) {
    const h = Math.floor(n / 100), r = n % 100, out = [];
    if (h) out.push(`${ONES[h]} hundred`);
    if (r) out.push(r < 20 ? ONES[r] : TENS[Math.floor(r / 10)] + (r % 10 ? '-' + ONES[r % 10] : ''));
    return out.join(' ');
  }
  function intToWords(n) {
    if (n === 0) return 'zero';
    const parts = [];
    let i = 0;
    while (n > 0 && i < SCALES.length) {
      const chunk = n % 1000;
      if (chunk) parts.unshift(under1000(chunk) + (SCALES[i] ? ' ' + SCALES[i] : ''));
      n = Math.floor(n / 1000); i++;
    }
    return parts.join(' ');
  }
  function amountInWords(value, code) {
    if (!isNum(value) || value < 0 || value >= 1e15) return '';
    const m = meta(code);
    const mu = m.type === 'fiat' ? minorUnits(code) : 0;
    let whole = Math.floor(value);
    let frac = '';
    if (mu > 0) {
      const scale = 10 ** mu;
      let cents = Math.round((value - whole) * scale);
      if (cents >= scale) { whole += 1; cents = 0; }
      if (cents) frac = ` and ${String(cents).padStart(mu, '0')}/${scale}`;
    } else if (m.type !== 'fiat') {
      const s = fmtMoney(value, code, false);
      const dec = s.split(/[.,]/)[1];
      if (dec && +dec) frac = ' point ' + dec.split('').map((d) => ONES[+d]).join(' ');
    } else {
      whole = Math.round(value);
    }
    return `${intToWords(whole)}${frac} · ${m.name}`;
  }

  /* ------------------------------------------------------------------
   * Network
   * ------------------------------------------------------------------ */
  async function fetchJSON(url, timeout = 9000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeout);
    try {
      const res = await fetch(url, { signal: ctrl.signal, cache: 'no-cache' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally { clearTimeout(t); }
  }
  async function firstOk(urls, timeout) {
    let lastErr;
    for (const u of urls) {
      try { return await fetchJSON(u, timeout); } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error('All sources failed');
  }
  const upperMap = (obj) => {
    const out = {};
    for (const [k, v] of Object.entries(obj || {})) if (isNum(v) && v > 0) out[k.toUpperCase()] = v;
    out.USD = 1;
    return out;
  };

  const fawazUrls = (tag) => [
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${tag}/v1/currencies/usd.min.json`,
    `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${tag}/v1/currencies/usd.json`,
    `https://${tag}.currency-api.pages.dev/v1/currencies/usd.json`,
  ];

  async function fetchLatest() {
    const data = await firstOk(fawazUrls('latest'));
    if (!data || !data.usd) throw new Error('Bad payload');
    return { rates: upperMap(data.usd), date: data.date || todayISO() };
  }

  // Dated snapshot cache (shared by chart, 24h change and historical mode).
  const datedCache = new Map();
  function fetchDated(date) {
    if (datedCache.has(date)) return datedCache.get(date);
    const pr = firstOk(fawazUrls(date), 8000).then((d) => {
      if (!d || !d.usd) throw new Error('Bad payload');
      return { rates: upperMap(d.usd), date: d.date || date };
    });
    datedCache.set(date, pr);
    pr.catch(() => datedCache.delete(date));
    return pr;
  }

  const frankBases = ['https://api.frankfurter.dev/v1', 'https://api.frankfurter.app'];
  async function frank(path) { return firstOk(frankBases.map((b) => b + path), 10000); }

  /* ------------------------------------------------------------------
   * Rates
   * ------------------------------------------------------------------ */
  const marketMap = () => state.rates || {};
  const activeMap = () => (state.histDate && state.histRates ? state.histRates : marketMap());
  const pairKey = (a, b) => `${a}>${b}`;

  function rateFrom(map, a, b) {
    if (a === b) return 1;
    const ra = map[a], rb = map[b];
    return isNum(ra) && isNum(rb) && ra > 0 ? rb / ra : NaN;
  }
  function customRate(a, b) {
    const c = state.custom[pairKey(a, b)];
    return c && c.on && isNum(c.rate) && c.rate > 0 ? c.rate : null;
  }
  /** Rate used for converting (custom > historical > market). */
  function rate(a = state.from, b = state.to) {
    if (!state.histDate) { const c = customRate(a, b); if (c) return c; }
    return rateFrom(activeMap(), a, b);
  }
  const marketRate = (a, b) => rateFrom(marketMap(), a, b);
  function change24h(a, b) {
    if (!state.prevRates) return NaN;
    const now = marketRate(a, b), prev = rateFrom(state.prevRates, a, b);
    return isNum(now) && isNum(prev) && prev > 0 ? (now / prev - 1) * 100 : NaN;
  }
  const available = (code) => !state.rates || isNum(marketMap()[code]);

  /* Real-time layer: Coinbase's public exchange-rates feed (no key). It covers ~160 fiat
   * currencies + crypto and moves through the day. It is laid over the daily set, and each
   * value is sanity-checked against it, because a few crypto tickers share a code with a
   * national currency (e.g. MNT) — a value that disagrees wildly is ignored. */
  const REALTIME_URL = 'https://api.coinbase.com/v2/exchange-rates?currency=USD';
  const AMBIGUOUS = new Set(['MNT']);
  const DAILY_MAX_AGE = 3600e3; // the daily set only changes once a day — re-check hourly
  async function fetchRealtime() {
    const d = await fetchJSON(REALTIME_URL, 8000);
    const raw = d && d.data && d.data.rates;
    if (!raw || typeof raw !== 'object') throw new Error('Bad payload');
    const out = {};
    for (const [k, v] of Object.entries(raw)) {
      const n = parseFloat(v);
      if (META[k] && isNum(n) && n > 0) out[k] = n;
    }
    if (Object.keys(out).length < 20) throw new Error('Too few rates');
    out.USD = 1;
    return out;
  }
  function mergeRates(daily, rt) {
    const out = { ...(daily || {}) };
    let used = 0;
    for (const [code, v] of Object.entries(rt || {})) {
      if (code === 'USD') continue;
      const base = daily && daily[code];
      if (isNum(base)) {
        const tol = meta(code).type === 'crypto' ? 0.5 : 0.15;
        if (Math.abs(v / base - 1) > tol) continue;     // ticker collision or bad tick → keep daily
      } else if (AMBIGUOUS.has(code)) continue;          // can't verify → don't risk it
      out[code] = v; used++;
    }
    out.USD = 1;
    return { rates: out, used };
  }
  function persistRates() {
    store.set('rates', { rates: state.rates, date: state.ratesDate, fetchedAt: state.fetchedAt, prev: state.prevRates, daily: state.daily, source: state.source });
  }

  let refreshing = false;
  async function loadRates({ manual = false, forceChart = false } = {}) {
    if (refreshing) return;
    refreshing = true;
    el.refreshBtn.classList.add('spinning');
    if (!state.rates) setStatus('loading');
    const prevMarket = state.rates;
    const prevDate = state.ratesDate;
    try {
      let daily = state.daily;
      if (!daily || manual || !(Date.now() - daily.at <= DAILY_MAX_AGE)) {
        try { const r = await fetchLatest(); daily = { rates: r.rates, date: r.date, at: Date.now() }; } catch { /* real-time may still work */ }
      }
      let rt = null;
      if (state.settings.source === 'realtime') { try { rt = await fetchRealtime(); } catch { rt = null; } }
      if (!daily && !rt) throw new Error('No rate source reachable');
      const { rates, used } = mergeRates(daily && daily.rates, rt);
      const date = daily ? daily.date : todayISO();
      const changed = !prevMarket || JSON.stringify(rates) !== JSON.stringify(prevMarket);
      state.daily = daily;
      state.rates = rates; state.ratesDate = date; state.fetchedAt = Date.now();
      state.source = rt && used ? 'realtime' : 'live';
      state.rtUsed = rt ? used : 0;
      persistRates();
      if (prevDate !== date || !state.prevRates) {
        // Yesterday for 24h change (non-blocking)
        fetchDated(addDays(date, -1)).then((p) => {
          state.prevRates = p.rates; persistRates(); renderRates({ animate: false });
        }).catch(() => { /* change pills just stay hidden */ });
      }
      if (manual) {
        if (state.settings.source === 'realtime' && !rt) toast('Real-time feed unreachable — showing daily rates', 'error');
        else toast(changed ? 'Rates updated' : 'Already up to date', 'ok');
      }
      if (changed) renderRates();
      if (prevDate !== date || forceChart) loadChart();
      else if (changed) refreshChartTail();
      checkAlerts();
    } catch (err) {
      if (!state.rates) {
        state.rates = { ...SAMPLE_RATES }; state.ratesDate = null; state.source = 'sample';
        renderRates(); loadChart();
      } else {
        if (forceChart) loadChart();
      }
      if ((state.source === 'live' || state.source === 'realtime') && Date.now() - state.fetchedAt > 15 * 60e3) state.source = 'cache';
      if (manual || state.source === 'sample') toast(navigator.onLine ? 'Couldn’t reach the rate service' : 'You’re offline — using saved rates', 'error');
    } finally {
      refreshing = false;
      el.refreshBtn.classList.remove('spinning');
      setStatus();
    }
  }

  function bootFromCache() {
    const c = store.get('rates', null);
    if (c && c.rates && c.rates.USD) {
      state.rates = c.rates; state.ratesDate = c.date; state.fetchedAt = c.fetchedAt || 0; state.prevRates = c.prev || null;
      state.daily = c.daily && c.daily.rates && isNum(c.daily.at) ? c.daily : null;
      state.source = 'cache';
    }
  }

  function relTime(ts) {
    const s = Math.round((Date.now() - ts) / 1000);
    if (s < 10) return 'just now';
    if (s < 60) return `${s}s ago`;
    const m = Math.round(s / 60);
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} h ago`;
    return `${Math.round(h / 24)} d ago`;
  }
  const fmtDate = (s, opts = { day: 'numeric', month: 'short', year: 'numeric' }) => {
    if (!s) return '';
    try { return new Intl.DateTimeFormat(localeInfo.tag, { ...opts, timeZone: 'UTC' }).format(parseISO(s)); } catch { return s; }
  };

  function setStatus(force) {
    let st = force || state.source;
    if (!navigator.onLine && st !== 'loading') st = state.rates && state.source !== 'sample' ? 'offline' : 'sample';
    el.status.dataset.state = st;
    const dataDate = state.ratesDate ? ` · ${fmtDate(state.ratesDate, { day: 'numeric', month: 'short' })}` : '';
    const txt = {
      loading: 'Fetching rates…',
      realtime: `Real-time · updated ${relTime(state.fetchedAt)}`,
      live: `Daily rates${dataDate} · checked ${relTime(state.fetchedAt)}`,
      cache: `Saved rates · ${state.fetchedAt ? relTime(state.fetchedAt) : ''}${dataDate}`,
      offline: `Offline · saved rates${dataDate}`,
      sample: 'Offline · approximate sample rates',
    }[st];
    el.statusText.textContent = txt;
    el.status.title = state.fetchedAt
      ? `Fetched ${new Date(state.fetchedAt).toLocaleString()}${st === 'realtime' ? ` · ${state.rtUsed} currencies real-time (Coinbase), the rest from the daily reference set` : ''}`
      : '';
  }

  /* ------------------------------------------------------------------
   * Conversion core
   * ------------------------------------------------------------------ */
  let fromValue = NaN; // canonical numbers driving everything
  let toValue = NaN;

  function showPreview(node, res, input) {
    node.classList.toggle('err', !!res.error);
    input.classList.toggle('invalid', !!res.error);
    input.setAttribute('aria-invalid', res.error ? 'true' : 'false');
    if (res.error) node.textContent = res.error;
    else if (res.expr && isNum(res.value)) node.textContent = `= ${nf(0, 8).format(res.value)}`;
    else node.textContent = '';
  }

  function evalAmount(str) {
    const res = evaluate(str);
    if (isNum(res.value) && res.value < 0) return { value: NaN, error: 'Amount can’t be negative' };
    return res;
  }

  function recompute({ animate = true } = {}) {
    const r = rate();
    if (state.lastEdited === 'from') {
      const res = evalAmount(el.fromAmount.value);
      showPreview(el.fromPreview, res, el.fromAmount);
      el.toPreview.textContent = ''; el.toAmount.classList.remove('invalid');
      fromValue = res.value;
      toValue = isNum(fromValue) && isNum(r) ? fromValue * r : NaN;
      if (document.activeElement !== el.toAmount) el.toAmount.value = isNum(toValue) ? toInputString(toValue, state.to) : '';
    } else {
      const res = evalAmount(el.toAmount.value);
      showPreview(el.toPreview, res, el.toAmount);
      el.fromPreview.textContent = ''; el.fromAmount.classList.remove('invalid');
      toValue = res.value;
      fromValue = isNum(toValue) && isNum(r) && r > 0 ? toValue / r : NaN;
      if (document.activeElement !== el.fromAmount) el.fromAmount.value = isNum(fromValue) ? toInputString(fromValue, state.from) : '';
    }
    renderFlap(animate);
    el.words.textContent = isNum(toValue) && toValue >= 0 ? amountInWords(toValue, state.to) : '';
    $$('button', el.chips).forEach((b) => b.classList.toggle('on', isNum(fromValue) && +b.dataset.amt === fromValue));
    renderCompare(); renderFees(); renderCheat();
    queueHistory(); queueUrl();
    store.set('amount', state.lastEdited === 'from' ? el.fromAmount.value : toInputString(fromValue, state.from));
  }

  let lastFlap = '';
  function renderFlap(animate) {
    let str;
    if (!isNum(rate())) str = 'N/A';
    else if (!isNum(toValue)) str = '0';
    else str = fmtMoney(toValue, state.to);
    if (str.length > 22) str = fmtCompact(toValue);
    const chars = Array.from(str);
    el.flap.style.setProperty('--n', Math.max(chars.length, 6));
    const prev = Array.from(lastFlap);
    const doFlip = animate && state.settings.flap;
    // right-aligned diff so digits that didn't change stay still
    const offset = prev.length - chars.length;
    el.flap.innerHTML = chars.map((c, i) => {
      const isDigit = /[0-9A-Z]/i.test(c);
      const changed = prev[i + offset] !== c;
      const cls = ['t', isDigit ? '' : 'p', doFlip && changed ? 'flip' : '', !isNum(toValue) && isDigit ? 'dim' : ''].filter(Boolean).join(' ');
      return `<span class="${cls}" style="animation-delay:${(i * 28)}ms">${c === ' ' || c === ' ' || c === ' ' ? '&nbsp;' : esc(c)}</span>`;
    }).join('');
    lastFlap = str;
    el.flap.setAttribute('aria-label', str);
    el.toAmount.closest('.to-wrap').style.setProperty('--flap-h', `${el.flap.offsetHeight || 56}px`);
  }

  function renderCcyBtn(btn, code) {
    const m = meta(code);
    btn.innerHTML = `${flagHTML(code)}<span class="meta"><span class="code">${esc(code)}</span><span class="name">${esc(m.name)}</span></span>${ICON.chev}`;
    btn.setAttribute('aria-label', `${btn.dataset.side === 'from' ? 'From' : 'To'} currency: ${m.name} (${code}). Change`);
  }

  function flagHTML(code, size = '') {
    const m = meta(code);
    if (m.cc) return `<span class="flag ${size}"><img src="https://flagcdn.com/w80/${m.cc}.png" alt="" loading="lazy" decoding="async" data-code="${esc(code)}"></span>`;
    return `<span class="flag glyph ${m.type} ${code.toLowerCase()} ${size}">${esc(m.sym)}</span>`;
  }
  // Graceful flag fallback (offline / blocked CDN) → monogram.
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img && img.tagName === 'IMG' && img.parentElement && img.parentElement.classList.contains('flag')) {
      const span = img.parentElement;
      span.textContent = (img.dataset.code || '').slice(0, 3);
    }
  }, true);

  function renderRateStrip() {
    const { from, to } = state;
    const r = rate();
    const parts = [];
    if (!isNum(r)) {
      parts.push(`<span>Rate unavailable for <b>${from} → ${to}</b>${state.histDate ? ' on this date' : ''}</span>`);
    } else {
      parts.push(`<span>1 ${from} = <b>${fmtRate(r)}</b> ${to}</span>`, '<i class="sep"></i>', `<span>1 ${to} = <b>${fmtRate(1 / r)}</b> ${from}</span>`);
      if (customRate(from, to) && !state.histDate) {
        const mr = marketRate(from, to);
        parts.push('<i class="sep"></i>', `<span class="pill accent">Custom · ${fmtPct((r / mr - 1) * 100)} vs market</span>`);
      } else if (state.histDate) {
        parts.push('<i class="sep"></i>', `<span class="pill accent">${fmtDate(state.histActualDate || state.histDate)}</span>`);
      } else {
        const ch = change24h(from, to);
        if (isNum(ch)) parts.push('<i class="sep"></i>', changePill(ch, '24h'));
        const rtNow = state.source === 'realtime' && state.daily && isNum(state.daily.rates[from]) && isNum(state.daily.rates[to])
          ? marketRate(from, to) !== rateFrom(state.daily.rates, from, to) : state.source === 'realtime';
        const label = state.source === 'sample' ? 'Sample rate'
          : rtNow ? `Real-time mid-market · ${new Date(state.fetchedAt).toLocaleTimeString(localeInfo.tag, { hour: '2-digit', minute: '2-digit' })}`
            : `Mid-market${state.ratesDate ? ' · ' + fmtDate(state.ratesDate) : ''}`;
        parts.push('<i class="sep"></i>', `<span class="muted">${label}</span>`);
      }
    }
    el.rateStrip.innerHTML = parts.join('');
  }

  function changePill(ch, label = '') {
    const cls = Math.abs(ch) < 0.005 ? 'flat' : ch > 0 ? 'up' : 'down';
    const arrow = cls === 'flat' ? '•' : ch > 0 ? '▲' : '▼';
    return `<span class="pill ${cls}" title="${label ? label + ' change' : 'change'}">${arrow} ${fmtPct(ch)}${label ? ' <span style="opacity:.7">' + label + '</span>' : ''}</span>`;
  }

  /** Full refresh of everything depending on pair / rates. */
  function renderRates({ animate = true } = {}) {
    renderCcyBtn(el.fromBtn, state.from);
    renderCcyBtn(el.toBtn, state.to);
    el.feeFlatCode.textContent = state.from;
    renderRateStrip();
    renderFavBtn();
    renderCustom();
    renderModeBadge();
    renderChartHead();
    renderPairs();
    renderAlerts();
    renderTally();
    recompute({ animate });
    setStatus();
    document.title = isNum(rate()) ? `${fmtRate(rate())} ${state.to} · ${state.from}/${state.to} · Tender` : 'Tender · Currency Desk';
  }

  function renderModeBadge() {
    if (state.histDate) { el.modeBadge.hidden = false; el.modeBadge.textContent = 'Historical'; }
    else if (customRate(state.from, state.to)) { el.modeBadge.hidden = false; el.modeBadge.textContent = 'Custom rate'; }
    else el.modeBadge.hidden = true;
  }

  /* ------------------------------------------------------------------
   * Pair actions
   * ------------------------------------------------------------------ */
  function setPair(from, to, { keepChart = false } = {}) {
    const changed = from !== state.from || to !== state.to;
    state.from = from; state.to = to;
    save.pair();
    if (state.histDate) loadHistDate(state.histDate, { quiet: true });
    renderRates();
    if (changed && !keepChart) loadChart();
  }

  function swap() {
    el.swapBtn.classList.toggle('spin');
    // keep the number the user typed on the side they typed it, but swap currencies
    if (state.lastEdited === 'to') {
      el.fromAmount.value = el.toAmount.value;
      state.lastEdited = 'from';
    }
    setPair(state.to, state.from);
  }

  function pushRecent(code) {
    state.recent = [code, ...state.recent.filter((c) => c !== code)].slice(0, 8);
    store.set('recent', state.recent);
  }

  function pickCurrency(side, code) {
    pushRecent(code);
    if (side === 'from') {
      if (code === state.to) setPair(code, state.from); else setPair(code, state.to);
    } else if (side === 'to') {
      if (code === state.from) setPair(state.to, code); else setPair(state.from, code);
    } else if (side === 'tally') {
      state.tally.code = code; saveTally(); renderTally();
      el.tallyAmount.focus();
    } else if (side === 'compare') {
      if (!state.compare.includes(code)) {
        state.compare.push(code); store.set('compare', state.compare);
        renderCompare(); toast(`${code} added to compare`, 'ok');
      }
    }
  }

  /* ------------------------------------------------------------------
   * Currency picker
   * ------------------------------------------------------------------ */
  const picker = { side: 'from', filter: 'all', items: [], active: 0, returnFocus: null };

  function openPicker(side, returnFocus) {
    picker.side = side; picker.returnFocus = returnFocus || document.activeElement;
    el.pickerTitle.textContent = { from: 'Convert from', to: 'Convert to', compare: 'Add to compare', tally: 'Tally items are priced in…' }[side] || 'Choose currency';
    el.pickerSearch.value = '';
    setPickerFilter('all', false);
    renderPicker();
    if (!el.picker.open) el.picker.showModal();
    el.pickerSearch.focus();
    const cur = side === 'from' ? state.from : side === 'to' ? state.to : side === 'tally' ? tallyCode() : null;
    if (cur) {
      const idx = picker.items.findIndex((it) => it.code === cur);
      if (idx >= 0) setActive(idx, true);
    }
  }

  function setPickerFilter(f, rerender = true) {
    $$('[data-filter="crypto"], [data-filter="metal"]', el.pickerFilters).forEach((b) => (b.hidden = !state.settings.crypto));
    if (!state.settings.crypto && (f === 'crypto' || f === 'metal')) f = 'all';
    picker.filter = f;
    $$('button', el.pickerFilters).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.filter === f)));
    if (rerender) renderPicker();
  }

  function visibleCatalogue() {
    return CATALOGUE.filter((c) => available(c.code) && (state.settings.crypto || c.type === 'fiat'));
  }

  function highlight(text, q) {
    if (!q) return esc(text);
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + q.length)) + '</mark>' + esc(text.slice(i + q.length));
  }

  function renderPicker() {
    const q = el.pickerSearch.value.trim().toLowerCase();
    const pool = visibleCatalogue();
    const f = picker.filter;
    const byFilter = (c) => f === 'all' || (f === 'starred' ? state.starred.includes(c.code) : c.type === f);
    let groups = [];
    if (q) {
      const scored = pool.filter(byFilter).map((c) => {
        const code = c.code.toLowerCase(), name = c.name.toLowerCase();
        let s = -1;
        if (code === q) s = 0;
        else if (code.startsWith(q)) s = 1;
        else if (name.startsWith(q) || name.split(/[\s·-]+/).some((w) => w.startsWith(q))) s = 2;
        else if (c.sym.toLowerCase() === q) s = 3;
        else if (c.country.toLowerCase().split(/\s+/).some((w) => w.startsWith(q)) || c.country.toLowerCase().startsWith(q)) s = 4;
        else if (c.search.includes(q)) s = 5;
        return { c, s };
      }).filter((x) => x.s >= 0).sort((a, b) => a.s - b.s || a.c.code.localeCompare(b.c.code));
      groups = [{ label: `${scored.length} result${scored.length === 1 ? '' : 's'}`, list: scored.map((x) => x.c) }];
    } else if (f === 'all') {
      const star = state.starred.map((c) => META[c]).filter((c) => c && pool.includes(c));
      const rec = state.recent.map((c) => META[c]).filter((c) => c && pool.includes(c) && !state.starred.includes(c.code)).slice(0, 5);
      if (star.length) groups.push({ label: 'Starred', list: star });
      if (rec.length) groups.push({ label: 'Recent', list: rec });
      groups.push({ label: 'World currencies', list: pool.filter((c) => c.type === 'fiat') });
      if (state.settings.crypto) {
        groups.push({ label: 'Crypto', list: pool.filter((c) => c.type === 'crypto') });
        groups.push({ label: 'Precious metals', list: pool.filter((c) => c.type === 'metal') });
      }
    } else {
      groups = [{ label: { starred: 'Starred', fiat: 'World currencies', crypto: 'Crypto', metal: 'Precious metals' }[f], list: pool.filter(byFilter) }];
    }
    groups = groups.filter((g) => g.list.length);

    picker.items = [];
    const current = picker.side === 'from' ? state.from : picker.side === 'to' ? state.to : picker.side === 'tally' ? tallyCode() : null;
    let html = '';
    let idx = 0;
    for (const g of groups) {
      html += `<li class="grp" role="presentation">${esc(g.label)}</li>`;
      for (const c of g.list) {
        const disabled = picker.side === 'compare' && state.compare.includes(c.code);
        picker.items.push({ code: c.code, disabled });
        const starred = state.starred.includes(c.code);
        html += `<li class="opt${disabled ? ' disabled' : ''}" role="option" id="opt-${idx}" data-i="${idx}" data-code="${c.code}" aria-selected="${c.code === current}" ${disabled ? 'aria-disabled="true"' : ''}>
          ${flagHTML(c.code, 'sm')}
          <span class="o-meta"><span class="o-code">${highlight(c.code, q)}</span> <span class="o-name">${highlight(c.name, q)}${disabled ? ' · added' : ''}</span></span>
          <span class="o-sym">${esc(c.sym)}</span>
          <button type="button" class="o-star${starred ? ' on' : ''}" data-star="${c.code}" aria-label="${starred ? 'Unstar' : 'Star'} ${c.code}" tabindex="-1">${ICON.star}</button>
        </li>`;
        idx++;
      }
    }
    if (!picker.items.length) {
      html = `<li class="picker-empty">${q ? `Nothing matches “${esc(q)}”.` : f === 'starred' ? 'Star currencies with ★ to pin them here.' : 'No currencies.'}</li>`;
    }
    el.pickerList.innerHTML = html;
    picker.active = -1;
    const first = picker.items.findIndex((it) => !it.disabled);
    if (first >= 0) setActive(first, false);
  }

  function setActive(i, scroll = true) {
    const prev = el.pickerList.querySelector('.opt.active');
    if (prev) prev.classList.remove('active');
    picker.active = i;
    const node = el.pickerList.querySelector(`[data-i="${i}"]`);
    if (node) {
      node.classList.add('active');
      el.pickerSearch.setAttribute('aria-activedescendant', node.id);
      if (scroll) node.scrollIntoView({ block: 'nearest' });
    }
  }
  function moveActive(d) {
    const n = picker.items.length;
    if (!n) return;
    let i = picker.active;
    for (let k = 0; k < n; k++) {
      i = (i + d + n) % n;
      if (!picker.items[i].disabled) break;
    }
    setActive(i);
  }
  function choosePicker(i) {
    const it = picker.items[i];
    if (!it || it.disabled) return;
    closeDialog(el.picker);
    pickCurrency(picker.side, it.code);
  }
  function toggleStar(code) {
    state.starred = state.starred.includes(code) ? state.starred.filter((c) => c !== code) : [...state.starred, code];
    store.set('starred', state.starred);
  }

  /* ------------------------------------------------------------------
   * Dialog helpers
   * ------------------------------------------------------------------ */
  function closeDialog(d) {
    if (!d.open) return;
    d.close();
  }
  $$('dialog').forEach((d) => {
    let downOnBackdrop = false;
    d.addEventListener('pointerdown', (e) => { downOnBackdrop = e.target === d; });
    d.addEventListener('click', (e) => {
      if (e.target === d && downOnBackdrop) closeDialog(d); // backdrop click (not a drag that ended outside)
      if (e.target.closest('[data-close]')) closeDialog(d);
    });
    d.addEventListener('close', () => {
      if (d === el.picker && picker.returnFocus && document.contains(picker.returnFocus)) picker.returnFocus.focus();
    });
  });

  /* ------------------------------------------------------------------
   * Compare list
   * ------------------------------------------------------------------ */
  function renderCompare() {
    const amt = isNum(fromValue) ? fromValue : NaN;
    const list = state.compare.filter((c) => c !== state.from);
    el.cntCompare.textContent = state.compare.length || '';
    el.compareLead.innerHTML = isNum(amt)
      ? `<b>${esc(fmtMoney(amt, state.from))} ${state.from}</b> is worth…`
      : 'Enter an amount to compare.';
    if (!list.length) {
      el.compareList.innerHTML = `<li class="empty"><span class="big">Nothing to compare yet</span>Add a few currencies you care about.</li>`;
      return;
    }
    el.compareList.innerHTML = list.map((code) => {
      const m = meta(code);
      const r = rate(state.from, code);
      const v = amt * r;
      const ch = state.histDate ? NaN : change24h(state.from, code);
      return `<li class="crow${code === state.to ? ' is-target' : ''}" draggable="true" data-code="${code}" tabindex="0" aria-label="${esc(m.name)}: ${isNum(v) ? esc(fmtMoney(v, code)) : 'unavailable'}">
        <span class="crow-left"><span class="grip" aria-hidden="true">${ICON.grip}</span>
        <span class="who">${flagHTML(code, 'sm')}<div><div class="c">${code}</div><div class="n">${esc(m.name)}</div></div></span></span>
        <span class="val"><div class="v">${isNum(v) ? esc(fmtMoney(v, code)) : '—'} <span style="color:var(--muted);font-size:12px">${esc(m.sym !== code ? m.sym : '')}</span></div>
          <div class="r">${isNum(r) ? `1 ${state.from} = ${esc(fmtRate(r))}` : 'n/a'} ${isNum(ch) ? changePill(ch) : ''}</div></span>
        <button type="button" class="x" data-remove="${code}" aria-label="Remove ${code}">${ICON.x}</button>
      </li>`;
    }).join('');
  }

  // Drag-to-reorder
  let dragCode = null;
  el.compareList.addEventListener('dragstart', (e) => {
    const row = e.target.closest('.crow'); if (!row) return;
    dragCode = row.dataset.code; row.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', dragCode); } catch { /* ignore */ }
  });
  el.compareList.addEventListener('dragover', (e) => {
    if (!dragCode) return;
    const row = e.target.closest('.crow'); if (!row || row.dataset.code === dragCode) return;
    e.preventDefault();
    const rect = row.getBoundingClientRect();
    const after = e.clientY > rect.top + rect.height / 2;
    $$('.crow', el.compareList).forEach((r) => r.classList.remove('drop-before', 'drop-after'));
    row.classList.add(after ? 'drop-after' : 'drop-before');
  });
  el.compareList.addEventListener('drop', (e) => {
    const row = e.target.closest('.crow'); if (!row || !dragCode) return;
    e.preventDefault();
    const target = row.dataset.code;
    const after = row.classList.contains('drop-after');
    const arr = state.compare.filter((c) => c !== dragCode);
    let idx = arr.indexOf(target); if (after) idx++;
    arr.splice(idx, 0, dragCode);
    state.compare = arr; store.set('compare', arr);
    dragCode = null; renderCompare();
  });
  el.compareList.addEventListener('dragend', () => {
    dragCode = null;
    $$('.crow', el.compareList).forEach((r) => r.classList.remove('dragging', 'drop-before', 'drop-after'));
  });
  el.compareList.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-remove]');
    if (rm) {
      state.compare = state.compare.filter((c) => c !== rm.dataset.remove);
      store.set('compare', state.compare); renderCompare(); return;
    }
    const row = e.target.closest('.crow');
    if (row) { pickCurrency('to', row.dataset.code); }
  });
  el.compareList.addEventListener('keydown', (e) => {
    const row = e.target.closest('.crow');
    if (!row || e.target !== row) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickCurrency('to', row.dataset.code); }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      state.compare = state.compare.filter((c) => c !== row.dataset.code); store.set('compare', state.compare); renderCompare();
    }
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && e.altKey) {
      e.preventDefault();
      const i = state.compare.indexOf(row.dataset.code), j = i + (e.key === 'ArrowUp' ? -1 : 1);
      if (j < 0 || j >= state.compare.length) return;
      [state.compare[i], state.compare[j]] = [state.compare[j], state.compare[i]];
      store.set('compare', state.compare); renderCompare();
      const again = el.compareList.querySelector(`[data-code="${row.dataset.code}"]`); if (again) again.focus();
    }
  });

  /* ------------------------------------------------------------------
   * Cheat sheet
   * ------------------------------------------------------------------ */
  const CHEAT_STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  function scaleFor(code) {
    const per = activeMap()[code];
    if (!isNum(per) || per <= 0) return 1;
    const e = Math.floor(Math.log10(per));
    return 10 ** e; // e.g. JPY (~150/USD) → 100, BTC → 1e-5
  }
  function cheatTable(a, b) {
    const r = rate(a, b);
    const s = scaleFor(a);
    const rows = CHEAT_STEPS.map((n) => {
      const amt = +(n * s).toPrecision(12);
      return `<tr><td>${esc(fmtMoney(amt, a))}</td><td>${isNum(r) ? esc(fmtMoney(amt * r, b)) : '—'}</td></tr>`;
    }).join('');
    return `<table><caption><span class="cap">${flagHTML(a, 'xs')} ${a} → ${flagHTML(b, 'xs')} ${b}</span></caption><thead><tr><th>${a}</th><th>${b}</th></tr></thead><tbody>${rows}</tbody></table>`;
  }
  function renderCheat() {
    // Cheap enough to always keep current so printing is instant.
    el.cheat.innerHTML = cheatTable(state.from, state.to) + cheatTable(state.to, state.from);
  }

  /* ------------------------------------------------------------------
   * Saved pairs
   * ------------------------------------------------------------------ */
  const isFavPair = (a = state.from, b = state.to) => state.pairs.some((p) => p.from === a && p.to === b);
  function renderFavBtn() {
    const on = isFavPair();
    el.favPairBtn.setAttribute('aria-pressed', String(on));
    el.favPairBtn.querySelector('span').textContent = on ? 'Saved' : 'Save pair';
  }
  function toggleFavPair() {
    if (isFavPair()) {
      state.pairs = state.pairs.filter((p) => !(p.from === state.from && p.to === state.to));
      toast(`Removed ${state.from}/${state.to}`, 'info');
    } else {
      state.pairs.unshift({ from: state.from, to: state.to });
      toast(`Saved ${state.from}/${state.to}`, 'ok');
    }
    store.set('pairs', state.pairs);
    renderFavBtn(); renderPairs();
  }
  function renderPairs() {
    el.cntPairs.textContent = state.pairs.length || '';
    if (!state.pairs.length) {
      el.pairsList.innerHTML = `<div class="empty" style="grid-column:1/-1"><span class="big">No saved pairs</span>Tap “Save pair” (or press P) on any conversion.</div>`;
      return;
    }
    el.pairsList.innerHTML = state.pairs.map((p, i) => {
      const r = marketRate(p.from, p.to);
      const ch = change24h(p.from, p.to);
      const active = p.from === state.from && p.to === state.to;
      return `<button type="button" class="pair-card${active ? ' active' : ''}" data-pair="${i}">
        <span class="pc-top"><span class="pair-flags">${flagHTML(p.from, 'xs')}${flagHTML(p.to, 'xs')}</span>${p.from} → ${p.to}</span>
        <span class="pc-rate">${isNum(r) ? esc(fmtRate(r)) : '—'}</span>
        <span>${isNum(ch) ? changePill(ch, '24h') : '<span class="pill flat">—</span>'}</span>
        <span class="pc-x" data-unpair="${i}" role="button" aria-label="Remove pair" tabindex="0">${ICON.x}</span>
      </button>`;
    }).join('');
  }
  el.pairsList.addEventListener('click', (e) => {
    const x = e.target.closest('[data-unpair]');
    if (x) {
      e.stopPropagation();
      state.pairs.splice(+x.dataset.unpair, 1); store.set('pairs', state.pairs);
      renderPairs(); renderFavBtn(); return;
    }
    const b = e.target.closest('[data-pair]');
    if (b) { const p = state.pairs[+b.dataset.pair]; if (p) { pushRecent(p.from); pushRecent(p.to); setPair(p.from, p.to); } }
  });
  el.pairsList.addEventListener('keydown', (e) => {
    const x = e.target.closest('[data-unpair]');
    if (x && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); x.click(); }
  });

  /* ------------------------------------------------------------------
   * History
   * ------------------------------------------------------------------ */
  const queueHistory = debounce(() => {
    if (!isNum(fromValue) || !isNum(toValue) || fromValue <= 0) return;
    const last = state.history[0];
    const entry = {
      t: Date.now(), from: state.from, to: state.to, a: fromValue, b: toValue, r: rate(),
      mode: state.histDate ? `hist:${state.histActualDate || state.histDate}` : customRate(state.from, state.to) ? 'custom' : 'market',
    };
    if (last && last.from === entry.from && last.to === entry.to && Math.abs(last.a - entry.a) < 1e-12 && last.mode === entry.mode) return;
    // collapse rapid typing (same pair within 20s) into one entry
    if (last && last.from === entry.from && last.to === entry.to && entry.t - last.t < 20000) state.history[0] = entry;
    else {
      state.history.unshift(entry);
      state.serial++; store.set('serial', state.serial); renderSerial();
    }
    state.history = state.history.slice(0, 50);
    store.set('history', state.history);
    renderHistory();
  }, 1400);

  function renderSerial() { el.serial.textContent = `No. ${String(state.serial).padStart(6, '0')}`; }

  function renderHistory() {
    el.cntHistory.textContent = state.history.length || '';
    if (!state.history.length) {
      el.historyList.innerHTML = `<li class="empty"><span class="big">A clean slate</span>Conversions you make will appear here.</li>`;
      return;
    }
    let lastDay = '';
    const today = new Date().toDateString();
    const yest = new Date(Date.now() - 864e5).toDateString();
    el.historyList.innerHTML = state.history.map((h, i) => {
      const d = new Date(h.t);
      const day = d.toDateString();
      let head = '';
      if (day !== lastDay) {
        lastDay = day;
        const label = day === today ? 'Today' : day === yest ? 'Yesterday' : d.toLocaleDateString(localeInfo.tag, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        head = `<li class="hday" role="presentation">${esc(label)}</li>`;
      }
      const mode = h.mode === 'custom' ? ' · custom rate' : h.mode && h.mode.startsWith('hist:') ? ` · rate of ${fmtDate(h.mode.slice(5))}` : '';
      return `${head}<li class="hrow" data-h="${i}" tabindex="0" role="button" aria-label="Restore conversion">
        <span class="h-main">${esc(fmtMoney(h.a, h.from))} ${h.from}<span class="arrow">→</span><b>${esc(fmtMoney(h.b, h.to))} ${h.to}</b></span>
        <span class="h-time">${d.toLocaleTimeString(localeInfo.tag, { hour: '2-digit', minute: '2-digit' })}</span>
        <span class="h-sub">@ ${esc(fmtRate(h.r))}${mode}</span>
      </li>`;
    }).join('');
  }
  function restoreHistory(i) {
    const h = state.history[i]; if (!h) return;
    state.lastEdited = 'from';
    el.fromAmount.value = toInputString(h.a, h.from);
    setPair(h.from, h.to);
    el.fromAmount.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  el.historyList.addEventListener('click', (e) => { const r = e.target.closest('[data-h]'); if (r) restoreHistory(+r.dataset.h); });
  el.historyList.addEventListener('keydown', (e) => { const r = e.target.closest('[data-h]'); if (r && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); restoreHistory(+r.dataset.h); } });

  function exportHistoryCSV() {
    if (!state.history.length) { toast('No history to export', 'info'); return; }
    const rows = [['timestamp', 'from', 'amount', 'to', 'converted', 'rate', 'mode']];
    state.history.forEach((h) => rows.push([new Date(h.t).toISOString(), h.from, h.a, h.to, h.b, h.r, h.mode || 'market']));
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    download(`tender-history-${todayISO()}.csv`, csv, 'text/csv');
  }
  function download(name, text, type) {
    const blob = new Blob([text], { type: `${type};charset=utf-8` });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ------------------------------------------------------------------
   * Tally — running total of several items (a bill, a shopping trip)
   * ------------------------------------------------------------------ */
  let tallyEditing = null;
  const tallyCode = () => state.tally.code || state.from;
  const saveTally = () => store.set('tally', state.tally);

  function tallyTotals() {
    const items = state.tally.items;
    const to = state.to;
    let totalTo = 0, missing = false;
    for (const it of items) {
      const r = rate(it.code, to);
      if (isNum(r)) totalTo += it.a * r; else missing = true;
    }
    const codes = [...new Set(items.map((i) => i.code))];
    const uniform = codes.length === 1 ? codes[0] : null;
    const subSrc = uniform ? items.reduce((a, i) => a + i.a, 0) : NaN;
    const tip = state.tally.tip || 0;
    return { totalTo, missing, uniform, subSrc, tip, grandTo: totalTo * (1 + tip / 100), grandSrc: subSrc * (1 + tip / 100) };
  }

  function renderTally() {
    const t = state.tally;
    el.cntTally.textContent = t.items.length || '';
    el.tallyCcy.innerHTML = `${flagHTML(tallyCode(), 'xs')}${esc(tallyCode())}`;
    el.tallyCcy.setAttribute('aria-label', `Item currency: ${meta(tallyCode()).name}. Change`);
    if (document.activeElement !== el.tallyTip) el.tallyTip.value = String(t.tip);
    $$('[data-tip]', el.tipPresets).forEach((b) => b.classList.toggle('on', +b.dataset.tip === t.tip));
    el.tallyLead.innerHTML = t.items.length
      ? `Totals shown in <b>${esc(state.to)}</b> — change “They receive” to switch.`
      : 'Add up a bill or a shopping trip, item by item.';
    if (!t.items.length) {
      el.tallyList.innerHTML = `<li class="empty"><span class="big">Nothing on the bill yet</span>Type a price above, or press “Tally +” on the slip.</li>`;
    } else {
      el.tallyList.innerHTML = t.items.map((it, i) => {
        const r = rate(it.code, state.to);
        const conv = it.code === state.to ? '' : `<div class="t-conv">≈ ${isNum(r) ? esc(fmtMoney(it.a * r, state.to)) : '—'} ${esc(state.to)}</div>`;
        return `<li class="trow${tallyEditing === it.id ? ' editing' : ''}" data-tid="${esc(it.id)}">
          <span class="t-n">${i + 1}</span>
          <span class="t-note${it.note ? '' : ' placeholder'}">${esc(it.note || `Item ${i + 1}`)}</span>
          <span class="t-amt"><div class="t-src">${esc(fmtMoney(it.a, it.code))} ${esc(it.code)}</div>${conv}</span>
          <span class="t-btns">
            <button type="button" data-tedit="${esc(it.id)}" aria-label="Edit item ${i + 1}" title="Edit"><svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="M13.5 6.5l4 4"/></svg></button>
            <button type="button" data-tdel="${esc(it.id)}" aria-label="Remove item ${i + 1}" title="Remove">${ICON.x}</button>
          </span>
        </li>`;
      }).join('');
    }
    const s = tallyTotals();
    const row = (k, v, cls = '') => `<div class="${cls}"><dt>${k}</dt><dd>${v}</dd></div>`;
    const showSrc = s.uniform && s.uniform !== state.to;
    const out = [row('Items', String(t.items.length))];
    if (t.items.length) {
      out.push(row('Subtotal', showSrc ? `${esc(fmtMoney(s.subSrc, s.uniform))} ${esc(s.uniform)}` : `${esc(fmtMoney(s.totalTo, state.to))} ${esc(state.to)}`));
      if (s.tip) out.push(row(`Tip / tax ${nf(0, 2).format(s.tip)}%`, showSrc ? `+${esc(fmtMoney(s.subSrc * s.tip / 100, s.uniform))} ${esc(s.uniform)}` : `+${esc(fmtMoney(s.totalTo * s.tip / 100, state.to))} ${esc(state.to)}`));
      if (showSrc) out.push(row('Total to pay', `${esc(fmtMoney(s.grandSrc, s.uniform))} ${esc(s.uniform)}`));
    }
    out.push(row(t.items.length && showSrc ? `≈ in ${esc(state.to)}` : 'Total',
      `${t.items.length ? (s.missing && !s.totalTo ? '—' : esc(fmtMoney(s.grandTo, state.to))) : esc(fmtMoney(0, state.to))}<small>${esc(state.to)}</small>`, 'grand'));
    if (s.missing) out.push(row('Note', 'Some items have no rate right now'));
    el.tallySum.innerHTML = out.join('');
  }

  function resetTallyForm() {
    tallyEditing = null;
    el.tallyAmount.value = ''; el.tallyNote.value = '';
    el.tallySubmit.textContent = 'Add'; el.tallyCancel.hidden = true;
    el.tallyErr.textContent = ''; el.tallyAmount.classList.remove('invalid');
  }
  function addToTally(amount, code, note = '') {
    state.tally.items.push({ id: uid(), a: amount, code, note: note.slice(0, 40) });
    if (state.tally.items.length > 300) state.tally.items.shift();
    saveTally(); renderTally();
  }

  el.tallyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const res = evalAmount(el.tallyAmount.value);
    if (!isNum(res.value) || res.value <= 0) {
      el.tallyErr.textContent = res.error || 'Enter a price above zero';
      el.tallyAmount.classList.add('invalid'); el.tallyAmount.focus(); return;
    }
    const note = el.tallyNote.value.trim();
    if (tallyEditing) {
      const it = state.tally.items.find((i) => i.id === tallyEditing);
      if (it) { it.a = res.value; it.note = note.slice(0, 40); it.code = tallyCode(); }
      saveTally();
    } else addToTally(res.value, tallyCode(), note);
    resetTallyForm(); renderTally();
    el.tallyAmount.focus();
    el.tallyList.scrollTop = el.tallyList.scrollHeight;
  });
  el.tallyAmount.addEventListener('input', () => { el.tallyErr.textContent = ''; el.tallyAmount.classList.remove('invalid'); });
  el.tallyNote.addEventListener('keydown', (e) => { if (e.key === 'Escape' && tallyEditing) { resetTallyForm(); renderTally(); } });
  el.tallyAmount.addEventListener('keydown', (e) => { if (e.key === 'Escape' && tallyEditing) { resetTallyForm(); renderTally(); } });
  el.tallyCancel.addEventListener('click', () => { resetTallyForm(); renderTally(); });
  el.tallyCcy.addEventListener('click', () => openPicker('tally', el.tallyCcy));
  el.tallyList.addEventListener('click', (e) => {
    const del = e.target.closest('[data-tdel]');
    const ed = e.target.closest('[data-tedit]');
    if (del) {
      const id = del.dataset.tdel;
      state.tally.items = state.tally.items.filter((i) => i.id !== id);
      if (tallyEditing === id) resetTallyForm();
      saveTally(); renderTally();
    } else if (ed) {
      const it = state.tally.items.find((i) => i.id === ed.dataset.tedit);
      if (!it) return;
      tallyEditing = it.id;
      state.tally.code = it.code;
      el.tallyAmount.value = toInputString(it.a, it.code);
      el.tallyNote.value = it.note;
      el.tallySubmit.textContent = 'Save'; el.tallyCancel.hidden = false;
      renderTally(); el.tallyAmount.focus(); el.tallyAmount.select();
    }
  });
  const setTip = (v) => { state.tally.tip = clamp(isNum(v) ? v : 0, 0, 100); saveTally(); renderTally(); };
  el.tallyTip.addEventListener('input', () => setTip(parseFloat(el.tallyTip.value) || 0));
  el.tallyTip.addEventListener('blur', () => { el.tallyTip.value = String(state.tally.tip); });
  el.tipPresets.addEventListener('click', (e) => { const b = e.target.closest('[data-tip]'); if (b) { el.tallyTip.value = b.dataset.tip; setTip(+b.dataset.tip); } });
  el.tallyClearBtn.addEventListener('click', () => {
    if (!state.tally.items.length) return;
    if (!confirm('Clear every item from the tally?')) return;
    state.tally.items = []; resetTallyForm(); saveTally(); renderTally(); toast('Tally cleared', 'ok');
  });
  el.tallyCopyBtn.addEventListener('click', async () => {
    const t = state.tally;
    if (!t.items.length) { toast('Nothing to copy yet', 'error'); return; }
    const s = tallyTotals();
    const lines = t.items.map((it, i) => {
      const r = rate(it.code, state.to);
      const conv = it.code !== state.to && isNum(r) ? ` (≈ ${fmtMoney(it.a * r, state.to)} ${state.to})` : '';
      return `${i + 1}. ${it.note || 'Item'} — ${fmtMoney(it.a, it.code)} ${it.code}${conv}`;
    });
    if (s.tip) lines.push(`Tip / tax ${s.tip}%`);
    if (s.uniform && s.uniform !== state.to) lines.push(`Total: ${fmtMoney(s.grandSrc, s.uniform)} ${s.uniform}`);
    lines.push(`${s.uniform && s.uniform !== state.to ? '≈ ' : 'Total: '}${fmtMoney(s.grandTo, state.to)} ${state.to}`);
    const ok = await copyText(lines.join('\n'));
    toast(ok ? 'Tally copied' : 'Copy failed', ok ? 'ok' : 'error');
  });
  el.tallyAddBtn.addEventListener('click', () => {
    if (!isNum(fromValue) || fromValue <= 0) { toast('Enter an amount first', 'error'); return; }
    addToTally(fromValue, state.from);
    toast(`Added ${fmtMoney(fromValue, state.from)} ${state.from} to the tally (${state.tally.items.length} item${state.tally.items.length === 1 ? '' : 's'})`, 'ok');
  });

  /* ------------------------------------------------------------------
   * Alerts
   * ------------------------------------------------------------------ */
  function renderAlerts() {
    el.alertPair.innerHTML = `${flagHTML(state.from, 'xs')}${flagHTML(state.to, 'xs')} 1 ${state.from} in ${state.to}`;
    const mr = marketRate(state.from, state.to);
    if (document.activeElement !== el.alertValue && isNum(mr)) el.alertValue.placeholder = fmtRate(mr);
    const armed = state.alerts.filter((a) => !a.hit).length;
    el.cntAlerts.textContent = state.alerts.length ? String(armed || '✓') : '';
    if (!state.alerts.length) {
      el.alertList.innerHTML = `<li class="empty"><span class="big">No alerts set</span>Get a heads-up when a rate crosses your target.</li>`;
    } else {
      el.alertList.innerHTML = state.alerts.map((a, i) => {
        const now = marketRate(a.from, a.to);
        const dist = isNum(now) ? (a.value / now - 1) * 100 : NaN;
        return `<li class="arow${a.hit ? ' hit' : ''}">
          <span class="a-icon">${a.hit ? ICON.check : ICON.bell}</span>
          <span><div class="a-main">${a.from} → ${a.to} ${a.cond === 'above' ? '≥' : '≤'} <b>${esc(fmtRate(a.value))}</b></div>
          <div class="a-sub">${a.hit ? `Triggered ${new Date(a.hitAt).toLocaleString(localeInfo.tag, { dateStyle: 'medium', timeStyle: 'short' })} at ${esc(fmtRate(a.hitRate))}` : `Now ${esc(fmtRate(now))}${isNum(dist) ? ` · ${fmtPct(dist)} away` : ''}`}</div></span>
          <span class="a-btns">${a.hit ? `<button type="button" data-rearm="${i}" title="Re-arm" aria-label="Re-arm alert">${ICON.redo}</button>` : ''}<button type="button" data-unalert="${i}" title="Delete" aria-label="Delete alert">${ICON.x}</button></span>
        </li>`;
      }).join('');
    }
    el.notifyBtn.hidden = !('Notification' in window) || Notification.permission === 'granted' || Notification.permission === 'denied';
  }
  function checkAlerts() {
    if (!state.rates || state.source === 'sample') return;
    let fired = false;
    state.alerts.forEach((a) => {
      if (a.hit) return;
      const now = marketRate(a.from, a.to);
      if (!isNum(now)) return;
      if ((a.cond === 'above' && now >= a.value) || (a.cond === 'below' && now <= a.value)) {
        a.hit = true; a.hitAt = Date.now(); a.hitRate = now; fired = true;
        const msg = `${a.from}/${a.to} is ${a.cond === 'above' ? 'above' : 'below'} ${fmtRate(a.value)} — now ${fmtRate(now)}`;
        toast(`🔔 ${msg}`, 'info', 6000);
        try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Tender rate alert', { body: msg }); } catch { /* ignore */ }
      }
    });
    if (fired) store.set('alerts', state.alerts);
    renderAlerts();
  }
  el.alertForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const v = parseFloat(el.alertValue.value); // type=number → always "." decimal
    if (!isNum(v) || v <= 0) { toast('Enter a target rate above zero', 'error'); el.alertValue.focus(); return; }
    if (state.from === state.to) { toast('Pick two different currencies first', 'error'); return; }
    state.alerts.unshift({ from: state.from, to: state.to, cond: el.alertCond.value, value: v, created: Date.now(), hit: false });
    store.set('alerts', state.alerts);
    el.alertValue.value = '';
    toast('Alert set', 'ok');
    checkAlerts();
  });
  el.alertList.addEventListener('click', (e) => {
    const del = e.target.closest('[data-unalert]');
    const re = e.target.closest('[data-rearm]');
    if (del) { state.alerts.splice(+del.dataset.unalert, 1); }
    else if (re) { const a = state.alerts[+re.dataset.rearm]; a.hit = false; delete a.hitAt; delete a.hitRate; }
    else return;
    store.set('alerts', state.alerts);
    if (re) checkAlerts(); else renderAlerts();
  });
  el.notifyBtn.addEventListener('click', async () => {
    try {
      const p = await Notification.requestPermission();
      toast(p === 'granted' ? 'Notifications on' : 'Notifications blocked', p === 'granted' ? 'ok' : 'error');
    } catch { toast('Notifications not supported here', 'error'); }
    renderAlerts();
  });

  /* ------------------------------------------------------------------
   * Fees
   * ------------------------------------------------------------------ */
  function renderFees() {
    const margin = clamp(parseFloat(el.feeMargin.value) || 0, 0, 99);
    const flat = Math.max(0, parseFloat(el.feeFlat.value) || 0);
    const r = rate();
    const active = margin > 0 || flat > 0;
    el.feesMeta.textContent = active ? `${nf(0, 2).format(margin)}% + ${nf(0, 2).format(flat)} ${state.from}` : 'See what you really get';
    el.feesMeta.classList.toggle('on', active);
    if (!isNum(fromValue) || !isNum(r)) { el.feeOut.innerHTML = '<div><dt>Enter an amount to see the breakdown</dt><dd></dd></div>'; return; }
    const eff = r * (1 - margin / 100);
    const net = Math.max(0, fromValue - flat);
    const receive = net * eff;
    const ideal = fromValue * r;
    const lost = ideal - receive;
    const lostPct = ideal > 0 ? (lost / ideal) * 100 : 0;
    const needToSend = eff > 0 && isNum(toValue) ? toValue / eff + flat : NaN;
    const row = (k, v, cls = '') => `<div class="${cls}"><dt>${k}</dt><dd>${v}</dd></div>`;
    el.feeOut.innerHTML = [
      row('Mid-market amount', `${esc(fmtMoney(ideal, state.to))} ${state.to}`),
      row('Rate after margin', `1 ${state.from} = ${esc(fmtRate(eff))} ${state.to}`),
      row('Flat fee', flat > 0 ? `−${esc(fmtMoney(Math.min(flat, fromValue), state.from))} ${state.from}` : 'None'),
      row('You actually receive', `${esc(fmtMoney(receive, state.to))} ${state.to}`, 'em'),
      row('Total cost of fees', `${esc(fmtMoney(lost, state.to))} ${state.to} (${nf(2, 2).format(lostPct)}%)`, lost > 0 ? 'loss' : ''),
      row(`To receive ${esc(fmtMoney(toValue, state.to))} ${state.to} send`, isNum(needToSend) ? `${esc(fmtMoney(needToSend, state.from))} ${state.from}` : '—'),
    ].join('');
  }
  const saveFees = () => { state.fees = { margin: +el.feeMargin.value || 0, flat: +el.feeFlat.value || 0 }; store.set('fees', state.fees); renderFees(); };
  el.feeMargin.addEventListener('input', saveFees);
  el.feeFlat.addEventListener('input', saveFees);
  el.feePresets.addEventListener('click', (e) => { const b = e.target.closest('[data-margin]'); if (b) { el.feeMargin.value = b.dataset.margin; saveFees(); } });

  /* ------------------------------------------------------------------
   * Custom rate
   * ------------------------------------------------------------------ */
  function renderCustom() {
    const key = pairKey(state.from, state.to);
    const c = state.custom[key];
    const mr = marketRate(state.from, state.to);
    el.customRateLabel.textContent = `1 ${state.from} =`;
    el.customRateCode.textContent = state.to;
    el.customLabel.textContent = `Override the market rate for ${state.from} → ${state.to}`;
    el.customToggle.checked = !!(c && c.on);
    if (document.activeElement !== el.customRate) el.customRate.value = c && isNum(c.rate) ? String(c.rate) : '';
    el.customRate.placeholder = isNum(mr) ? String(+mr.toPrecision(6)) : '';
    const on = !!customRate(state.from, state.to);
    el.customMeta.textContent = on ? `Active · ${fmtRate(c.rate)}` : 'Use your bank’s quoted rate';
    el.customMeta.classList.toggle('on', on);
    if (state.histDate && on) { el.customHint.className = 'hint warn'; el.customHint.textContent = 'Custom rate is paused while converting at a past date.'; }
    else if (on && isNum(mr)) {
      const diff = (c.rate / mr - 1) * 100;
      el.customHint.className = 'hint';
      el.customHint.textContent = Math.abs(diff) < 0.01
        ? `Matches mid-market (${fmtRate(mr)}). Type your provider’s quoted rate above.`
        : `${fmtPct(diff)} versus mid-market (${fmtRate(mr)}). ${diff < 0 ? 'You get less than the market rate.' : 'Better than market — double-check this rate.'}`;
    } else { el.customHint.className = 'hint'; el.customHint.textContent = 'Saved per pair on this device. The chart still shows market rates.'; }
  }
  function saveCustom() {
    const key = pairKey(state.from, state.to);
    const v = parseFloat(String(el.customRate.value).replace(',', '.'));
    const on = el.customToggle.checked;
    if (on && !(isNum(v) && v > 0)) {
      // toggled on with no value: seed with market rate
      const mr = marketRate(state.from, state.to);
      if (isNum(mr)) { el.customRate.value = String(+mr.toPrecision(6)); state.custom[key] = { on, rate: +mr.toPrecision(6) }; }
    } else if (!on && !(isNum(v) && v > 0)) delete state.custom[key];
    else state.custom[key] = { on, rate: v };
    store.set('custom', state.custom);
    renderRateStrip(); renderModeBadge(); recompute(); renderCustom();
  }
  el.customToggle.addEventListener('change', saveCustom);
  el.customRate.addEventListener('input', () => {
    const v = parseFloat(el.customRate.value);
    if (isNum(v) && v > 0 && !el.customToggle.checked) el.customToggle.checked = true;
    saveCustom();
  });

  /* ------------------------------------------------------------------
   * Historical date conversion
   * ------------------------------------------------------------------ */
  let histToken = 0;
  async function loadHistDate(date, { quiet = false } = {}) {
    const token = ++histToken;
    if (!date) {
      state.histDate = ''; state.histRates = null; state.histActualDate = '';
      el.histDate.value = ''; el.dateMeta.textContent = 'Convert with historical rates'; el.dateMeta.classList.remove('on');
      el.dateHint.className = 'hint';
      el.dateHint.textContent = 'Major currencies go back to 1999; everything else (incl. crypto) to March 2024.';
      renderRates(); return;
    }
    if (date > todayISO()) date = todayISO();
    if (date < FRANK_EARLIEST) date = FRANK_EARLIEST;
    state.histDate = date; el.histDate.value = date;
    el.dateMeta.textContent = `Using ${fmtDate(date)}`; el.dateMeta.classList.add('on');
    el.dateHint.className = 'hint'; el.dateHint.textContent = 'Loading rates for that day…';
    const bothFrank = FRANKFURTER.has(state.from) && FRANKFURTER.has(state.to);
    try {
      let result;
      if (date >= FAWAZ_EARLIEST) {
        try { result = await fetchDated(date); } catch (e) { if (!bothFrank) throw e; }
      }
      if (!result) {
        if (!bothFrank) throw new Error(`Data for ${state.from}/${state.to} only goes back to ${fmtDate(FAWAZ_EARLIEST)}.`);
        const d = await frank(`/${date}?base=USD`);
        result = { rates: upperMap(d.rates), date: d.date };
      }
      if (token !== histToken) return;
      state.histRates = result.rates; state.histActualDate = result.date;
      el.dateHint.className = 'hint';
      el.dateHint.textContent = result.date !== date
        ? `No fixing on ${fmtDate(date)} (weekend/holiday) — using ${fmtDate(result.date)}.`
        : `Converting with rates from ${fmtDate(result.date)}.`;
    } catch (err) {
      if (token !== histToken) return;
      state.histRates = {}; state.histActualDate = date;
      el.dateHint.className = 'hint warn';
      el.dateHint.textContent = err && err.message && err.message.startsWith('Data for') ? err.message : 'Couldn’t load rates for that date. Check your connection or pick another date.';
    }
    if (!quiet || token === histToken) renderRates();
  }
  el.histDate.max = todayISO();
  el.histDate.addEventListener('change', () => loadHistDate(el.histDate.value));
  el.histClear.addEventListener('click', () => { loadHistDate(''); toast('Back to live rates', 'ok'); });
  el.datePresets.addEventListener('click', (e) => { const b = e.target.closest('[data-ago]'); if (b) loadHistDate(addDays(todayISO(), -+b.dataset.ago)); });

  /* ------------------------------------------------------------------
   * Chart
   * ------------------------------------------------------------------ */
  const chart = { data: [], hover: -1, token: 0, clamped: false, source: '' };
  const seriesCache = new Map();

  async function getSeries(a, b, days) {
    const key = `${a}>${b}>${days}>${state.ratesDate}`;
    if (seriesCache.has(key)) return seriesCache.get(key);
    const end = state.ratesDate || todayISO();
    const start = addDays(end, -days);
    let out = null, source = '', clamped = false;
    // 1) Frankfurter: one request, daily resolution, back to 1999
    if (FRANKFURTER.has(a) && FRANKFURTER.has(b)) {
      try {
        const d = await frank(`/${start}..${end}?base=${a}&symbols=${b}`);
        const pts = Object.entries(d.rates || {}).map(([date, r]) => ({ date, v: r[b] })).filter((p) => isNum(p.v)).sort((x, y) => x.date.localeCompare(y.date));
        if (pts.length > 1) { out = pts; source = 'ECB via Frankfurter'; }
      } catch { /* fall through */ }
    }
    // 2) Sampled daily snapshots (works for any pair incl. crypto)
    if (!out) {
      let s = start;
      if (s < FAWAZ_EARLIEST) { s = FAWAZ_EARLIEST; clamped = true; }
      const span = daysBetween(s, end);
      if (span < 1) throw new Error('No history');
      const n = clamp(Math.min(span, { 7: 8, 30: 24, 90: 26, 182: 28, 365: 32, 1826: 36 }[days] || 30), 2, 40);
      const dates = [];
      for (let i = 0; i < n; i++) dates.push(addDays(s, Math.round((span * i) / (n - 1))));
      const uniq = [...new Set(dates)].filter((d) => d !== end);
      const results = await pool(uniq, 6, (d) => fetchDated(d).then((r) => ({ date: d, v: rateFrom(r.rates, a, b) })));
      out = results.filter((r) => r && isNum(r.v));
      const live = marketRate(a, b);
      if (isNum(live)) out.push({ date: end, v: live });
      out.sort((x, y) => x.date.localeCompare(y.date));
      source = 'exchange-api daily snapshots';
      if (out.length < 2) throw new Error('No history');
    }
    const result = { pts: out, source, clamped };
    seriesCache.set(key, result);
    return result;
  }

  async function pool(items, size, fn) {
    const results = new Array(items.length);
    let i = 0;
    const worker = async () => {
      while (i < items.length) {
        const k = i++;
        try { results[k] = await fn(items[k]); } catch { results[k] = null; }
      }
    };
    await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
    return results;
  }

  function renderChartHead() {
    el.chartTitle.innerHTML = `<span class="pair-flags">${flagHTML(state.from, 'xs')}${flagHTML(state.to, 'xs')}</span>${state.from} / ${state.to} · market`;
    const r = marketRate(state.from, state.to);
    el.chartRate.innerHTML = `${isNum(r) ? esc(fmtRate(r)) : '—'}<small>${state.to}</small>`;
    $$('button', el.rangeSeg).forEach((b) => b.setAttribute('aria-checked', String(+b.dataset.range === state.range)));
  }

  function setChartState(html) {
    el.chartState.hidden = !html;
    el.chartState.innerHTML = html || '';
  }

  async function loadChart() {
    const token = ++chart.token;
    const { from, to, range } = state;
    renderChartHead();
    el.chartTip.hidden = true;
    if (from === to) {
      chart.data = []; drawChart(); renderStats();
      setChartState('<div>Same currency on both sides — nothing to chart.</div>'); el.chartDelta.innerHTML = ''; el.chartNote.textContent = '';
      return;
    }
    if (!chart.data.length) setChartState('<div><div class="loader"><i></i><i></i><i></i><i></i><i></i></div>Loading history…</div>');
    else el.chartBox.style.opacity = '.55';
    try {
      const { pts, source, clamped } = await getSeries(from, to, range);
      if (token !== chart.token) return;
      chart.data = pts; chart.hover = -1;
      setChartState('');
      el.chartNote.textContent = `${pts.length} points · ${source}${clamped ? ` · history for this pair starts ${fmtDate(FAWAZ_EARLIEST)}` : ''}`;
    } catch {
      if (token !== chart.token) return;
      chart.data = [];
      setChartState(`<div>${navigator.onLine ? 'History isn’t available for this pair right now.' : 'You’re offline — charts need a connection.'}<br><button class="link" type="button" id="chartRetry">Try again</button></div>`);
      el.chartNote.textContent = '';
    } finally {
      if (token === chart.token) el.chartBox.style.opacity = '';
    }
    drawChart(); renderStats();
  }

  /** New real-time tick: move the chart's last point instead of reloading history. */
  function refreshChartTail() {
    const d = chart.data;
    if (d.length < 2 || state.from === state.to) return;
    const live = marketRate(state.from, state.to);
    if (!isNum(live)) return;
    const end = state.ratesDate || todayISO();
    const last = d[d.length - 1];
    if (last.date === end) last.v = live;
    else if (last.date < end) d.push({ date: end, v: live });
    drawChart(); renderStats();
  }

  function renderStats() {
    const d = chart.data;
    if (d.length < 2) {
      [el.stOpen, el.stHigh, el.stLow, el.stAvg, el.stVol].forEach((n) => (n.textContent = '—'));
      el.chartDelta.innerHTML = ''; return;
    }
    const vals = d.map((p) => p.v);
    const hi = Math.max(...vals), lo = Math.min(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const rets = [];
    for (let i = 1; i < vals.length; i++) rets.push(Math.log(vals[i] / vals[i - 1]));
    const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
    const sd = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, rets.length - 1));
    el.stOpen.textContent = fmtRate(vals[0]);
    el.stHigh.textContent = fmtRate(hi);
    el.stLow.textContent = fmtRate(lo);
    el.stAvg.textContent = fmtRate(avg);
    el.stVol.textContent = isNum(sd) ? `${nf(2, 2).format(sd * 100)}%` : '—';
    el.stVol.title = 'Standard deviation of returns between points';
    [el.stOpen, el.stHigh, el.stLow, el.stAvg].forEach((n) => (n.title = n.textContent));
    const ch = (vals[vals.length - 1] / vals[0] - 1) * 100;
    const label = { 7: '1W', 30: '1M', 90: '3M', 182: '6M', 365: '1Y', 1826: '5Y' }[state.range] || '';
    el.chartDelta.innerHTML = changePill(ch, label);
  }

  function cssVar(name) { return getComputedStyle(el.root).getPropertyValue(name).trim(); }

  function drawChart() {
    const cv = el.canvas;
    const box = el.chartBox.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = Math.max(10, Math.floor(box.width)), H = Math.max(10, Math.floor(box.height));
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const d = chart.data;
    if (d.length < 2) return;

    const ink = cssVar('--ink'), muted = cssVar('--muted'), line = cssVar('--line'), surface = cssVar('--surface');
    const up = (d[d.length - 1].v >= d[0].v);
    const col = up ? cssVar('--up') : cssVar('--down');
    const monoFont = `11px ${cssVar('--f-mono') || 'monospace'}`;

    const vals = d.map((p) => p.v);
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (hi === lo) { hi += hi * 0.01 || 1; lo -= lo * 0.01 || 1; }
    const pad = (hi - lo) * 0.12; lo -= pad; hi += pad;
    ctx.font = `600 ${monoFont}`;
    const labelW = Math.max(...[hi, lo, (hi + lo) / 2, vals[vals.length - 1]].map((v) => ctx.measureText(fmtRate(v)).width));
    const padL = 8, padT = 16, padB = 26;
    const padR = clamp(Math.ceil(labelW) + 24, 56, Math.floor(W * 0.4));
    const t0 = parseISO(d[0].date).getTime(), t1 = parseISO(d[d.length - 1].date).getTime();
    const x = (i) => padL + ((parseISO(d[i].date).getTime() - t0) / Math.max(1, t1 - t0)) * (W - padL - padR);
    const y = (v) => padT + (1 - (v - lo) / (hi - lo)) * (H - padT - padB);
    chart.geom = { x, y, padL, padR, W, H, padT, padB };

    // grid + y labels
    ctx.font = monoFont; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    for (let g = 0; g <= 4; g++) {
      const v = lo + ((hi - lo) * g) / 4;
      const yy = Math.round(y(v)) + 0.5;
      ctx.strokeStyle = line; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(padL, yy); ctx.lineTo(W - padR + 6, yy); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = muted; ctx.fillText(fmtRate(v), W - padR + 12, yy);
    }
    // x labels
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    const ticks = W < 420 ? 3 : 5;
    const span = daysBetween(d[0].date, d[d.length - 1].date);
    const dOpts = span > 400 ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' };
    for (let k = 0; k < ticks; k++) {
      const i = Math.round(((d.length - 1) * k) / (ticks - 1));
      const xx = clamp(x(i), padL + 22, W - padR - 22);
      ctx.fillStyle = muted; ctx.fillText(fmtDate(d[i].date, dOpts), xx, H - 7);
    }

    // area
    const grad = ctx.createLinearGradient(0, padT, 0, H - padB);
    grad.addColorStop(0, hexA(col, 0.28)); grad.addColorStop(1, hexA(col, 0));
    ctx.beginPath();
    ctx.moveTo(x(0), y(d[0].v));
    for (let i = 1; i < d.length; i++) ctx.lineTo(x(i), y(d[i].v));
    ctx.lineTo(x(d.length - 1), H - padB); ctx.lineTo(x(0), H - padB); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    // line
    ctx.beginPath();
    ctx.moveTo(x(0), y(d[0].v));
    for (let i = 1; i < d.length; i++) ctx.lineTo(x(i), y(d[i].v));
    ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();

    // high / low markers
    const iHi = vals.indexOf(Math.max(...vals)), iLo = vals.indexOf(Math.min(...vals));
    [[iHi, 'H', -1], [iLo, 'L', 1]].forEach(([i, lab, dir]) => {
      const xx = x(i), yy = y(d[i].v);
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(xx, yy, 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.font = `600 ${monoFont}`; ctx.textAlign = 'center';
      ctx.fillText(lab, clamp(xx, padL + 8, W - padR - 8), yy + dir * 11 + (dir > 0 ? 4 : 0));
    });
    // last point + price tag
    const lx = x(d.length - 1), ly = y(d[d.length - 1].v);
    ctx.fillStyle = hexA(col, 0.22); ctx.beginPath(); ctx.arc(lx, ly, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(lx, ly, 3.6, 0, Math.PI * 2); ctx.fill();
    const tag = fmtRate(d[d.length - 1].v);
    ctx.font = `600 ${monoFont}`;
    const tw = ctx.measureText(tag).width + 12;
    const ty = clamp(ly, padT + 9, H - padB - 9);
    roundRect(ctx, W - padR + 6, ty - 9, Math.min(tw, padR - 8), 18, 5); ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = surface; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(tag, W - padR + 12, ty + 0.5);

    // hover crosshair
    if (chart.hover >= 0 && chart.hover < d.length) {
      const hx = x(chart.hover), hy = y(d[chart.hover].v);
      ctx.strokeStyle = ink; ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
      ctx.beginPath(); ctx.moveTo(hx, padT); ctx.lineTo(hx, H - padB); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(padL, hy); ctx.lineTo(W - padR, hy); ctx.stroke();
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      ctx.fillStyle = surface; ctx.beginPath(); ctx.arc(hx, hy, 5.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.stroke();
    }
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function hexA(color, a) {
    const c = color.trim();
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
    if (m) {
      let h = m[1]; if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
      const n = parseInt(h, 16);
      return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
    }
    return c;
  }

  function chartPointer(e) {
    const d = chart.data; if (d.length < 2 || !chart.geom) return;
    const rect = el.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < d.length; i++) { const dist = Math.abs(chart.geom.x(i) - mx); if (dist < bestDist) { bestDist = dist; best = i; } }
    if (best === chart.hover) return;
    chart.hover = best; drawChart();
    const p = d[best];
    const ch = (p.v / d[0].v - 1) * 100;
    el.chartTip.innerHTML = `<b>${esc(fmtRate(p.v))} ${state.to}</b><span>${esc(fmtDate(p.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }))} · ${fmtPct(ch)}</span>`;
    el.chartTip.hidden = false;
    const tipW = el.chartTip.offsetWidth;
    const bx = el.chartBox.clientWidth;
    const px = chart.geom.x(best);
    el.chartTip.style.left = `${clamp(px, tipW / 2 + 4, bx - tipW / 2 - 4)}px`;
    const py = chart.geom.y(p.v);
    el.chartTip.style.top = `${py > 80 ? py - 62 : py + 16}px`;
  }
  el.canvas.addEventListener('pointermove', chartPointer);
  el.canvas.addEventListener('pointerdown', chartPointer);
  el.canvas.addEventListener('pointerleave', () => { chart.hover = -1; el.chartTip.hidden = true; drawChart(); });
  el.chartState.addEventListener('click', (e) => { if (e.target.id === 'chartRetry') { seriesCache.clear(); loadChart(); } });
  el.rangeSeg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-range]'); if (!b) return;
    setRange(+b.dataset.range);
  });
  function setRange(r) {
    if (state.range === r) return;
    state.range = r; store.set('range', r); loadChart();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => drawChart());
  if ('ResizeObserver' in window) new ResizeObserver(() => drawChart()).observe(el.chartBox);
  else window.addEventListener('resize', debounce(drawChart, 100));

  /* ------------------------------------------------------------------
   * Copy / share / speak / voice
   * ------------------------------------------------------------------ */
  function resultText() {
    if (!isNum(fromValue) || !isNum(toValue)) return '';
    return `${fmtMoney(fromValue, state.from)} ${state.from} = ${fmtMoney(toValue, state.to)} ${state.to}`;
  }
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch { ok = false; }
      ta.remove(); return ok;
    }
  }
  async function copyResult() {
    const t = resultText();
    if (!t) { toast('Nothing to copy yet', 'error'); return; }
    const ok = await copyText(t);
    toast(ok ? `Copied “${t}”` : 'Copy failed — the browser blocked the clipboard', ok ? 'ok' : 'error');
  }
  function shareUrl() {
    const u = new URL(location.href);
    u.search = '';
    u.searchParams.set('from', state.from); u.searchParams.set('to', state.to);
    if (isNum(fromValue)) u.searchParams.set('amount', String(+fromValue.toPrecision(12)));
    u.hash = '';
    return u.toString();
  }
  async function share() {
    const url = shareUrl();
    const text = resultText();
    if (navigator.share && /^https?:/.test(location.protocol)) {
      try { await navigator.share({ title: 'Currency conversion', text, url }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    const ok = await copyText(url);
    toast(ok ? 'Link copied — it opens this exact conversion' : 'Couldn’t copy the link', ok ? 'ok' : 'error');
  }
  const queueUrl = debounce(() => {
    try { history.replaceState(null, '', shareUrl()); } catch { /* file:// in some browsers */ }
  }, 600);

  function speak() {
    if (!('speechSynthesis' in window)) { toast('Speech isn’t supported in this browser', 'error'); return; }
    if (!isNum(fromValue) || !isNum(toValue)) { toast('Nothing to read yet', 'error'); return; }
    speechSynthesis.cancel();
    const NO_PLURAL = /^(yen|won|yuan|baht|rand|kip|riel|kyat|taka|som|somoni|tenge|vatu|kina|rufiyaa|ariary|đồng|tālā|paʻanga|pula|naira|real|loti|lilangeni|złoty|forint|koruna|krona|króna|krone|leu|lev|lek|renminbi)$/i;
    const say = (v, c) => {
      const m = meta(c);
      const name = m.name.split(' · ')[0];
      const last = name.split(' ').pop();
      const plural = v !== 1 && m.type === 'fiat' && !/s$/i.test(last) && !NO_PLURAL.test(last);
      return `${fmtMoney(v, c).replace(/[\u202f\u00a0]/g, ' ')} ${name}${plural ? 's' : ''}`;
    };
    const u = new SpeechSynthesisUtterance(`${say(fromValue, state.from)} is ${say(toValue, state.to)}`);
    u.lang = 'en-US'; u.rate = 1;
    speechSynthesis.speak(u);
  }

  const ALIASES = {
    dollar: 'USD', dollars: 'USD', bucks: 'USD', buck: 'USD', usd: 'USD', euro: 'EUR', euros: 'EUR', pound: 'GBP', pounds: 'GBP', sterling: 'GBP', quid: 'GBP',
    yen: 'JPY', yuan: 'CNY', renminbi: 'CNY', rmb: 'CNY', rupee: 'INR', rupees: 'INR', won: 'KRW', franc: 'CHF', francs: 'CHF', peso: 'MXN', pesos: 'MXN',
    real: 'BRL', reais: 'BRL', rand: 'ZAR', baht: 'THB', ringgit: 'MYR', dirham: 'AED', dirhams: 'AED', riyal: 'SAR', lira: 'TRY', ruble: 'RUB', rubles: 'RUB',
    rouble: 'RUB', zloty: 'PLN', krona: 'SEK', krone: 'NOK', shekel: 'ILS', shekels: 'ILS', naira: 'NGN', dong: 'VND', rupiah: 'IDR', taka: 'BDT',
    bitcoin: 'BTC', bitcoins: 'BTC', ether: 'ETH', ethereum: 'ETH', gold: 'XAU', silver: 'XAG', canadian: 'CAD', australian: 'AUD', nepali: 'NPR', nepalese: 'NPR',
    pakistani: 'PKR', 'sri': 'LKR', singapore: 'SGD', 'hong': 'HKD', 'new zealand': 'NZD', kiwi: 'NZD', swiss: 'CHF', japanese: 'JPY', indian: 'INR', mexican: 'MXN',
  };
  function parseSpoken(text) {
    const t = ` ${text.toLowerCase().replace(/[,]/g, '')} `;
    const numMatch = /(\d+(?:\.\d+)?)\s*(thousand|million|billion|k)?/.exec(t);
    let amount = numMatch ? parseFloat(numMatch[1]) * ({ thousand: 1e3, k: 1e3, million: 1e6, billion: 1e9 }[numMatch[2]] || 1) : NaN;
    const found = [];
    const words = t.split(/[^a-z]+/).filter(Boolean);
    for (let i = 0; i < words.length; i++) {
      const two = `${words[i]} ${words[i + 1] || ''}`;
      let code = ALIASES[two] || null;
      if (code) i++;
      else if (ALIASES[words[i]]) code = ALIASES[words[i]];
      else if (words[i].length === 3 && META[words[i].toUpperCase()]) code = words[i].toUpperCase();
      else {
        const byName = CATALOGUE.find((c) => c.name.toLowerCase().split(/\s+/)[0] === words[i] && words[i].length > 4);
        if (byName) code = byName.code;
      }
      if (code && found[found.length - 1] !== code) found.push(code);
    }
    // "rupees" after "nepali" → NPR already caught; drop generic duplicates like INR following NPR
    const dedup = found.filter((c, i) => !(i > 0 && (c === 'INR' || c === 'USD') && /^(NPR|PKR|LKR|CAD|AUD|SGD|HKD|NZD)$/.test(found[i - 1])));
    return { amount, codes: dedup };
  }
  function setupVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    el.voiceBtn.hidden = false;
    let rec = null;
    el.voiceBtn.addEventListener('click', () => {
      if (rec) { rec.stop(); return; }
      rec = new SR();
      rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
      el.voiceBtn.classList.add('listening');
      toast('Listening… try “250 euros to yen”', 'info');
      rec.onresult = (ev) => {
        const said = ev.results[0][0].transcript;
        const { amount, codes } = parseSpoken(said);
        let from = state.from, to = state.to;
        if (codes.length >= 2) { from = codes[0]; to = codes[1]; } else if (codes.length === 1) { if (/\bto\b|\bin\b|\binto\b/.test(said.toLowerCase()) && !isNum(amount)) to = codes[0]; else from = codes[0]; }
        if (isNum(amount)) { el.fromAmount.value = toInputString(amount, from); state.lastEdited = 'from'; }
        if (from === to) to = state.from === from ? state.to : state.from;
        setPair(from, to);
        toast(`Heard “${said}”`, 'ok');
      };
      rec.onerror = (ev) => { if (ev.error !== 'aborted') toast(ev.error === 'not-allowed' ? 'Microphone permission denied' : 'Didn’t catch that', 'error'); };
      rec.onend = () => { el.voiceBtn.classList.remove('listening'); rec = null; };
      try { rec.start(); } catch { el.voiceBtn.classList.remove('listening'); rec = null; }
    });
  }

  /* ------------------------------------------------------------------
   * Toasts
   * ------------------------------------------------------------------ */
  function toast(msg, type = 'ok', ms = 2600) {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span class="ti">${type === 'error' ? '!' : type === 'info' ? 'i' : '✓'}</span><span></span>`;
    t.lastChild.textContent = msg;
    el.toasts.appendChild(t);
    while (el.toasts.children.length > 3) el.toasts.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 260); }, ms);
  }

  /* ------------------------------------------------------------------
   * Theme & settings
   * ------------------------------------------------------------------ */
  const mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  function applyTheme() {
    const t = state.settings.theme;
    if (t === 'system') el.root.removeAttribute('data-theme'); else el.root.setAttribute('data-theme', t);
    el.themeBtn.dataset.mode = t;
    el.themeBtn.title = `Theme: ${{ system: 'System', light: 'Paper', dark: 'Ink' }[t]} (D)`;
    $$('button', el.themeSeg).forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themeOpt === t)));
    const dark = t === 'dark' || (t === 'system' && mql && mql.matches);
    $$('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', dark ? '#0d0e0c' : '#efe9dc'));
    el.root.classList.toggle('no-flap', !state.settings.flap);
    requestAnimationFrame(drawChart);
  }
  function cycleTheme() {
    const order = ['system', 'light', 'dark'];
    state.settings.theme = order[(order.indexOf(state.settings.theme) + 1) % 3];
    save.settings(); applyTheme();
    toast(`Theme: ${{ system: 'System', light: 'Paper', dark: 'Ink' }[state.settings.theme]}`, 'info', 1400);
  }
  if (mql) (mql.addEventListener ? mql.addEventListener('change', applyTheme) : mql.addListener(applyTheme));

  function syncSettingsUI() {
    el.setLocale.value = state.settings.locale;
    el.setPrecision.value = String(state.settings.precision);
    el.setRefresh.value = String(state.settings.refresh);
    el.setSource.value = state.settings.source;
    el.sourceHint.textContent = state.settings.source === 'realtime'
      ? 'Live market rates from Coinbase’s public feed (no sign-up), checked against the daily set. Currencies it doesn’t cover use the daily rate.'
      : 'Official daily reference rates (ECB & exchange-api). They change once a day.';
    el.setCrypto.checked = !!state.settings.crypto;
    el.setMotion.checked = !!state.settings.flap;
  }

  let refreshTimer = null;
  function scheduleRefresh() {
    clearInterval(refreshTimer);
    if (+state.settings.refresh > 0) refreshTimer = setInterval(() => { if (!document.hidden) loadRates(); }, +state.settings.refresh);
  }

  el.themeSeg.addEventListener('click', (e) => { const b = e.target.closest('[data-theme-opt]'); if (!b) return; state.settings.theme = b.dataset.themeOpt; save.settings(); applyTheme(); });
  el.setLocale.addEventListener('change', () => {
    // keep the typed number's value when the decimal mark changes
    const fv = fromValue, tv = toValue, side = state.lastEdited;
    state.settings.locale = el.setLocale.value; save.settings(); resolveLocale();
    if (side === 'from' && isNum(fv)) el.fromAmount.value = toInputString(fv, state.from);
    if (side === 'to' && isNum(tv)) el.toAmount.value = toInputString(tv, state.to);
    renderAll();
  });
  el.setPrecision.addEventListener('change', () => { state.settings.precision = el.setPrecision.value; save.settings(); renderAll(); });
  el.setRefresh.addEventListener('change', () => { state.settings.refresh = +el.setRefresh.value; save.settings(); scheduleRefresh(); });
  el.setSource.addEventListener('change', () => {
    state.settings.source = el.setSource.value; save.settings(); syncSettingsUI();
    loadRates().then(() => toast(state.settings.source === 'realtime'
      ? (state.source === 'realtime' ? 'Real-time rates on' : 'Real-time feed unreachable — using daily rates')
      : 'Using daily reference rates', state.settings.source === 'realtime' && state.source !== 'realtime' ? 'error' : 'ok'));
  });
  el.setCrypto.addEventListener('change', () => { state.settings.crypto = el.setCrypto.checked; save.settings(); });
  el.setMotion.addEventListener('change', () => { state.settings.flap = el.setMotion.checked; save.settings(); applyTheme(); });

  el.exportDataBtn.addEventListener('click', () => {
    const data = {
      app: 'tender', version: 1, exported: new Date().toISOString(),
      settings: state.settings, starred: state.starred, compare: state.compare, pairs: state.pairs, history: state.history,
      alerts: state.alerts, custom: state.custom, fees: state.fees, tally: state.tally, from: state.from, to: state.to,
    };
    download(`tender-backup-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json');
  });
  el.importData.addEventListener('change', async () => {
    const file = el.importData.files && el.importData.files[0];
    el.importData.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data || data.app !== 'tender') throw new Error('not ours');
      const arr = (v, f) => (Array.isArray(v) ? v.filter(f) : null);
      const okCode = (c) => typeof c === 'string' && !!META[c];
      if (data.settings && typeof data.settings === 'object') state.settings = sanitizeSettings(data.settings);
      state.starred = arr(data.starred, okCode) || state.starred;
      state.compare = arr(data.compare, okCode) || state.compare;
      state.pairs = arr(data.pairs, (p) => p && okCode(p.from) && okCode(p.to)) || state.pairs;
      state.history = (arr(data.history, (h) => h && okCode(h.from) && okCode(h.to) && isNum(h.a) && isNum(h.b) && isNum(h.t) && isNum(h.r)) || state.history).slice(0, 50);
      state.alerts = arr(data.alerts, (a) => a && okCode(a.from) && okCode(a.to) && isNum(a.value) && (a.cond === 'above' || a.cond === 'below')) || state.alerts;
      if (data.custom && typeof data.custom === 'object' && !Array.isArray(data.custom)) {
        state.custom = Object.fromEntries(Object.entries(data.custom).filter(([, c]) => c && isNum(c.rate) && c.rate > 0).map(([k, c]) => [k, { on: !!c.on, rate: c.rate }]));
      }
      if (data.fees && typeof data.fees === 'object') state.fees = { margin: +data.fees.margin || 0, flat: +data.fees.flat || 0 };
      if (data.tally) state.tally = sanitizeTally(data.tally);
      ['starred', 'compare', 'pairs', 'history', 'alerts', 'custom', 'fees', 'tally'].forEach((k) => store.set(k, state[k]));
      save.settings();
      if (okCode(data.from) && okCode(data.to)) { state.from = data.from; state.to = data.to; save.pair(); }
      el.feeMargin.value = state.fees.margin; el.feeFlat.value = state.fees.flat;
      resolveLocale(); applyTheme(); syncSettingsUI(); scheduleRefresh(); renderAll(); loadChart();
      toast('Backup restored', 'ok');
    } catch { toast('That file isn’t a Tender backup', 'error'); }
  });
  el.resetBtn.addEventListener('click', () => {
    if (!confirm('Reset all settings, history, saved pairs, alerts and custom rates?')) return;
    store.clear();
    location.href = location.pathname;
  });

  /* ------------------------------------------------------------------
   * Tabs
   * ------------------------------------------------------------------ */
  function setTab(name, focus = false) {
    state.tab = name; store.set('tab', name);
    $$('[role="tab"]', el.tabs).forEach((t) => {
      const on = t.dataset.tab === name;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    $$('.tab-panel').forEach((p) => (p.hidden = p.dataset.panel !== name));
  }
  el.tabs.addEventListener('click', (e) => { const t = e.target.closest('[role="tab"]'); if (t) setTab(t.dataset.tab); });
  el.tabs.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const tabs = $$('[role="tab"]', el.tabs);
    const i = tabs.findIndex((t) => t.dataset.tab === state.tab);
    const j = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    setTab(tabs[j].dataset.tab, true);
  });

  /* ------------------------------------------------------------------
   * Wiring: converter inputs
   * ------------------------------------------------------------------ */
  el.fromAmount.addEventListener('input', () => { state.lastEdited = 'from'; recompute(); });
  el.toAmount.addEventListener('input', () => { state.lastEdited = 'to'; recompute(); });
  el.toAmount.addEventListener('focus', () => {
    // show an editable plain number (not the flap formatting)
    if (state.lastEdited === 'from') el.toAmount.value = isNum(toValue) ? toInputString(toValue, state.to) : '';
    requestAnimationFrame(() => el.toAmount.select());
  });
  const commitExpr = (input, side) => {
    // On blur/Enter, replace an expression with its result (calculator-style).
    if (state.lastEdited !== side) return;
    const res = evaluate(input.value);
    if (res.expr && isNum(res.value) && res.value >= 0) {
      input.value = toInputString(res.value, side === 'from' ? state.from : state.to);
      recompute({ animate: false });
    }
  };
  el.fromAmount.addEventListener('blur', () => commitExpr(el.fromAmount, 'from'));
  el.toAmount.addEventListener('blur', () => { commitExpr(el.toAmount, 'to'); renderFlap(false); });
  [el.fromAmount, el.toAmount].forEach((input) => {
    const side = input === el.fromAmount ? 'from' : 'to';
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commitExpr(input, side); }
      if (e.key === 'Escape' && input.value) { e.preventDefault(); input.value = ''; state.lastEdited = side; recompute(); }
      if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && !e.altKey && !e.metaKey && !e.ctrlKey) {
        const res = evaluate(input.value);
        const cur = isNum(res.value) ? res.value : 0;
        const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
        e.preventDefault();
        input.value = toInputString(Math.max(0, +(cur + step).toFixed(10)), side === 'from' ? state.from : state.to);
        state.lastEdited = side; recompute({ animate: false });
      }
    });
    input.addEventListener('paste', () => setTimeout(() => { state.lastEdited = side; recompute(); }, 0));
  });
  el.chips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-amt]'); if (!b) return;
    el.fromAmount.value = toInputString(+b.dataset.amt, state.from);
    state.lastEdited = 'from'; recompute();
  });

  el.fromBtn.addEventListener('click', () => openPicker('from', el.fromBtn));
  el.toBtn.addEventListener('click', () => openPicker('to', el.toBtn));
  el.addCompareBtn.addEventListener('click', () => openPicker('compare', el.addCompareBtn));
  el.swapBtn.addEventListener('click', swap);
  el.copyBtn.addEventListener('click', copyResult);
  el.shareBtn.addEventListener('click', share);
  el.favPairBtn.addEventListener('click', toggleFavPair);
  el.speakBtn.addEventListener('click', speak);
  el.printBtn.addEventListener('click', () => { setTab('cheat'); window.print(); });
  el.exportHistoryBtn.addEventListener('click', exportHistoryCSV);
  el.clearHistoryBtn.addEventListener('click', () => {
    if (!state.history.length) return;
    if (!confirm('Clear all conversion history?')) return;
    state.history = []; store.set('history', []); renderHistory(); toast('History cleared', 'ok');
  });
  el.refreshBtn.addEventListener('click', () => { seriesCache.clear(); loadRates({ manual: true, forceChart: true }); });
  el.themeBtn.addEventListener('click', cycleTheme);
  el.helpBtn.addEventListener('click', () => el.help.showModal());
  el.settingsBtn.addEventListener('click', () => { syncSettingsUI(); el.settings.showModal(); });

  // Picker interactions
  el.pickerSearch.addEventListener('input', renderPicker);
  el.pickerSearch.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveActive(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveActive(-1); }
    else if (e.key === 'PageDown') { e.preventDefault(); for (let i = 0; i < 8; i++) moveActive(1); }
    else if (e.key === 'PageUp') { e.preventDefault(); for (let i = 0; i < 8; i++) moveActive(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); choosePicker(picker.active); }
  });
  el.pickerFilters.addEventListener('click', (e) => { const b = e.target.closest('[data-filter]'); if (b) { setPickerFilter(b.dataset.filter); el.pickerSearch.focus(); } });
  el.pickerList.addEventListener('click', (e) => {
    const star = e.target.closest('[data-star]');
    if (star) {
      e.stopPropagation();
      toggleStar(star.dataset.star);
      const on = state.starred.includes(star.dataset.star);
      // update in place (no re-render so the list doesn't jump)
      $$(`[data-star="${star.dataset.star}"]`, el.pickerList).forEach((s) => { s.classList.toggle('on', on); s.setAttribute('aria-label', `${on ? 'Unstar' : 'Star'} ${star.dataset.star}`); });
      el.pickerSearch.focus();
      return;
    }
    const opt = e.target.closest('.opt');
    if (opt) choosePicker(+opt.dataset.i);
  });
  el.pickerList.addEventListener('mousemove', (e) => {
    const opt = e.target.closest('.opt');
    if (opt && +opt.dataset.i !== picker.active && !opt.classList.contains('disabled')) setActive(+opt.dataset.i, false);
  });

  /* ------------------------------------------------------------------
   * Global keyboard shortcuts
   * ------------------------------------------------------------------ */
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) return;
    if ($$('dialog').some((d) => d.open)) return;
    const k = e.key;
    const map = {
      '/': () => { el.fromAmount.focus(); el.fromAmount.select(); },
      f: () => openPicker('from', el.fromBtn), t: () => openPicker('to', el.toBtn),
      s: swap, c: copyResult, p: toggleFavPair, d: cycleTheme,
      r: () => el.refreshBtn.click(), '?': () => el.help.showModal(),
    };
    const ranges = { 1: 7, 2: 30, 3: 90, 4: 182, 5: 365, 6: 1826 };
    const fn = map[k.toLowerCase()] || (ranges[k] ? () => setRange(ranges[k]) : null);
    if (fn) { e.preventDefault(); fn(); }
  });

  /* ------------------------------------------------------------------
   * Lifecycle
   * ------------------------------------------------------------------ */
  function renderAll() {
    renderRates({ animate: false });
    renderHistory();
    renderSerial();
  }

  window.addEventListener('online', () => { setStatus(); loadRates(); toast('Back online', 'ok'); });
  window.addEventListener('offline', () => { setStatus(); toast('You’re offline — using saved rates', 'info'); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.fetchedAt && Date.now() - state.fetchedAt > 30 * 60e3) loadRates();
  });
  setInterval(() => setStatus(), 10000);
  window.addEventListener('storage', (e) => {
    // keep multiple tabs in sync for lists
    if (!e.key || !e.key.startsWith(PREFIX)) return;
    const k = e.key.slice(PREFIX.length);
    if (k === 'tally') { state.tally = sanitizeTally(store.get('tally', null)); renderTally(); return; }
    if (['pairs', 'history', 'alerts', 'starred', 'compare'].includes(k)) {
      state[k] = arrOf(store.get(k, state[k]), state[k]);
      renderPairs(); renderHistory(); renderAlerts(); renderCompare(); renderFavBtn();
    }
  });

  /* ------------------------------------------------------------------
   * Installable app + offline (needs http(s); not available from file://)
   * ------------------------------------------------------------------ */
  const isWeb = /^https?:$/.test(location.protocol);
  let installPrompt = null;
  function setupPWA() {
    if (!isWeb) { el.fileModeNote.hidden = false; return; }
    const link = document.createElement('link');
    link.rel = 'manifest'; link.href = 'manifest.webmanifest';
    document.head.appendChild(link);
    if ('serviceWorker' in navigator) {
      const hadController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.register('sw.js').catch(() => { /* e.g. plain http on a LAN IP */ });
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hadController) toast('Tender was updated — refresh to get the new version', 'info', 6000);
      });
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      installPrompt = e;
      el.installBtn.hidden = false;
    });
    window.addEventListener('appinstalled', () => {
      installPrompt = null; el.installBtn.hidden = true;
      toast('Installed — Tender now opens like an app and works offline', 'ok', 4000);
    });
    el.installBtn.addEventListener('click', async () => {
      if (!installPrompt) return;
      installPrompt.prompt();
      try { await installPrompt.userChoice; } catch { /* ignore */ }
      installPrompt = null; el.installBtn.hidden = true;
    });
  }

  // Boot
  setupPWA();
  resolveLocale();
  applyTheme();
  syncSettingsUI();
  el.feeMargin.value = state.fees.margin;
  el.feeFlat.value = state.fees.flat;
  {
    // URL amounts are always "." decimal; show them in the user's own format.
    const urlAmt = urlParams.get('amount') || urlParams.get('amt');
    const v = urlAmt != null ? parseFloat(urlAmt) : NaN;
    el.fromAmount.value = isNum(v) && v >= 0 ? toInputString(v, state.from) : initialAmount;
  }
  setTab(state.tab);
  setupVoice();
  bootFromCache();
  renderAll();
  if (state.rates) loadChart(); // draw from cache immediately
  loadRates();
  scheduleRefresh();

  // Expose a tiny debug/test hook
  window.__tender = { state, evaluate, amountInWords, parseSpoken, fmtMoney, rate };
})();
