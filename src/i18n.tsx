import React from 'react';

export type AppLanguage = 'es' | 'en' | 'zh' | 'hi' | 'pt' | 'fr' | 'ar' | 'ru';

export interface LanguageOption {
  code: AppLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

export const APP_LANGUAGES: LanguageOption[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文 (简体)', flag: '🇨🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
];

export interface WorldCurrency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  defaultRateUSD: number;
  region: string;
}

export const WORLD_CURRENCIES: WorldCurrency[] = [
  // Global Reserve & Major Currencies
  { code: 'USD', symbol: '$', name: 'Dólar Estadounidense (US Dollar)', flag: '🇺🇸', defaultRateUSD: 1.0, region: 'Global' },
  { code: 'EUR', symbol: '€', name: 'Euro (Zona Euro)', flag: '🇪🇺', defaultRateUSD: 0.92, region: 'Europa' },
  { code: 'CNY', symbol: '¥', name: 'Yuan Chino / Renminbi (人民币)', flag: '🇨🇳', defaultRateUSD: 7.24, region: 'Asia' },
  { code: 'INR', symbol: '₹', name: 'Rupia India (भारतीय रुपया)', flag: '🇮🇳', defaultRateUSD: 84.1, region: 'Asia' },
  { code: 'GBP', symbol: '£', name: 'Libra Esterlina (British Pound)', flag: '🇬🇧', defaultRateUSD: 0.77, region: 'Europa' },
  { code: 'JPY', symbol: '¥', name: 'Yen Japonés (日本円)', flag: '🇯🇵', defaultRateUSD: 152.5, region: 'Asia' },
  { code: 'RUB', symbol: '₽', name: 'Rublo Ruso (Российский рубль)', flag: '🇷🇺', defaultRateUSD: 96.5, region: 'Europa/Asia' },
  { code: 'AED', symbol: 'د.إ', name: 'Dírham EAU (UAE Dirham)', flag: '🇦🇪', defaultRateUSD: 3.67, region: 'Medio Oriente' },
  { code: 'SAR', symbol: '﷼', name: 'Riyal Saudí (Saudi Riyal)', flag: '🇸🇦', defaultRateUSD: 3.75, region: 'Medio Oriente' },
  { code: 'CAD', symbol: 'C$', name: 'Dólar Canadiense (Canadian Dollar)', flag: '🇨🇦', defaultRateUSD: 1.39, region: 'América' },
  { code: 'AUD', symbol: 'A$', name: 'Dólar Australiano (Australian Dollar)', flag: '🇦🇺', defaultRateUSD: 1.51, region: 'Oceanía' },
  { code: 'CHF', symbol: 'CHF', name: 'Franco Suizo (Swiss Franc)', flag: '🇨🇭', defaultRateUSD: 0.87, region: 'Europa' },
  { code: 'KRW', symbol: '₩', name: 'Won Surcoreano (한국 원)', flag: '🇰🇷', defaultRateUSD: 1380.0, region: 'Asia' },
  { code: 'SGD', symbol: 'S$', name: 'Dólar de Singapur (Singapore Dollar)', flag: '🇸🇬', defaultRateUSD: 1.32, region: 'Asia' },
  { code: 'HKD', symbol: 'HK$', name: 'Dólar de Hong Kong (港幣)', flag: '🇭🇰', defaultRateUSD: 7.77, region: 'Asia' },
  { code: 'TRY', symbol: '₺', name: 'Lira Turca (Türk Lirası)', flag: '🇹🇷', defaultRateUSD: 34.25, region: 'Europa/Asia' },
  { code: 'PKR', symbol: '₨', name: 'Rupia Pakistaní (Pakistani Rupee)', flag: '🇵🇰', defaultRateUSD: 277.8, region: 'Asia' },
  { code: 'BDT', symbol: '৳', name: 'Taka Bangladesí (Bangladeshi Taka)', flag: '🇧🇩', defaultRateUSD: 119.5, region: 'Asia' },
  { code: 'THB', symbol: '฿', name: 'Baht Tailandés (Thai Baht)', flag: '🇹🇭', defaultRateUSD: 33.8, region: 'Asia' },
  { code: 'IDR', symbol: 'Rp', name: 'Rupia Indonesia (Indonesian Rupiah)', flag: '🇮🇩', defaultRateUSD: 15650.0, region: 'Asia' },
  { code: 'PHP', symbol: '₱', name: 'Peso Filipino (Philippine Peso)', flag: '🇵🇭', defaultRateUSD: 58.1, region: 'Asia' },
  { code: 'ZAR', symbol: 'R', name: 'Rand Sudafricano (South African Rand)', flag: '🇿🇦', defaultRateUSD: 17.65, region: 'África' },
  { code: 'NGN', symbol: '₦', name: 'Naira Nigeriana (Nigerian Naira)', flag: '🇳🇬', defaultRateUSD: 1640.0, region: 'África' },
  { code: 'EGP', symbol: 'E£', name: 'Libra Egipcia (Egyptian Pound)', flag: '🇪🇬', defaultRateUSD: 48.7, region: 'África' },
  // Latin America & Caribbean
  { code: 'VES', symbol: 'Bs.', name: 'Bolívar Venezolano (VES)', flag: '🇻🇪', defaultRateUSD: 42.5, region: 'Latinoamérica' },
  { code: 'COP', symbol: '$', name: 'Peso Colombiano (COP)', flag: '🇨🇴', defaultRateUSD: 4250.0, region: 'Latinoamérica' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino (ARS)', flag: '🇦🇷', defaultRateUSD: 995.0, region: 'Latinoamérica' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano (MXN)', flag: '🇲🇽', defaultRateUSD: 19.95, region: 'Latinoamérica' },
  { code: 'BRL', symbol: 'R$', name: 'Real Brasileño (BRL)', flag: '🇧🇷', defaultRateUSD: 5.75, region: 'Latinoamérica' },
  { code: 'CLP', symbol: '$', name: 'Peso Chileno (CLP)', flag: '🇨🇱', defaultRateUSD: 965.0, region: 'Latinoamérica' },
  { code: 'PEN', symbol: 'S/', name: 'Sol Peruano (PEN)', flag: '🇵🇪', defaultRateUSD: 3.76, region: 'Latinoamérica' },
  { code: 'UYU', symbol: '$U', name: 'Peso Uruguayo (UYU)', flag: '🇺🇾', defaultRateUSD: 41.6, region: 'Latinoamérica' },
  { code: 'DOP', symbol: 'RD$', name: 'Peso Dominicano (DOP)', flag: '🇩🇴', defaultRateUSD: 60.2, region: 'Latinoamérica' },
  { code: 'CRC', symbol: '₡', name: 'Colón Costarricense (CRC)', flag: '🇨🇷', defaultRateUSD: 513.0, region: 'Latinoamérica' },
  { code: 'GTQ', symbol: 'Q', name: 'Quetzal Guatemalteco (GTQ)', flag: '🇬🇹', defaultRateUSD: 7.73, region: 'Latinoamérica' },
  { code: 'BOB', symbol: 'Bs', name: 'Boliviano (BOB)', flag: '🇧🇴', defaultRateUSD: 6.91, region: 'Latinoamérica' },
  { code: 'PYG', symbol: '₲', name: 'Guaraní Paraguayo (PYG)', flag: '🇵🇾', defaultRateUSD: 7850.0, region: 'Latinoamérica' },
  { code: 'HNL', symbol: 'L', name: 'Lempira Hondureño (HNL)', flag: '🇭🇳', defaultRateUSD: 25.1, region: 'Latinoamérica' },
  { code: 'NIO', symbol: 'C$', name: 'Córdoba Nicaragüense (NIO)', flag: '🇳🇮', defaultRateUSD: 36.8, region: 'Latinoamérica' },
  { code: 'PAB', symbol: 'B/.', name: 'Balboa Panameño (PAB)', flag: '🇵🇦', defaultRateUSD: 1.0, region: 'Latinoamérica' },
];

export const WORLD_DEFAULT_RATES_MAP: Record<string, number> = WORLD_CURRENCIES.reduce(
  (acc, curr) => {
    acc[curr.code] = curr.defaultRateUSD;
    return acc;
  },
  {} as Record<string, number>
);

export const getCurrencySymbol = (code?: string): string => {
  if (!code) return '$';
  const found = WORLD_CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase());
  return found ? found.symbol : '$';
};

export const WORLD_COUNTRIES = [
  { code: 'VE', name: '🇻🇪 Venezuela' },
  { code: 'CO', name: '🇨🇴 Colombia' },
  { code: 'AR', name: '🇦🇷 Argentina' },
  { code: 'MX', name: '🇲🇽 México' },
  { code: 'CL', name: '🇨🇱 Chile' },
  { code: 'PE', name: '🇵🇪 Perú' },
  { code: 'BR', name: '🇧🇷 Brasil' },
  { code: 'US', name: '🇺🇸 Estados Unidos (USA)' },
  { code: 'CN', name: '🇨🇳 China (中国)' },
  { code: 'IN', name: '🇮🇳 India (भारत)' },
  { code: 'ES', name: '🇪🇸 España' },
  { code: 'PT', name: '🇵🇹 Portugal' },
  { code: 'FR', name: '🇫🇷 Francia (France)' },
  { code: 'GB', name: '🇬🇧 Reino Unido (UK)' },
  { code: 'DE', name: '🇩🇪 Alemania (Germany)' },
  { code: 'IT', name: '🇮🇹 Italia (Italy)' },
  { code: 'RU', name: '🇷🇺 Rusia (Россия)' },
  { code: 'AE', name: '🇦🇪 Emiratos Árabes Unidos (UAE)' },
  { code: 'SA', name: '🇸🇦 Arabia Saudita (Saudi Arabia)' },
  { code: 'JP', name: '🇯🇵 Japón (日本)' },
  { code: 'KR', name: '🇰🇷 Corea del Sur (대한민국)' },
  { code: 'CA', name: '🇨🇦 Canadá' },
  { code: 'AU', name: '🇦🇺 Australia' },
  { code: 'TR', name: '🇹🇷 Turquía (Türkiye)' },
  { code: 'ZA', name: '🇿🇦 Sudáfrica' },
  { code: 'PA', name: '🇵🇦 Panamá' },
  { code: 'DO', name: '🇩🇴 República Dominicana' },
  { code: 'EC', name: '🇪🇨 Ecuador' },
  { code: 'UY', name: '🇺🇾 Uruguay' },
  { code: 'BO', name: '🇧🇴 Bolivia' },
  { code: 'PY', name: '🇵🇾 Paraguay' },
  { code: 'CR', name: '🇨🇷 Costa Rica' },
  { code: 'GT', name: '🇬🇹 Guatemala' },
];

export interface TranslationSchema {
  appSubtitle: string;
  ownerLabel: string;
  masterBtn: string;
  configBtn: string;
  logoutBtn: string;
  tabSell: string;
  tabInventory: string;
  tabRates: string;
  tabDebtors: string;
  tabCatalog: string;
  tabCash: string;
  tabMetrics: string;
  tabBackup: string;
  searchPosPlaceholder: string;
  allCategories: string;
  noActiveCarts: string;
  addCartHint: string;
  newCartBtn: string;
  chargeBtn: string;
  creditBtn: string;
  hideItems: string;
  showItems: string;
  changeClientName: string;
  setupTitle: string;
  setupSubtitle: string;
  storeNameLabel: string;
  ownerFullNameLabel: string;
  countryLabel: string;
  dniLabel: string;
  appLanguageLabel: string;
  appLanguageHint: string;
  saveSetupBtn: string;
  inventoryTitle: string;
  inventorySubtitle: string;
  alertsInboxBtn: string;
  addProductBtn: string;
  catalogVisibleOn: string;
  catalogVisibleOff: string;
  editSimulateBtn: string;
  ratesPanelTitle: string;
  ratesPanelSubtitle: string;
  syncLiveBtn: string;
  syncingBtn: string;
  refRateTitle: string;
  primaryRateTitle: string;
  secondaryRateTitle: string;
  cryptoRateTitle: string;
  mandatoryBadge: string;
  optionalBadge: string;
  saveRatesBtn: string;
  lightMode: string;
  darkMode: string;
}

export const TRANSLATIONS: Record<AppLanguage, TranslationSchema> = {
  es: {
    appSubtitle: 'POS, Inventario y Catálogo Virtual Profesional',
    ownerLabel: 'Propietario',
    masterBtn: 'Maestro',
    configBtn: 'Ajustes',
    logoutBtn: 'Salir',
    tabSell: 'VENDER',
    tabInventory: 'Inventario',
    tabRates: 'Tasas',
    tabDebtors: 'Deudores / Fiado',
    tabCatalog: 'Catálogo',
    tabCash: 'Caja',
    tabMetrics: 'Métricas',
    tabBackup: 'Respaldo',
    searchPosPlaceholder: 'Buscar o escanear producto...',
    allCategories: 'Todos',
    noActiveCarts: 'Sin carritos activos',
    addCartHint: 'Agrega un carrito para colocar el nombre del cliente y vender',
    newCartBtn: 'Nuevo Carrito',
    chargeBtn: 'Cobrar 💳',
    creditBtn: 'Dejar Fiado 📝',
    hideItems: '▼ Ocultar',
    showItems: '▲ Ítems',
    changeClientName: 'Cambiar Nombre / Contacto',
    setupTitle: 'Ajustes e Idioma de tu Tienda',
    setupSubtitle: 'Configura tu tienda, idioma global y datos con tu ID Único:',
    storeNameLabel: 'Nombre de la Tienda',
    ownerFullNameLabel: 'Nombre Completo del Propietario',
    countryLabel: 'País',
    dniLabel: 'DNI / Cédula / Pasaporte / ID Fiscal',
    appLanguageLabel: 'Idioma de toda la Aplicación 🌐',
    appLanguageHint: 'Cambia el idioma de los menús, botones y paneles en tiempo real',
    saveSetupBtn: 'Guardar Ajustes y Entrar al Panel 🚀',
    inventoryTitle: 'Inventario Detallado de Productos',
    inventorySubtitle: 'Ficha técnica completa: costos, márgenes, ganancias, tasas, stock y catálogo web.',
    alertsInboxBtn: 'Bandeja de Avisos',
    addProductBtn: 'Agregar Nuevo Producto',
    catalogVisibleOn: 'En Catálogo Web (ON)',
    catalogVisibleOff: 'Oculto Catálogo (OFF)',
    editSimulateBtn: 'Editar / Simular',
    ratesPanelTitle: 'Panel Mundial de Tasas y Monedas',
    ratesPanelSubtitle: 'La Referencial y la Primaria son obligatorias. La Secundaria y Cripto tienen interruptor ON/OFF opcional.',
    syncLiveBtn: 'Sincronizar Tasas del Mundo Ahora',
    syncingBtn: 'Sincronizando...',
    refRateTitle: '1. Moneda de Referencia',
    primaryRateTitle: '2. Tasa Primaria (Letra Grande)',
    secondaryRateTitle: '3. Tasa Secundaria (Debajo Primaria)',
    cryptoRateTitle: '4. Tasa Cripto en Productos (Debajo)',
    mandatoryBadge: 'OBLIGATORIA',
    optionalBadge: 'OPCIONAL',
    saveRatesBtn: 'Guardar y Aplicar Tasas ✅',
    lightMode: 'Claro',
    darkMode: 'Oscuro',
  },
  en: {
    appSubtitle: 'Professional POS, Inventory & Virtual Catalog',
    ownerLabel: 'Owner',
    masterBtn: 'Master',
    configBtn: 'Settings',
    logoutBtn: 'Logout',
    tabSell: 'SELL (POS)',
    tabInventory: 'Inventory',
    tabRates: 'Rates',
    tabDebtors: 'Debtors / Credit',
    tabCatalog: 'Catalog',
    tabCash: 'Cashier',
    tabMetrics: 'Analytics',
    tabBackup: 'Backup',
    searchPosPlaceholder: 'Search or scan product...',
    allCategories: 'All',
    noActiveCarts: 'No active carts',
    addCartHint: 'Add a cart to set the customer name and start selling',
    newCartBtn: 'New Cart',
    chargeBtn: 'Charge 💳',
    creditBtn: 'On Credit 📝',
    hideItems: '▼ Hide',
    showItems: '▲ Items',
    changeClientName: 'Edit Name / Contact',
    setupTitle: 'Store Settings & Language',
    setupSubtitle: 'Configure your store, global language and details with your Unique ID:',
    storeNameLabel: 'Store Name',
    ownerFullNameLabel: 'Owner Full Name',
    countryLabel: 'Country',
    dniLabel: 'ID / Passport / Tax Number',
    appLanguageLabel: 'Application Language 🌐',
    appLanguageHint: 'Switch the language of all menus, buttons, and panels immediately',
    saveSetupBtn: 'Save Settings & Open Dashboard 🚀',
    inventoryTitle: 'Detailed Product Inventory',
    inventorySubtitle: 'Full specs: costs, margins, profit, multi-currency rates, stock & web catalog.',
    alertsInboxBtn: 'Alerts Inbox',
    addProductBtn: 'Add New Product',
    catalogVisibleOn: 'Web Catalog (ON)',
    catalogVisibleOff: 'Hidden Catalog (OFF)',
    editSimulateBtn: 'Edit / Simulate',
    ratesPanelTitle: 'Global Currency & Exchange Rates Panel',
    ratesPanelSubtitle: 'Reference & Primary rates are mandatory. Secondary & Crypto rates have ON/OFF switches.',
    syncLiveBtn: 'Sync World Rates Now',
    syncingBtn: 'Syncing...',
    refRateTitle: '1. Reference Currency',
    primaryRateTitle: '2. Primary Rate (Large Print)',
    secondaryRateTitle: '3. Secondary Rate (Below Primary)',
    cryptoRateTitle: '4. Crypto Rate on Products',
    mandatoryBadge: 'MANDATORY',
    optionalBadge: 'OPTIONAL',
    saveRatesBtn: 'Save & Apply Rates ✅',
    lightMode: 'Light',
    darkMode: 'Dark',
  },
  zh: {
    appSubtitle: '专业收银 POS、库存管理与虚拟商品目录',
    ownerLabel: '店主',
    masterBtn: '总控',
    configBtn: '设置',
    logoutBtn: '退出',
    tabSell: '收银销售',
    tabInventory: '库存管理',
    tabRates: '全球汇率',
    tabDebtors: '赊账 / 欠款客户',
    tabCatalog: '在线目录',
    tabCash: '收银箱',
    tabMetrics: '销售报表',
    tabBackup: '数据备份',
    searchPosPlaceholder: '搜索商品名称或扫描条形码...',
    allCategories: '全部',
    noActiveCarts: '暂无活动购物车',
    addCartHint: '点击添加购物车，输入客户姓名即可开始销售',
    newCartBtn: '新建购物车',
    chargeBtn: '收款结账 💳',
    creditBtn: '赊账记录 📝',
    hideItems: '▼ 收起',
    showItems: '▲ 商品明细',
    changeClientName: '修改客户姓名 / 联系人',
    setupTitle: '店铺设置与系统语言',
    setupSubtitle: '配置您的店铺信息、全球语言与专属唯一 ID：',
    storeNameLabel: '店铺名称',
    ownerFullNameLabel: '店主姓名',
    countryLabel: '国家 / 地区',
    dniLabel: '身份证 / 护照 / 营业执照号',
    appLanguageLabel: '整个应用程序的语言 🌐',
    appLanguageHint: '实时切换所有菜单、按钮和面板的显示语言',
    saveSetupBtn: '保存设置并进入控制台 🚀',
    inventoryTitle: '商品详细库存管理',
    inventorySubtitle: '完整规格：成本、利润率、净利润、多币种售价、库存预警与网店展示开关。',
    alertsInboxBtn: '库存通知箱',
    addProductBtn: '添加新商品',
    catalogVisibleOn: '网店目录显示 (ON)',
    catalogVisibleOff: '网店目录隐藏 (OFF)',
    editSimulateBtn: '编辑 / 模拟定价',
    ratesPanelTitle: '全球货币与自动汇率面板',
    ratesPanelSubtitle: '基准货币与主货币为必选项；次要货币和加密货币支持 ON/OFF 自由开关。',
    syncLiveBtn: '立即同步全球实时汇率',
    syncingBtn: '同步中...',
    refRateTitle: '1. 基准参考货币',
    primaryRateTitle: '2. 主要显示货币 (大字体)',
    secondaryRateTitle: '3. 次要显示货币 (主货币下方)',
    cryptoRateTitle: '4. 加密货币汇率显示',
    mandatoryBadge: '必选',
    optionalBadge: '可选开关',
    saveRatesBtn: '保存并应用汇率 ✅',
    lightMode: '浅色',
    darkMode: '深色',
  },
  hi: {
    appSubtitle: 'प्रोफेशनल पीओएस (POS), इन्वेंटरी और वर्चुअल कैटलॉग',
    ownerLabel: 'मालिक',
    masterBtn: 'मास्टर',
    configBtn: 'सेटिंग्स',
    logoutBtn: 'लॉग आउट',
    tabSell: 'बेचें (POS)',
    tabInventory: 'इन्वेंटरी (स्टॉक)',
    tabRates: 'मुद्रा दरें (Rates)',
    tabDebtors: 'उधार / देनदार',
    tabCatalog: 'कैटलॉग',
    tabCash: 'कैश बॉक्स',
    tabMetrics: 'रिपोर्ट्स',
    tabBackup: 'बैकअप',
    searchPosPlaceholder: 'उत्पाद खोजें या बारकोड स्कैन करें...',
    allCategories: 'सभी',
    noActiveCarts: 'कोई सक्रिय कार्ट नहीं है',
    addCartHint: 'ग्राहक का नाम दर्ज करने और बिक्री शुरू करने के लिए नया कार्ट जोड़ें',
    newCartBtn: 'नया कार्ट',
    chargeBtn: 'भुगतान लें 💳',
    creditBtn: 'उधार (खाता) 📝',
    hideItems: '▼ छिपाएं',
    showItems: '▲ आइटम',
    changeClientName: 'ग्राहक का नाम बदलें',
    setupTitle: 'दुकान सेटिंग्स और भाषा (Settings)',
    setupSubtitle: 'अपनी यूनिक आईडी के साथ अपनी दुकान और भाषा कॉन्फ़िगर करें:',
    storeNameLabel: 'दुकान का नाम',
    ownerFullNameLabel: 'मालिक का पूरा नाम',
    countryLabel: 'देश',
    dniLabel: 'पहचान पत्र / पासपोर्ट / पैन नंबर',
    appLanguageLabel: 'पूरे ऐप की भाषा चुनें 🌐',
    appLanguageHint: 'सभी मेनू और बटन की भाषा तुरंत बदलें',
    saveSetupBtn: 'सेटिंग्स सहेजें और डैशबोर्ड खोलें 🚀',
    inventoryTitle: 'विस्तृत उत्पाद इन्वेंटरी',
    inventorySubtitle: 'लागत, मार्जिन, मुनाफा, 4 मुद्रा दरें, स्टॉक अलर्ट और वेब कैटलॉग स्विच।',
    alertsInboxBtn: 'सूचना इनबॉक्स',
    addProductBtn: 'नया उत्पाद जोड़ें',
    catalogVisibleOn: 'वेब कैटलॉग में दृश्यमान (ON)',
    catalogVisibleOff: 'कैटलॉग से छिपा हुआ (OFF)',
    editSimulateBtn: 'संपादित करें',
    ratesPanelTitle: 'विश्व मुद्रा और विनिमय दर पैनल',
    ratesPanelSubtitle: 'रेफरेंस और प्राइमरी दरें अनिवार्य हैं। सेकेंडरी और क्रिप्टो दरें वैकल्पिक (ON/OFF) हैं।',
    syncLiveBtn: 'लाइव विश्व दरें सिंक करें',
    syncingBtn: 'सिंक हो रहा है...',
    refRateTitle: '1. संदर्भ मुद्रा (Reference)',
    primaryRateTitle: '2. प्राथमिक मुद्रा (बड़े अक्षर)',
    secondaryRateTitle: '3. द्वितीयक मुद्रा (नीचे)',
    cryptoRateTitle: '4. क्रिप्टो मुद्रा दर',
    mandatoryBadge: 'अनिवार्य',
    optionalBadge: 'वैकल्पिक',
    saveRatesBtn: 'दरें सहेजें और लागू करें ✅',
    lightMode: 'लाइट',
    darkMode: 'डार्क',
  },
  pt: {
    appSubtitle: 'PDV, Estoque e Catálogo Virtual Profissional',
    ownerLabel: 'Proprietário',
    masterBtn: 'Mestre',
    configBtn: 'Ajustes',
    logoutBtn: 'Sair',
    tabSell: 'VENDER',
    tabInventory: 'Estoque',
    tabRates: 'Câmbio',
    tabDebtors: 'Fiado / Devedores',
    tabCatalog: 'Catálogo',
    tabCash: 'Caixa',
    tabMetrics: 'Métricas',
    tabBackup: 'Backup',
    searchPosPlaceholder: 'Buscar ou escanear produto...',
    allCategories: 'Todos',
    noActiveCarts: 'Sem carrinhos ativos',
    addCartHint: 'Adicione um carrinho para colocar o nome do cliente e vender',
    newCartBtn: 'Novo Carrinho',
    chargeBtn: 'Cobrar 💳',
    creditBtn: 'Deixar Fiado 📝',
    hideItems: '▼ Ocultar',
    showItems: '▲ Itens',
    changeClientName: 'Mudar Nome / Contato',
    setupTitle: 'Ajustes e Idioma da Loja',
    setupSubtitle: 'Configure sua loja, idioma global e dados com seu ID Único:',
    storeNameLabel: 'Nome da Loja',
    ownerFullNameLabel: 'Nome Completo do Proprietário',
    countryLabel: 'País',
    dniLabel: 'CPF / RG / Passaporte',
    appLanguageLabel: 'Idioma de todo o Aplicativo 🌐',
    appLanguageHint: 'Altere o idioma dos menus, botões e painéis em tempo real',
    saveSetupBtn: 'Salvar Ajustes e Entrar no Painel 🚀',
    inventoryTitle: 'Estoque Detalhado de Produtos',
    inventorySubtitle: 'Ficha técnica completa: custos, margens, lucros, moedas, estoque e catálogo web.',
    alertsInboxBtn: 'Caixa de Avisos',
    addProductBtn: 'Adicionar Novo Produto',
    catalogVisibleOn: 'Visível no Catálogo (ON)',
    catalogVisibleOff: 'Oculto no Catálogo (OFF)',
    editSimulateBtn: 'Editar / Simular',
    ratesPanelTitle: 'Painel Mundial de Taxas e Moedas',
    ratesPanelSubtitle: 'Referência e Primária são obrigatórias. Secundária e Cripto têm botão ON/OFF opcional.',
    syncLiveBtn: 'Sincronizar Taxas ao Vivo Agora',
    syncingBtn: 'Sincronizando...',
    refRateTitle: '1. Moeda de Referência',
    primaryRateTitle: '2. Taxa Primária (Letra Grande)',
    secondaryRateTitle: '3. Taxa Secundária (Abaixo)',
    cryptoRateTitle: '4. Taxa Cripto nos Produtos',
    mandatoryBadge: 'OBRIGATÓRIA',
    optionalBadge: 'OPCIONAL',
    saveRatesBtn: 'Salvar e Aplicar Taxas ✅',
    lightMode: 'Claro',
    darkMode: 'Escuro',
  },
  fr: {
    appSubtitle: 'PDV, Inventaire et Catalogue Virtuel Professionnel',
    ownerLabel: 'Propriétaire',
    masterBtn: 'Admin',
    configBtn: 'Paramètres',
    logoutBtn: 'Quitter',
    tabSell: 'VENDRE',
    tabInventory: 'Inventaire',
    tabRates: 'Devises',
    tabDebtors: 'Crédits / Clients',
    tabCatalog: 'Catalogue',
    tabCash: 'Caisse',
    tabMetrics: 'Métriques',
    tabBackup: 'Sauvegarde',
    searchPosPlaceholder: 'Rechercher ou scanner un produit...',
    allCategories: 'Tous',
    noActiveCarts: 'Aucun panier actif',
    addCartHint: 'Ajoutez un panier pour définir le nom du client et vendre',
    newCartBtn: 'Nouveau Panier',
    chargeBtn: 'Encaisser 💳',
    creditBtn: 'À Crédit 📝',
    hideItems: '▼ Masquer',
    showItems: '▲ Articles',
    changeClientName: 'Changer Nom / Contact',
    setupTitle: 'Paramètres et Langue de la Boutique',
    setupSubtitle: 'Configurez votre boutique et la langue globale avec votre ID Unique :',
    storeNameLabel: 'Nom de la Boutique',
    ownerFullNameLabel: 'Nom Complet du Propriétaire',
    countryLabel: 'Pays',
    dniLabel: 'Pièce d’identité / Passeport',
    appLanguageLabel: 'Langue de toute l’Application 🌐',
    appLanguageHint: 'Changez la langue de tous les menus et panneaux instantanément',
    saveSetupBtn: 'Enregistrer et Ouvrir le Panneau 🚀',
    inventoryTitle: 'Inventaire Détaillé des Produits',
    inventorySubtitle: 'Coûts, marges, bénéfices, taux multidevises, stock et catalogue web.',
    alertsInboxBtn: 'Alertes Stock',
    addProductBtn: 'Ajouter un Produit',
    catalogVisibleOn: 'Catalogue Web (ON)',
    catalogVisibleOff: 'Masqué Catalogue (OFF)',
    editSimulateBtn: 'Modifier / Simuler',
    ratesPanelTitle: 'Panneau Mondial des Devises et Taux',
    ratesPanelSubtitle: 'Référence et Primaire obligatoires. Secondaire et Crypto avec interrupteur ON/OFF.',
    syncLiveBtn: 'Synchroniser les Taux Mondiaux',
    syncingBtn: 'Synchronisation...',
    refRateTitle: '1. Devise de Référence',
    primaryRateTitle: '2. Taux Primaire (Grand Format)',
    secondaryRateTitle: '3. Taux Secondaire (En dessous)',
    cryptoRateTitle: '4. Taux Crypto sur Produits',
    mandatoryBadge: 'OBLIGATOIRE',
    optionalBadge: 'OPTIONNEL',
    saveRatesBtn: 'Enregistrer les Taux ✅',
    lightMode: 'Clair',
    darkMode: 'Sombre',
  },
  ar: {
    appSubtitle: 'نظام نقاط البيع والمخزون والكتالوج الافتراضي الاحترافي',
    ownerLabel: 'المالك',
    masterBtn: 'الرئيسي',
    configBtn: 'الإعدادات',
    logoutBtn: 'خروج',
    tabSell: 'بيع (POS)',
    tabInventory: 'المخزون',
    tabRates: 'العملات والأسعار',
    tabDebtors: 'الديون / الآجل',
    tabCatalog: 'الكتالوج',
    tabCash: 'الصندوق',
    tabMetrics: 'التقارير',
    tabBackup: 'نسخ احتياطي',
    searchPosPlaceholder: 'ابحث عن منتج أو امسح الباركود...',
    allCategories: 'الكل',
    noActiveCarts: 'لا توجد سلات نشطة',
    addCartHint: 'أضف سلة لكتابة اسم العميل والبدء بالبيع',
    newCartBtn: 'سلة جديدة',
    chargeBtn: 'تحصيل 💳',
    creditBtn: 'بيع بالآجل 📝',
    hideItems: '▼ إخفاء',
    showItems: '▲ العناصر',
    changeClientName: 'تغيير الاسم / جهة الاتصال',
    setupTitle: 'إعدادات المتجر ولغة التطبيق',
    setupSubtitle: 'قمسم بإعداد متجرك ولغتك المفضلة باستخدام معرفك الفريد:',
    storeNameLabel: 'اسم المتجر',
    ownerFullNameLabel: 'الاسم الكامل للمالك',
    countryLabel: 'الدولة',
    dniLabel: 'رقم الهوية / جواز السفر',
    appLanguageLabel: 'لغة التطبيق بالكامل 🌐',
    appLanguageHint: 'تغيير لغة جميع القوائم والأزرار فوراً',
    saveSetupBtn: 'حفظ الإعدادات والدخول للوحة التحكم 🚀',
    inventoryTitle: 'مخزون المنتجات المفصل',
    inventorySubtitle: 'التكاليف، الهوامش، الأرباح، أسعار العملات، التنبيهات والكتالوج الإلكتروني.',
    alertsInboxBtn: 'صندوق التنبيهات',
    addProductBtn: 'إضافة منتج جديد',
    catalogVisibleOn: 'ظاهر في الكتالوج (ON)',
    catalogVisibleOff: 'مخفي من الكتالوج (OFF)',
    editSimulateBtn: 'تعديل / محاكاة',
    ratesPanelTitle: 'لوحة العملات وأسعار الصرف العالمية',
    ratesPanelSubtitle: 'العملة المرجعية والأساسية إلزامية. الثانوية والرقمية اختيارية بمفتاح ON/OFF.',
    syncLiveBtn: 'مزامنة الأسعار العالمية الآن',
    syncingBtn: 'جاري المزامنة...',
    refRateTitle: '1. العملة المرجعية',
    primaryRateTitle: '2. السعر الأساسي (خط كبير)',
    secondaryRateTitle: '3. السعر الثانوي (أسفل الأساسي)',
    cryptoRateTitle: '4. سعر العملات الرقمية',
    mandatoryBadge: 'إلزامي',
    optionalBadge: 'اختياري',
    saveRatesBtn: 'حفظ وتطبيق الأسعار ✅',
    lightMode: 'فاتح',
    darkMode: 'داكن',
  },
  ru: {
    appSubtitle: 'Профессиональная POS-касса, Склад и Виртуальный Каталог',
    ownerLabel: 'Владелец',
    masterBtn: 'Админ',
    configBtn: 'Настройки',
    logoutBtn: 'Выйти',
    tabSell: 'ПРОДАЖА',
    tabInventory: 'Склад',
    tabRates: 'Курсы валют',
    tabDebtors: 'Должники',
    tabCatalog: 'Каталог',
    tabCash: 'Касса',
    tabMetrics: 'Аналитика',
    tabBackup: 'Экспорт',
    searchPosPlaceholder: 'Поиск товара или сканирование штрих-кода...',
    allCategories: 'Все',
    noActiveCarts: 'Нет активных корзин',
    addCartHint: 'Добавьте корзину, чтобы указать имя клиента и начать продажу',
    newCartBtn: 'Новая корзина',
    chargeBtn: 'Оплата 💳',
    creditBtn: 'В долг 📝',
    hideItems: '▼ Скрыть',
    showItems: '▲ Товары',
    changeClientName: 'Имя / Контакт',
    setupTitle: 'Настройки магазина и язык',
    setupSubtitle: 'Настройте магазин и язык интерфейса с вашим уникальным ID:',
    storeNameLabel: 'Название магазина',
    ownerFullNameLabel: 'ФИО владельца',
    countryLabel: 'Страна',
    dniLabel: 'Паспорт / ИНН',
    appLanguageLabel: 'Язык всего приложения 🌐',
    appLanguageHint: 'Мгновенное переключение языка всех меню и панелей',
    saveSetupBtn: 'Сохранить и открыть панель 🚀',
    inventoryTitle: 'Детальный складской учет',
    inventorySubtitle: 'Себестоимость, наценка, прибыль, мировые валюты, остатки и веб-каталог.',
    alertsInboxBtn: 'Уведомления',
    addProductBtn: 'Добавить товар',
    catalogVisibleOn: 'В каталоге (ON)',
    catalogVisibleOff: 'Скрыт (OFF)',
    editSimulateBtn: 'Изменить',
    ratesPanelTitle: 'Мировая панель валют и курсов',
    ratesPanelSubtitle: 'Базовая и основная валюты обязательны. Вторичная и крипто имеют переключатель ON/OFF.',
    syncLiveBtn: 'Синхронизировать мировые курсы',
    syncingBtn: 'Синхронизация...',
    refRateTitle: '1. Базовая валюта',
    primaryRateTitle: '2. Основная валюта (Крупно)',
    secondaryRateTitle: '3. Вторичная валюта (Ниже)',
    cryptoRateTitle: '4. Криптовалюта в товарах',
    mandatoryBadge: 'ОБЯЗАТЕЛЬНО',
    optionalBadge: 'ОПЦИОНАЛЬНО',
    saveRatesBtn: 'Сохранить курсы ✅',
    lightMode: 'Светлая',
    darkMode: 'Темная',
  },
};

interface AnimatedToggleSwitchProps {
  checked: boolean;
  onChange: (nextVal: boolean) => void;
  labelOn: string;
  labelOff: string;
  iconOn?: string;
  iconOff?: string;
  accentColor?: 'emerald' | 'violet' | 'amber' | 'brand';
  title?: string;
  size?: 'sm' | 'md';
}

/**
 * Reusable Animated Sliding Toggle Switch matching the exact smooth spring animation
 * and visual aesthetic of the Light/Dark theme switch that the user loved.
 */
export const AnimatedToggleSwitch: React.FC<AnimatedToggleSwitchProps> = ({
  checked,
  onChange,
  labelOn,
  labelOff,
  iconOn = 'fa-check',
  iconOff = 'fa-power-off',
  accentColor = 'emerald',
  title,
  size = 'md',
}) => {
  const pillClasses = checked
    ? accentColor === 'violet'
      ? 'bg-violet-500/20 border-violet-400/60 text-violet-200 shadow-violet-950/40'
      : accentColor === 'amber'
      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-amber-950/40'
      : accentColor === 'brand'
      ? 'bg-indigo-500/20 border-indigo-400/60 text-indigo-200 shadow-indigo-950/40'
      : 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200 shadow-emerald-950/40'
    : 'bg-slate-800/90 border-slate-600 text-slate-400 shadow-slate-950/60';

  const trackClasses = checked
    ? accentColor === 'violet'
      ? 'bg-gradient-to-r from-violet-600 to-purple-500'
      : accentColor === 'amber'
      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
      : accentColor === 'brand'
      ? 'bg-gradient-to-r from-indigo-600 to-blue-500'
      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
    : 'bg-gradient-to-r from-slate-950 to-slate-800 border border-slate-700';

  const thumbIconColor = checked
    ? accentColor === 'violet'
      ? 'text-violet-600'
      : accentColor === 'amber'
      ? 'text-amber-600'
      : accentColor === 'brand'
      ? 'text-indigo-600'
      : 'text-emerald-600'
    : 'text-slate-300';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      title={title || (checked ? labelOn : labelOff)}
      className={`group relative inline-flex items-center justify-center max-w-full overflow-hidden ${
        size === 'sm'
          ? 'w-full min-h-[34px] px-2 py-1 gap-1.5 text-[9.5px] sm:text-[10.5px]'
          : 'min-h-[42px] min-w-[44px] px-2.5 py-1.5 pr-3.5 gap-2 text-[11px]'
      } rounded-full border font-extrabold cursor-pointer select-none shadow-inner transition-all duration-500 ${pillClasses}`}
    >
      {/* Track with Sliding Thumb */}
      <span
        className={`relative ${
          size === 'sm' ? 'w-9 h-4.5' : 'w-11 h-6'
        } rounded-full p-0.5 flex items-center transition-colors duration-500 shrink-0 ${trackClasses}`}
      >
        {/* Background Track Icons */}
        <i
          className={`fa-solid ${iconOn} text-[7px] ml-0.5 text-white transition-all duration-500 ${
            checked ? 'opacity-100 scale-100' : 'opacity-30 scale-75'
          }`}
        ></i>
        <i
          className={`fa-solid ${iconOff} text-[7px] ml-auto mr-0.5 text-slate-400 transition-all duration-500 ${
            !checked ? 'opacity-100 scale-100' : 'opacity-30 scale-75'
          }`}
        ></i>

        {/* Animated Sliding Thumb */}
        <span
          className={`theme-toggle-thumb absolute top-0.5 left-0.5 ${
            size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'
          } rounded-full shadow-md flex items-center justify-center transform transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
            checked
              ? `${
                  size === 'sm' ? 'translate-x-4' : 'translate-x-5'
                } bg-white ${thumbIconColor} rotate-0`
              : 'translate-x-0 bg-slate-700 text-slate-300 -rotate-90'
          }`}
        >
          <i
            className={`theme-toggle-icon fa-solid ${
              checked ? iconOn : iconOff
            } ${size === 'sm' ? 'text-[8px]' : 'text-[9px]'} transition-transform duration-500`}
          ></i>
        </span>
      </span>

      <span className="tracking-tight truncate min-w-0 transition-colors duration-300">
        {checked ? labelOn : labelOff}
      </span>
    </button>
  );
};
