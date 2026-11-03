export type AppFontFamily =
  | 'inter'
  | 'rounded'
  | 'mono'
  | 'serif'
  | 'bold_display'
  | 'condensed'
  | 'geometric'
  | 'handwritten';
export type AppFontSizeScale = 'compact' | 'normal' | 'large' | 'xlarge';
export type AppTextColorTone =
  | 'white'
  | 'warm_ivory'
  | 'ice_cyan'
  | 'mint_green'
  | 'gold_amber'
  | 'rose_quartz'
  | 'lavender_soft'
  | 'neon_lime'
  | 'sky_electric'
  | 'silver_chrome';
export type AppCardShape =
  | 'rounded'
  | 'pill'
  | 'soft_square'
  | 'sharp'
  | 'chamfer'
  | 'double_frame';
export type AppProductCardStyle =
  | 'matte_titanium'
  | 'obsidian_dark'
  | 'slate_navy'
  | 'emerald_matte'
  | 'burgundy_matte'
  | 'bronze_matte'
  | 'violet_matte'
  | 'graphite_neon'
  | 'hc_amber_black'
  | 'hc_cyan_laser'
  | 'hc_neon_emerald'
  | 'cobalt_ocean'
  | 'terracotta_copper';
export type ClientNeonColor =
  | 'neon_green'
  | 'neon_cyan'
  | 'neon_yellow'
  | 'neon_pink'
  | 'neon_orange'
  | 'neon_purple'
  | 'neon_white';
export type StoreTitleColor =
  | 'white'
  | 'gold_amber'
  | 'emerald_bright'
  | 'sky_cyan'
  | 'violet_glow'
  | 'rose_coral'
  | 'neon_green';
export type CajaCardThemeColor =
  | 'royal_purple'
  | 'cobalt_blue'
  | 'emerald_deep'
  | 'crimson_wine'
  | 'amber_bronze'
  | 'obsidian_neon'
  | 'hc_gold_black'
  | 'hc_cyan_black'
  | 'hc_lime_black'
  | 'terracotta_warm'
  | 'arctic_slate';

export type CheckoutSoundStyle = 'kaching' | 'modern_chime' | 'counter_bell' | 'arcade_coin' | 'off';
export type CartSoundStyle = 'pos_beep' | 'bubble_pop' | 'mech_click' | 'off';
export type ScannerSoundStyle = 'supermarket_laser' | 'soft_ding' | 'off';
export type AlertSoundStyle = 'double_warn' | 'soft_low' | 'off';

// --- INDEPENDENT PRODUCT CARD ELEMENT CUSTOMIZATION ---
export type CardElementId =
  | 'image'
  | 'title'
  | 'subtitle'
  | 'primaryPrice'
  | 'usdRate'
  | 'secondaryRate'
  | 'cryptoRate'
  | 'category'
  | 'stock';

export type CardImageSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'banner';

export type CardImageShape =
  | 'rounded'
  | 'soft_xl'
  | 'circle'
  | 'square'
  | 'neon_ring'
  | 'gold_frame';

export type CardElementSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type CardElementWeight = 'normal' | 'bold' | 'black' | 'uppercase';

export type CardElementColorId =
  | 'auto'
  | 'white'
  | 'emerald'
  | 'gold'
  | 'neon_green'
  | 'cyan_laser'
  | 'sky'
  | 'warm_ivory'
  | 'amber_orange'
  | 'rose_coral'
  | 'fuchsia_neon'
  | 'violet'
  | 'royal_blue'
  | 'lime'
  | 'turquoise'
  | 'silver'
  | 'muted_zinc';

export interface CardElementStyleConfig {
  size: CardElementSize;
  color: CardElementColorId;
  font: 'inherit' | AppFontFamily;
  weight: CardElementWeight;
}

export type CardTextElementId = Exclude<CardElementId, 'image'>;

export type CardElementsConfigMap = Record<CardTextElementId, CardElementStyleConfig>;

export interface AppCustomizationSettings {
  // Letras (Color, Tamaño, Estilo), Formas y Colores Destacados
  fontFamily: AppFontFamily;
  fontSizeScale: AppFontSizeScale;
  textColorTone: AppTextColorTone;
  fontBoldBoost: boolean;
  cardShape?: AppCardShape;
  productCardStyle?: AppProductCardStyle;
  clientNeonColor: ClientNeonColor;
  storeTitleColor: StoreTitleColor;
  cajaCardColor: CajaCardThemeColor;

  // Edición Independiente de cada Elemento de la Tarjeta de Producto + Imagen
  cardImageSize?: CardImageSize;
  cardImageShape?: CardImageShape;
  cardElements?: Partial<CardElementsConfigMap>;

  // Sonidos
  soundMasterEnabled: boolean;
  soundVolume: number; // 0.1 to 1.0
  checkoutSound: CheckoutSoundStyle;
  cartAddSound: CartSoundStyle;
  scannerSound: ScannerSoundStyle;
  alertSound: AlertSoundStyle;
  buttonTapSound: boolean;

  // Otros ajustes prácticos de Punto de Venta
  hapticVibration: boolean;
  keepScreenAwake: boolean;
  autoOpenReceiptModal: boolean;
  confirmBeforeDeleteCart: boolean;
  hideDecimalsOnLargeCurrencies: boolean;
  customReceiptFooter: string;
  reducedMotionBatterySaver: boolean;
}

const CUSTOMIZATION_STORAGE_KEY = 'mi_tienda_customization_v1';

export const DEFAULT_CARD_ELEMENTS_CONFIG: CardElementsConfigMap = {
  title: {
    size: 'md',
    color: 'white',
    font: 'inherit',
    weight: 'bold',
  },
  subtitle: {
    size: 'md',
    color: 'muted_zinc',
    font: 'inherit',
    weight: 'normal',
  },
  primaryPrice: {
    size: 'md',
    color: 'white',
    font: 'mono',
    weight: 'black',
  },
  usdRate: {
    size: 'md',
    color: 'silver',
    font: 'mono',
    weight: 'bold',
  },
  secondaryRate: {
    size: 'md',
    color: 'muted_zinc',
    font: 'mono',
    weight: 'bold',
  },
  cryptoRate: {
    size: 'md',
    color: 'gold',
    font: 'mono',
    weight: 'bold',
  },
  category: {
    size: 'md',
    color: 'muted_zinc',
    font: 'inherit',
    weight: 'normal',
  },
  stock: {
    size: 'md',
    color: 'silver',
    font: 'mono',
    weight: 'bold',
  },
};

export const CARD_IMAGE_SIZE_OPTIONS: Array<{
  id: CardImageSize;
  label: string;
  shortLabel: string;
  badge: string;
  desc: string;
  px: number;
  isBanner?: boolean;
}> = [
  {
    id: 'xs',
    label: 'Mini (32px)',
    shortLabel: 'Mini',
    badge: '32px',
    desc: 'Muy discreta',
    px: 32,
  },
  {
    id: 'sm',
    label: 'Compacta (38px)',
    shortLabel: 'Compacta',
    badge: '38px',
    desc: 'Ideal pantallas chicas',
    px: 38,
  },
  {
    id: 'md',
    label: 'Normal (44px)',
    shortLabel: 'Normal',
    badge: '44px',
    desc: 'Tamaño estándar',
    px: 44,
  },
  {
    id: 'lg',
    label: 'Grande (60px)',
    shortLabel: 'Grande',
    badge: '60px',
    desc: 'Foto más visible',
    px: 60,
  },
  {
    id: 'xl',
    label: 'Extra Grande (78px)',
    shortLabel: 'Extra Grande',
    badge: '78px',
    desc: 'Destaca el producto',
    px: 78,
  },
  {
    id: 'xxl',
    label: 'Gigante (96px)',
    shortLabel: 'Gigante',
    badge: '96px',
    desc: 'Foto cuadrada máxima',
    px: 96,
  },
  {
    id: 'banner',
    label: 'Foto Ancha Arriba',
    shortLabel: 'Ancha Arriba',
    badge: 'Ancha',
    desc: 'Ocupa todo el ancho superior',
    px: 112,
    isBanner: true,
  },
];

export const CARD_IMAGE_SHAPE_OPTIONS: Array<{
  id: CardImageShape;
  label: string;
  shortLabel: string;
  radius: string;
  border: string;
  shadow: string;
}> = [
  {
    id: 'rounded',
    label: 'Curva Suave',
    shortLabel: 'Curva',
    radius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.14)',
    shadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
  },
  {
    id: 'soft_xl',
    label: 'Súper Redondeada',
    shortLabel: 'Súper Curva',
    radius: '18px',
    border: '1.5px solid rgba(255, 255, 255, 0.22)',
    shadow: '0 4px 10px rgba(0, 0, 0, 0.4)',
  },
  {
    id: 'circle',
    label: 'Circular Redonda',
    shortLabel: 'Circular',
    radius: '9999px',
    border: '2px solid rgba(255, 255, 255, 0.25)',
    shadow: '0 4px 10px rgba(0, 0, 0, 0.45)',
  },
  {
    id: 'square',
    label: 'Cuadrada Recta',
    shortLabel: 'Cuadrada',
    radius: '3px',
    border: '1.5px solid rgba(255, 255, 255, 0.2)',
    shadow: '0 2px 6px rgba(0, 0, 0, 0.35)',
  },
  {
    id: 'neon_ring',
    label: 'Borde Luminoso',
    shortLabel: 'Neón',
    radius: '14px',
    border: '2px solid #34d399',
    shadow: '0 0 12px rgba(52, 211, 153, 0.45)',
  },
  {
    id: 'gold_frame',
    label: 'Marco Dorado',
    shortLabel: 'Dorado',
    radius: '14px',
    border: '2px solid #fbbf24',
    shadow: '0 0 12px rgba(251, 191, 36, 0.4)',
  },
];

export const CARD_ELEMENT_SIZE_OPTIONS: Array<{
  id: CardElementSize;
  label: string;
  shortLabel: string;
  percentLabel: string;
  badge: string;
  scale: number;
}> = [
  { id: 'xs', label: 'Mini', shortLabel: 'Mini', percentLabel: '84%', badge: '84%', scale: 0.84 },
  { id: 'sm', label: 'Compacto', shortLabel: 'Compacto', percentLabel: '92%', badge: '92%', scale: 0.92 },
  { id: 'md', label: 'Normal', shortLabel: 'Normal', percentLabel: '100%', badge: '100%', scale: 1.0 },
  { id: 'lg', label: 'Grande', shortLabel: 'Grande', percentLabel: '116%', badge: '116%', scale: 1.16 },
  { id: 'xl', label: 'Extra Grande', shortLabel: 'Extra G.', percentLabel: '134%', badge: '134%', scale: 1.34 },
  { id: '2xl', label: 'Gigante', shortLabel: 'Gigante', percentLabel: '154%', badge: '154%', scale: 1.54 },
];

export const CARD_ELEMENT_WEIGHT_OPTIONS: Array<{
  id: CardElementWeight;
  label: string;
  shortLabel: string;
  fontWeight: number;
  cssWeight: number;
  textTransform: string;
  uppercase: boolean;
}> = [
  { id: 'normal', label: 'Suave / Normal', shortLabel: 'Normal', fontWeight: 500, cssWeight: 500, textTransform: 'none', uppercase: false },
  { id: 'bold', label: 'Negrita Clara', shortLabel: 'Negrita', fontWeight: 700, cssWeight: 700, textTransform: 'none', uppercase: false },
  { id: 'black', label: 'Extra Gruesa', shortLabel: 'Extra Gruesa', fontWeight: 900, cssWeight: 900, textTransform: 'none', uppercase: false },
  { id: 'uppercase', label: 'MAYÚSCULAS GRUESA', shortLabel: 'MAYÚSCULAS', fontWeight: 900, cssWeight: 900, textTransform: 'uppercase', uppercase: true },
];

export const CARD_ELEMENT_COLOR_OPTIONS: Array<{
  id: CardElementColorId;
  label: string;
  shortName: string;
  hex: string;
  lightHex: string;
}> = [
  { id: 'auto', label: 'Automático (Según Tema)', shortName: 'Auto', hex: '#ffffff', lightHex: '#0f172a' },
  { id: 'white', label: 'Blanco Puro', shortName: 'Blanco', hex: '#ffffff', lightHex: '#0f172a' },
  { id: 'emerald', label: 'Verde Esmeralda', shortName: 'Esmeralda', hex: '#34d399', lightHex: '#047857' },
  { id: 'gold', label: 'Amarillo Oro', shortName: 'Oro', hex: '#fbbf24', lightHex: '#b45309' },
  { id: 'neon_green', label: 'Verde Neón Láser', shortName: 'Neón', hex: '#39ff14', lightHex: '#15803d' },
  { id: 'cyan_laser', label: 'Cian Eléctrico', shortName: 'Cian', hex: '#00f5ff', lightHex: '#0e7490' },
  { id: 'sky', label: 'Celeste Cielo', shortName: 'Celeste', hex: '#38bdf8', lightHex: '#0369a1' },
  { id: 'warm_ivory', label: 'Marfil Cálido', shortName: 'Marfil', hex: '#fef08a', lightHex: '#854d0e' },
  { id: 'amber_orange', label: 'Naranja Ámbar', shortName: 'Naranja', hex: '#fb923c', lightHex: '#c2410c' },
  { id: 'rose_coral', label: 'Coral Rosa', shortName: 'Coral', hex: '#fb7185', lightHex: '#be123c' },
  { id: 'fuchsia_neon', label: 'Fucsia Vivo', shortName: 'Fucsia', hex: '#f472b6', lightHex: '#a21caf' },
  { id: 'violet', label: 'Violeta Lavanda', shortName: 'Violeta', hex: '#c084fc', lightHex: '#6d28d9' },
  { id: 'royal_blue', label: 'Azul Real', shortName: 'Azul', hex: '#60a5fa', lightHex: '#1d4ed8' },
  { id: 'lime', label: 'Lima Brillante', shortName: 'Lima', hex: '#a3e635', lightHex: '#3f6212' },
  { id: 'turquoise', label: 'Turquesa Menta', shortName: 'Turquesa', hex: '#2dd4bf', lightHex: '#0f766e' },
  { id: 'silver', label: 'Plata Suave', shortName: 'Plata', hex: '#cbd5e1', lightHex: '#334155' },
  { id: 'muted_zinc', label: 'Gris Neutro', shortName: 'Gris', hex: '#94a3b8', lightHex: '#475569' },
];

export const CARD_ELEMENTS_META: Array<{
  id: CardElementId;
  label: string;
  shortLabel: string;
  icon: string;
  sampleText: string;
  desc: string;
}> = [
  {
    id: 'image',
    label: 'Imagen del Producto',
    shortLabel: 'Imagen',
    icon: '🖼️',
    sampleText: 'Foto / Icono',
    desc: 'Agranda la foto, hazla circular, cuadrada o ponla ancha arriba',
  },
  {
    id: 'title',
    label: 'Nombre del Producto',
    shortLabel: 'Nombre',
    icon: '🏷️',
    sampleText: 'Café Arábica Gourmet 500g',
    desc: 'Tamaño, color, fuente y grosor del título del producto',
  },
  {
    id: 'subtitle',
    label: 'Peso y Marca (Subtítulo)',
    shortLabel: 'Peso / Marca',
    icon: '⚖️',
    sampleText: '500g · Cafetal',
    desc: 'Texto debajo del nombre (gramaje, presentación y marca)',
  },
  {
    id: 'primaryPrice',
    label: 'Tasa Principal + ISO Uniforme',
    shortLabel: 'Tasa Principal (VES)',
    icon: '💰',
    sampleText: '7.514,25 VES',
    desc: 'Precio principal y moneda (ej. 7.514,25 VES en un solo color uniforme)',
  },
  {
    id: 'usdRate',
    label: 'Tasa Referencia (USD)',
    shortLabel: 'Tasa USD',
    icon: '💵',
    sampleText: '$8.45 USD',
    desc: 'Monto y código USD en un mismo color, tamaño y estilo',
  },
  {
    id: 'secondaryRate',
    label: 'Tasa Secundaria (COP / Otra)',
    shortLabel: 'Tasa Secundaria',
    icon: '💱',
    sampleText: '26.735,80 COP',
    desc: 'Monto y código de segunda moneda en un solo color uniforme',
  },
  {
    id: 'cryptoRate',
    label: 'Tasa Cripto (BTC / USDT)',
    shortLabel: 'Tasa Cripto',
    icon: '₿',
    sampleText: '₿ 0.000109 BTC',
    desc: 'Monto e ISO cripto en un mismo color, tamaño y fuente',
  },
  {
    id: 'category',
    label: 'Etiqueta de Categoría',
    shortLabel: 'Categoría',
    icon: '🥫',
    sampleText: '🥫 Alimentos',
    desc: 'Nombre e icono de la categoría en la esquina inferior izquierda',
  },
  {
    id: 'stock',
    label: 'Indicador de Stock / Unidades',
    shortLabel: 'Stock (und)',
    icon: '📦',
    sampleText: '453 und',
    desc: 'Recuadro de cantidad disponible en la esquina inferior derecha',
  },
];

export function getResolvedCardElementConfig(
  settings: AppCustomizationSettings
): CardElementsConfigMap;
export function getResolvedCardElementConfig(
  settings: AppCustomizationSettings,
  elementId: CardTextElementId
): CardElementStyleConfig;
export function getResolvedCardElementConfig(
  settings: AppCustomizationSettings,
  elementId?: CardTextElementId
): CardElementsConfigMap | CardElementStyleConfig {
  const resolveSingle = (elId: CardTextElementId): CardElementStyleConfig => {
    const base = DEFAULT_CARD_ELEMENTS_CONFIG[elId];
    const override = settings?.cardElements?.[elId];
    if (!override) return { ...base };
    return {
      size: override.size || base.size,
      color: override.color || base.color,
      font: override.font || base.font,
      weight: override.weight || base.weight,
    };
  };

  if (elementId) {
    return resolveSingle(elementId);
  }

  return {
    title: resolveSingle('title'),
    subtitle: resolveSingle('subtitle'),
    primaryPrice: resolveSingle('primaryPrice'),
    usdRate: resolveSingle('usdRate'),
    secondaryRate: resolveSingle('secondaryRate'),
    cryptoRate: resolveSingle('cryptoRate'),
    category: resolveSingle('category'),
    stock: resolveSingle('stock'),
  };
}

export const DEFAULT_CUSTOMIZATION_SETTINGS: AppCustomizationSettings = {
  fontFamily: 'inter',
  fontSizeScale: 'normal',
  textColorTone: 'white',
  fontBoldBoost: false,
  cardShape: 'rounded',
  productCardStyle: 'matte_titanium',
  clientNeonColor: 'neon_green',
  storeTitleColor: 'white',
  cajaCardColor: 'royal_purple',

  cardImageSize: 'md',
  cardImageShape: 'rounded',
  cardElements: { ...DEFAULT_CARD_ELEMENTS_CONFIG },

  soundMasterEnabled: true,
  soundVolume: 0.85,
  checkoutSound: 'kaching',
  cartAddSound: 'pos_beep',
  scannerSound: 'supermarket_laser',
  alertSound: 'double_warn',
  buttonTapSound: false,

  hapticVibration: true,
  keepScreenAwake: false,
  autoOpenReceiptModal: true,
  confirmBeforeDeleteCart: true,
  hideDecimalsOnLargeCurrencies: false,
  customReceiptFooter: '¡Gracias por su compra! Vuelva pronto 🙌',
  reducedMotionBatterySaver: false,
};

export const FONT_FAMILY_OPTIONS: Array<{
  id: AppFontFamily;
  label: string;
  shortLabel: string;
  desc: string;
  cssValue: string;
  sample: string;
}> = [
  {
    id: 'inter',
    label: 'Moderna Clara (Inter)',
    shortLabel: 'Moderna',
    desc: 'Limpia y fácil de leer',
    cssValue: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    sample: 'Harina $1.40',
  },
  {
    id: 'rounded',
    label: 'Suave Redondeada',
    shortLabel: 'Redondeada',
    desc: 'Bordes suaves y amigables',
    cssValue: "'Nunito', 'Varela Round', 'Segoe UI Rounded', 'Trebuchet MS', sans-serif",
    sample: 'Harina $1.40',
  },
  {
    id: 'mono',
    label: 'Digital / Caja POS',
    shortLabel: 'Digital POS',
    desc: 'Números tipo registradora',
    cssValue: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    sample: '123.45 VES',
  },
  {
    id: 'serif',
    label: 'Clásica Elegante',
    shortLabel: 'Elegante',
    desc: 'Estilo catálogo formal',
    cssValue: "'Georgia', 'Cambria', 'Times New Roman', serif",
    sample: 'Harina $1.40',
  },
  {
    id: 'bold_display',
    label: 'Impacto Gruesa',
    shortLabel: 'Impacto',
    desc: 'Trazo fuerte y llamativo',
    cssValue: "'Arial Black', 'Impact', 'Franklin Gothic Heavy', sans-serif",
    sample: 'HARINA $1.40',
  },
  {
    id: 'condensed',
    label: 'Compacta Comercial',
    shortLabel: 'Compacta',
    desc: 'Caben nombres más largos',
    cssValue: "'Arial Narrow', 'Roboto Condensed', 'Bahnschrift', sans-serif",
    sample: 'Harina Pan $1.40',
  },
  {
    id: 'geometric',
    label: 'Geométrica Futura',
    shortLabel: 'Geométrica',
    desc: 'Estilo moderno simétrico',
    cssValue: "'Century Gothic', 'Futura', 'Avant Garde', 'Segoe UI', sans-serif",
    sample: 'Harina $1.40',
  },
  {
    id: 'handwritten',
    label: 'Bodegón Artesanal',
    shortLabel: 'Artesanal',
    desc: 'Toque cálido de tienda',
    cssValue: "'Comic Sans MS', 'Bradley Hand', 'Segoe Print', cursive, sans-serif",
    sample: 'Harina $1.40',
  },
];

export const FONT_SIZE_OPTIONS: Array<{
  id: AppFontSizeScale;
  label: string;
  percentLabel: string;
  desc: string;
  rootFontSizePx: number;
}> = [
  {
    id: 'compact',
    label: 'Compacta',
    percentLabel: '93%',
    desc: 'Más productos en pantalla',
    rootFontSizePx: 14.8,
  },
  {
    id: 'normal',
    label: 'Normal',
    percentLabel: '100%',
    desc: 'Tamaño estándar ideal',
    rootFontSizePx: 16,
  },
  {
    id: 'large',
    label: 'Grande',
    percentLabel: '108%',
    desc: 'Lectura más cómoda',
    rootFontSizePx: 17.3,
  },
  {
    id: 'xlarge',
    label: 'Extra Grande',
    percentLabel: '116%',
    desc: 'Máxima visibilidad',
    rootFontSizePx: 18.5,
  },
];

export const TEXT_COLOR_TONE_OPTIONS: Array<{
  id: AppTextColorTone;
  label: string;
  shortName: string;
  hex: string;
  subHex: string;
  dotBg: string;
}> = [
  {
    id: 'white',
    label: 'Blanco Puro',
    shortName: 'Blanco',
    hex: '#ffffff',
    subHex: '#cbd5e1',
    dotBg: '#ffffff',
  },
  {
    id: 'warm_ivory',
    label: 'Marfil Cálido (Descanso Visual)',
    shortName: 'Marfil',
    hex: '#fef9c3',
    subHex: '#fde68a',
    dotBg: '#fde047',
  },
  {
    id: 'ice_cyan',
    label: 'Celeste Cristal',
    shortName: 'Celeste',
    hex: '#e0f2fe',
    subHex: '#7dd3fc',
    dotBg: '#38bdf8',
  },
  {
    id: 'mint_green',
    label: 'Verde Menta Suave',
    shortName: 'Menta',
    hex: '#d1fae5',
    subHex: '#6ee7b7',
    dotBg: '#34d399',
  },
  {
    id: 'gold_amber',
    label: 'Ámbar Dorado',
    shortName: 'Ámbar',
    hex: '#fef3c7',
    subHex: '#fcd34d',
    dotBg: '#f59e0b',
  },
  {
    id: 'rose_quartz',
    label: 'Rosa Coral Suave',
    shortName: 'Coral',
    hex: '#ffe4e6',
    subHex: '#fda4af',
    dotBg: '#fb7185',
  },
  {
    id: 'lavender_soft',
    label: 'Violeta Lavanda',
    shortName: 'Lavanda',
    hex: '#f3e8ff',
    subHex: '#d8b4fe',
    dotBg: '#c084fc',
  },
  {
    id: 'neon_lime',
    label: 'Lima Brillante',
    shortName: 'Lima',
    hex: '#ecfccb',
    subHex: '#bef264',
    dotBg: '#a3e635',
  },
  {
    id: 'sky_electric',
    label: 'Azul Cielo Intenso',
    shortName: 'Cielo',
    hex: '#bae6fd',
    subHex: '#38bdf8',
    dotBg: '#0ea5e9',
  },
  {
    id: 'silver_chrome',
    label: 'Plata Titanio',
    shortName: 'Plata',
    hex: '#e2e8f0',
    subHex: '#94a3b8',
    dotBg: '#94a3b8',
  },
];

export const CARD_SHAPE_OPTIONS: Array<{
  id: AppCardShape;
  label: string;
  shortName: string;
  desc: string;
  cardRadius: string;
  btnRadius: string;
  previewBorderStyle: string;
}> = [
  {
    id: 'rounded',
    label: 'Curva Estándar',
    shortName: 'Curva',
    desc: 'Bordes redondeados clásicos',
    cardRadius: '16px',
    btnRadius: '12px',
    previewBorderStyle: 'rounded-2xl',
  },
  {
    id: 'pill',
    label: 'Súper Redondeada (Cápsula)',
    shortName: 'Cápsula',
    desc: 'Esquinas muy suaves y orgánicas',
    cardRadius: '26px',
    btnRadius: '9999px',
    previewBorderStyle: 'rounded-[26px]',
  },
  {
    id: 'soft_square',
    label: 'Compacta Sutil',
    shortName: 'Discreta',
    desc: 'Esquinas apenas curvas',
    cardRadius: '9px',
    btnRadius: '7px',
    previewBorderStyle: 'rounded-lg',
  },
  {
    id: 'sharp',
    label: 'Cuadrada / Recta',
    shortName: 'Recta',
    desc: 'Corte recto profesional',
    cardRadius: '3px',
    btnRadius: '3px',
    previewBorderStyle: 'rounded-[3px]',
  },
  {
    id: 'chamfer',
    label: 'Biselada Diamante',
    shortName: 'Biselada',
    desc: 'Esquinas con corte técnico',
    cardRadius: '14px 3px 14px 3px',
    btnRadius: '10px 2px 10px 2px',
    previewBorderStyle: 'rounded-tl-2xl rounded-br-2xl rounded-tr-xs rounded-bl-xs',
  },
  {
    id: 'double_frame',
    label: 'Marco Resaltado',
    shortName: 'Marco 3D',
    desc: 'Relieve superior acentuado',
    cardRadius: '18px',
    btnRadius: '14px',
    previewBorderStyle: 'rounded-[18px]',
  },
];

export const PRODUCT_CARD_STYLE_OPTIONS: Array<{
  id: AppProductCardStyle;
  label: string;
  shortName: string;
  desc: string;
  bg: string;
  bgHover: string;
  border: string;
  borderHover: string;
  swatch: string;
  isHighContrast?: boolean;
  brand50: string;
  brand100: string;
  brand400: string;
  brand500: string;
  brand600: string;
  brand700: string;
  brand900: string;
  btnBg: string;
  btnBgHover: string;
  btnBorder: string;
  btnText: string;
  btnShadow: string;
  storeCardBg: string;
  storeCardBorder: string;
  storeCardGlow: string;
  storeCardLightBg: string;
}> = [
  {
    id: 'matte_titanium',
    label: 'Titanio Mate Neutro',
    shortName: 'Titanio Mate',
    desc: 'Gris grafito mate profesional',
    bg: 'linear-gradient(180deg, #2b2e37 0%, #23262e 100%)',
    bgHover: 'linear-gradient(180deg, #323640 0%, #292c35 100%)',
    border: 'rgba(255, 255, 255, 0.15)',
    borderHover: 'rgba(255, 255, 255, 0.28)',
    swatch: '#6366f1',
    brand50: '#eef2ff',
    brand100: '#e0e7ff',
    brand400: '#818cf8',
    brand500: '#6366f1',
    brand600: '#4f46e5',
    brand700: '#4338ca',
    brand900: '#312e81',
    btnBg: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
    btnBgHover: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
    btnBorder: 'rgba(129, 140, 248, 0.45)',
    btnText: '#ffffff',
    btnShadow: 'rgba(79, 70, 229, 0.32)',
    storeCardBg: 'rgba(35, 38, 46, 0.9)',
    storeCardBorder: 'rgba(148, 163, 184, 0.35)',
    storeCardGlow: 'rgba(99, 102, 241, 0.18)',
    storeCardLightBg: 'rgba(241, 245, 249, 0.95)',
  },
  {
    id: 'obsidian_dark',
    label: 'Obsidiana Carbón',
    shortName: 'Obsidiana',
    desc: 'Negro profundo de alto contraste',
    bg: 'linear-gradient(180deg, #18181b 0%, #0f1014 100%)',
    bgHover: 'linear-gradient(180deg, #222227 0%, #16171d 100%)',
    border: 'rgba(255, 255, 255, 0.18)',
    borderHover: 'rgba(255, 255, 255, 0.34)',
    swatch: '#141417',
    brand50: '#f4f4f5',
    brand100: '#e4e4e7',
    brand400: '#a1a1aa',
    brand500: '#6366f1',
    brand600: '#4f46e5',
    brand700: '#3730a3',
    brand900: '#18181b',
    btnBg: 'linear-gradient(135deg, #3f3f46 0%, #27272a 100%)',
    btnBgHover: 'linear-gradient(135deg, #52525b 0%, #3f3f46 100%)',
    btnBorder: 'rgba(255, 255, 255, 0.32)',
    btnText: '#ffffff',
    btnShadow: 'rgba(0, 0, 0, 0.45)',
    storeCardBg: 'rgba(18, 18, 22, 0.92)',
    storeCardBorder: 'rgba(255, 255, 255, 0.22)',
    storeCardGlow: 'rgba(255, 255, 255, 0.1)',
    storeCardLightBg: 'rgba(244, 244, 245, 0.96)',
  },
  {
    id: 'slate_navy',
    label: 'Azul Pizarra Ejecutivo',
    shortName: 'Azul Pizarra',
    desc: 'Tono azulado sobrio y elegante',
    bg: 'linear-gradient(180deg, #1e293b 0%, #151e2e 100%)',
    bgHover: 'linear-gradient(180deg, #263449 0%, #1b263b 100%)',
    border: 'rgba(56, 189, 248, 0.28)',
    borderHover: 'rgba(56, 189, 248, 0.5)',
    swatch: '#0ea5e9',
    brand50: '#f0f9ff',
    brand100: '#e0f2fe',
    brand400: '#38bdf8',
    brand500: '#0ea5e9',
    brand600: '#0284c7',
    brand700: '#0369a1',
    brand900: '#0c4a6e',
    btnBg: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
    btnBgHover: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
    btnBorder: 'rgba(56, 189, 248, 0.5)',
    btnText: '#ffffff',
    btnShadow: 'rgba(2, 132, 199, 0.35)',
    storeCardBg: 'rgba(21, 30, 46, 0.9)',
    storeCardBorder: 'rgba(56, 189, 248, 0.4)',
    storeCardGlow: 'rgba(14, 165, 233, 0.22)',
    storeCardLightBg: 'rgba(240, 249, 255, 0.95)',
  },
  {
    id: 'emerald_matte',
    label: 'Verde Bosque Mate',
    shortName: 'Esmeralda',
    desc: 'Tono verde oscuro comercial',
    bg: 'linear-gradient(180deg, #132f28 0%, #0d211c 100%)',
    bgHover: 'linear-gradient(180deg, #193c33 0%, #112b24 100%)',
    border: 'rgba(52, 211, 153, 0.3)',
    borderHover: 'rgba(52, 211, 153, 0.55)',
    swatch: '#10b981',
    brand50: '#ecfdf5',
    brand100: '#d1fae5',
    brand400: '#34d399',
    brand500: '#10b981',
    brand600: '#059669',
    brand700: '#047857',
    brand900: '#064e3b',
    btnBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    btnBgHover: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    btnBorder: 'rgba(52, 211, 153, 0.5)',
    btnText: '#ffffff',
    btnShadow: 'rgba(5, 150, 105, 0.35)',
    storeCardBg: 'rgba(13, 33, 28, 0.9)',
    storeCardBorder: 'rgba(52, 211, 153, 0.42)',
    storeCardGlow: 'rgba(16, 185, 129, 0.22)',
    storeCardLightBg: 'rgba(236, 253, 245, 0.95)',
  },
  {
    id: 'burgundy_matte',
    label: 'Vino Imperial Mate',
    shortName: 'Vino Mate',
    desc: 'Tono burdeos cálido y elegante',
    bg: 'linear-gradient(180deg, #351624 0%, #240f18 100%)',
    bgHover: 'linear-gradient(180deg, #421b2d 0%, #2e131f 100%)',
    border: 'rgba(251, 113, 133, 0.3)',
    borderHover: 'rgba(251, 113, 133, 0.55)',
    swatch: '#e11d48',
    brand50: '#fff1f2',
    brand100: '#ffe4e6',
    brand400: '#fb7185',
    brand500: '#f43f5e',
    brand600: '#e11d48',
    brand700: '#be123c',
    brand900: '#881337',
    btnBg: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
    btnBgHover: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    btnBorder: 'rgba(251, 113, 133, 0.5)',
    btnText: '#ffffff',
    btnShadow: 'rgba(225, 29, 72, 0.35)',
    storeCardBg: 'rgba(36, 15, 24, 0.9)',
    storeCardBorder: 'rgba(251, 113, 133, 0.42)',
    storeCardGlow: 'rgba(244, 63, 94, 0.22)',
    storeCardLightBg: 'rgba(255, 241, 242, 0.95)',
  },
  {
    id: 'bronze_matte',
    label: 'Bronce Cálido Mate',
    shortName: 'Bronce Mate',
    desc: 'Tono tierra/dorado oscuro',
    bg: 'linear-gradient(180deg, #33261a 0%, #241a12 100%)',
    bgHover: 'linear-gradient(180deg, #3f2f20 0%, #2d2117 100%)',
    border: 'rgba(251, 191, 36, 0.3)',
    borderHover: 'rgba(251, 191, 36, 0.55)',
    swatch: '#d97706',
    brand50: '#fffbeb',
    brand100: '#fef3c7',
    brand400: '#fbbf24',
    brand500: '#f59e0b',
    brand600: '#d97706',
    brand700: '#b45309',
    brand900: '#78350f',
    btnBg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    btnBgHover: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    btnBorder: 'rgba(251, 191, 36, 0.55)',
    btnText: '#ffffff',
    btnShadow: 'rgba(217, 119, 6, 0.35)',
    storeCardBg: 'rgba(36, 26, 18, 0.9)',
    storeCardBorder: 'rgba(251, 191, 36, 0.42)',
    storeCardGlow: 'rgba(245, 158, 11, 0.22)',
    storeCardLightBg: 'rgba(255, 251, 235, 0.95)',
  },
  {
    id: 'violet_matte',
    label: 'Índigo Real Mate',
    shortName: 'Índigo Mate',
    desc: 'Tono violeta oscuro moderno',
    bg: 'linear-gradient(180deg, #251d3a 0%, #191329 100%)',
    bgHover: 'linear-gradient(180deg, #2f254a 0%, #211936 100%)',
    border: 'rgba(167, 139, 250, 0.3)',
    borderHover: 'rgba(167, 139, 250, 0.55)',
    swatch: '#8b5cf6',
    brand50: '#f5f3ff',
    brand100: '#ede9fe',
    brand400: '#a78bfa',
    brand500: '#8b5cf6',
    brand600: '#7c3aed',
    brand700: '#6d28d9',
    brand900: '#4c1d95',
    btnBg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    btnBgHover: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    btnBorder: 'rgba(167, 139, 250, 0.5)',
    btnText: '#ffffff',
    btnShadow: 'rgba(124, 58, 237, 0.35)',
    storeCardBg: 'rgba(25, 19, 41, 0.9)',
    storeCardBorder: 'rgba(167, 139, 250, 0.42)',
    storeCardGlow: 'rgba(139, 92, 246, 0.22)',
    storeCardLightBg: 'rgba(245, 243, 255, 0.95)',
  },
  {
    id: 'graphite_neon',
    label: 'Grafito Borde Luminoso',
    shortName: 'Borde Neón',
    desc: 'Superficie mate con borde vivo',
    bg: 'linear-gradient(180deg, #222630 0%, #181b22 100%)',
    bgHover: 'linear-gradient(180deg, #2a2f3b 0%, #1f232c 100%)',
    border: 'rgba(16, 185, 129, 0.55)',
    borderHover: 'rgba(52, 211, 153, 0.85)',
    swatch: '#10b981',
    brand50: '#ecfdf5',
    brand100: '#d1fae5',
    brand400: '#34d399',
    brand500: '#10b981',
    brand600: '#059669',
    brand700: '#047857',
    brand900: '#064e3b',
    btnBg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    btnBgHover: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
    btnBorder: 'rgba(52, 211, 153, 0.75)',
    btnText: '#ffffff',
    btnShadow: 'rgba(16, 185, 129, 0.4)',
    storeCardBg: 'rgba(24, 27, 34, 0.92)',
    storeCardBorder: 'rgba(16, 185, 129, 0.55)',
    storeCardGlow: 'rgba(16, 185, 129, 0.28)',
    storeCardLightBg: 'rgba(236, 253, 245, 0.95)',
  },
  {
    id: 'hc_amber_black',
    label: '⚡ Alto Contraste Ámbar / Negro',
    shortName: '⚡ AC Ámbar',
    desc: 'Máxima visibilidad solar y mostrador',
    bg: 'linear-gradient(180deg, #09090b 0%, #000000 100%)',
    bgHover: 'linear-gradient(180deg, #141418 0%, #09090b 100%)',
    border: 'rgba(250, 204, 21, 0.88)',
    borderHover: '#fde047',
    swatch: '#facc15',
    isHighContrast: true,
    brand50: '#fefce8',
    brand100: '#fef9c3',
    brand400: '#facc15',
    brand500: '#eab308',
    brand600: '#ca8a04',
    brand700: '#a16207',
    brand900: '#422006',
    btnBg: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
    btnBgHover: 'linear-gradient(135deg, #facc15 0%, #eab308 100%)',
    btnBorder: '#fef08a',
    btnText: '#09090b',
    btnShadow: 'rgba(250, 204, 21, 0.45)',
    storeCardBg: 'rgba(5, 5, 7, 0.96)',
    storeCardBorder: 'rgba(250, 204, 21, 0.85)',
    storeCardGlow: 'rgba(250, 204, 21, 0.32)',
    storeCardLightBg: 'rgba(254, 252, 232, 0.98)',
  },
  {
    id: 'hc_cyan_laser',
    label: '⚡ Alto Contraste Cian / Noche',
    shortName: '⚡ AC Cian',
    desc: 'Bordes cian eléctrico ultra nítidos',
    bg: 'linear-gradient(180deg, #030712 0%, #000208 100%)',
    bgHover: 'linear-gradient(180deg, #0b1329 0%, #030712 100%)',
    border: 'rgba(0, 245, 255, 0.88)',
    borderHover: '#67e8f9',
    swatch: '#00f5ff',
    isHighContrast: true,
    brand50: '#ecfeff',
    brand100: '#cffafe',
    brand400: '#22d3ee',
    brand500: '#06b6d4',
    brand600: '#0891b2',
    brand700: '#0e7490',
    brand900: '#164e63',
    btnBg: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
    btnBgHover: 'linear-gradient(135deg, #22d3ee 0%, #06b6d4 100%)',
    btnBorder: '#a5f3fc',
    btnText: '#ffffff',
    btnShadow: 'rgba(6, 182, 212, 0.48)',
    storeCardBg: 'rgba(3, 7, 18, 0.96)',
    storeCardBorder: 'rgba(0, 245, 255, 0.85)',
    storeCardGlow: 'rgba(0, 245, 255, 0.32)',
    storeCardLightBg: 'rgba(236, 254, 255, 0.98)',
  },
  {
    id: 'hc_neon_emerald',
    label: '⚡ Alto Contraste Verde Láser',
    shortName: '⚡ AC Verde',
    desc: 'Contraste extremo negro y verde neón',
    bg: 'linear-gradient(180deg, #030b06 0%, #000000 100%)',
    bgHover: 'linear-gradient(180deg, #08180e 0%, #030b06 100%)',
    border: 'rgba(57, 255, 20, 0.85)',
    borderHover: '#86efac',
    swatch: '#39ff14',
    isHighContrast: true,
    brand50: '#f0fdf4',
    brand100: '#dcfce7',
    brand400: '#4ade80',
    brand500: '#22c55e',
    brand600: '#16a34a',
    brand700: '#15803d',
    brand900: '#14532d',
    btnBg: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
    btnBgHover: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    btnBorder: '#86efac',
    btnText: '#ffffff',
    btnShadow: 'rgba(34, 197, 94, 0.48)',
    storeCardBg: 'rgba(3, 11, 6, 0.96)',
    storeCardBorder: 'rgba(57, 255, 20, 0.82)',
    storeCardGlow: 'rgba(57, 255, 20, 0.3)',
    storeCardLightBg: 'rgba(240, 253, 244, 0.98)',
  },
  {
    id: 'cobalt_ocean',
    label: 'Océano Cobalto Real',
    shortName: 'Cobalto Real',
    desc: 'Azul marino profundo con acento real',
    bg: 'linear-gradient(180deg, #0f2447 0%, #09162e 100%)',
    bgHover: 'linear-gradient(180deg, #16315e 0%, #0d2040 100%)',
    border: 'rgba(96, 165, 250, 0.45)',
    borderHover: 'rgba(147, 197, 253, 0.78)',
    swatch: '#2563eb',
    brand50: '#eff6ff',
    brand100: '#dbeafe',
    brand400: '#60a5fa',
    brand500: '#3b82f6',
    brand600: '#2563eb',
    brand700: '#1d4ed8',
    brand900: '#1e3a8a',
    btnBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    btnBgHover: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    btnBorder: 'rgba(147, 197, 253, 0.55)',
    btnText: '#ffffff',
    btnShadow: 'rgba(37, 99, 235, 0.38)',
    storeCardBg: 'rgba(15, 36, 71, 0.92)',
    storeCardBorder: 'rgba(96, 165, 250, 0.5)',
    storeCardGlow: 'rgba(59, 130, 246, 0.25)',
    storeCardLightBg: 'rgba(239, 246, 255, 0.95)',
  },
  {
    id: 'terracotta_copper',
    label: 'Terracota Cobre Cálido',
    shortName: 'Terracota',
    desc: 'Cobre artesanal con borde naranja vivo',
    bg: 'linear-gradient(180deg, #3b1c16 0%, #26110d 100%)',
    bgHover: 'linear-gradient(180deg, #4a241c 0%, #311611 100%)',
    border: 'rgba(251, 146, 60, 0.45)',
    borderHover: 'rgba(253, 186, 116, 0.8)',
    swatch: '#ea580c',
    brand50: '#fff7ed',
    brand100: '#ffedd5',
    brand400: '#fb923c',
    brand500: '#f97316',
    brand600: '#ea580c',
    brand700: '#c2410c',
    brand900: '#7c2d12',
    btnBg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    btnBgHover: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    btnBorder: 'rgba(253, 186, 116, 0.55)',
    btnText: '#ffffff',
    btnShadow: 'rgba(234, 88, 12, 0.38)',
    storeCardBg: 'rgba(59, 28, 22, 0.92)',
    storeCardBorder: 'rgba(251, 146, 60, 0.5)',
    storeCardGlow: 'rgba(249, 115, 22, 0.25)',
    storeCardLightBg: 'rgba(255, 247, 237, 0.95)',
  },
];

export const CLIENT_NEON_COLOR_OPTIONS: Array<{
  id: ClientNeonColor;
  label: string;
  hex: string;
  bgRgba: string;
  borderRgba: string;
  glowRgba: string;
}> = [
  {
    id: 'neon_green',
    label: 'Verde Fosforescente',
    hex: '#39ff14',
    bgRgba: 'rgba(57, 255, 20, 0.14)',
    borderRgba: 'rgba(57, 255, 20, 0.6)',
    glowRgba: 'rgba(57, 255, 20, 0.45)',
  },
  {
    id: 'neon_cyan',
    label: 'Cian Eléctrico',
    hex: '#00f5ff',
    bgRgba: 'rgba(0, 245, 255, 0.14)',
    borderRgba: 'rgba(0, 245, 255, 0.6)',
    glowRgba: 'rgba(0, 245, 255, 0.45)',
  },
  {
    id: 'neon_yellow',
    label: 'Amarillo Láser',
    hex: '#ffea00',
    bgRgba: 'rgba(255, 234, 0, 0.14)',
    borderRgba: 'rgba(255, 234, 0, 0.65)',
    glowRgba: 'rgba(255, 234, 0, 0.45)',
  },
  {
    id: 'neon_pink',
    label: 'Fucsia Neón',
    hex: '#ff2a85',
    bgRgba: 'rgba(255, 42, 133, 0.16)',
    borderRgba: 'rgba(255, 42, 133, 0.65)',
    glowRgba: 'rgba(255, 42, 133, 0.45)',
  },
  {
    id: 'neon_orange',
    label: 'Naranja Fosforescente',
    hex: '#ff7b00',
    bgRgba: 'rgba(255, 123, 0, 0.16)',
    borderRgba: 'rgba(255, 123, 0, 0.65)',
    glowRgba: 'rgba(255, 123, 0, 0.45)',
  },
  {
    id: 'neon_purple',
    label: 'Violeta Ultravioleta',
    hex: '#d946ef',
    bgRgba: 'rgba(217, 70, 239, 0.16)',
    borderRgba: 'rgba(217, 70, 239, 0.65)',
    glowRgba: 'rgba(217, 70, 239, 0.45)',
  },
  {
    id: 'neon_white',
    label: 'Blanco Destello',
    hex: '#ffffff',
    bgRgba: 'rgba(255, 255, 255, 0.16)',
    borderRgba: 'rgba(255, 255, 255, 0.75)',
    glowRgba: 'rgba(255, 255, 255, 0.45)',
  },
];

export const STORE_TITLE_COLOR_OPTIONS: Array<{
  id: StoreTitleColor;
  label: string;
  hex: string;
  lightHex: string;
}> = [
  {
    id: 'white',
    label: 'Blanco Puro',
    hex: '#ffffff',
    lightHex: '#0f172a',
  },
  {
    id: 'gold_amber',
    label: 'Dorado Real',
    hex: '#fbbf24',
    lightHex: '#b45309',
  },
  {
    id: 'emerald_bright',
    label: 'Esmeralda',
    hex: '#34d399',
    lightHex: '#047857',
  },
  {
    id: 'sky_cyan',
    label: 'Celeste Cian',
    hex: '#38bdf8',
    lightHex: '#0369a1',
  },
  {
    id: 'violet_glow',
    label: 'Violeta',
    hex: '#c084fc',
    lightHex: '#6d28d9',
  },
  {
    id: 'rose_coral',
    label: 'Coral',
    hex: '#fb7185',
    lightHex: '#be123c',
  },
  {
    id: 'neon_green',
    label: 'Verde Neón',
    hex: '#39ff14',
    lightHex: '#15803d',
  },
];

export const CAJA_CARD_COLOR_OPTIONS: Array<{
  id: CajaCardThemeColor;
  label: string;
  bg: string;
  bgHover: string;
  border: string;
  shadow: string;
  subText: string;
  swatch: string;
  isHighContrast?: boolean;
}> = [
  {
    id: 'royal_purple',
    label: 'Púrpura Real (Destacado)',
    bg: 'linear-gradient(135deg, #2e1065 0%, #1e1b4b 55%, #3b0764 100%)',
    bgHover: 'linear-gradient(135deg, #3b0764 0%, #312e81 55%, #4c1d95 100%)',
    border: '#a855f7',
    shadow: '0 12px 28px -4px rgba(147, 51, 234, 0.5), 0 0 0 1px rgba(168, 85, 247, 0.35)',
    subText: '#e9d5ff',
    swatch: '#7e22ce',
  },
  {
    id: 'cobalt_blue',
    label: 'Azul Cobalto Intenso',
    bg: 'linear-gradient(135deg, #0c4a6e 0%, #1e3a8a 55%, #172554 100%)',
    bgHover: 'linear-gradient(135deg, #0369a1 0%, #1d4ed8 55%, #1e3a8a 100%)',
    border: '#38bdf8',
    shadow: '0 12px 28px -4px rgba(14, 165, 233, 0.45), 0 0 0 1px rgba(56, 189, 248, 0.35)',
    subText: '#bae6fd',
    swatch: '#0284c7',
  },
  {
    id: 'emerald_deep',
    label: 'Esmeralda Profundo',
    bg: 'linear-gradient(135deg, #064e3b 0%, #115e59 55%, #022c22 100%)',
    bgHover: 'linear-gradient(135deg, #047857 0%, #0f766e 55%, #064e3b 100%)',
    border: '#34d399',
    shadow: '0 12px 28px -4px rgba(16, 185, 129, 0.45), 0 0 0 1px rgba(52, 211, 153, 0.35)',
    subText: '#a7f3d0',
    swatch: '#059669',
  },
  {
    id: 'crimson_wine',
    label: 'Vino Carmesí',
    bg: 'linear-gradient(135deg, #881337 0%, #4c0519 55%, #701a75 100%)',
    bgHover: 'linear-gradient(135deg, #9f1239 0%, #881337 55%, #86198f 100%)',
    border: '#fb7185',
    shadow: '0 12px 28px -4px rgba(244, 63, 94, 0.45), 0 0 0 1px rgba(251, 113, 133, 0.35)',
    subText: '#fecdd3',
    swatch: '#e11d48',
  },
  {
    id: 'amber_bronze',
    label: 'Bronce Dorado',
    bg: 'linear-gradient(135deg, #78350f 0%, #451a03 55%, #713f12 100%)',
    bgHover: 'linear-gradient(135deg, #92400e 0%, #78350f 55%, #854d0e 100%)',
    border: '#fbbf24',
    shadow: '0 12px 28px -4px rgba(245, 158, 11, 0.45), 0 0 0 1px rgba(251, 191, 36, 0.35)',
    subText: '#fde68a',
    swatch: '#d97706',
  },
  {
    id: 'obsidian_neon',
    label: 'Obsidiana Borde Neón',
    bg: 'linear-gradient(135deg, #18181b 0%, #090d16 60%, #1e293b 100%)',
    bgHover: 'linear-gradient(135deg, #27272a 0%, #0f172a 60%, #334155 100%)',
    border: '#39ff14',
    shadow: '0 12px 28px -4px rgba(57, 255, 20, 0.35), 0 0 0 1px rgba(57, 255, 20, 0.4)',
    subText: '#cbd5e1',
    swatch: '#39ff14',
  },
  {
    id: 'hc_gold_black',
    label: '⚡ AC Oro / Negro Puro',
    bg: 'linear-gradient(135deg, #000000 0%, #141204 60%, #000000 100%)',
    bgHover: 'linear-gradient(135deg, #09090b 0%, #1f1b06 60%, #09090b 100%)',
    border: '#facc15',
    shadow: '0 12px 28px -4px rgba(250, 204, 21, 0.55), 0 0 0 2px rgba(250, 204, 21, 0.5)',
    subText: '#fef08a',
    swatch: '#facc15',
    isHighContrast: true,
  },
  {
    id: 'hc_cyan_black',
    label: '⚡ AC Cian / Noche',
    bg: 'linear-gradient(135deg, #00040d 0%, #021b29 60%, #00040d 100%)',
    bgHover: 'linear-gradient(135deg, #020b1c 0%, #04283d 60%, #020b1c 100%)',
    border: '#00f5ff',
    shadow: '0 12px 28px -4px rgba(0, 245, 255, 0.5), 0 0 0 2px rgba(0, 245, 255, 0.45)',
    subText: '#a5f3fc',
    swatch: '#00f5ff',
    isHighContrast: true,
  },
  {
    id: 'hc_lime_black',
    label: '⚡ AC Verde Láser',
    bg: 'linear-gradient(135deg, #000000 0%, #04210c 60%, #000000 100%)',
    bgHover: 'linear-gradient(135deg, #051208 0%, #073314 60%, #051208 100%)',
    border: '#39ff14',
    shadow: '0 12px 28px -4px rgba(57, 255, 20, 0.5), 0 0 0 2px rgba(57, 255, 20, 0.45)',
    subText: '#bbf7d0',
    swatch: '#39ff14',
    isHighContrast: true,
  },
  {
    id: 'terracotta_warm',
    label: 'Terracota Cobre',
    bg: 'linear-gradient(135deg, #431407 0%, #7c2d12 55%, #2a0d05 100%)',
    bgHover: 'linear-gradient(135deg, #5c1c0b 0%, #9a3412 55%, #431407 100%)',
    border: '#fb923c',
    shadow: '0 12px 28px -4px rgba(249, 115, 22, 0.45), 0 0 0 1px rgba(251, 146, 60, 0.35)',
    subText: '#fed7aa',
    swatch: '#ea580c',
  },
  {
    id: 'arctic_slate',
    label: 'Pizarra Ártico',
    bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 55%, #334155 100%)',
    bgHover: 'linear-gradient(135deg, #334155 0%, #1e293b 55%, #475569 100%)',
    border: '#e2e8f0',
    shadow: '0 12px 28px -4px rgba(148, 163, 184, 0.4), 0 0 0 1px rgba(226, 232, 240, 0.35)',
    subText: '#f1f5f9',
    swatch: '#94a3b8',
  },
];

export function loadCustomizationSettings(): AppCustomizationSettings {
  try {
    const raw = localStorage.getItem(CUSTOMIZATION_STORAGE_KEY);
    if (!raw) return DEFAULT_CUSTOMIZATION_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CUSTOMIZATION_SETTINGS,
      ...parsed,
      cardElements: {
        ...DEFAULT_CARD_ELEMENTS_CONFIG,
        ...(parsed?.cardElements || {}),
      },
    };
  } catch {
    return DEFAULT_CUSTOMIZATION_SETTINGS;
  }
}

export function saveCustomizationSettings(settings: AppCustomizationSettings): void {
  try {
    localStorage.setItem(CUSTOMIZATION_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore storage errors
  }
}

export function applyCustomizationToDOM(settings: AppCustomizationSettings): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;

  const fontMeta =
    FONT_FAMILY_OPTIONS.find((f) => f.id === settings.fontFamily) || FONT_FAMILY_OPTIONS[0];
  const sizeMeta =
    FONT_SIZE_OPTIONS.find((s) => s.id === settings.fontSizeScale) || FONT_SIZE_OPTIONS[1];
  const toneMeta =
    TEXT_COLOR_TONE_OPTIONS.find((t) => t.id === settings.textColorTone) ||
    TEXT_COLOR_TONE_OPTIONS[0];
  const shapeMeta =
    CARD_SHAPE_OPTIONS.find((s) => s.id === (settings.cardShape || 'rounded')) ||
    CARD_SHAPE_OPTIONS[0];
  const cardStyleMeta =
    PRODUCT_CARD_STYLE_OPTIONS.find(
      (st) => st.id === (settings.productCardStyle || 'matte_titanium')
    ) || PRODUCT_CARD_STYLE_OPTIONS[0];
  const neonMeta =
    CLIENT_NEON_COLOR_OPTIONS.find((n) => n.id === settings.clientNeonColor) ||
    CLIENT_NEON_COLOR_OPTIONS[0];
  const titleColorMeta =
    STORE_TITLE_COLOR_OPTIONS.find((t) => t.id === settings.storeTitleColor) ||
    STORE_TITLE_COLOR_OPTIONS[0];
  const cajaMeta =
    CAJA_CARD_COLOR_OPTIONS.find((c) => c.id === settings.cajaCardColor) ||
    CAJA_CARD_COLOR_OPTIONS[0];

  root.style.setProperty('--app-font-family', fontMeta.cssValue);
  root.style.setProperty('--app-root-font-size', `${sizeMeta.rootFontSizePx}px`);
  root.style.setProperty('--app-text-main', toneMeta.hex);
  root.style.setProperty('--app-text-sub', toneMeta.subHex);

  root.style.setProperty('--app-card-radius', shapeMeta.cardRadius);
  root.style.setProperty('--app-btn-radius', shapeMeta.btnRadius);
  root.setAttribute('data-card-shape', shapeMeta.id);

  // Dynamic Visual Theme Palette Variables (Cards, Buttons, Brand Accents & Store Surfaces)
  root.style.setProperty('--pos-card-bg', cardStyleMeta.bg);
  root.style.setProperty('--pos-card-bg-hover', cardStyleMeta.bgHover);
  root.style.setProperty('--pos-card-border', cardStyleMeta.border);
  root.style.setProperty('--pos-card-border-hover', cardStyleMeta.borderHover);

  root.style.setProperty('--color-brand-50', cardStyleMeta.brand50);
  root.style.setProperty('--color-brand-100', cardStyleMeta.brand100);
  root.style.setProperty('--color-brand-400', cardStyleMeta.brand400);
  root.style.setProperty('--color-brand-500', cardStyleMeta.brand500);
  root.style.setProperty('--color-brand-600', cardStyleMeta.brand600);
  root.style.setProperty('--color-brand-700', cardStyleMeta.brand700);
  root.style.setProperty('--color-brand-900', cardStyleMeta.brand900);

  root.style.setProperty('--pos-btn-bg', cardStyleMeta.btnBg);
  root.style.setProperty('--pos-btn-bg-hover', cardStyleMeta.btnBgHover);
  root.style.setProperty('--pos-btn-border', cardStyleMeta.btnBorder);
  root.style.setProperty('--pos-btn-text', cardStyleMeta.btnText);
  root.style.setProperty('--pos-btn-shadow', cardStyleMeta.btnShadow);

  root.style.setProperty('--store-card-bg', cardStyleMeta.storeCardBg);
  root.style.setProperty('--store-card-border', cardStyleMeta.storeCardBorder);
  root.style.setProperty('--store-card-glow', cardStyleMeta.storeCardGlow);
  root.style.setProperty('--store-card-light-bg', cardStyleMeta.storeCardLightBg);

  root.setAttribute('data-card-style', cardStyleMeta.id);
  root.setAttribute('data-high-contrast', cardStyleMeta.isHighContrast ? 'true' : 'false');

  // Independent Product Card Image Size & Shape Variables
  const imgSizeMeta =
    CARD_IMAGE_SIZE_OPTIONS.find((s) => s.id === (settings.cardImageSize || 'md')) ||
    CARD_IMAGE_SIZE_OPTIONS[2];
  const imgShapeMeta =
    CARD_IMAGE_SHAPE_OPTIONS.find((s) => s.id === (settings.cardImageShape || 'rounded')) ||
    CARD_IMAGE_SHAPE_OPTIONS[0];

  root.style.setProperty('--pos-img-size', `${imgSizeMeta.px}px`);
  root.style.setProperty('--pos-img-radius', imgShapeMeta.radius);
  root.style.setProperty('--pos-img-border', imgShapeMeta.border);
  root.style.setProperty('--pos-img-shadow', imgShapeMeta.shadow);
  root.setAttribute('data-pos-img-mode', imgSizeMeta.isBanner ? 'banner' : 'thumb');

  // Independent Product Card Text & Rate Elements Variables
  const elementBaseRemMap: Record<CardTextElementId, { varPrefix: string; baseRem: number }> = {
    title: { varPrefix: '--pos-el-title', baseRem: 0.82 },
    subtitle: { varPrefix: '--pos-el-subtitle', baseRem: 0.65 },
    primaryPrice: { varPrefix: '--pos-el-price', baseRem: 1.08 },
    usdRate: { varPrefix: '--pos-el-usd', baseRem: 0.69 },
    secondaryRate: { varPrefix: '--pos-el-sec', baseRem: 0.69 },
    cryptoRate: { varPrefix: '--pos-el-crypto', baseRem: 0.65 },
    category: { varPrefix: '--pos-el-cat', baseRem: 0.64 },
    stock: { varPrefix: '--pos-el-stock', baseRem: 0.62 },
  };

  (Object.keys(elementBaseRemMap) as CardTextElementId[]).forEach((elId) => {
    const cfg = getResolvedCardElementConfig(settings, elId);
    const { varPrefix, baseRem } = elementBaseRemMap[elId];
    const szMeta =
      CARD_ELEMENT_SIZE_OPTIONS.find((s) => s.id === cfg.size) || CARD_ELEMENT_SIZE_OPTIONS[2];
    const colMeta =
      CARD_ELEMENT_COLOR_OPTIONS.find((c) => c.id === cfg.color) || CARD_ELEMENT_COLOR_OPTIONS[0];
    const wtMeta =
      CARD_ELEMENT_WEIGHT_OPTIONS.find((w) => w.id === cfg.weight) ||
      CARD_ELEMENT_WEIGHT_OPTIONS[1];
    const elFontMeta =
      cfg.font === 'inherit'
        ? fontMeta
        : FONT_FAMILY_OPTIONS.find((f) => f.id === cfg.font) || fontMeta;

    const computedRem = +(baseRem * szMeta.scale).toFixed(3);
    root.style.setProperty(`${varPrefix}-size`, `${computedRem}rem`);
    root.style.setProperty(`${varPrefix}-color`, colMeta.hex);
    root.style.setProperty(`${varPrefix}-color-light`, colMeta.lightHex);
    root.style.setProperty(`${varPrefix}-font`, elFontMeta.cssValue);
    root.style.setProperty(`${varPrefix}-weight`, String(wtMeta.fontWeight));
    root.style.setProperty(`${varPrefix}-transform`, wtMeta.textTransform);
  });

  root.style.setProperty('--store-title-color', titleColorMeta.hex);
  root.style.setProperty('--store-title-color-light', titleColorMeta.lightHex);

  root.style.setProperty('--client-neon-color', neonMeta.hex);
  root.style.setProperty('--client-neon-bg', neonMeta.bgRgba);
  root.style.setProperty('--client-neon-border', neonMeta.borderRgba);
  root.style.setProperty('--client-neon-glow', neonMeta.glowRgba);

  root.style.setProperty('--caja-card-bg', cajaMeta.bg);
  root.style.setProperty('--caja-card-bg-hover', cajaMeta.bgHover);
  root.style.setProperty('--caja-card-border', cajaMeta.border);
  root.style.setProperty('--caja-card-shadow', cajaMeta.shadow);
  root.style.setProperty('--caja-card-sub', cajaMeta.subText);

  root.classList.toggle('app-bold-boost', Boolean(settings.fontBoldBoost));
  root.classList.toggle('app-custom-text-tone', settings.textColorTone !== 'white');
  root.classList.toggle('app-reduced-motion', Boolean(settings.reducedMotionBatterySaver));
  root.classList.toggle('app-high-contrast', Boolean(cardStyleMeta.isHighContrast));
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  return new AudioCtx();
}

export function triggerHapticFeedback(
  settings: AppCustomizationSettings,
  pattern: number | number[] = 18
): void {
  if (!settings.hapticVibration) return;
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // ignore
  }
}

export function playConfiguredCheckoutSound(
  settings: AppCustomizationSettings,
  overrideStyle?: CheckoutSoundStyle
): void {
  const style = overrideStyle ?? settings.checkoutSound;
  if (!settings.soundMasterEnabled || style === 'off') return;
  const vol = Math.max(0.05, Math.min(1, settings.soundVolume || 0.85));

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (style === 'kaching') {
      const clackOsc = ctx.createOscillator();
      const clackGain = ctx.createGain();
      clackOsc.type = 'triangle';
      clackOsc.frequency.setValueAtTime(190, now);
      clackOsc.frequency.exponentialRampToValueAtTime(75, now + 0.065);
      clackGain.gain.setValueAtTime(0.32 * vol, now);
      clackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      clackOsc.connect(clackGain);
      clackGain.connect(ctx.destination);
      clackOsc.start(now);
      clackOsc.stop(now + 0.075);

      const bellStart = now + 0.085;
      const partials = [
        { freq: 2093.0, amp: 0.28 * vol, decay: 0.7 },
        { freq: 2637.0, amp: 0.18 * vol, decay: 0.6 },
        { freq: 3136.0, amp: 0.22 * vol, decay: 0.55 },
        { freq: 4186.0, amp: 0.2 * vol, decay: 0.5 },
      ];
      partials.forEach(({ freq, amp, decay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, bellStart);
        gain.gain.setValueAtTime(0.0001, bellStart);
        gain.gain.linearRampToValueAtTime(amp, bellStart + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0008, bellStart + decay);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(bellStart);
        osc.stop(bellStart + decay + 0.02);
      });
    } else if (style === 'modern_chime') {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((freq, idx) => {
        const start = now + idx * 0.065;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.24 * vol, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.37);
      });
    } else if (style === 'counter_bell') {
      [0, 0.16].forEach((offset) => {
        const start = now + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.linearRampToValueAtTime(0.3 * vol, start + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.47);
      });
    } else if (style === 'arcade_coin') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, now); // B5
      osc.frequency.setValueAtTime(1318.51, now + 0.075); // E6
      gain.gain.setValueAtTime(0.18 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.44);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1000);
  } catch {
    // ignore
  }
}

export function playConfiguredCartSound(
  settings: AppCustomizationSettings,
  overrideStyle?: CartSoundStyle
): void {
  const style = overrideStyle ?? settings.cartAddSound;
  if (!settings.soundMasterEnabled || style === 'off') return;
  const vol = Math.max(0.05, Math.min(1, settings.soundVolume || 0.85));

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (style === 'pos_beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.065);
      gain.gain.setValueAtTime(0.18 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (style === 'bubble_pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.07);
      gain.gain.setValueAtTime(0.24 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.085);
    } else if (style === 'mech_click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.035);
      gain.gain.setValueAtTime(0.28 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 300);
  } catch {
    // ignore
  }
}

export function playConfiguredScannerSound(
  settings: AppCustomizationSettings,
  overrideStyle?: ScannerSoundStyle
): void {
  const style = overrideStyle ?? settings.scannerSound;
  if (!settings.soundMasterEnabled || style === 'off') return;
  const vol = Math.max(0.05, Math.min(1, settings.soundVolume || 0.85));

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (style === 'supermarket_laser') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(2350, now);
      gain.gain.setValueAtTime(0.16 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (style === 'soft_ding') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1318.5, now);
      gain.gain.setValueAtTime(0.22 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.24);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 400);
  } catch {
    // ignore
  }
}

export function playConfiguredAlertSound(
  settings: AppCustomizationSettings,
  overrideStyle?: AlertSoundStyle
): void {
  const style = overrideStyle ?? settings.alertSound;
  if (!settings.soundMasterEnabled || style === 'off') return;
  const vol = Math.max(0.05, Math.min(1, settings.soundVolume || 0.85));

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (style === 'double_warn') {
      [0, 0.11].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(310, now + offset);
        gain.gain.setValueAtTime(0.16 * vol, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.085);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } else if (style === 'soft_low') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
      gain.gain.setValueAtTime(0.22 * vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.22);
    }

    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 500);
  } catch {
    // ignore
  }
}
