import React, { useState, useEffect } from 'react';
import { AnimatedToggleSwitch } from '../i18n';
import {
  AppCustomizationSettings,
  DEFAULT_CUSTOMIZATION_SETTINGS,
  FONT_FAMILY_OPTIONS,
  FONT_SIZE_OPTIONS,
  TEXT_COLOR_TONE_OPTIONS,
  CARD_SHAPE_OPTIONS,
  PRODUCT_CARD_STYLE_OPTIONS,
  CLIENT_NEON_COLOR_OPTIONS,
  STORE_TITLE_COLOR_OPTIONS,
  CAJA_CARD_COLOR_OPTIONS,
  CardElementId,
  CardTextElementId,
  CardElementStyleConfig,
  DEFAULT_CARD_ELEMENTS_CONFIG,
  CARD_IMAGE_SIZE_OPTIONS,
  CARD_IMAGE_SHAPE_OPTIONS,
  CARD_ELEMENT_SIZE_OPTIONS,
  CARD_ELEMENT_WEIGHT_OPTIONS,
  CARD_ELEMENT_COLOR_OPTIONS,
  CARD_ELEMENTS_META,
  getResolvedCardElementConfig,
  CheckoutSoundStyle,
  CartSoundStyle,
  ScannerSoundStyle,
  AlertSoundStyle,
  playConfiguredCheckoutSound,
  playConfiguredCartSound,
  playConfiguredScannerSound,
  playConfiguredAlertSound,
  triggerHapticFeedback,
} from '../utils/appCustomization';

export type StoreAccentColor =
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'cyan'
  | 'violet'
  | 'hc_amber'
  | 'hc_cyan'
  | 'hc_neon'
  | 'cobalt'
  | 'terracotta';

export interface InventoryCopyRequest {
  id: string;
  requesterStoreId: string;
  requesterStoreCode: string;
  requesterStoreName: string;
  requesterOwnerEmail: string;
  targetStoreId: string;
  targetStoreCode: string;
  targetStoreName: string;
  targetOwnerEmail: string;
  mode: 'copy' | 'fusion';
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  productsCount: number;
}

export interface InventoryCopyProgressState {
  isActive: boolean;
  percent: number;
  completed: boolean;
  sourceCode: string;
  sourceName: string;
  targetCode: string;
  targetName: string;
  totalProducts: number;
  copiedProducts: number;
  mode: 'copy' | 'fusion';
}

export interface StoreBranchSummary {
  id: string;
  uniqueCode: string;
  ownerEmail: string;
  name: string;
  type: 'tienda' | 'sucursal';
  color: StoreAccentColor;
  address?: string;
  createdAt?: string;
  productsCount: number;
  cartsCount: number;
  salesCount: number;
  fusedWithStoreId?: string;
  fusedWithStoreName?: string;
  fusedWithStoreCode?: string;
  parentStoreId?: string;
  parentStoreName?: string;
  parentStoreCode?: string;
}

export const STORE_COLOR_STYLES: Record<
  StoreAccentColor,
  {
    label: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    ring: string;
    gradient: string;
    dot: string;
    bannerBg: string;
    cardBgClass: string;
    cardBorderClass: string;
    cardBgHex: string;
    cardBorderHex: string;
    cardGlowHex: string;
    cardLightBgHex: string;
    isHighContrast?: boolean;
  }
> = {
  indigo: {
    label: 'Azul Índigo',
    badgeBg: 'bg-indigo-500/20',
    badgeText: 'text-indigo-300',
    border: 'border-indigo-500/50',
    ring: 'ring-indigo-500/30',
    gradient: 'from-indigo-600 to-blue-700',
    dot: 'bg-indigo-400',
    bannerBg: 'bg-indigo-950/60 border-indigo-500/40',
    cardBgClass: 'bg-indigo-950/80 bg-opacity-80',
    cardBorderClass: 'border-indigo-500/50 hover:border-indigo-400',
    cardBgHex: 'rgba(30, 27, 75, 0.82)',
    cardBorderHex: 'rgba(99, 102, 241, 0.55)',
    cardGlowHex: 'rgba(99, 102, 241, 0.22)',
    cardLightBgHex: 'rgba(238, 242, 255, 0.92)',
  },
  emerald: {
    label: 'Verde Esmeralda',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300',
    border: 'border-emerald-500/50',
    ring: 'ring-emerald-500/30',
    gradient: 'from-emerald-600 to-teal-700',
    dot: 'bg-emerald-400',
    bannerBg: 'bg-emerald-950/60 border-emerald-500/40',
    cardBgClass: 'bg-emerald-950/80 bg-opacity-80',
    cardBorderClass: 'border-emerald-500/50 hover:border-emerald-400',
    cardBgHex: 'rgba(6, 78, 59, 0.82)',
    cardBorderHex: 'rgba(16, 185, 129, 0.55)',
    cardGlowHex: 'rgba(16, 185, 129, 0.22)',
    cardLightBgHex: 'rgba(236, 253, 245, 0.92)',
  },
  amber: {
    label: 'Ámbar Dorado',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300',
    border: 'border-amber-500/50',
    ring: 'ring-amber-500/30',
    gradient: 'from-amber-500 to-orange-600',
    dot: 'bg-amber-400',
    bannerBg: 'bg-amber-950/60 border-amber-500/40',
    cardBgClass: 'bg-amber-950/80 bg-opacity-80',
    cardBorderClass: 'border-amber-500/50 hover:border-amber-400',
    cardBgHex: 'rgba(69, 26, 3, 0.82)',
    cardBorderHex: 'rgba(245, 158, 11, 0.55)',
    cardGlowHex: 'rgba(245, 158, 11, 0.22)',
    cardLightBgHex: 'rgba(255, 251, 235, 0.92)',
  },
  rose: {
    label: 'Rojo Coral',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-300',
    border: 'border-rose-500/50',
    ring: 'ring-rose-500/30',
    gradient: 'from-rose-600 to-pink-700',
    dot: 'bg-rose-400',
    bannerBg: 'bg-rose-950/60 border-rose-500/40',
    cardBgClass: 'bg-rose-950/80 bg-opacity-80',
    cardBorderClass: 'border-rose-500/50 hover:border-rose-400',
    cardBgHex: 'rgba(76, 5, 25, 0.82)',
    cardBorderHex: 'rgba(244, 63, 94, 0.55)',
    cardGlowHex: 'rgba(244, 63, 94, 0.22)',
    cardLightBgHex: 'rgba(255, 241, 242, 0.92)',
  },
  cyan: {
    label: 'Cian Turquesa',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300',
    border: 'border-cyan-500/50',
    ring: 'ring-cyan-500/30',
    gradient: 'from-cyan-600 to-sky-700',
    dot: 'bg-cyan-400',
    bannerBg: 'bg-cyan-950/60 border-cyan-500/40',
    cardBgClass: 'bg-cyan-950/80 bg-opacity-80',
    cardBorderClass: 'border-cyan-500/50 hover:border-cyan-400',
    cardBgHex: 'rgba(8, 51, 68, 0.82)',
    cardBorderHex: 'rgba(6, 182, 212, 0.55)',
    cardGlowHex: 'rgba(6, 182, 212, 0.22)',
    cardLightBgHex: 'rgba(236, 254, 255, 0.92)',
  },
  violet: {
    label: 'Violeta Real',
    badgeBg: 'bg-violet-500/20',
    badgeText: 'text-violet-300',
    border: 'border-violet-500/50',
    ring: 'ring-violet-500/30',
    gradient: 'from-violet-600 to-purple-700',
    dot: 'bg-violet-400',
    bannerBg: 'bg-violet-950/60 border-violet-500/40',
    cardBgClass: 'bg-violet-950/80 bg-opacity-80',
    cardBorderClass: 'border-violet-500/50 hover:border-violet-400',
    cardBgHex: 'rgba(46, 16, 101, 0.82)',
    cardBorderHex: 'rgba(139, 92, 246, 0.55)',
    cardGlowHex: 'rgba(139, 92, 246, 0.22)',
    cardLightBgHex: 'rgba(245, 243, 255, 0.92)',
  },
  hc_amber: {
    label: '⚡ Alto Contraste Ámbar',
    badgeBg: 'bg-yellow-400/25',
    badgeText: 'text-yellow-300',
    border: 'border-yellow-400',
    ring: 'ring-yellow-400/50',
    gradient: 'from-yellow-500 to-amber-600',
    dot: 'bg-yellow-400',
    bannerBg: 'bg-black border-yellow-400',
    cardBgClass: 'bg-black',
    cardBorderClass: 'border-yellow-400 hover:border-yellow-300',
    cardBgHex: 'rgba(5, 5, 7, 0.96)',
    cardBorderHex: 'rgba(250, 204, 21, 0.88)',
    cardGlowHex: 'rgba(250, 204, 21, 0.35)',
    cardLightBgHex: 'rgba(254, 252, 232, 0.98)',
    isHighContrast: true,
  },
  hc_cyan: {
    label: '⚡ Alto Contraste Cian',
    badgeBg: 'bg-cyan-400/25',
    badgeText: 'text-cyan-200',
    border: 'border-cyan-400',
    ring: 'ring-cyan-400/50',
    gradient: 'from-cyan-500 to-blue-600',
    dot: 'bg-cyan-300',
    bannerBg: 'bg-slate-950 border-cyan-400',
    cardBgClass: 'bg-slate-950',
    cardBorderClass: 'border-cyan-400 hover:border-cyan-300',
    cardBgHex: 'rgba(3, 7, 18, 0.96)',
    cardBorderHex: 'rgba(0, 245, 255, 0.88)',
    cardGlowHex: 'rgba(0, 245, 255, 0.35)',
    cardLightBgHex: 'rgba(236, 254, 255, 0.98)',
    isHighContrast: true,
  },
  hc_neon: {
    label: '⚡ Alto Contraste Verde',
    badgeBg: 'bg-green-400/25',
    badgeText: 'text-green-300',
    border: 'border-green-400',
    ring: 'ring-green-400/50',
    gradient: 'from-green-500 to-emerald-600',
    dot: 'bg-green-400',
    bannerBg: 'bg-black border-green-400',
    cardBgClass: 'bg-black',
    cardBorderClass: 'border-green-400 hover:border-green-300',
    cardBgHex: 'rgba(3, 11, 6, 0.96)',
    cardBorderHex: 'rgba(57, 255, 20, 0.85)',
    cardGlowHex: 'rgba(57, 255, 20, 0.32)',
    cardLightBgHex: 'rgba(240, 253, 244, 0.98)',
    isHighContrast: true,
  },
  cobalt: {
    label: 'Océano Cobalto',
    badgeBg: 'bg-blue-500/20',
    badgeText: 'text-blue-300',
    border: 'border-blue-500/50',
    ring: 'ring-blue-500/30',
    gradient: 'from-blue-600 to-indigo-700',
    dot: 'bg-blue-400',
    bannerBg: 'bg-blue-950/60 border-blue-500/40',
    cardBgClass: 'bg-blue-950/85',
    cardBorderClass: 'border-blue-500/50 hover:border-blue-400',
    cardBgHex: 'rgba(15, 36, 71, 0.9)',
    cardBorderHex: 'rgba(96, 165, 250, 0.55)',
    cardGlowHex: 'rgba(59, 130, 246, 0.25)',
    cardLightBgHex: 'rgba(239, 246, 255, 0.94)',
  },
  terracotta: {
    label: 'Terracota Cobre',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-300',
    border: 'border-orange-500/50',
    ring: 'ring-orange-500/30',
    gradient: 'from-orange-600 to-red-700',
    dot: 'bg-orange-400',
    bannerBg: 'bg-orange-950/60 border-orange-500/40',
    cardBgClass: 'bg-orange-950/85',
    cardBorderClass: 'border-orange-500/50 hover:border-orange-400',
    cardBgHex: 'rgba(59, 28, 22, 0.9)',
    cardBorderHex: 'rgba(251, 146, 60, 0.55)',
    cardGlowHex: 'rgba(249, 115, 22, 0.25)',
    cardLightBgHex: 'rgba(255, 247, 237, 0.94)',
  },
};

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => {
  const padded = String(h).padStart(2, '0');
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return {
    value: h,
    label: `${padded}:00 (${hour12}:00 ${suffix})`,
  };
});

interface StoreBranchesModalProps {
  isOpen: boolean;
  stores: StoreBranchSummary[];
  activeStoreId: string;
  userFullName?: string;
  userEmail?: string;
  userToken?: string;
  appLang?: string;
  languages?: ReadonlyArray<{ code: string; name: string; nativeName: string; flag: string }>;
  onSelectLanguage?: (code: any) => void;
  themeMode?: 'dark' | 'light';
  onToggleTheme?: () => void;
  autoDarkByTime?: boolean;
  onToggleAutoDarkByTime?: (enabled: boolean) => void;
  autoDarkStartHour?: number;
  autoDarkEndHour?: number;
  onChangeAutoDarkSchedule?: (startHour: number, endHour: number) => void;
  deviceTimeDisplay?: string;
  onLogout?: () => void;
  logoutLabel?: string;
  languageLabel?: string;
  onClose: () => void;
  onSelectStore: (storeId: string) => void;
  onCreateStore: (data: {
    name: string;
    type: 'tienda' | 'sucursal';
    color: StoreAccentColor;
    address: string;
    copyCategoriesOnly: boolean;
    inventoryMode?: 'independent' | 'fusion' | 'request_copy';
    sourceStoreIdOrCode?: string;
    parentStoreId?: string;
  }) => void;
  onRenameStore: (storeId: string, newName: string, newColor: StoreAccentColor) => void;
  onDeleteStore: (storeId: string) => void;
  onToggleFusionMode?: (storeId: string, targetStoreId: string | null) => void;
  onRequestCopyInventoryByCode?: (params: {
    requesterStoreId: string;
    targetCodeInput: string;
    mode: 'copy' | 'fusion';
  }) => { ok: boolean; message: string };
  inventoryCopyRequests?: InventoryCopyRequest[];
  onApproveInventoryRequest?: (requestId: string) => void;
  onRejectInventoryRequest?: (requestId: string) => void;
  activeCopyProgress?: InventoryCopyProgressState | null;
  onDismissCopyProgress?: () => void;
  onOpenUserSetup?: () => void;
  onOpenPaymentMethodsConfig?: () => void;
  onOpenDevicePairing?: () => void;
  connectedDevicesCount?: number;
  wsConnected?: boolean;
  customization: AppCustomizationSettings;
  onUpdateCustomization: (patch: Partial<AppCustomizationSettings>) => void;
  onResetCustomization: () => void;
  defaultBranchPreviewCode?: string;
  nextTiendaPreviewCode?: string;
  nextSucursalPreviewCode?: string;
  initialTab?: 'appearance' | 'sounds' | 'extra' | 'stores';
  kioskPin?: string;
  kioskPinUpdatedAt?: string;
  onUpdateKioskPinSecurely?: (params: {
    currentPinOrPass: string;
    newPin: string;
    skipCurrentCheck?: boolean;
  }) => { ok: boolean; message: string };
}

export type SettingsMenuTab = 'appearance' | 'sounds' | 'extra' | 'stores';

export const StoreBranchesModal: React.FC<StoreBranchesModalProps> = ({
  isOpen,
  stores,
  activeStoreId,
  userFullName,
  userEmail,
  userToken,
  appLang = 'es',
  languages = [],
  onSelectLanguage,
  themeMode = 'dark',
  onToggleTheme,
  autoDarkByTime = false,
  onToggleAutoDarkByTime,
  autoDarkStartHour = 18,
  autoDarkEndHour = 6,
  onChangeAutoDarkSchedule,
  deviceTimeDisplay,
  onLogout,
  logoutLabel = 'Salir',
  languageLabel = 'Idioma',
  onClose,
  onSelectStore,
  onCreateStore,
  onRenameStore,
  onDeleteStore,
  onToggleFusionMode,
  onRequestCopyInventoryByCode,
  inventoryCopyRequests = [],
  onApproveInventoryRequest,
  onRejectInventoryRequest,
  activeCopyProgress,
  onDismissCopyProgress,
  onOpenUserSetup,
  onOpenPaymentMethodsConfig,
  onOpenDevicePairing,
  connectedDevicesCount = 1,
  wsConnected = false,
  customization,
  onUpdateCustomization,
  onResetCustomization,
  defaultBranchPreviewCode,
  nextTiendaPreviewCode,
  nextSucursalPreviewCode,
  initialTab = 'appearance',
  kioskPin = '1234',
  kioskPinUpdatedAt = 'Predeterminado',
  onUpdateKioskPinSecurely,
}) => {
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsMenuTab>(initialTab);

  useEffect(() => {
    if (isOpen) {
      setActiveSettingsTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const [previewTouchFeedback, setPreviewTouchFeedback] = useState<string>(
    '👆 Toca cualquier opción o toca la vista previa para ver los cambios en vivo al instante'
  );
  const [isLiveBackgroundPeek, setIsLiveBackgroundPeek] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'tienda' | 'sucursal'>('tienda');
  const [newColor, setNewColor] = useState<StoreAccentColor>('emerald');
  const [newAddress, setNewAddress] = useState('');
  const [newInventoryMode, setNewInventoryMode] = useState<'independent' | 'fusion' | 'request_copy'>('independent');
  const [newSourceStoreOrCode, setNewSourceStoreOrCode] = useState('');
  const [newParentStoreId, setNewParentStoreId] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<StoreAccentColor>('indigo');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>('');
  const [formError, setFormError] = useState('');
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);
  const [selectedCardElement, setSelectedCardElement] = useState<CardElementId>('title');

  // State for Copying / Fusing Inventory by Store/Branch ID
  const [copyRequesterStoreId, setCopyRequesterStoreId] = useState<string>(activeStoreId);
  const [copyTargetCodeInput, setCopyTargetCodeInput] = useState<string>('');
  const [copyActionMode, setCopyActionMode] = useState<'copy' | 'fusion'>('copy');
  const [copyRequestFeedback, setCopyRequestFeedback] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);
  const [fusionPickerStoreId, setFusionPickerStoreId] = useState<string | null>(null);

  // Kiosk PIN Management state inside Settings Modal
  const [revealCurrentKioskPin, setRevealCurrentKioskPin] = useState(false);
  const [showChangePinModalBox, setShowChangePinModalBox] = useState(false);
  const [modalCurrentPinInput, setModalCurrentPinInput] = useState('');
  const [modalNewPinInput, setModalNewPinInput] = useState('');
  const [modalConfirmPinInput, setModalConfirmPinInput] = useState('');
  const [revealModalNewPin, setRevealModalNewPin] = useState(false);
  const [modalPinFeedback, setModalPinFeedback] = useState<{
    type: 'ok' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (activeStoreId) {
      setCopyRequesterStoreId(activeStoreId);
    }
  }, [activeStoreId]);

  const handleCopyCode = (text: string) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
    } catch {
      // ignore
    }
    document.body.removeChild(textarea);
    setCopiedCodeKey(text);
    setTimeout(() => setCopiedCodeKey(null), 2000);
  };

  if (!isOpen) return null;

  const activeStore = stores.find((s) => s.id === activeStoreId) || stores[0];
  const currentLangObj = languages.find((l) => l.code === appLang);

  const currentFontMeta =
    FONT_FAMILY_OPTIONS.find((f) => f.id === customization.fontFamily) || FONT_FAMILY_OPTIONS[0];
  const currentSizeMeta =
    FONT_SIZE_OPTIONS.find((s) => s.id === customization.fontSizeScale) || FONT_SIZE_OPTIONS[1];
  const currentToneMeta =
    TEXT_COLOR_TONE_OPTIONS.find((t) => t.id === customization.textColorTone) ||
    TEXT_COLOR_TONE_OPTIONS[0];
  const currentShapeMeta =
    CARD_SHAPE_OPTIONS.find((s) => s.id === (customization.cardShape || 'rounded')) ||
    CARD_SHAPE_OPTIONS[0];
  const currentCardStyleMeta =
    PRODUCT_CARD_STYLE_OPTIONS.find(
      (st) => st.id === (customization.productCardStyle || 'matte_titanium')
    ) || PRODUCT_CARD_STYLE_OPTIONS[0];
  const currentNeonMeta =
    CLIENT_NEON_COLOR_OPTIONS.find((n) => n.id === customization.clientNeonColor) ||
    CLIENT_NEON_COLOR_OPTIONS[0];
  const currentStoreTitleColorMeta =
    STORE_TITLE_COLOR_OPTIONS.find((t) => t.id === (customization.storeTitleColor || 'white')) ||
    STORE_TITLE_COLOR_OPTIONS[0];
  const currentCajaMeta =
    CAJA_CARD_COLOR_OPTIONS.find((c) => c.id === customization.cajaCardColor) ||
    CAJA_CARD_COLOR_OPTIONS[0];

  const previewScaleRatio =
    customization.fontSizeScale === 'compact'
      ? 0.92
      : customization.fontSizeScale === 'large'
      ? 1.08
      : customization.fontSizeScale === 'xlarge'
      ? 1.16
      : 1;

  // Interactive Preview Cycle Handlers
  const cycleStoreTitleColor = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = STORE_TITLE_COLOR_OPTIONS.findIndex(
      (c) => c.id === (customization.storeTitleColor || 'white')
    );
    const next = STORE_TITLE_COLOR_OPTIONS[(idx + 1) % STORE_TITLE_COLOR_OPTIONS.length];
    onUpdateCustomization({ storeTitleColor: next.id });
    triggerHapticFeedback(customization, 15);
    playConfiguredCartSound(customization);
    setPreviewTouchFeedback(
      `🏪 Color del titular de la tienda cambiado a: ${next.label} (Tamaño específico fijo)`
    );
  };

  const cycleClientNeonColor = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = CLIENT_NEON_COLOR_OPTIONS.findIndex((c) => c.id === customization.clientNeonColor);
    const next = CLIENT_NEON_COLOR_OPTIONS[(idx + 1) % CLIENT_NEON_COLOR_OPTIONS.length];
    onUpdateCustomization({ clientNeonColor: next.id });
    triggerHapticFeedback(customization, 15);
    playConfiguredCartSound(customization);
    setPreviewTouchFeedback(`✨ Color del cliente cambiado a: ${next.label}`);
  };

  const cycleCajaCardColor = () => {
    const idx = CAJA_CARD_COLOR_OPTIONS.findIndex((c) => c.id === customization.cajaCardColor);
    const next = CAJA_CARD_COLOR_OPTIONS[(idx + 1) % CAJA_CARD_COLOR_OPTIONS.length];
    onUpdateCustomization({ cajaCardColor: next.id });
    triggerHapticFeedback(customization, 18);
    playConfiguredCartSound(customization);
    setPreviewTouchFeedback(`🎨 Color de la tarjeta de Caja cambiado a: ${next.label}`);
  };

  const cycleFontFamily = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = FONT_FAMILY_OPTIONS.findIndex((f) => f.id === customization.fontFamily);
    const next = FONT_FAMILY_OPTIONS[(idx + 1) % FONT_FAMILY_OPTIONS.length];
    onUpdateCustomization({ fontFamily: next.id });
    triggerHapticFeedback(customization, 15);
    playConfiguredCartSound(customization);
    setPreviewTouchFeedback(`🔤 Estilo de letra cambiado a: ${next.label}`);
  };

  const cycleFontSize = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = FONT_SIZE_OPTIONS.findIndex((s) => s.id === customization.fontSizeScale);
    const next = FONT_SIZE_OPTIONS[(idx + 1) % FONT_SIZE_OPTIONS.length];
    onUpdateCustomization({ fontSizeScale: next.id });
    triggerHapticFeedback(customization, 15);
    playConfiguredCartSound(customization);
    setPreviewTouchFeedback(`📏 Tamaño de letra cambiado a: ${next.label} (${next.percentLabel})`);
  };

  const cycleTextColorTone = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = TEXT_COLOR_TONE_OPTIONS.findIndex((t) => t.id === customization.textColorTone);
    const next = TEXT_COLOR_TONE_OPTIONS[(idx + 1) % TEXT_COLOR_TONE_OPTIONS.length];
    onUpdateCustomization({ textColorTone: next.id });
    triggerHapticFeedback(customization, 15);
    playConfiguredCartSound(customization);
    setPreviewTouchFeedback(`🌈 Color de las letras cambiado a: ${next.label}`);
  };

  const cycleCardShape = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = CARD_SHAPE_OPTIONS.findIndex(
      (s) => s.id === (customization.cardShape || 'rounded')
    );
    const next = CARD_SHAPE_OPTIONS[(idx + 1) % CARD_SHAPE_OPTIONS.length];
    onUpdateCustomization({ cardShape: next.id });
    triggerHapticFeedback(customization, 15);
    playConfiguredCartSound(customization);
    setPreviewTouchFeedback(`📐 Forma de tarjetas cambiada a: ${next.label}`);
  };

  const cycleProductCardStyle = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const idx = PRODUCT_CARD_STYLE_OPTIONS.findIndex(
      (st) => st.id === (customization.productCardStyle || 'matte_titanium')
    );
    const next = PRODUCT_CARD_STYLE_OPTIONS[(idx + 1) % PRODUCT_CARD_STYLE_OPTIONS.length];
    onUpdateCustomization({ productCardStyle: next.id });
    triggerHapticFeedback(customization, 15);
    playConfiguredCartSound(customization);
    setPreviewTouchFeedback(`🎨 Estilo de tarjeta cambiado a: ${next.label}`);
  };

  // Per-Element Product Card Customization Helpers
  const resolvedCardElements = getResolvedCardElementConfig(customization);
  const currentImgSizeMeta =
    CARD_IMAGE_SIZE_OPTIONS.find((s) => s.id === (customization.cardImageSize || 'md')) ||
    CARD_IMAGE_SIZE_OPTIONS[2];
  const currentImgShapeMeta =
    CARD_IMAGE_SHAPE_OPTIONS.find((sh) => sh.id === (customization.cardImageShape || 'rounded')) ||
    CARD_IMAGE_SHAPE_OPTIONS[0];
  const activeElementMeta =
    CARD_ELEMENTS_META.find((m) => m.id === selectedCardElement) || CARD_ELEMENTS_META[1];

  const getElementDisplayStyles = (
    elId: CardTextElementId,
    basePx: number
  ): React.CSSProperties => {
    const cfg = resolvedCardElements[elId] || DEFAULT_CARD_ELEMENTS_CONFIG[elId];
    const szMeta =
      CARD_ELEMENT_SIZE_OPTIONS.find((s) => s.id === cfg.size) || CARD_ELEMENT_SIZE_OPTIONS[1];
    const colMeta =
      CARD_ELEMENT_COLOR_OPTIONS.find((c) => c.id === cfg.color) || CARD_ELEMENT_COLOR_OPTIONS[0];
    const wtMeta =
      CARD_ELEMENT_WEIGHT_OPTIONS.find((w) => w.id === cfg.weight) ||
      CARD_ELEMENT_WEIGHT_OPTIONS[1];
    const fMeta =
      cfg.font === 'inherit'
        ? currentFontMeta
        : FONT_FAMILY_OPTIONS.find((f) => f.id === cfg.font) || currentFontMeta;
    const resolvedHex = cfg.color === 'auto' ? currentToneMeta.hex : colMeta.hex;
    return {
      fontSize: `${(basePx * szMeta.scale * previewScaleRatio).toFixed(1)}px`,
      color: resolvedHex,
      fontFamily: fMeta.cssValue,
      fontWeight: wtMeta.cssWeight,
      textTransform: wtMeta.uppercase ? 'uppercase' : 'none',
    };
  };

  const handleSelectCardElement = (elId: CardElementId, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCardElement(elId);
    const meta = CARD_ELEMENTS_META.find((m) => m.id === elId);
    triggerHapticFeedback(customization, 12);
    playConfiguredCartSound(customization);
    if (meta) {
      setPreviewTouchFeedback(
        `✏️ Editando "${meta.label}": usa los controles de abajo para agrandar, cambiar color o letra`
      );
    }
  };

  const updateSingleTextElement = (
    elId: CardTextElementId,
    partial: Partial<CardElementStyleConfig>,
    feedbackMsg?: string
  ) => {
    const current = resolvedCardElements[elId] || DEFAULT_CARD_ELEMENTS_CONFIG[elId];
    const nextMap = {
      ...resolvedCardElements,
      [elId]: {
        ...current,
        ...partial,
      },
    };
    onUpdateCustomization({ cardElements: nextMap });
    triggerHapticFeedback(customization, 12);
    if (feedbackMsg) setPreviewTouchFeedback(feedbackMsg);
  };

  const stepSelectedElementSize = (direction: -1 | 1) => {
    if (selectedCardElement === 'image') {
      const idx = CARD_IMAGE_SIZE_OPTIONS.findIndex(
        (s) => s.id === (customization.cardImageSize || 'md')
      );
      const nextIdx = Math.max(0, Math.min(CARD_IMAGE_SIZE_OPTIONS.length - 1, idx + direction));
      const nextOpt = CARD_IMAGE_SIZE_OPTIONS[nextIdx];
      onUpdateCustomization({ cardImageSize: nextOpt.id });
      triggerHapticFeedback(customization, 15);
      playConfiguredCartSound(customization);
      setPreviewTouchFeedback(
        `🖼️ Tamaño de imagen del producto: ${nextOpt.label} (${nextOpt.badge})`
      );
      return;
    }
    const elId = selectedCardElement as CardTextElementId;
    const cfg = resolvedCardElements[elId] || DEFAULT_CARD_ELEMENTS_CONFIG[elId];
    const idx = CARD_ELEMENT_SIZE_OPTIONS.findIndex((s) => s.id === cfg.size);
    const nextIdx = Math.max(0, Math.min(CARD_ELEMENT_SIZE_OPTIONS.length - 1, idx + direction));
    const nextOpt = CARD_ELEMENT_SIZE_OPTIONS[nextIdx];
    updateSingleTextElement(
      elId,
      { size: nextOpt.id },
      `📏 Tamaño de "${activeElementMeta.shortLabel}": ${nextOpt.label} (${nextOpt.badge})`
    );
    playConfiguredCartSound(customization);
  };

  const applyColorToAllRates = (colorId: CardElementStyleConfig['color']) => {
    const colMeta =
      CARD_ELEMENT_COLOR_OPTIONS.find((c) => c.id === colorId) || CARD_ELEMENT_COLOR_OPTIONS[0];
    const nextMap = {
      ...resolvedCardElements,
      primaryPrice: { ...resolvedCardElements.primaryPrice, color: colorId },
      usdRate: { ...resolvedCardElements.usdRate, color: colorId },
      secondaryRate: { ...resolvedCardElements.secondaryRate, color: colorId },
      cryptoRate: { ...resolvedCardElements.cryptoRate, color: colorId },
    };
    onUpdateCustomization({ cardElements: nextMap });
    triggerHapticFeedback(customization, 18);
    playConfiguredCartSound(customization);
    setPreviewTouchFeedback(
      `💱 Color uniforme "${colMeta.label}" aplicado a todas las tasas (VES, USD, COP y BTC)`
    );
  };

  const resetSingleCardElement = (elId: CardElementId) => {
    if (elId === 'image') {
      onUpdateCustomization({
        cardImageSize: DEFAULT_CUSTOMIZATION_SETTINGS.cardImageSize,
        cardImageShape: DEFAULT_CUSTOMIZATION_SETTINGS.cardImageShape,
      });
      setPreviewTouchFeedback('🔄 Imagen del producto restaurada a su tamaño y forma original');
      return;
    }
    const textId = elId as CardTextElementId;
    const nextMap = {
      ...resolvedCardElements,
      [textId]: { ...DEFAULT_CARD_ELEMENTS_CONFIG[textId] },
    };
    onUpdateCustomization({ cardElements: nextMap });
    triggerHapticFeedback(customization, 14);
    setPreviewTouchFeedback(
      `🔄 Elemento "${activeElementMeta.label}" restaurado a su estilo predeterminado`
    );
  };

  const mainTiendasList = stores.filter((s) => s.type !== 'sucursal');
  const defaultMainTienda = mainTiendasList[0] || stores[0];

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newName.trim();
    if (!clean) {
      setFormError('Escribe el nombre de la nueva tienda o sucursal (ej. TIENDA 2).');
      return;
    }
    if (newType === 'tienda' && newInventoryMode === 'fusion') {
      setFormError(
        '⚠️ Las tiendas principales no pueden fusionar su inventario entre sí. Solo una Tienda Principal y alguna de sus Sucursales pueden usar Modo Fusión.'
      );
      return;
    }
    const resolvedParentTienda =
      newType === 'sucursal'
        ? mainTiendasList.find((t) => t.id === newParentStoreId) || defaultMainTienda
        : undefined;

    const effectiveSourceStoreOrCode =
      newType === 'sucursal' && newInventoryMode === 'fusion'
        ? resolvedParentTienda?.id || newSourceStoreOrCode.trim()
        : newSourceStoreOrCode.trim();

    if (
      (newInventoryMode === 'fusion' || newInventoryMode === 'request_copy') &&
      !effectiveSourceStoreOrCode
    ) {
      setFormError(
        newInventoryMode === 'fusion'
          ? 'Selecciona la Tienda Principal con la cual esta sucursal fusionará su inventario.'
          : 'Coloca el ID de la tienda o sucursal de la cual solicitas copiar el inventario.'
      );
      return;
    }
    onCreateStore({
      name: clean,
      type: newType,
      color: newColor,
      address: newAddress.trim(),
      copyCategoriesOnly: true,
      inventoryMode: newType === 'tienda' && newInventoryMode === 'fusion' ? 'independent' : newInventoryMode,
      sourceStoreIdOrCode: effectiveSourceStoreOrCode || undefined,
      parentStoreId: newType === 'sucursal' ? resolvedParentTienda?.id : undefined,
    });
    setNewName('');
    setNewAddress('');
    setNewInventoryMode('independent');
    setNewSourceStoreOrCode('');
    setFormError('');
    setShowCreateForm(false);
    const colors: StoreAccentColor[] = ['emerald', 'amber', 'rose', 'cyan', 'violet', 'indigo'];
    const nextColor = colors[(stores.length + 1) % colors.length];
    setNewColor(nextColor);
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-200 flex justify-center p-2 sm:p-4 ${
        isLiveBackgroundPeek
          ? 'bg-black/10 items-end pointer-events-auto'
          : 'bg-black/75 backdrop-blur-sm items-center'
      }`}
    >
      <div
        className={`bg-slate-800 border-2 border-brand-500/40 shadow-2xl rounded-3xl p-3 sm:p-5 max-w-xl w-full overflow-y-auto space-y-3.5 text-xs transition-all duration-200 ${
          isLiveBackgroundPeek ? 'max-h-[48vh] bg-slate-900/95' : 'max-h-[93vh]'
        }`}
      >
        {/* Header: Menú de Ajustes General + Botón Ver Fondo en Vivo */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-brand-600/30 shrink-0">
              <i className="fa-solid fa-sliders text-sm"></i>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white truncate">
                Menú de Ajustes y Personalización
              </h3>
              <p className="text-[10.5px] text-slate-400 truncate">
                Letras, colores, formas, estilos y previsualización en vivo
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsLiveBackgroundPeek((prev) => !prev)}
              style={{ minWidth: 0, minHeight: 36 }}
              title="Ver cómo va quedando la tienda detrás sin salir de esta ventana"
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                isLiveBackgroundPeek
                  ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-900 hover:bg-slate-700 border-slate-600 text-emerald-300'
              }`}
            >
              <i className={`fa-solid ${isLiveBackgroundPeek ? 'fa-expand' : 'fa-eye'}`}></i>
              <span className="hidden sm:inline">
                {isLiveBackgroundPeek ? 'Ampliar Panel' : 'Ver Tienda en Vivo'}
              </span>
              <span className="sm:hidden">{isLiveBackgroundPeek ? 'Ampliar' : 'Ver Vivo'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ minWidth: 0, minHeight: 36 }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition"
            >
              <i className="fa-solid fa-arrow-left text-brand-400"></i>
              <span>Volver</span>
            </button>
          </div>
        </div>

        {/* Compact Active Store Bar with Small "🔀 CAMBIAR" Button Right Next to "Estás en la tienda:" */}
        {activeStore && (
          <div className="bg-slate-900/95 border border-slate-700/90 rounded-2xl px-3 py-2 space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                <span
                  className={`w-2 h-2 rounded-full ${
                    (STORE_COLOR_STYLES[activeStore.color] || STORE_COLOR_STYLES.indigo).dot
                  } shrink-0`}
                ></span>
                <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                  {activeStore.type === 'sucursal'
                    ? 'Estás en la sucursal:'
                    : 'Estás en la tienda:'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveSettingsTab('stores')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-400/50 text-[9.5px] font-black uppercase tracking-wider cursor-pointer transition shadow-sm shrink-0 active:scale-95 leading-none"
                  title="Cambiar de tienda o gestionar sucursales"
                >
                  <i className="fa-solid fa-shuffle text-[8.5px]"></i>
                  <span>CAMBIAR</span>
                </button>
                <strong
                  className="text-xs sm:text-sm font-black break-words"
                  style={{ color: currentStoreTitleColorMeta.hex }}
                >
                  {activeStore.name}
                </strong>
              </div>
              <span className="px-2 py-0.5 rounded font-mono font-black text-[10px] bg-indigo-500/20 text-indigo-200 border border-indigo-500/40 shrink-0">
                {activeStore.uniqueCode}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-300 pt-0.5 border-t border-slate-800/80">
              {activeStore.type === 'sucursal' ? (
                <>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-extrabold">
                    <i className="fa-solid fa-code-branch text-[9px]"></i>
                    <span>
                      Sucursal de la tienda:{' '}
                      <strong className="text-white">
                        {activeStore.parentStoreName || defaultMainTienda?.name || 'Tienda Principal'}
                      </strong>
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-500/15 border border-brand-500/30 text-brand-300 font-extrabold">
                    <i className="fa-solid fa-store text-[9px]"></i>
                    <span>
                      Tienda Principal:{' '}
                      <strong className="text-white">
                        {activeStore.parentStoreName || defaultMainTienda?.name || 'Tienda Principal'}
                      </strong>
                    </span>
                  </span>
                </>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-brand-500/15 border border-brand-500/30 text-brand-300 font-extrabold">
                  <i className="fa-solid fa-store text-[9px]"></i>
                  <span>
                    Tienda Principal: <strong className="text-white">{activeStore.name}</strong>
                  </span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Navigation Tabs inside Settings Menu */}
        <div className="grid grid-cols-4 gap-1.5 bg-slate-900/95 p-1.5 rounded-2xl border border-slate-700/90">
          <button
            type="button"
            onClick={() => setActiveSettingsTab('appearance')}
            className={`py-2 px-1.5 rounded-xl font-extrabold text-[10.5px] sm:text-xs flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer transition ${
              activeSettingsTab === 'appearance'
                ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
            <span className="truncate">Letras y Estilo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('sounds')}
            className={`py-2 px-1.5 rounded-xl font-extrabold text-[10.5px] sm:text-xs flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer transition ${
              activeSettingsTab === 'sounds'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-volume-high text-xs"></i>
            <span className="truncate">Sonidos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('extra')}
            className={`py-2 px-1.5 rounded-xl font-extrabold text-[10.5px] sm:text-xs flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer transition ${
              activeSettingsTab === 'extra'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-bolt text-xs"></i>
            <span className="truncate">Otros Ajustes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSettingsTab('stores')}
            className={`py-2 px-1.5 rounded-xl font-extrabold text-[10.5px] sm:text-xs flex flex-col sm:flex-row items-center justify-center gap-1 cursor-pointer transition ${
              activeSettingsTab === 'stores'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-store text-xs"></i>
            <span className="truncate">Tiendas ({stores.length})</span>
          </button>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: LETRAS (COLOR, TAMAÑO, ESTILO) + PREVISUALIZACIÓN TOCABLE       */}
        {/* ===================================================================== */}
        {activeSettingsTab === 'appearance' && (
          <div className="space-y-3.5 animate-fadeIn">
            {/* INTERACTIVE TOUCHABLE LIVE PREVIEW */}
            <div className="bg-slate-900/95 border-2 border-brand-500/50 rounded-2xl p-3 sm:p-3.5 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-300 flex items-center gap-1.5">
                  <i className="fa-solid fa-hand-pointer text-amber-400 animate-bounce"></i>
                  <span>Previsualización Tocable de Caja y Titular</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9.5px] font-extrabold">
                  ¡Toca los elementos para cambiarlos!
                </span>
              </div>

              {/* Feedback Banner showing what changed when touched */}
              <div className="bg-slate-950/90 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-[10.5px] font-bold text-emerald-300 flex items-center justify-between gap-2">
                <span className="truncate">{previewTouchFeedback}</span>
              </div>

              {/* Touchable Store Title Preview (Fixed Size, Color-Only Change) */}
              <button
                type="button"
                onClick={cycleStoreTitleColor}
                title="Toca para cambiar el color del titular de la tienda (su tamaño es fijo para verse siempre completo)"
                className="w-full bg-slate-950/90 hover:bg-slate-950 border border-slate-700/90 rounded-xl px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition active:scale-[0.99] text-left"
              >
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                    🏪 Titular de la Tienda (Tamaño fijo · Solo cambia el color):
                  </span>
                  <span
                    className="store-main-title block mt-0.5"
                    style={{ color: currentStoreTitleColorMeta.hex }}
                  >
                    {activeStore?.name || 'Tienda Don Salvador'}
                  </span>
                </div>
                <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-600 text-[9.5px] font-black text-amber-300 shrink-0">
                  🎨 {currentStoreTitleColorMeta.label} 👆
                </span>
              </button>

              {/* LIVE TOUCHABLE CAJA CARD REPLICA */}
              <div
                onClick={cycleCajaCardColor}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') cycleCajaCardColor();
                }}
                title="Toca el fondo de esta tarjeta para cambiar el color de la Caja"
                className="pos-caja-bar w-full rounded-[24px] px-3.5 sm:px-4 py-3 flex items-center justify-between gap-2.5 cursor-pointer transition active:scale-[0.99] select-none relative overflow-hidden"
                style={{
                  fontFamily: currentFontMeta.cssValue,
                }}
              >
                {/* Left: Touchable Fluorescent Client Pill */}
                <div className="min-w-0 flex flex-col items-start gap-1">
                  <button
                    type="button"
                    onClick={cycleClientNeonColor}
                    title="Toca aquí para cambiar el color fosforescente del cliente"
                    className="pos-caja-client-pill inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black leading-tight cursor-pointer active:scale-95 transition"
                  >
                    <i className="fa-solid fa-user text-[10px] shrink-0"></i>
                    <span className="truncate">Carlos Mendoza</span>
                    <span className="text-[9px] opacity-85 ml-0.5">👆</span>
                  </button>
                  <span className="pos-caja-sub text-[10px] font-extrabold leading-tight pl-0.5">
                    🎨 Fondo Caja: <u>{currentCajaMeta.label.split(' ')[0]}</u> (Toca fondo)
                  </span>
                </div>

                {/* Right: Touchable Price / Typography Preview */}
                <div
                  onClick={cycleFontFamily}
                  title="Toca el precio para cambiar el estilo de letra"
                  className="text-right shrink-0 cursor-pointer active:scale-95 transition"
                >
                  <div
                    className="pos-caja-total-main text-base sm:text-xl font-black leading-none tracking-tight"
                    style={{ color: currentToneMeta.hex }}
                  >
                    578,02 <span className="pos-caja-total-curr text-xs sm:text-sm">VES</span>
                  </div>
                  <div className="pos-caja-ref text-[10px] font-mono font-bold mt-1">
                    0,65 USD · 2.056,60 COP
                  </div>
                  <div className="text-[9.5px] font-mono font-extrabold text-amber-400 mt-0.5">
                    ₿ 0.00000846 BTC
                  </div>
                </div>
              </div>
            </div>

            {/* 0. COLOR DEL TITULAR DE LA TIENDA (TAMAÑO ESPECÍFICO FIJO, SOLO CAMBIA EL COLOR) */}
            <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                  <i className="fa-solid fa-store text-amber-400"></i>
                  <span>Color del Titular de la Tienda (Tamaño Fijo)</span>
                </label>
                <span
                  className="text-[10px] font-black"
                  style={{ color: currentStoreTitleColorMeta.hex }}
                >
                  {currentStoreTitleColorMeta.label}
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {STORE_TITLE_COLOR_OPTIONS.map((opt) => {
                  const active = (customization.storeTitleColor || 'white') === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onUpdateCustomization({ storeTitleColor: opt.id });
                        triggerHapticFeedback(customization, 12);
                      }}
                      className={`py-2 px-1.5 rounded-xl border text-[10px] font-black flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                        active
                          ? 'bg-slate-950 border-white ring-2 ring-amber-400/50 shadow-md scale-[1.02]'
                          : 'bg-slate-800/80 border-slate-700 opacity-85 hover:opacity-100'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-slate-600"
                        style={{ backgroundColor: opt.hex }}
                      />
                      <span className="truncate max-w-full" style={{ color: opt.hex }}>
                        {opt.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 1. COLOR DE LA TARJETA DE CAJA (QUE SE HAGA NOTAR) */}
            <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                  <i className="fa-solid fa-palette text-purple-400"></i>
                  <span>Color Destacado de la Tarjeta de Caja</span>
                </label>
                <span className="text-[10px] text-purple-300 font-bold">
                  {currentCajaMeta.label}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {CAJA_CARD_COLOR_OPTIONS.map((opt) => {
                  const active = customization.cajaCardColor === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onUpdateCustomization({ cajaCardColor: opt.id });
                        triggerHapticFeedback(customization, 12);
                      }}
                      className={`px-2.5 py-2 rounded-xl border text-[11px] font-extrabold flex items-center gap-2 cursor-pointer transition ${
                        active
                          ? 'bg-slate-800 text-white border-white ring-2 ring-brand-400/50 shadow'
                          : 'bg-slate-800/70 hover:bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border border-white/60 shadow-sm"
                        style={{ background: opt.swatch }}
                      />
                      <span className="truncate">{opt.label.split(' (')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. COLOR FOSFORESCENTE DEL NOMBRE DEL CLIENTE */}
            <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-extrabold text-white flex items-center gap-1.5">
                  <i className="fa-solid fa-highlighter text-emerald-400"></i>
                  <span>Color Fosforescente del Nombre del Cliente</span>
                </label>
                <span
                  className="text-[10px] font-black"
                  style={{ color: currentNeonMeta.hex }}
                >
                  {currentNeonMeta.label}
                </span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {CLIENT_NEON_COLOR_OPTIONS.map((opt) => {
                  const active = customization.clientNeonColor === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onUpdateCustomization({ clientNeonColor: opt.id });
                        triggerHapticFeedback(customization, 12);
                      }}
                      className={`py-2 px-1.5 rounded-xl border text-[10px] font-black flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                        active
                          ? 'bg-slate-950 border-white ring-2 ring-white/30 shadow-md scale-[1.02]'
                          : 'bg-slate-800/80 border-slate-700 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-black/40"
                        style={{
                          backgroundColor: opt.hex,
                          boxShadow: `0 0 8px ${opt.hex}`,
                        }}
                      />
                      <span className="truncate max-w-full" style={{ color: opt.hex }}>
                        {opt.label.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ===================================================================== */}
            {/* 3. ESTUDIO EN VIVO DE LETRAS, COLORES, FORMAS Y ESTILOS DE TARJETA    */}
            {/* ===================================================================== */}
            <div className="bg-slate-900/95 border-2 border-indigo-500/40 rounded-2xl p-3 sm:p-4 space-y-4 shadow-xl">
              {/* Header + Negrita Extra Toggle */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <label className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-wand-magic-sparkles text-brand-400"></i>
                    <span>Letras, Colores, Formas y Estilos de Tarjetas</span>
                  </label>
                  <p className="text-[10.5px] text-slate-400 mt-0.5">
                    Mira abajo la <strong className="text-emerald-300">Vista Previa en Vivo</strong>{' '}
                    mientras tocas cada opción sin tener que salir.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateCustomization({ fontBoldBoost: !customization.fontBoldBoost });
                    triggerHapticFeedback(customization, 12);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-[10.5px] font-black cursor-pointer transition flex items-center gap-1.5 ${
                    customization.fontBoldBoost
                      ? 'bg-amber-400 text-slate-950 border-amber-200 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-200 border-slate-600 hover:text-white'
                  }`}
                >
                  <i className="fa-solid fa-bold"></i>
                  <span>Negrita Extra: {customization.fontBoldBoost ? 'ACTIVA ✅' : 'NO'}</span>
                </button>
              </div>

              {/* ========================================================================== */}
              {/* EDITOR INTERACTIVO DE TARJETA DE PRODUCTO: TOCA CADA ELEMENTO PARA EDITARLO */}
              {/* ========================================================================== */}
              <div className="bg-slate-950/95 border-2 border-emerald-500/60 rounded-2xl p-3 sm:p-3.5 space-y-3 shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-300">
                      👆 Toca Cualquier Elemento de la Tarjeta para Editarlo:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsLiveBackgroundPeek((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black border cursor-pointer transition ${
                      isLiveBackgroundPeek
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {isLiveBackgroundPeek ? '🔼 Subir ventana' : '👁️ Ver tienda detrás'}
                  </button>
                </div>

                {/* Quick Selector Chips for All 9 Card Elements */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                  {CARD_ELEMENTS_META.map((el) => {
                    const isSel = selectedCardElement === el.id;
                    return (
                      <button
                        key={el.id}
                        type="button"
                        onClick={(e) => handleSelectCardElement(el.id, e)}
                        className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-black flex items-center gap-1.5 shrink-0 cursor-pointer transition ${
                          isSel
                            ? 'bg-emerald-500 text-slate-950 border-white ring-2 ring-emerald-400/60 shadow-md scale-[1.03]'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        <i className={`fa-solid ${el.icon} text-[10px]`}></i>
                        <span>{el.shortLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {/* REALISTIC INTERACTIVE PRODUCT CARD REPLICA (Matching User Screenshot: Café Arábica Gourmet 500g) */}
                <div className="flex justify-center">
                  <div
                    style={{
                      background: currentCardStyleMeta.bg,
                      borderColor: currentCardStyleMeta.borderHover,
                      borderRadius: currentShapeMeta.cardRadius,
                      boxShadow:
                        customization.cardShape === 'double_frame'
                          ? '0 8px 24px rgba(0,0,0,0.55), inset 0 2px 0 rgba(255,255,255,0.22), 0 0 0 2px rgba(255,255,255,0.12)'
                          : '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                    className="w-full max-w-[330px] border-2 p-3.5 flex flex-col justify-between gap-2.5 transition-all select-none relative"
                  >
                    {/* 1. Product Image + Title + Subtitle */}
                    <div
                      className={`w-full min-w-0 flex gap-3 ${
                        currentImgSizeMeta.isBanner
                          ? 'flex-col items-stretch'
                          : 'items-start'
                      }`}
                    >
                      {/* Touchable Product Image */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleSelectCardElement('image', e)}
                        title="Toca la imagen del producto para agrandarla o cambiar su forma"
                        style={{
                          width: currentImgSizeMeta.isBanner ? '100%' : currentImgSizeMeta.px,
                          height: currentImgSizeMeta.px,
                          borderRadius: currentImgShapeMeta.radius,
                          border: currentImgShapeMeta.border,
                          boxShadow: currentImgShapeMeta.shadow,
                        }}
                        className={`relative bg-gradient-to-br from-orange-700 via-amber-800 to-stone-900 shrink-0 flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                          selectedCardElement === 'image'
                            ? 'ring-3 ring-emerald-400 scale-[1.03]'
                            : 'hover:ring-2 hover:ring-white/40'
                        }`}
                      >
                        <span className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-black/45 text-amber-200 mb-0.5">
                          🥫 Alimentos
                        </span>
                        <span
                          style={{
                            fontSize:
                              currentImgSizeMeta.id === 'xs'
                                ? '15px'
                                : currentImgSizeMeta.id === 'sm'
                                ? '18px'
                                : currentImgSizeMeta.id === 'md'
                                ? '21px'
                                : '28px',
                          }}
                          className="leading-none drop-shadow"
                        >
                          ☕
                        </span>
                        <span className="text-[6.5px] font-bold text-white/90 truncate max-w-[90%] mt-0.5">
                          Café Arábica 500g
                        </span>
                        {selectedCardElement === 'image' && (
                          <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-[9px] font-black shadow">
                            ✓
                          </span>
                        )}
                      </div>

                      {/* Touchable Product Name & Subtitle */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleSelectCardElement('title', e)}
                          title="Toca el nombre del producto para editar su tamaño, letra y color"
                          style={getElementDisplayStyles('title', 15)}
                          className={`leading-snug tracking-tight break-words whitespace-normal cursor-pointer rounded-lg px-1.5 py-0.5 -mx-1.5 transition ${
                            selectedCardElement === 'title'
                              ? 'ring-2 ring-emerald-400 bg-emerald-500/15'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          Café Arábica Gourmet 500g
                        </div>

                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleSelectCardElement('subtitle', e)}
                          title="Toca el peso/marca para editar su tamaño, letra y color"
                          style={getElementDisplayStyles('subtitle', 11.5)}
                          className={`leading-tight break-words whitespace-normal cursor-pointer rounded-lg px-1.5 py-0.5 -mx-1.5 transition ${
                            selectedCardElement === 'subtitle'
                              ? 'ring-2 ring-emerald-400 bg-emerald-500/15'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          500g · Cafetal
                        </div>
                      </div>
                    </div>

                    {/* 2. Price & Multi-Rates Block (All Rates in Uniform Single Color for Number + ISO) */}
                    <div className="w-full min-w-0 pt-2 border-t border-white/10 space-y-1">
                      {/* Primary Price + ISO (Uniform Color!) */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleSelectCardElement('primaryPrice', e)}
                        title="Toca la tasa principal (7.514,25 VES) para editarla (número e ISO en un solo color uniforme)"
                        style={getElementDisplayStyles('primaryPrice', 19)}
                        className={`font-mono tabular-nums leading-none tracking-tight cursor-pointer rounded-lg px-1.5 py-1 -mx-1.5 transition inline-block ${
                          selectedCardElement === 'primaryPrice'
                            ? 'ring-2 ring-emerald-400 bg-emerald-500/15'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        7.514,25{' '}
                        <span
                          style={{ color: 'inherit', fontSize: '0.68em', fontWeight: 'inherit' }}
                          className="uppercase tracking-wider"
                        >
                          VES
                        </span>
                      </div>

                      {/* USD Reference Rate (Uniform Color!) */}
                      <div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleSelectCardElement('usdRate', e)}
                          title="Toca la tasa USD ($8.45 USD) para editar su tamaño, color uniforme y letra"
                          style={getElementDisplayStyles('usdRate', 12.5)}
                          className={`font-mono tabular-nums leading-snug cursor-pointer rounded-lg px-1.5 py-0.5 -mx-1.5 transition inline-block ${
                            selectedCardElement === 'usdRate'
                              ? 'ring-2 ring-emerald-400 bg-emerald-500/15'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          $8.45 <span style={{ color: 'inherit' }}>USD</span>
                        </span>
                      </div>

                      {/* Secondary Rate COP (Uniform Color!) */}
                      <div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleSelectCardElement('secondaryRate', e)}
                          title="Toca la tasa secundaria (26.735,80 COP) para editar su tamaño, color uniforme y letra"
                          style={getElementDisplayStyles('secondaryRate', 12)}
                          className={`font-mono tabular-nums leading-snug cursor-pointer rounded-lg px-1.5 py-0.5 -mx-1.5 transition inline-block ${
                            selectedCardElement === 'secondaryRate'
                              ? 'ring-2 ring-emerald-400 bg-emerald-500/15'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          · 26.735,80 <span style={{ color: 'inherit' }}>COP</span>
                        </span>
                      </div>

                      {/* Crypto Rate BTC (Uniform Color!) */}
                      <div>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleSelectCardElement('cryptoRate', e)}
                          title="Toca la tasa cripto (₿ 0.000109 BTC) para editar su tamaño, color uniforme y letra"
                          style={getElementDisplayStyles('cryptoRate', 11.5)}
                          className={`font-mono tabular-nums leading-snug cursor-pointer rounded-lg px-1.5 py-0.5 -mx-1.5 transition inline-flex items-center gap-1 ${
                            selectedCardElement === 'cryptoRate'
                              ? 'ring-2 ring-emerald-400 bg-emerald-500/15'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <i
                            className="fa-brands fa-bitcoin text-[11px]"
                            style={{ color: 'inherit' }}
                          ></i>
                          <span style={{ color: 'inherit' }}>0.000109 BTC</span>
                        </span>
                      </div>
                    </div>

                    {/* 3. Footer: Category & Stock */}
                    <div className="pt-1 flex items-center justify-between gap-2 w-full min-w-0">
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleSelectCardElement('category', e)}
                        title="Toca la categoría para editar su tamaño, color y letra"
                        style={getElementDisplayStyles('category', 11.5)}
                        className={`truncate cursor-pointer rounded-lg px-1.5 py-0.5 -mx-1 transition ${
                          selectedCardElement === 'category'
                            ? 'ring-2 ring-emerald-400 bg-emerald-500/15'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        🥫 Alimentos
                      </span>

                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => handleSelectCardElement('stock', e)}
                        title="Toca el stock (453 und) para editar su tamaño, color y letra"
                        style={{
                          ...getElementDisplayStyles('stock', 11),
                          borderRadius: currentShapeMeta.btnRadius,
                        }}
                        className={`px-2 py-0.5 font-mono tabular-nums shrink-0 border border-white/15 bg-zinc-900/75 cursor-pointer transition ${
                          selectedCardElement === 'stock'
                            ? 'ring-2 ring-emerald-400 bg-emerald-500/20'
                            : 'hover:bg-zinc-800'
                        }`}
                      >
                        453 und
                      </span>
                    </div>
                  </div>
                </div>

                {/* ==================================================================== */}
                {/* DEDICATED CONTROLS FOR THE CURRENTLY SELECTED PRODUCT CARD ELEMENT   */}
                {/* ==================================================================== */}
                <div className="bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-3 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center justify-center text-xs font-black">
                        <i className={`fa-solid ${activeElementMeta.icon}`}></i>
                      </span>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                          Elemento Seleccionado:
                        </span>
                        <span className="text-xs sm:text-sm font-black text-white">
                          {activeElementMeta.label}{' '}
                          <span className="text-[10.5px] font-mono text-amber-300 font-bold">
                            ({activeElementMeta.sampleText})
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => stepSelectedElementSize(-1)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-[11px] font-black cursor-pointer flex items-center gap-1 active:scale-95 transition"
                        title="Achicar este elemento"
                      >
                        <i className="fa-solid fa-minus text-[9px] text-rose-400"></i>
                        <span>Achicar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => stepSelectedElementSize(1)}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400 text-[11px] font-black cursor-pointer flex items-center gap-1 shadow active:scale-95 transition"
                        title="Agrandar este elemento"
                      >
                        <i className="fa-solid fa-plus text-[9px]"></i>
                        <span>Agrandar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => resetSingleCardElement(selectedCardElement)}
                        className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-extrabold cursor-pointer"
                        title="Restaurar solo este elemento"
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                      </button>
                    </div>
                  </div>

                  {selectedCardElement === 'image' ? (
                    /* CONTROLS FOR PRODUCT IMAGE: 7 SIZES (INCLUDING ENLARGE & BANNER) + 6 SHAPES/FRAMES */
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-amber-300">
                            📏 Tamaño de la Imagen del Producto (7 Tamaños):
                          </span>
                          <span className="text-[10px] font-black text-emerald-300">
                            {currentImgSizeMeta.label} ({currentImgSizeMeta.badge})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {CARD_IMAGE_SIZE_OPTIONS.map((sz) => {
                            const active = (customization.cardImageSize || 'md') === sz.id;
                            return (
                              <button
                                key={sz.id}
                                type="button"
                                onClick={() => {
                                  onUpdateCustomization({ cardImageSize: sz.id });
                                  triggerHapticFeedback(customization, 12);
                                  setPreviewTouchFeedback(
                                    `🖼️ Imagen del producto cambiada a: ${sz.label} (${sz.badge})`
                                  );
                                }}
                                className={`py-2 px-2 rounded-xl border text-left flex flex-col justify-between gap-0.5 cursor-pointer transition ${
                                  active
                                    ? 'bg-emerald-600 text-white border-white ring-2 ring-emerald-400/50 shadow-md'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1">
                                  <span className="font-black text-[11px] truncate">
                                    {sz.label}
                                  </span>
                                  <span className="text-[9.5px] font-mono font-black px-1.5 py-0.2 rounded bg-black/30 text-amber-300">
                                    {sz.badge}
                                  </span>
                                </div>
                                <span
                                  className={`text-[9px] truncate ${
                                    active ? 'text-emerald-100' : 'text-slate-400'
                                  }`}
                                >
                                  {sz.desc}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-extrabold text-cyan-300">
                            🖼️ Forma y Marco de la Imagen (6 Estilos):
                          </span>
                          <span className="text-[10px] font-black text-cyan-300">
                            {currentImgShapeMeta.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                          {CARD_IMAGE_SHAPE_OPTIONS.map((sh) => {
                            const active = (customization.cardImageShape || 'rounded') === sh.id;
                            return (
                              <button
                                key={sh.id}
                                type="button"
                                onClick={() => {
                                  onUpdateCustomization({ cardImageShape: sh.id });
                                  triggerHapticFeedback(customization, 12);
                                  setPreviewTouchFeedback(
                                    `🖼️ Marco de imagen aplicado: ${sh.label}`
                                  );
                                }}
                                className={`py-2 px-1.5 rounded-xl border text-[10px] font-black flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                                  active
                                    ? 'bg-cyan-900/90 text-white border-white ring-2 ring-cyan-400/50 shadow'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                }`}
                              >
                                <span
                                  style={{
                                    borderRadius: sh.radius,
                                    border: sh.border,
                                  }}
                                  className="w-6 h-6 bg-amber-600/40 flex items-center justify-center text-xs"
                                >
                                  ☕
                                </span>
                                <span className="truncate max-w-full">{sh.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* CONTROLS FOR SELECTED TEXT / RATE / BADGE ELEMENT */
                    (() => {
                      const elId = selectedCardElement as CardTextElementId;
                      const elCfg =
                        resolvedCardElements[elId] || DEFAULT_CARD_ELEMENTS_CONFIG[elId];
                      const isRateElement =
                        elId === 'primaryPrice' ||
                        elId === 'usdRate' ||
                        elId === 'secondaryRate' ||
                        elId === 'cryptoRate';

                      return (
                        <div className="space-y-3">
                          {/* 1. Tamaño Individual del Elemento (6 Niveles) */}
                          <div className="space-y-1.5">
                            <span className="text-[10.5px] font-extrabold text-emerald-300 block">
                              1. Tamaño de "{activeElementMeta.shortLabel}":
                            </span>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                              {CARD_ELEMENT_SIZE_OPTIONS.map((sz) => {
                                const active = elCfg.size === sz.id;
                                return (
                                  <button
                                    key={sz.id}
                                    type="button"
                                    onClick={() =>
                                      updateSingleTextElement(
                                        elId,
                                        { size: sz.id },
                                        `📏 Tamaño de "${activeElementMeta.shortLabel}": ${sz.label} (${sz.badge})`
                                      )
                                    }
                                    className={`py-1.5 px-1.5 rounded-xl border text-center flex flex-col items-center justify-center cursor-pointer transition ${
                                      active
                                        ? 'bg-emerald-600 text-white border-white ring-2 ring-emerald-400/50 shadow'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                    }`}
                                  >
                                    <span className="font-mono font-black text-[10.5px]">
                                      {sz.badge}
                                    </span>
                                    <span className="text-[9px] font-bold truncate max-w-full">
                                      {sz.label}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 2. Paleta de 16 Colores Uniformes (Número + ISO del mismo color) */}
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-1">
                              <span className="text-[10.5px] font-extrabold text-amber-300">
                                2. Color Uniforme de "{activeElementMeta.shortLabel}" (16 Colores):
                              </span>
                              {isRateElement && (
                                <button
                                  type="button"
                                  onClick={() => applyColorToAllRates(elCfg.color)}
                                  className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-400/50 text-[9.5px] font-black cursor-pointer transition"
                                >
                                  🎨 Aplicar este color a todas las tasas
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                              {CARD_ELEMENT_COLOR_OPTIONS.map((col) => {
                                const active = elCfg.color === col.id;
                                return (
                                  <button
                                    key={col.id}
                                    type="button"
                                    onClick={() =>
                                      updateSingleTextElement(
                                        elId,
                                        { color: col.id },
                                        `🎨 Color de "${activeElementMeta.shortLabel}" cambiado a: ${col.label}`
                                      )
                                    }
                                    className={`py-1.5 px-1 rounded-xl border text-[9.5px] font-black flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                                      active
                                        ? 'bg-slate-950 border-white ring-2 ring-amber-400/60 shadow scale-[1.03]'
                                        : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700'
                                    }`}
                                  >
                                    <span
                                      className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                                      style={{ backgroundColor: col.hex }}
                                    />
                                    <span
                                      className="truncate max-w-full leading-tight"
                                      style={{ color: col.hex }}
                                    >
                                      {col.shortName}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* 3. Tipo de Letra Individual + Grosor/Estilo */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold text-brand-300 block">
                                3. Tipo de Letra de "{activeElementMeta.shortLabel}":
                              </span>
                              <select
                                value={elCfg.font}
                                onChange={(e) =>
                                  updateSingleTextElement(
                                    elId,
                                    {
                                      font: e.target.value as CardElementStyleConfig['font'],
                                    },
                                    `🔤 Fuente actualizada para ${activeElementMeta.shortLabel}`
                                  )
                                }
                                className="w-full bg-slate-800 border border-slate-600 rounded-xl px-2.5 py-2 text-[11px] text-white font-extrabold outline-none cursor-pointer"
                              >
                                <option value="inherit">
                                  ✨ Usar Fuente General ({currentFontMeta.shortLabel})
                                </option>
                                {FONT_FAMILY_OPTIONS.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    🔤 {f.label} — {f.desc}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold text-purple-300 block">
                                4. Grosor / Estilo de "{activeElementMeta.shortLabel}":
                              </span>
                              <div className="grid grid-cols-4 gap-1">
                                {CARD_ELEMENT_WEIGHT_OPTIONS.map((wt) => {
                                  const active = elCfg.weight === wt.id;
                                  return (
                                    <button
                                      key={wt.id}
                                      type="button"
                                      onClick={() =>
                                        updateSingleTextElement(
                                          elId,
                                          { weight: wt.id },
                                          `✨ Grosor "${wt.label}" aplicado a ${activeElementMeta.shortLabel}`
                                        )
                                      }
                                      className={`py-1.5 px-1 rounded-xl border text-[9.5px] font-black truncate cursor-pointer transition ${
                                        active
                                          ? 'bg-purple-600 text-white border-white shadow'
                                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                      }`}
                                    >
                                      {wt.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* A. ESTILO DE LETRA (8 FUENTES CLARAS CON DESCRIPCIÓN) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-brand-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-brand-500/20 border border-brand-500/40 text-brand-300 flex items-center justify-center text-[10px] font-black">
                      1
                    </span>
                    <span>Estilo de Letra (8 Tipos de Fuente):</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Actual: <strong className="text-white">{currentFontMeta.shortLabel}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {FONT_FAMILY_OPTIONS.map((f) => {
                    const active = customization.fontFamily === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          onUpdateCustomization({ fontFamily: f.id });
                          triggerHapticFeedback(customization, 12);
                          setPreviewTouchFeedback(`🔤 Fuente aplicada: ${f.label}`);
                        }}
                        style={{ fontFamily: f.cssValue }}
                        className={`py-2 px-2.5 rounded-xl border text-left flex flex-col justify-between gap-0.5 cursor-pointer transition ${
                          active
                            ? 'bg-brand-600 text-white border-white ring-2 ring-brand-400/50 shadow-md'
                            : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="font-black text-xs truncate">{f.shortLabel}</span>
                          {active && <i className="fa-solid fa-check text-[10px] text-amber-300"></i>}
                        </div>
                        <span
                          className="text-[11px] font-extrabold truncate block"
                          style={{ color: active ? '#ffffff' : currentToneMeta.hex }}
                        >
                          {f.sample}
                        </span>
                        <span
                          className={`text-[9px] truncate block ${
                            active ? 'text-brand-100' : 'text-slate-400'
                          }`}
                        >
                          {f.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* B. TAMAÑO DE LETRA EN TODA LA APP (4 NIVELES CLAROS) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-emerald-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-[10px] font-black">
                      2
                    </span>
                    <span>Tamaño de Letra en Toda la App:</span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    Actual:{' '}
                    <strong className="text-emerald-300">
                      {currentSizeMeta.label} ({currentSizeMeta.percentLabel})
                    </strong>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {FONT_SIZE_OPTIONS.map((sz, idx) => {
                    const active = customization.fontSizeScale === sz.id;
                    const samplePx = [12, 14, 16, 18][idx] || 14;
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => {
                          onUpdateCustomization({ fontSizeScale: sz.id });
                          triggerHapticFeedback(customization, 12);
                          setPreviewTouchFeedback(
                            `📏 Tamaño aplicado: ${sz.label} (${sz.percentLabel})`
                          );
                        }}
                        className={`py-2 px-2.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 cursor-pointer transition text-center ${
                          active
                            ? 'bg-emerald-600 text-white border-white ring-2 ring-emerald-400/50 shadow-md'
                            : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <span
                          style={{ fontSize: `${samplePx}px`, lineHeight: 1.1 }}
                          className="font-black"
                        >
                          Aa {sz.percentLabel}
                        </span>
                        <span className="text-[10.5px] font-extrabold">{sz.label}</span>
                        <span
                          className={`text-[8.5px] leading-tight ${
                            active ? 'text-emerald-100' : 'text-slate-400'
                          }`}
                        >
                          {sz.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* C. COLOR PRINCIPAL DE LAS LETRAS (10 COLORES SIN RECORTES) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-amber-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center text-[10px] font-black">
                      3
                    </span>
                    <span>Color Principal de las Letras (10 Tonos):</span>
                  </span>
                  <span className="text-[10px] font-black" style={{ color: currentToneMeta.hex }}>
                    {currentToneMeta.label}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {TEXT_COLOR_TONE_OPTIONS.map((tone) => {
                    const active = customization.textColorTone === tone.id;
                    return (
                      <button
                        key={tone.id}
                        type="button"
                        onClick={() => {
                          onUpdateCustomization({ textColorTone: tone.id });
                          triggerHapticFeedback(customization, 12);
                          setPreviewTouchFeedback(`🎨 Color de letras aplicado: ${tone.label}`);
                        }}
                        className={`py-2 px-1 rounded-xl border text-[10px] font-extrabold flex flex-col items-center justify-center gap-1 cursor-pointer transition ${
                          active
                            ? 'bg-slate-950 border-white ring-2 ring-brand-400/60 shadow-md scale-[1.02]'
                            : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center text-[9px] font-black text-slate-950 shadow-sm"
                          style={{ backgroundColor: tone.dotBg }}
                        >
                          Aa
                        </span>
                        <span
                          className="leading-tight text-center break-words w-full"
                          style={{ color: tone.hex }}
                        >
                          {tone.shortName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* D. FORMA DE LAS TARJETAS Y BOTONES (6 FORMAS VISUALES) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-cyan-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-[10px] font-black">
                      4
                    </span>
                    <span>Forma de las Tarjetas y Botones (6 Formas):</span>
                  </span>
                  <span className="text-[10px] font-bold text-cyan-300">
                    {currentShapeMeta.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {CARD_SHAPE_OPTIONS.map((sh) => {
                    const active = (customization.cardShape || 'rounded') === sh.id;
                    return (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => {
                          onUpdateCustomization({ cardShape: sh.id });
                          triggerHapticFeedback(customization, 12);
                          setPreviewTouchFeedback(`📐 Forma de tarjetas y botones aplicada: ${sh.label}`);
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                          active
                            ? 'bg-cyan-950/90 text-white border-cyan-300 ring-2 ring-cyan-400/40 shadow-md'
                            : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <span
                          style={{ borderRadius: sh.cardRadius }}
                          className={`w-7 h-7 shrink-0 border-2 flex items-center justify-center text-[9px] font-black ${
                            active
                              ? 'bg-cyan-500/30 border-white text-white'
                              : 'bg-slate-900 border-cyan-400/60 text-cyan-300'
                          }`}
                        >
                          ▢
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="font-black text-[11px] block truncate">
                            {sh.shortName}
                          </span>
                          <span className="text-[9px] text-slate-400 block truncate">
                            {sh.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* E. BIBLIOTECA DE TEMAS VISUALES: TARJETAS Y BOTONES (13 PALETAS + ALTO CONTRASTE) */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-[11px] font-extrabold text-purple-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-md bg-purple-500/20 border border-purple-500/40 text-purple-300 flex items-center justify-center text-[10px] font-black">
                      5
                    </span>
                    <span>
                      Biblioteca de Temas Visuales: Tarjetas y Botones ({PRODUCT_CARD_STYLE_OPTIONS.length} Paletas):
                    </span>
                  </span>
                  <span className="text-[10px] font-bold text-purple-300">
                    {currentCardStyleMeta.label}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {PRODUCT_CARD_STYLE_OPTIONS.map((st) => {
                    const active = (customization.productCardStyle || 'matte_titanium') === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          onUpdateCustomization({ productCardStyle: st.id });
                          triggerHapticFeedback(customization, 12);
                          setPreviewTouchFeedback(
                            `🎨 Tema visual aplicado a tarjetas y botones: ${st.label}`
                          );
                        }}
                        style={{
                          background: st.bg,
                          borderColor: active ? '#ffffff' : st.border,
                        }}
                        className={`p-2 rounded-xl border-2 text-left flex flex-col justify-between gap-1 cursor-pointer transition ${
                          active
                            ? 'ring-2 ring-amber-400/70 shadow-lg scale-[1.02]'
                            : 'opacity-90 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/60 shrink-0"
                            style={{ backgroundColor: st.swatch }}
                          />
                          <span className="font-black text-[10.5px] text-white truncate flex-1">
                            {st.shortName}
                          </span>
                          {st.isHighContrast && (
                            <span className="px-1 py-0.2 rounded bg-yellow-400/25 border border-yellow-400/60 text-[7.5px] font-black text-yellow-200 uppercase shrink-0">
                              Alto Contraste
                            </span>
                          )}
                          {active && (
                            <i className="fa-solid fa-circle-check text-[10px] text-amber-300 shrink-0"></i>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[8.5px] text-slate-300 leading-tight truncate flex-1">
                            {st.desc}
                          </span>
                          <span
                            style={{
                              background: st.btnBg,
                              color: st.btnText,
                              borderColor: st.btnBorder,
                            }}
                            className="px-1.5 py-0.2 rounded border text-[7.5px] font-black shrink-0"
                          >
                            Botón
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. TEMA CLARO / OSCURO, IDIOMA Y BOTÓN FINAL DE RESTAURAR A PREDETERMINADO */}
            <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2 items-center">
                {onSelectLanguage && languages.length > 0 && (
                  <div
                    className="relative h-11 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer transition"
                    title={languageLabel}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-sm leading-none">{currentLangObj?.flag || '🇪🇸'}</span>
                      <span className="text-[10.5px] font-black text-white uppercase">
                        {appLang}
                      </span>
                      <i className="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </div>
                    <span className="text-[8.5px] font-bold text-slate-300 truncate max-w-full">
                      {currentLangObj?.nativeName || languageLabel}
                    </span>
                    <select
                      value={appLang}
                      onChange={(e) => onSelectLanguage(e.target.value)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    >
                      {languages.map((l) => (
                        <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                          {l.flag} {l.nativeName} ({l.code.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {onToggleTheme && (
                  <button
                    type="button"
                    onClick={onToggleTheme}
                    className="h-11 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-1.5 text-amber-300 font-black text-[11px]">
                      <i
                        className={`fa-solid ${
                          themeMode === 'light' ? 'fa-sun text-amber-400' : 'fa-moon text-indigo-300'
                        }`}
                      ></i>
                      <span>{themeMode === 'light' ? 'Claro' : 'Oscuro'}</span>
                    </div>
                    <span className="text-[8.5px] text-slate-400 font-bold">Cambiar Tema</span>
                  </button>
                )}
              </div>

              {/* BOTÓN PROMINENTE AL FINAL PARA RESTAURAR A PREDETERMINADO */}
              <button
                type="button"
                onClick={() => {
                  onResetCustomization();
                  triggerHapticFeedback(customization, 20);
                  setPreviewTouchFeedback(
                    '🔄 Todos los tamaños, colores, tasas e imágenes fueron restaurados a predeterminado'
                  );
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-600/25 via-amber-500/20 to-rose-600/25 hover:from-rose-600 hover:to-amber-600 text-amber-200 hover:text-white border-2 border-amber-400/50 font-black text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.99]"
              >
                <i className="fa-solid fa-rotate-left text-sm"></i>
                <span>Restaurar a Predeterminado</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: AJUSTES DE SONIDOS (PARA COBRO, CARRITO, ESCÁNER Y MÁS)        */}
        {/* ===================================================================== */}
        {activeSettingsTab === 'sounds' && (
          <div className="space-y-3 animate-fadeIn">
            {/* Master Sound Switch & Volume */}
            <div className="bg-slate-900/95 border border-emerald-500/40 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="font-black text-white text-xs sm:text-sm flex items-center gap-2">
                    <i
                      className={`fa-solid ${
                        customization.soundMasterEnabled
                          ? 'fa-volume-high text-emerald-400'
                          : 'fa-volume-xmark text-rose-400'
                      }`}
                    ></i>
                    <span>Sonidos de la Aplicación</span>
                  </span>
                  <span className="text-[10.5px] text-slate-400 block">
                    Efectos de sonido para cobro en caja, carrito, lector QR y alertas
                  </span>
                </div>
                <AnimatedToggleSwitch
                  checked={customization.soundMasterEnabled}
                  onChange={(enabled) => onUpdateCustomization({ soundMasterEnabled: enabled })}
                  labelOn="Sonido ON"
                  labelOff="Silencio"
                  iconOn="fa-volume-high"
                  iconOff="fa-volume-xmark"
                  accentColor="emerald"
                  size="sm"
                />
              </div>

              {customization.soundMasterEnabled && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-extrabold">
                    <span className="text-slate-300">🔊 Volumen General de Efectos:</span>
                    <span className="text-emerald-400 font-mono">
                      {Math.round((customization.soundVolume || 0.85) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={customization.soundVolume || 0.85}
                    onChange={(e) =>
                      onUpdateCustomization({ soundVolume: parseFloat(e.target.value) })
                    }
                    className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* 1. Sonido al Cobrar en Caja */}
            <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="font-extrabold text-white text-xs flex items-center gap-1.5">
                  <i className="fa-solid fa-cash-register text-emerald-400"></i>
                  <span>1. Sonido al Cobrar / Completar Venta</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    playConfiguredCheckoutSound(
                      { ...customization, soundMasterEnabled: true },
                      customization.checkoutSound === 'off' ? 'kaching' : customization.checkoutSound
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-[10.5px] font-black cursor-pointer flex items-center gap-1 transition"
                >
                  <i className="fa-solid fa-play text-[9px]"></i>
                  <span>Probar</span>
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {(
                  [
                    { id: 'kaching', label: '🪙 Caja Clásica (Ka-Ching)' },
                    { id: 'modern_chime', label: '✨ Éxito Digital' },
                    { id: 'counter_bell', label: '🔔 Campana Mostrador' },
                    { id: 'arcade_coin', label: '🎮 Moneda Retro' },
                    { id: 'off', label: '🔇 Sin Sonido' },
                  ] as Array<{ id: CheckoutSoundStyle; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onUpdateCustomization({ checkoutSound: opt.id });
                      if (opt.id !== 'off') {
                        playConfiguredCheckoutSound(
                          { ...customization, soundMasterEnabled: true },
                          opt.id
                        );
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-extrabold text-left truncate cursor-pointer transition ${
                      customization.checkoutSound === opt.id
                        ? 'bg-emerald-600 text-white border-emerald-300 shadow'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Sonido al Agregar Producto al Carrito */}
            <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="font-extrabold text-white text-xs flex items-center gap-1.5">
                  <i className="fa-solid fa-cart-plus text-brand-400"></i>
                  <span>2. Sonido al Tocar / Agregar Producto</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    playConfiguredCartSound(
                      { ...customization, soundMasterEnabled: true },
                      customization.cartAddSound === 'off' ? 'pos_beep' : customization.cartAddSound
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-brand-600/25 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/40 text-[10.5px] font-black cursor-pointer flex items-center gap-1 transition"
                >
                  <i className="fa-solid fa-play text-[9px]"></i>
                  <span>Probar</span>
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(
                  [
                    { id: 'pos_beep', label: '🔊 Beep POS' },
                    { id: 'bubble_pop', label: '💧 Pop Suave' },
                    { id: 'mech_click', label: '⚡ Clic Táctil' },
                    { id: 'off', label: '🔇 Silencio' },
                  ] as Array<{ id: CartSoundStyle; label: string }>
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      onUpdateCustomization({ cartAddSound: opt.id });
                      if (opt.id !== 'off') {
                        playConfiguredCartSound(
                          { ...customization, soundMasterEnabled: true },
                          opt.id
                        );
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl border text-[11px] font-extrabold text-center truncate cursor-pointer transition ${
                      customization.cartAddSound === opt.id
                        ? 'bg-brand-600 text-white border-brand-300 shadow'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Sonido de Escáner y Alertas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-[11px] flex items-center gap-1.5">
                    <i className="fa-solid fa-barcode text-amber-400"></i>
                    <span>3. Escáner de Código/QR</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      playConfiguredScannerSound(
                        { ...customization, soundMasterEnabled: true },
                        customization.scannerSound === 'off'
                          ? 'supermarket_laser'
                          : customization.scannerSound
                      )
                    }
                    className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black cursor-pointer"
                  >
                    ▶️ Probar
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'supermarket_laser', label: '📡 Láser' },
                      { id: 'soft_ding', label: '🔔 Ding' },
                      { id: 'off', label: '🔇 Off' },
                    ] as Array<{ id: ScannerSoundStyle; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onUpdateCustomization({ scannerSound: opt.id });
                        if (opt.id !== 'off') {
                          playConfiguredScannerSound(
                            { ...customization, soundMasterEnabled: true },
                            opt.id
                          );
                        }
                      }}
                      className={`py-1.5 px-1.5 rounded-lg border text-[10px] font-extrabold cursor-pointer ${
                        customization.scannerSound === opt.id
                          ? 'bg-amber-500 text-slate-950 border-amber-300'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-[11px] flex items-center gap-1.5">
                    <i className="fa-solid fa-bell text-rose-400"></i>
                    <span>4. Avisos / Stock Bajo</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      playConfiguredAlertSound(
                        { ...customization, soundMasterEnabled: true },
                        customization.alertSound === 'off' ? 'double_warn' : customization.alertSound
                      )
                    }
                    className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-black cursor-pointer"
                  >
                    ▶️ Probar
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {(
                    [
                      { id: 'double_warn', label: '⚠️ Doble' },
                      { id: 'soft_low', label: '🔔 Suave' },
                      { id: 'off', label: '🔇 Off' },
                    ] as Array<{ id: AlertSoundStyle; label: string }>
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onUpdateCustomization({ alertSound: opt.id });
                        if (opt.id !== 'off') {
                          playConfiguredAlertSound(
                            { ...customization, soundMasterEnabled: true },
                            opt.id
                          );
                        }
                      }}
                      className={`py-1.5 px-1.5 rounded-lg border text-[10px] font-extrabold cursor-pointer ${
                        customization.alertSound === opt.id
                          ? 'bg-rose-600 text-white border-rose-300'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: OTROS AJUSTES ÚTILES DE PUNTO DE VENTA                         */}
        {/* ===================================================================== */}
        {activeSettingsTab === 'extra' && (
          <div className="space-y-2.5 animate-fadeIn">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-3 py-2 text-[11px] text-amber-200 font-bold flex items-center gap-2">
              <i className="fa-solid fa-lightbulb text-amber-400"></i>
              <span>
                Funciones rápidas pensadas para agilizar la atención en mostrador y cuidar tu caja:
              </span>
            </div>

            {/* Toggle 1: Vibración Táctil (Haptics) */}
            <label className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <span className="font-extrabold text-white text-xs block">
                  📳 Vibración al Tocar en el Celular (Respuesta Táctil)
                </span>
                <span className="text-[10.5px] text-slate-400">
                  Vibra suavemente al agregar productos al carrito o cobrar una venta.
                </span>
              </div>
              <input
                type="checkbox"
                checked={customization.hapticVibration}
                onChange={(e) => onUpdateCustomization({ hapticVibration: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
              />
            </label>

            {/* Toggle 2: Abrir Recibo Digital automáticamente después de cobrar */}
            <label className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <span className="font-extrabold text-white text-xs block">
                  🧾 Abrir Recibo Digital Automáticamente al Cobrar
                </span>
                <span className="text-[10.5px] text-slate-400">
                  Si lo desactivas, al cobrar volverás directo a Vender sin abrir la ventana de ticket.
                </span>
              </div>
              <input
                type="checkbox"
                checked={customization.autoOpenReceiptModal}
                onChange={(e) => onUpdateCustomization({ autoOpenReceiptModal: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
              />
            </label>

            {/* Toggle 3: Confirmación antes de eliminar carrito */}
            <label className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <span className="font-extrabold text-white text-xs block">
                  🛡️ Protección contra Borrado Accidental de Carrito
                </span>
                <span className="text-[10.5px] text-slate-400">
                  Evita que se elimine por error una cuenta que ya tiene productos cargados.
                </span>
              </div>
              <input
                type="checkbox"
                checked={customization.confirmBeforeDeleteCart}
                onChange={(e) =>
                  onUpdateCustomization({ confirmBeforeDeleteCart: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
              />
            </label>

            {/* Toggle 4: Mantener pantalla encendida */}
            <label className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <span className="font-extrabold text-white text-xs block">
                  ☀️ Mantener Pantalla Encendida (Modo Mostrador)
                </span>
                <span className="text-[10.5px] text-slate-400">
                  Evita que la pantalla del teléfono o tablet se apague mientras estás vendiendo.
                </span>
              </div>
              <input
                type="checkbox"
                checked={customization.keepScreenAwake}
                onChange={(e) => onUpdateCustomization({ keepScreenAwake: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
              />
            </label>

            {/* Toggle 5: Modo Ahorro de Batería / Menos animaciones */}
            <label className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer">
              <div>
                <span className="font-extrabold text-white text-xs block">
                  🔋 Modo Ultra Rápido / Ahorro de Batería
                </span>
                <span className="text-[10.5px] text-slate-400">
                  Desactiva transiciones suaves para máxima velocidad y menor consumo de batería.
                </span>
              </div>
              <input
                type="checkbox"
                checked={customization.reducedMotionBatterySaver}
                onChange={(e) =>
                  onUpdateCustomization({ reducedMotionBatterySaver: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 cursor-pointer shrink-0"
              />
            </label>

            {/* Pie de Factura / WhatsApp Personalizado */}
            <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="font-extrabold text-white text-xs block">
                  💬 Mensaje al Pie de las Facturas por WhatsApp:
                </label>
                {onOpenPaymentMethodsConfig && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenPaymentMethodsConfig();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-emerald-600/25 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-extrabold text-[10.5px] cursor-pointer flex items-center gap-1.5 transition"
                  >
                    <i className="fa-solid fa-money-check-dollar"></i>
                    <span>Configurar Métodos y Datos de Pago</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={customization.customReceiptFooter}
                onChange={(e) => onUpdateCustomization({ customReceiptFooter: e.target.value })}
                placeholder="Ej. ¡Gracias por su compra! Vuelva pronto 🙌"
                className="w-full bg-slate-800 border border-slate-700 focus:border-brand-400 rounded-xl px-3 py-2 text-xs text-white font-semibold outline-none"
              />
              <span className="text-[10px] text-slate-400 block">
                Este texto aparecerá automáticamente al final de cada recibo o factura enviada por WhatsApp.
              </span>
            </div>

            {/* SECCIÓN ESPECÍFICA: GESTIÓN SEGURA DEL PIN DE DESBLOQUEO DE KIOSCO */}
            {onUpdateKioskPinSecurely && (
              <div className="bg-slate-900/95 border-2 border-amber-500/40 rounded-2xl p-3.5 space-y-3 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                      <i className="fa-solid fa-key text-xs"></i>
                    </div>
                    <div>
                      <span className="font-extrabold text-white text-xs block">
                        🔐 PIN de Desbloqueo del Modo Kiosco
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Última actualización: {kioskPinUpdatedAt}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase border ${
                      kioskPin === '1234'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}
                  >
                    {kioskPin === '1234' ? 'PIN Predeterminado' : 'PIN Personalizado'}
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">
                      PIN Actual de Seguridad:
                    </span>
                    <span className="font-mono font-black text-sm sm:text-base tracking-[0.25em] text-amber-300">
                      {revealCurrentKioskPin ? kioskPin : '•'.repeat(Math.max(4, kioskPin.length))}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRevealCurrentKioskPin((prev) => !prev)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[10.5px] font-extrabold cursor-pointer flex items-center gap-1 transition"
                    >
                      <i
                        className={`fa-solid ${
                          revealCurrentKioskPin ? 'fa-eye-slash text-amber-400' : 'fa-eye text-cyan-400'
                        }`}
                      ></i>
                      <span>{revealCurrentKioskPin ? 'Ocultar' : 'Ver PIN'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChangePinModalBox((prev) => !prev);
                        setModalPinFeedback(null);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10.5px] font-black cursor-pointer flex items-center gap-1 transition"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                      <span>{showChangePinModalBox ? 'Cerrar' : 'Cambiar PIN'}</span>
                    </button>
                  </div>
                </div>

                {showChangePinModalBox && (
                  <div className="bg-slate-950/90 border border-amber-500/30 rounded-xl p-3 space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-300 mb-1">
                          1. PIN Actual *
                        </label>
                        <input
                          type={revealModalNewPin ? 'text' : 'password'}
                          maxLength={16}
                          value={modalCurrentPinInput}
                          onChange={(e) => {
                            setModalCurrentPinInput(e.target.value);
                            setModalPinFeedback(null);
                          }}
                          placeholder="PIN actual"
                          className="w-full bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold outline-none"
                        />
                        <span
                          className={`block text-[9.5px] mt-1 font-bold ${
                            modalCurrentPinInput.trim().length > 0
                              ? 'text-emerald-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {modalCurrentPinInput.trim().length > 0
                            ? '✓ PIN actual ingresado'
                            : 'Requerido para autorizar'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-300 mb-1">
                          2. Nuevo PIN (4-8 dígitos) *
                        </label>
                        <div className="relative">
                          <input
                            type={revealModalNewPin ? 'text' : 'password'}
                            maxLength={8}
                            value={modalNewPinInput}
                            onChange={(e) => {
                              setModalNewPinInput(e.target.value.replace(/\s+/g, ''));
                              setModalPinFeedback(null);
                            }}
                            placeholder="Nuevo PIN"
                            className={`w-full bg-slate-900 border rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-mono font-bold outline-none transition-all ${
                              modalNewPinInput.trim().length === 0
                                ? 'border-slate-700 focus:border-emerald-500 text-emerald-300'
                                : modalNewPinInput.trim().length >= 4
                                  ? 'border-emerald-500 ring-1 ring-emerald-500/30 text-emerald-300'
                                  : 'border-amber-500/80 text-amber-300'
                            }`}
                          />
                          {modalNewPinInput.trim().length > 0 && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                              {modalNewPinInput.trim().length >= 4 ? (
                                <i className="fa-solid fa-circle-check text-emerald-400 text-[11px]"></i>
                              ) : (
                                <i className="fa-solid fa-hourglass-half text-amber-400 text-[11px]"></i>
                              )}
                            </span>
                          )}
                        </div>
                        <span
                          className={`block text-[9.5px] mt-1 font-bold ${
                            modalNewPinInput.trim().length >= 4
                              ? 'text-emerald-400'
                              : modalNewPinInput.trim().length > 0
                                ? 'text-amber-400'
                                : 'text-slate-500'
                          }`}
                        >
                          {modalNewPinInput.trim().length >= 4
                            ? `✓ Longitud válida (${modalNewPinInput.trim().length}/8)`
                            : modalNewPinInput.trim().length > 0
                              ? `⏳ Mínimo 4 dígitos (${modalNewPinInput.trim().length}/4)`
                              : 'Mínimo 4 caracteres'}
                        </span>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-emerald-300 mb-1">
                          3. Confirmar Nuevo PIN *
                        </label>
                        <div className="relative">
                          <input
                            type={revealModalNewPin ? 'text' : 'password'}
                            maxLength={8}
                            value={modalConfirmPinInput}
                            onChange={(e) => {
                              setModalConfirmPinInput(e.target.value.replace(/\s+/g, ''));
                              setModalPinFeedback(null);
                            }}
                            placeholder="Repetir PIN"
                            className={`w-full bg-slate-900 border rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-mono font-bold outline-none transition-all ${
                              modalConfirmPinInput.trim().length === 0
                                ? 'border-slate-700 focus:border-emerald-500 text-emerald-300'
                                : modalNewPinInput.trim().length >= 4 &&
                                    modalNewPinInput.trim() === modalConfirmPinInput.trim()
                                  ? 'border-emerald-500 ring-1 ring-emerald-500/30 text-emerald-300 bg-emerald-950/20'
                                  : modalNewPinInput.trim().startsWith(modalConfirmPinInput.trim())
                                    ? 'border-amber-500/80 text-amber-300'
                                    : 'border-rose-500 ring-1 ring-rose-500/30 text-rose-300 bg-rose-950/20'
                            }`}
                          />
                          {modalConfirmPinInput.trim().length > 0 && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                              {modalNewPinInput.trim().length >= 4 &&
                              modalNewPinInput.trim() === modalConfirmPinInput.trim() ? (
                                <i className="fa-solid fa-circle-check text-emerald-400 text-[11px]"></i>
                              ) : modalNewPinInput.trim().startsWith(modalConfirmPinInput.trim()) ? (
                                <i className="fa-solid fa-ellipsis text-amber-400 text-[11px]"></i>
                              ) : (
                                <i className="fa-solid fa-circle-xmark text-rose-400 text-[11px]"></i>
                              )}
                            </span>
                          )}
                        </div>
                        <span
                          className={`block text-[9.5px] mt-1 font-bold ${
                            modalConfirmPinInput.trim().length > 0
                              ? modalNewPinInput.trim().length >= 4 &&
                                modalNewPinInput.trim() === modalConfirmPinInput.trim()
                                ? 'text-emerald-400'
                                : modalNewPinInput.trim().startsWith(modalConfirmPinInput.trim())
                                  ? 'text-amber-400'
                                  : 'text-rose-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {modalConfirmPinInput.trim().length > 0
                            ? modalNewPinInput.trim().length >= 4 &&
                              modalNewPinInput.trim() === modalConfirmPinInput.trim()
                              ? '✓ ¡Los PIN coinciden!'
                              : modalNewPinInput.trim().startsWith(modalConfirmPinInput.trim())
                                ? `⏳ Coincidiendo (${modalConfirmPinInput.trim().length}/${modalNewPinInput.trim().length})...`
                                : '✕ Los PIN no coinciden'
                            : 'Repite el nuevo PIN'}
                        </span>
                      </div>
                    </div>

                    {(() => {
                      const hasCurr = modalCurrentPinInput.trim().length > 0;
                      const isLenOk =
                        modalNewPinInput.trim().length >= 4 && modalNewPinInput.trim().length <= 8;
                      const isMatchOk =
                        isLenOk &&
                        modalConfirmPinInput.trim().length > 0 &&
                        modalNewPinInput.trim() === modalConfirmPinInput.trim();
                      const isMismatch =
                        modalConfirmPinInput.trim().length > 0 &&
                        (!modalNewPinInput.trim().startsWith(modalConfirmPinInput.trim()) ||
                          (modalConfirmPinInput.trim().length >= modalNewPinInput.trim().length &&
                            modalNewPinInput.trim() !== modalConfirmPinInput.trim()));
                      const canSaveModalPin = hasCurr && isMatchOk;

                      return (
                        <>
                          <div
                            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border flex items-center justify-between gap-2 ${
                              canSaveModalPin
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                                : isMismatch
                                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                  : 'bg-slate-900/90 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span>
                              {canSaveModalPin
                                ? '✓ Confirmación validada en tiempo real: PIN listo para guardar.'
                                : isMismatch
                                  ? '✕ El nuevo PIN y su confirmación no coinciden.'
                                  : 'Completa el PIN actual y confirma el nuevo PIN para habilitar el guardado.'}
                            </span>
                            <span className="font-mono text-[9.5px] shrink-0">
                              {isMatchOk ? '✓ Coincide' : isMismatch ? '✕ Diferente' : 'Pendiente'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <button
                              type="button"
                              onClick={() => setRevealModalNewPin((prev) => !prev)}
                              className="text-[10px] font-bold text-slate-400 hover:text-white cursor-pointer flex items-center gap-1"
                            >
                              <i
                                className={`fa-solid ${revealModalNewPin ? 'fa-eye-slash' : 'fa-eye'}`}
                              ></i>
                              <span>
                                {revealModalNewPin
                                  ? 'Ocultar dígitos'
                                  : 'Mostrar dígitos al escribir'}
                              </span>
                            </button>

                            <button
                              type="button"
                              disabled={!canSaveModalPin}
                              onClick={() => {
                                if (modalNewPinInput.trim().length < 4) {
                                  setModalPinFeedback({
                                    type: 'error',
                                    text: '⚠️ El nuevo PIN debe tener entre 4 y 8 caracteres.',
                                  });
                                  return;
                                }
                                if (modalNewPinInput.trim() !== modalConfirmPinInput.trim()) {
                                  setModalPinFeedback({
                                    type: 'error',
                                    text: '⚠️ El nuevo PIN y su confirmación no coinciden.',
                                  });
                                  return;
                                }
                                const res = onUpdateKioskPinSecurely({
                                  currentPinOrPass: modalCurrentPinInput,
                                  newPin: modalNewPinInput.trim(),
                                });
                                setModalPinFeedback({
                                  type: res.ok ? 'ok' : 'error',
                                  text: res.message,
                                });
                                if (res.ok) {
                                  setModalCurrentPinInput('');
                                  setModalNewPinInput('');
                                  setModalConfirmPinInput('');
                                }
                              }}
                              className={`px-3 py-1.5 rounded-lg font-black text-[10.5px] flex items-center gap-1.5 transition ${
                                canSaveModalPin
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md shadow-emerald-600/20'
                                  : 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed opacity-75'
                              }`}
                            >
                              <i
                                className={`fa-solid ${
                                  canSaveModalPin ? 'fa-shield-check' : 'fa-lock'
                                }`}
                              ></i>
                              <span>Guardar Nuevo PIN</span>
                            </button>
                          </div>
                        </>
                      );
                    })()}

                    {modalPinFeedback && (
                      <div
                        className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-bold border ${
                          modalPinFeedback.type === 'ok'
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        }`}
                      >
                        {modalPinFeedback.text}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Modo Oscuro Automático por Horario */}
            {onToggleAutoDarkByTime && (
              <div className="bg-slate-900/90 border border-slate-700/90 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-extrabold text-white text-xs block">
                      🕒 Modo Oscuro Automático por Horario ({deviceTimeDisplay || 'Reloj Local'})
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Cambia entre tema claro de día y oscuro de noche automáticamente.
                    </span>
                  </div>
                  <AnimatedToggleSwitch
                    checked={autoDarkByTime}
                    onChange={(nextVal) => onToggleAutoDarkByTime(nextVal)}
                    labelOn="Auto ON"
                    labelOff="Manual"
                    iconOn="fa-moon"
                    iconOff="fa-clock"
                    accentColor="brand"
                    size="sm"
                  />
                </div>
                {autoDarkByTime && onChangeAutoDarkSchedule && (
                  <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-800">
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-300 mb-0.5">
                        🌙 Oscuro desde:
                      </label>
                      <select
                        value={autoDarkStartHour}
                        onChange={(e) =>
                          onChangeAutoDarkSchedule(Number(e.target.value), autoDarkEndHour)
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-white font-bold"
                      >
                        {HOUR_OPTIONS.map((opt) => (
                          <option key={`st-${opt.value}`} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-amber-300 mb-0.5">
                        ☀️ Claro desde:
                      </label>
                      <select
                        value={autoDarkEndHour}
                        onChange={(e) =>
                          onChangeAutoDarkSchedule(autoDarkStartHour, Number(e.target.value))
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-[11px] text-white font-bold"
                      >
                        {HOUR_OPTIONS.map((opt) => (
                          <option key={`ed-${opt.value}`} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: MIS TIENDAS Y SUCURSALES (PRIMERO) + FUSIÓN/COPIA + ID (ÚLTIMO) */}
        {/* ===================================================================== */}
        {activeSettingsTab === 'stores' && (
          <div className="space-y-4 animate-fadeIn">
            {/* BARRA DE AVANCE EN VIVO (0% -> 100% INVENTARIO COMPLETO) CUANDO SE APRUEBA LA COPIA */}
            {activeCopyProgress && activeCopyProgress.isActive && (
              <div
                className={`rounded-2xl p-4 border-2 shadow-xl transition-all ${
                  activeCopyProgress.completed
                    ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/30'
                    : 'bg-slate-900 border-amber-400/80 ring-2 ring-amber-400/20'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-black text-sm ${
                        activeCopyProgress.completed
                          ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-400/40 animate-pulse'
                      }`}
                    >
                      {activeCopyProgress.completed ? (
                        <i className="fa-solid fa-check-double"></i>
                      ) : (
                        <i className="fa-solid fa-arrows-rotate fa-spin"></i>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span
                        className={`text-xs sm:text-sm font-black uppercase tracking-wider block ${
                          activeCopyProgress.completed ? 'text-emerald-300' : 'text-amber-300'
                        }`}
                      >
                        {activeCopyProgress.completed
                          ? '✅ ¡INVENTARIO COMPLETO AL 100%!'
                          : activeCopyProgress.mode === 'fusion'
                          ? '🔗 Fusionando y Sincronizando Inventario...'
                          : '📦 Copiando Inventario Aprobado...'}
                      </span>
                      <span className="text-[10.5px] text-slate-300 font-bold block">
                        Desde <strong className="text-white">{activeCopyProgress.sourceName}</strong> (
                        <span className="font-mono text-amber-300">
                          {activeCopyProgress.sourceCode}
                        </span>
                        ) ➔ Hacia{' '}
                        <strong className="text-emerald-300">{activeCopyProgress.targetName}</strong> (
                        <span className="font-mono text-emerald-300">
                          {activeCopyProgress.targetCode}
                        </span>
                        )
                      </span>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-black text-base sm:text-lg px-2.5 py-1 rounded-xl border shrink-0 ${
                      activeCopyProgress.completed
                        ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                        : 'bg-slate-950 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {activeCopyProgress.percent}%
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden border border-slate-700 p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-200 flex items-center justify-end pr-2 text-[9px] font-black ${
                      activeCopyProgress.completed
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 text-slate-950'
                        : 'bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-400 text-slate-950'
                    }`}
                    style={{ width: `${Math.max(6, activeCopyProgress.percent)}%` }}
                  >
                    {activeCopyProgress.percent >= 20 && `${activeCopyProgress.percent}%`}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 mt-2.5 text-[11px]">
                  <span className="font-bold text-slate-200">
                    {activeCopyProgress.completed ? (
                      <span className="text-emerald-300 font-black">
                        🎉 INVENTARIO COMPLETO: {activeCopyProgress.totalProducts} productos listos en{' '}
                        {activeCopyProgress.targetName}
                      </span>
                    ) : (
                      <span>
                        Sincronizando productos ({activeCopyProgress.copiedProducts} de{' '}
                        {activeCopyProgress.totalProducts})...
                      </span>
                    )}
                  </span>

                  {activeCopyProgress.completed && onDismissCopyProgress && (
                    <button
                      type="button"
                      onClick={onDismissCopyProgress}
                      className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10.5px] cursor-pointer transition"
                    >
                      Entendido ✅
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* PANEL DEL PROPIETARIO: SOLICITUDES PENDIENTES DE COPIA / FUSIÓN DE INVENTARIO */}
            {inventoryCopyRequests.filter((r) => r.status === 'pending').length > 0 && (
              <div className="bg-amber-950/80 border-2 border-amber-400 rounded-2xl p-3.5 space-y-2.5 shadow-xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <i className="fa-solid fa-bell text-amber-400 animate-bounce"></i>
                    <span>Panel del Propietario · Solicitudes de Inventario Recibidas</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                    {inventoryCopyRequests.filter((r) => r.status === 'pending').length} Pendiente(s)
                  </span>
                </div>

                <div className="space-y-2">
                  {inventoryCopyRequests
                    .filter((r) => r.status === 'pending')
                    .map((req) => (
                      <div
                        key={req.id}
                        className="bg-slate-950/95 border border-amber-500/50 rounded-xl p-3 space-y-2.5"
                      >
                        <div className="space-y-1">
                          <div className="text-xs sm:text-sm font-black text-white tracking-wide leading-snug">
                            <span className="inline-block px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/50 font-mono text-amber-300 mr-1.5">
                              {req.requesterStoreCode}
                            </span>
                            <span className="uppercase text-white">{req.requesterStoreName}</span>
                          </div>
                          <div className="text-xs sm:text-sm font-black text-emerald-400 uppercase tracking-wider">
                            {req.mode === 'fusion'
                              ? '🔗 SOLICITA FUSIONAR Y USAR TU MISMO INVENTARIO'
                              : '📦 SOLICITA COPIAR TU INVENTARIO'}
                          </div>
                          <p className="text-[10.5px] text-slate-300">
                            Inventario solicitado:{' '}
                            <strong className="text-white">{req.targetStoreName}</strong> (
                            <span className="font-mono text-indigo-300">{req.targetStoreCode}</span> ·{' '}
                            {req.productsCount} productos) • Fecha: {req.createdAt}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              onApproveInventoryRequest && onApproveInventoryRequest(req.id)
                            }
                            className="flex-1 min-h-[38px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-2 px-3 rounded-xl shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-1.5 text-xs transition active:scale-95"
                          >
                            <i className="fa-solid fa-check-circle"></i>
                            <span>Aprobar y Cargar Inventario (0% → 100%)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onRejectInventoryRequest && onRejectInventoryRequest(req.id)
                            }
                            className="min-h-[38px] bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-extrabold py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 text-xs transition active:scale-95"
                          >
                            <i className="fa-solid fa-xmark"></i>
                            <span>Rechazar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* 1. DE PRIMERO: MIS TIENDAS Y SUCURSALES                           */}
            {/* ================================================================= */}
            <div className="space-y-2.5 bg-slate-900/90 border border-slate-700/90 shadow-lg rounded-2xl p-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <i className="fa-solid fa-store text-cyan-400"></i>
                    <span>Mis Tiendas y Sucursales</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    Las tiendas principales no pueden fusionar su inventario entre sí; solo pueden fusionar inventario una Tienda Principal y alguna de sus Sucursales.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm((prev) => !prev);
                    if (!newParentStoreId && defaultMainTienda) {
                      setNewParentStoreId(defaultMainTienda.id);
                    }
                    if (!newSourceStoreOrCode && defaultMainTienda) {
                      setNewSourceStoreOrCode(defaultMainTienda.uniqueCode);
                    }
                  }}
                  className={`px-3.5 py-2 rounded-xl font-extrabold text-[11px] cursor-pointer flex items-center gap-1.5 border transition shadow-sm ${
                    showCreateForm
                      ? 'bg-slate-950 text-slate-300 border-slate-700'
                      : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white border-brand-400/40 shadow-brand-600/20'
                  }`}
                >
                  <i className={`fa-solid ${showCreateForm ? 'fa-chevron-up' : 'fa-plus'}`}></i>
                  <span>
                    {showCreateForm ? 'Ocultar Formulario' : '+ Agregar Tienda o Sucursal'}
                  </span>
                </button>
              </div>

              {showCreateForm && (
                <form
                  onSubmit={handleCreateSubmit}
                  className="bg-slate-950 border-2 border-brand-500/40 rounded-2xl p-4 space-y-3.5 shadow-xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-xs font-extrabold text-brand-300 uppercase tracking-wider flex items-center gap-1.5">
                      <i className="fa-solid fa-plus-circle"></i>
                      <span>Nueva Tienda o Sucursal</span>
                    </h4>
                    <span className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-amber-500/40 font-mono text-[10.5px] font-black text-amber-300">
                      ID Automático:{' '}
                      {newType === 'sucursal'
                        ? nextSucursalPreviewCode || 'SUC1-TOKEN-0000'
                        : nextTiendaPreviewCode || 'TIEN2-TOKEN-0000'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setNewType('tienda');
                        if (newInventoryMode === 'fusion') {
                          setNewInventoryMode('independent');
                        }
                        setFormError('');
                      }}
                      className={`py-2 px-3 rounded-lg font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition ${
                        newType === 'tienda'
                          ? 'bg-brand-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <i className="fa-solid fa-store"></i>
                      <span>Nueva Tienda Principal</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewType('sucursal');
                        if (!newParentStoreId && defaultMainTienda) {
                          setNewParentStoreId(defaultMainTienda.id);
                        }
                        setFormError('');
                      }}
                      className={`py-2 px-3 rounded-lg font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition ${
                        newType === 'sucursal'
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <i className="fa-solid fa-code-branch"></i>
                      <span>Nueva Sucursal</span>
                    </button>
                  </div>

                  {/* Identificación clara de Jerarquía: Tienda Principal vs Sucursal de la tienda tal */}
                  {newType === 'sucursal' ? (
                    <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 space-y-2">
                      <label className="block text-[11px] font-extrabold text-emerald-300">
                        🏬 Selecciona a cuál Tienda Principal pertenece esta Sucursal:
                      </label>
                      <select
                        value={newParentStoreId || defaultMainTienda?.id || ''}
                        onChange={(e) => {
                          setNewParentStoreId(e.target.value);
                          if (newInventoryMode === 'fusion') {
                            setNewSourceStoreOrCode(e.target.value);
                          }
                        }}
                        className="w-full bg-slate-900 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white font-bold"
                      >
                        {mainTiendasList.map((t) => (
                          <option key={`parent-opt-${t.id}`} value={t.id}>
                            Tienda Principal: {t.name} ({t.uniqueCode})
                          </option>
                        ))}
                      </select>
                      {(() => {
                        const selectedParent =
                          mainTiendasList.find((t) => t.id === newParentStoreId) ||
                          defaultMainTienda;
                        return (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[10.5px]">
                            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-lg px-2.5 py-1.5">
                              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">
                                Vínculo de Sucursal:
                              </span>
                              <span className="text-emerald-300 font-black">
                                Sucursal de la tienda:{' '}
                                <strong className="text-white">
                                  {selectedParent?.name || 'Tienda Principal'}
                                </strong>
                              </span>
                            </div>
                            <div className="bg-slate-900/90 border border-brand-500/30 rounded-lg px-2.5 py-1.5">
                              <span className="text-slate-400 block text-[9.5px] uppercase font-bold">
                                Tienda Matriz:
                              </span>
                              <span className="text-brand-300 font-black">
                                Tienda Principal:{' '}
                                <strong className="text-white">
                                  {selectedParent?.name || 'Tienda Principal'}
                                </strong>{' '}
                                {selectedParent?.uniqueCode ? `(${selectedParent.uniqueCode})` : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="bg-brand-950/30 border border-brand-500/30 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[10.5px]">
                      <span className="text-brand-300 font-black">
                        🏠 Tienda Principal:{' '}
                        <strong className="text-white">
                          {newName.trim() || `TIENDA ${mainTiendasList.length + 1}`}
                        </strong>
                      </span>
                      <span className="text-amber-300 font-bold text-[10px]">
                        ⚠️ Las tiendas principales no pueden fusionar su inventario entre sí
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Nombre de la {newType === 'sucursal' ? 'Sucursal' : 'Tienda Principal'} *
                      </label>
                      <input
                        type="text"
                        value={newName}
                        onChange={(e) => {
                          setNewName(e.target.value);
                          setFormError('');
                        }}
                        placeholder={
                          newType === 'sucursal'
                            ? 'Ej. Sucursal Centro'
                            : `Ej. TIENDA ${stores.length + 1}`
                        }
                        className="w-full bg-slate-900 border border-slate-700 focus:border-brand-500 rounded-xl px-3 py-2.5 text-white font-bold text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Ubicación / Nota (Opcional)
                      </label>
                      <input
                        type="text"
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        placeholder="Ej. Av. Bolívar Local 2"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-brand-500 rounded-xl px-3 py-2.5 text-white text-xs outline-none"
                      />
                    </div>
                  </div>

                  {/* Selector de Modalidad de Inventario para la nueva Tienda o Sucursal */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5">
                    <label className="block text-[11px] font-extrabold text-emerald-300">
                      📦 Configuración de Inventario de esta {newType === 'sucursal' ? 'Sucursal' : 'Tienda Principal'}:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setNewInventoryMode('independent')}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                          newInventoryMode === 'independent'
                            ? 'bg-emerald-600/25 border-emerald-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-black text-[11px] text-emerald-300">
                          📦 Independiente
                        </div>
                        <div className="text-[9.5px] leading-tight mt-0.5">
                          Inventario propio desde cero
                        </div>
                      </button>

                      {newType === 'sucursal' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setNewInventoryMode('fusion');
                            const parentT =
                              mainTiendasList.find((t) => t.id === newParentStoreId) ||
                              defaultMainTienda;
                            if (parentT) {
                              setNewSourceStoreOrCode(parentT.id);
                            }
                          }}
                          className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                            newInventoryMode === 'fusion'
                              ? 'bg-cyan-600/25 border-cyan-400 text-white'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          <div className="font-black text-[11px] text-cyan-300">
                            🔗 Modo Fusión
                          </div>
                          <div className="text-[9.5px] leading-tight mt-0.5">
                            Usa el mismo inventario de su Tienda Principal
                          </div>
                        </button>
                      ) : (
                        <div
                          title="Las tiendas principales no pueden fusionar su inventario entre sí"
                          className="p-2 rounded-xl border border-slate-800/80 bg-slate-950/60 text-slate-500 cursor-not-allowed select-none"
                        >
                          <div className="font-black text-[11px] text-slate-500">
                            🚫 Modo Fusión (Solo Sucursales)
                          </div>
                          <div className="text-[9px] leading-tight mt-0.5 text-slate-500">
                            Las tiendas no pueden fusionar su inventario entre sí
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setNewInventoryMode('request_copy');
                          if (!newSourceStoreOrCode && defaultMainTienda) {
                            setNewSourceStoreOrCode(defaultMainTienda.uniqueCode);
                          }
                        }}
                        className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                          newInventoryMode === 'request_copy'
                            ? 'bg-amber-500/25 border-amber-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="font-black text-[11px] text-amber-300">
                          📲 Copiar por ID
                        </div>
                        <div className="text-[9.5px] leading-tight mt-0.5">
                          Solicitar copiar inventario colocando su ID
                        </div>
                      </button>
                    </div>

                    {newType === 'sucursal' && newInventoryMode === 'fusion' && (
                      <div className="pt-1 space-y-1">
                        {(() => {
                          const selectedParent =
                            mainTiendasList.find((t) => t.id === newParentStoreId) ||
                            defaultMainTienda;
                          return (
                            <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl px-3 py-2 text-[10.5px] text-cyan-200 font-bold">
                              🔗 Esta sucursal compartirá en vivo el mismo inventario con su{' '}
                              <strong className="text-white">
                                Tienda Principal: {selectedParent?.name || 'Tienda Principal'} (
                                {selectedParent?.uniqueCode})
                              </strong>{' '}
                              ({selectedParent?.productsCount || 0} productos).
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {newInventoryMode === 'request_copy' && (
                      <div className="pt-1 space-y-1.5">
                        <label className="block text-[10px] font-bold text-amber-300">
                          Coloca el ID de la tienda o sucursal para solicitar copiar su inventario:
                        </label>
                        <input
                          type="text"
                          value={newSourceStoreOrCode}
                          onChange={(e) => setNewSourceStoreOrCode(e.target.value.toUpperCase())}
                          placeholder="Ej. TIEN1-ADMI-9760"
                          className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-black uppercase"
                        />
                        <div className="flex flex-wrap gap-1">
                          {stores.map((s) => (
                            <button
                              key={`qcode-${s.id}`}
                              type="button"
                              onClick={() => setNewSourceStoreOrCode(s.uniqueCode)}
                              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[9.5px] font-mono font-bold text-slate-200 cursor-pointer"
                            >
                              Usar {s.name}: {s.uniqueCode}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-300">
                      Color distintivo del panel de esta {newType}:
                    </span>
                    <div className="flex items-center gap-2">
                      {(Object.keys(STORE_COLOR_STYLES) as StoreAccentColor[]).map((cKey) => (
                        <button
                          key={cKey}
                          type="button"
                          onClick={() => setNewColor(cKey)}
                          title={STORE_COLOR_STYLES[cKey].label}
                          className={`w-7 h-7 rounded-full cursor-pointer border-2 transition flex items-center justify-center ${
                            STORE_COLOR_STYLES[cKey].dot
                          } ${
                            newColor === cKey
                              ? 'border-white scale-110 ring-2 ring-white/40 shadow-md'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                        >
                          {newColor === cKey && (
                            <i className="fa-solid fa-check text-[10px] text-slate-950"></i>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {formError && (
                    <div className="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-3 py-2 rounded-xl text-[11px] font-bold">
                      {formError}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full min-h-[44px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer flex items-center justify-center gap-2 text-xs transition"
                  >
                    <i className="fa-solid fa-check"></i>
                    <span>
                      {newInventoryMode === 'fusion' && newType === 'sucursal'
                        ? `Crear Sucursal en Modo Fusión con su Tienda Principal 🔗`
                        : newInventoryMode === 'request_copy'
                        ? `Crear y Enviar Solicitud de Copia por ID 📲`
                        : `Guardar y Crear ${
                            newType === 'sucursal' ? 'Sucursal' : 'Tienda Principal'
                          } Independiente`}
                    </span>
                  </button>
                </form>
              )}

              <div className="space-y-3 max-h-96 overflow-y-auto p-2">
                {stores.map((st, idx) => {
                  const isSelected = st.id === activeStoreId;
                  const style = STORE_COLOR_STYLES[st.color] || STORE_COLOR_STYLES.indigo;
                  const isEditing = editingId === st.id;
                  const isFusionPickerOpen = fusionPickerStoreId === st.id;
                  const resolvedParentForBranch =
                    st.type === 'sucursal'
                      ? mainTiendasList.find((m) => m.id === st.parentStoreId) ||
                        defaultMainTienda
                      : undefined;
                  const parentDisplayName =
                    st.parentStoreName ||
                    resolvedParentForBranch?.name ||
                    defaultMainTienda?.name ||
                    'Tienda Principal';
                  const parentDisplayCode =
                    st.parentStoreCode || resolvedParentForBranch?.uniqueCode || '';

                  // Compatible stores for fusion:
                  // - Two 'tienda' CANNOT fuse with each other!
                  // - A 'sucursal' can ONLY fuse with its Tienda Principal
                  // - A 'tienda' can ONLY fuse with its Sucursales
                  const compatibleFusionStores =
                    st.type === 'sucursal'
                      ? stores.filter(
                          (other) =>
                            other.type !== 'sucursal' &&
                            (!st.parentStoreId || other.id === st.parentStoreId)
                        )
                      : stores.filter(
                          (other) =>
                            other.type === 'sucursal' &&
                            (!other.parentStoreId || other.parentStoreId === st.id)
                        );

                  return (
                    <div
                      key={st.id}
                      className={`rounded-2xl p-3.5 transition-all duration-200 ${
                        isSelected
                          ? 'bg-slate-950 border-[3px] border-[#39ff14] ring-4 ring-[#39ff14]/45 shadow-[0_0_26px_rgba(57,255,20,0.5),inset_0_0_16px_rgba(57,255,20,0.18)]'
                          : 'bg-slate-950/70 border-2 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2.5">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="Nombre de tienda o sucursal"
                              className="flex-1 bg-slate-800 border border-slate-600 rounded-xl px-3 py-2 text-white font-bold text-xs outline-none"
                            />
                            <div className="flex items-center gap-1.5">
                              {(Object.keys(STORE_COLOR_STYLES) as StoreAccentColor[]).map(
                                (cKey) => (
                                  <button
                                    key={cKey}
                                    type="button"
                                    onClick={() => setEditColor(cKey)}
                                    title={STORE_COLOR_STYLES[cKey].label}
                                    className={`w-6 h-6 rounded-full cursor-pointer border-2 transition ${
                                      STORE_COLOR_STYLES[cKey].dot
                                    } ${
                                      editColor === cKey
                                        ? 'border-white scale-110 ring-2 ring-white/40'
                                        : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                  />
                                )
                              )}
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-bold cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (editName.trim()) {
                                  onRenameStore(st.id, editName.trim(), editColor);
                                }
                                setEditingId(null);
                              }}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-extrabold cursor-pointer"
                            >
                              Guardar Cambios
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div
                              onClick={() => {
                                onSelectStore(st.id);
                                onClose();
                              }}
                              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                            >
                              <div
                                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} text-white flex items-center justify-center font-black text-xs shrink-0 shadow`}
                              >
                                {st.type === 'sucursal' ? (
                                  <i className="fa-solid fa-code-branch"></i>
                                ) : (
                                  <span>#{idx + 1}</span>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-black text-white text-sm break-words">
                                    {st.name}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${style.badgeBg} ${style.badgeText} ${style.border}`}
                                  >
                                    {st.type === 'sucursal' ? 'Sucursal' : `Tienda Principal`}
                                  </span>
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyCode(st.uniqueCode);
                                    }}
                                    title="Toca para copiar el ID único de esta tienda/sucursal"
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-black text-[10px] tracking-wider border cursor-pointer transition ${
                                      st.type === 'sucursal'
                                        ? 'bg-purple-500/20 text-purple-200 border-purple-500/50 hover:bg-purple-500/30'
                                        : 'bg-indigo-500/20 text-indigo-200 border-indigo-500/50 hover:bg-indigo-500/30'
                                    }`}
                                  >
                                    {st.uniqueCode}
                                    <i
                                      className={`fa-solid ${
                                        copiedCodeKey === st.uniqueCode
                                          ? 'fa-check text-emerald-400'
                                          : 'fa-copy opacity-70'
                                      } text-[9px]`}
                                    ></i>
                                  </span>
                                  {isSelected && (
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#39ff14] text-slate-950 shadow-[0_0_10px_rgba(57,255,20,0.45)]">
                                      ● Activa
                                    </span>
                                  )}
                                </div>

                                {/* Identificación obligatoria: "Sucursal de la tienda tal" y "Tienda principal tal" */}
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  {st.type === 'sucursal' ? (
                                    <>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-extrabold">
                                        <i className="fa-solid fa-code-branch text-[9px]"></i>
                                        <span>
                                          Sucursal de la tienda:{' '}
                                          <strong className="text-white">{parentDisplayName}</strong>
                                        </span>
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/15 border border-brand-500/40 text-brand-300 text-[10px] font-extrabold">
                                        <i className="fa-solid fa-store text-[9px]"></i>
                                        <span>
                                          Tienda principal:{' '}
                                          <strong className="text-white">{parentDisplayName}</strong>
                                          {parentDisplayCode ? ` (${parentDisplayCode})` : ''}
                                        </span>
                                      </span>
                                    </>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-500/15 border border-brand-500/40 text-brand-300 text-[10px] font-extrabold">
                                      <i className="fa-solid fa-store text-[9px]"></i>
                                      <span>
                                        Tienda principal:{' '}
                                        <strong className="text-white">{st.name}</strong>
                                      </span>
                                    </span>
                                  )}
                                </div>

                                {/* Estado de Inventario: Independiente vs Modo Fusión */}
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  {st.fusedWithStoreId ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 text-[9.5px] font-extrabold">
                                      <i className="fa-solid fa-link text-cyan-300"></i>
                                      <span>
                                        Modo Fusión con:{' '}
                                        <strong className="text-white">
                                          {st.fusedWithStoreName || parentDisplayName}
                                        </strong>{' '}
                                        {st.fusedWithStoreCode ? `(${st.fusedWithStoreCode})` : ''}
                                      </span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-[9.5px] font-bold">
                                      <i className="fa-solid fa-box text-amber-400"></i>
                                      <span>Inventario Independiente</span>
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-1">
                                  <span>
                                    📦 <strong className="text-slate-200">{st.productsCount}</strong>{' '}
                                    productos
                                  </span>
                                  <span>
                                    🛒 <strong className="text-slate-200">{st.cartsCount}</strong>{' '}
                                    carritos
                                  </span>
                                  <span>
                                    🧾 <strong className="text-slate-200">{st.salesCount}</strong>{' '}
                                    ventas
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-1.5 shrink-0 flex-wrap">
                              {!isSelected ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    onSelectStore(st.id);
                                    onClose();
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-[11px] cursor-pointer shadow-md shadow-brand-600/25"
                                >
                                  Cambiar Aquí 👉
                                </button>
                              ) : (
                                <span className="px-2.5 py-1.5 rounded-xl bg-[#39ff14]/15 border-2 border-[#39ff14] text-[#39ff14] font-black text-[10.5px] shadow-[0_0_10px_rgba(57,255,20,0.3)]">
                                  ● En uso
                                </span>
                              )}

                              {stores.length > 1 && onToggleFusionMode && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setFusionPickerStoreId((prev) =>
                                      prev === st.id ? null : st.id
                                    )
                                  }
                                  title="Configurar Modo Fusión de Inventario entre Tienda Principal y Sucursal"
                                  className={`px-2.5 py-1.5 rounded-xl border text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition ${
                                    st.fusedWithStoreId
                                      ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 hover:bg-cyan-500/35'
                                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                                  }`}
                                >
                                  <i className="fa-solid fa-link"></i>
                                  <span>{st.fusedWithStoreId ? 'Fusión Activa' : 'Fusionar'}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(st.id);
                                  setEditName(st.name);
                                  setEditColor(st.color);
                                }}
                                title="Editar nombre o color de tienda"
                                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
                              >
                                <i className="fa-solid fa-pen text-[10px]"></i>
                              </button>

                              {stores.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirmDeleteId === st.id) {
                                      setConfirmDeleteId(null);
                                      setDeleteConfirmInput('');
                                    } else {
                                      setConfirmDeleteId(st.id);
                                      setDeleteConfirmInput('');
                                    }
                                  }}
                                  title="Eliminar esta tienda/sucursal"
                                  className={`w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer transition ${
                                    confirmDeleteId === st.id
                                      ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30'
                                      : 'bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-500/30'
                                  }`}
                                >
                                  <i className="fa-solid fa-trash text-[10px]"></i>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* AVISO DE SEGURIDAD PARA BORRAR O ELIMINAR COMPLETO UNA TIENDA (ESCRIBIR DELETE MANUALMENTE) */}
                          {confirmDeleteId === st.id && stores.length > 1 && (
                            <div className="bg-rose-950/85 border-2 border-rose-500 rounded-2xl p-3.5 space-y-2.5 mt-2 shadow-xl animate-fadeIn">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-1">
                                  <div className="text-xs sm:text-sm font-black text-rose-200 flex items-center gap-1.5">
                                    <i className="fa-solid fa-triangle-exclamation text-rose-400"></i>
                                    <span>¿Estás seguro de borrar esta tienda?</span>
                                  </div>
                                  <p className="text-[11px] text-rose-100/90 leading-snug">
                                    Estás a punto de eliminar por completo{' '}
                                    <strong className="text-white underline">{st.name}</strong> (
                                    <span className="font-mono text-amber-300">{st.uniqueCode}</span>
                                    ). Para evitar borrados por equivocación,{' '}
                                    <strong className="text-amber-300">
                                      Escribe: DELETE
                                    </strong>{' '}
                                    manualmente en la casilla de abajo y luego presiona Eliminar:
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmDeleteId(null);
                                    setDeleteConfirmInput('');
                                  }}
                                  className="text-rose-300 hover:text-white text-xs font-bold px-1.5 py-0.5 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>

                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                <input
                                  type="text"
                                  value={deleteConfirmInput}
                                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                                  placeholder="Escribe: DELETE"
                                  autoFocus
                                  className="flex-1 bg-slate-950 border-2 border-rose-500/60 focus:border-rose-400 rounded-xl px-3 py-2 text-white font-mono font-black text-xs tracking-widest outline-none"
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    disabled={deleteConfirmInput.trim() !== 'DELETE'}
                                    onClick={() => {
                                      if (deleteConfirmInput.trim() !== 'DELETE') return;
                                      onDeleteStore(st.id);
                                      setConfirmDeleteId(null);
                                      setDeleteConfirmInput('');
                                    }}
                                    className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition ${
                                      deleteConfirmInput.trim() === 'DELETE'
                                        ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-lg shadow-rose-600/40 active:scale-95'
                                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                                    }`}
                                  >
                                    <i className="fa-solid fa-trash-can"></i>
                                    <span>Eliminar</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmDeleteId(null);
                                      setDeleteConfirmInput('');
                                    }}
                                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs cursor-pointer"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Panel desplegable para Fusionar o Desvincular el Inventario (SOLO Tienda Principal <-> Sucursal) */}
                          {isFusionPickerOpen && onToggleFusionMode && (
                            <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-2.5 space-y-2 mt-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10.5px] font-extrabold text-cyan-300">
                                  🔗 Modo Fusión de Inventario para &ldquo;{st.name}&rdquo;:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setFusionPickerStoreId(null)}
                                  className="text-[10px] text-slate-400 hover:text-white cursor-pointer"
                                >
                                  Cerrar ✕
                                </button>
                              </div>
                              <p className="text-[10px] text-slate-300 leading-snug">
                                <strong className="text-amber-300">Regla de Fusión:</strong> Las tiendas principales no pueden fusionar su inventario entre sí; solo pueden fusionarse una{' '}
                                <strong className="text-white">Tienda Principal</strong> y alguna de sus{' '}
                                <strong className="text-emerald-300">Sucursales</strong>.
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {compatibleFusionStores.length > 0 ? (
                                  compatibleFusionStores.map((other) => {
                                    const isCurrentlyFused =
                                      st.fusedWithStoreId === other.id ||
                                      other.fusedWithStoreId === st.id;
                                    return (
                                      <button
                                        key={`fuse-opt-${other.id}`}
                                        type="button"
                                        onClick={() => {
                                          onToggleFusionMode(
                                            st.id,
                                            isCurrentlyFused ? null : other.id
                                          );
                                          setFusionPickerStoreId(null);
                                        }}
                                        className={`px-2.5 py-1.5 rounded-lg text-[10.5px] font-extrabold border cursor-pointer flex items-center gap-1.5 transition ${
                                          isCurrentlyFused
                                            ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow'
                                            : 'bg-slate-950 hover:bg-slate-800 text-slate-200 border-slate-700'
                                        }`}
                                      >
                                        <i className="fa-solid fa-link"></i>
                                        <span>
                                          {isCurrentlyFused
                                            ? `Fusionada con ${other.name} (Clic para separar)`
                                            : `Fusionar con ${
                                                other.type === 'sucursal'
                                                  ? `Sucursal: ${other.name}`
                                                  : `Tienda Principal: ${other.name}`
                                              } (${other.uniqueCode})`}
                                        </span>
                                      </button>
                                    );
                                  })
                                ) : (
                                  <div className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-2.5 py-1.5 font-bold">
                                    {st.type === 'sucursal'
                                      ? 'No se encontró una Tienda Principal disponible para fusionar.'
                                      : 'Esta Tienda Principal aún no tiene Sucursales asignadas para fusionar inventario. Crea primero una Nueva Sucursal de esta tienda.'}
                                  </div>
                                )}

                                {st.fusedWithStoreId && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onToggleFusionMode(st.id, null);
                                      setFusionPickerStoreId(null);
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg text-[10.5px] font-extrabold bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 cursor-pointer"
                                  >
                                    ✂️ Volver a Inventario Independiente
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ================================================================= */}
            {/* 2. CASILLA PARA COPIAR O FUSIONAR INVENTARIO COLOCANDO EL ID       */}
            {/* ================================================================= */}
            {onRequestCopyInventoryByCode && (
              <div className="bg-slate-900/95 border-2 border-indigo-500/40 rounded-2xl p-3.5 space-y-3 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                      <i className="fa-solid fa-boxes-packing text-amber-400"></i>
                      <span>Copiar o Fusionar Inventario por ID de Tienda / Sucursal</span>
                    </span>
                    <p className="text-[10.5px] text-slate-400 mt-0.5 leading-snug">
                      Coloca el ID de la tienda principal o sucursal y presiona{' '}
                      <strong className="text-white">Proceder</strong>. Recuerda: dos tiendas principales pueden{' '}
                      <strong className="text-amber-300">copiar</strong> su inventario por ID, pero{' '}
                      <strong className="text-cyan-300">solo una Tienda Principal y su Sucursal</strong> pueden fusionar su inventario en vivo.
                    </p>
                  </div>
                </div>

                {/* Selección de Tienda/Sucursal Solicitante y Modalidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-300 mb-1">
                      1. Tienda o Sucursal que solicita recibir el inventario:
                    </label>
                    <select
                      value={copyRequesterStoreId}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setCopyRequesterStoreId(nextId);
                        const selStore = stores.find((s) => s.id === nextId);
                        if (selStore?.type !== 'sucursal' && copyActionMode === 'fusion') {
                          setCopyActionMode('copy');
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white font-bold"
                    >
                      {stores.map((st) => (
                        <option key={`req-st-${st.id}`} value={st.id}>
                          {st.uniqueCode} · {st.name} (
                          {st.type === 'sucursal'
                            ? `Sucursal de ${st.parentStoreName || defaultMainTienda?.name || 'Tienda Principal'}`
                            : `Tienda Principal: ${st.name}`}
                          )
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-300 mb-1">
                      2. ¿Qué deseas hacer con el inventario?
                    </label>
                    <select
                      value={copyActionMode}
                      onChange={(e) => setCopyActionMode(e.target.value as 'copy' | 'fusion')}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-amber-300 font-bold"
                    >
                      <option value="copy">
                        📋 Copiar todo su inventario (Mantiene inventario independiente después)
                      </option>
                      <option
                        value="fusion"
                        disabled={
                          (stores.find((s) => s.id === copyRequesterStoreId)?.type || 'tienda') !==
                          'sucursal'
                        }
                      >
                        🔗 Utilizar el mismo inventario (Modo Fusión: Solo Sucursal ↔ Tienda Principal)
                      </option>
                    </select>
                  </div>
                </div>

                {/* Casilla para colocar el ID de la tienda o sucursal + Botón Proceder */}
                <div className="space-y-2">
                  <label className="block text-[10.5px] font-extrabold text-amber-300">
                    3. Coloca aquí el ID de la Tienda o Sucursal de origen:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={copyTargetCodeInput}
                      onChange={(e) => {
                        setCopyTargetCodeInput(e.target.value.toUpperCase());
                        setCopyRequestFeedback(null);
                      }}
                      placeholder="Ej. TIEN1-ADMI-9760"
                      className="flex-1 bg-slate-950 border-2 border-indigo-500/50 focus:border-amber-400 rounded-xl px-3 py-2.5 text-amber-300 font-mono font-black text-xs sm:text-sm uppercase tracking-wider outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const cleanCode = copyTargetCodeInput.trim();
                        if (!cleanCode) {
                          setCopyRequestFeedback({
                            type: 'error',
                            text: '⚠️ Coloca primero el ID de la tienda o sucursal en la casilla (ej. TIEN1-ADMI-9760).',
                          });
                          return;
                        }
                        const res = onRequestCopyInventoryByCode({
                          requesterStoreId: copyRequesterStoreId || activeStoreId,
                          targetCodeInput: cleanCode,
                          mode: copyActionMode,
                        });
                        setCopyRequestFeedback({
                          type: res.ok ? 'ok' : 'error',
                          text: res.message,
                        });
                        if (res.ok) {
                          setCopyTargetCodeInput('');
                        }
                      }}
                      className="min-h-[42px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5 shrink-0 transition active:scale-95"
                    >
                      <i className="fa-solid fa-paper-plane"></i>
                      <span>Proceder / Solicitar</span>
                    </button>
                  </div>

                  {/* Botones rápidos para rellenar el ID de la Tienda Principal o de otra sucursal en 1 clic */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-bold text-slate-400">
                      Autocompletar ID rápido:
                    </span>
                    {stores.map((st, idx) => (
                      <button
                        key={`quick-fill-${st.id}`}
                        type="button"
                        onClick={() => {
                          setCopyTargetCodeInput(st.uniqueCode);
                          setCopyRequestFeedback(null);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[10px] font-mono font-extrabold text-emerald-300 cursor-pointer transition"
                      >
                        {idx === 0 ? '🏠 Tienda Principal: ' : `${st.name}: `}
                        {st.uniqueCode}
                      </button>
                    ))}
                  </div>

                  {copyRequestFeedback && (
                    <div
                      className={`rounded-xl px-3 py-2 text-[11px] font-bold border ${
                        copyRequestFeedback.type === 'ok'
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200'
                          : 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                      }`}
                    >
                      {copyRequestFeedback.text}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* 3. DE ÚLTIMO: IDENTIFICACIÓN OFICIAL PARA CATÁLOGOS VIRTUALES      */}
            {/* ================================================================= */}
            <div className="bg-slate-900/95 border-2 border-emerald-500/40 shadow-lg rounded-2xl p-3.5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div className="min-w-0">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                    Identificación Oficial para Catálogos Virtuales
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className="text-xs sm:text-sm font-black text-white">
                      Propietario:
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-mono font-black text-xs sm:text-sm">
                      <i className="fa-solid fa-envelope text-[11px]"></i>
                      <span>{userEmail || 'furax030@gmail.com'}</span>
                      <span>✅</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {onOpenPaymentMethodsConfig && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenPaymentMethodsConfig();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/25 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 font-extrabold text-[11px] cursor-pointer flex items-center gap-1.5 transition shrink-0"
                    >
                      <i className="fa-solid fa-money-check-dollar"></i>
                      <span>Métodos y Datos de Pago</span>
                    </button>
                  )}
                  {onOpenUserSetup && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenUserSetup();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-600 font-extrabold text-[11px] cursor-pointer flex items-center gap-1.5 transition shrink-0"
                    >
                      <i className="fa-solid fa-id-card text-brand-400"></i>
                      <span>Datos Usuario y Tienda</span>
                    </button>
                  )}
                  {onLogout && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onLogout();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-extrabold text-[11px] cursor-pointer flex items-center gap-1.5 transition shrink-0"
                    >
                      <i className="fa-solid fa-right-from-bracket"></i>
                      <span>{logoutLabel}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* List of Generated Unique IDs (TIEN1-TOKEN-0000 / SUC1-TOKEN-0000) */}
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold">
                  <span>IDs Únicos Generados Automáticamente (Tiendas y Sucursales):</span>
                  <span className="text-amber-300">Catálogo Virtual</span>
                </div>

                <div className="space-y-1.5">
                  {stores.map((st) => (
                    <div
                      key={`code-${st.id}`}
                      className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                            st.type === 'sucursal'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                          }`}
                        >
                          {st.type === 'sucursal' ? 'Sucursal' : 'Tienda'}
                        </span>
                        <span className="font-mono font-black text-amber-300 text-xs tracking-wider truncate">
                          {st.uniqueCode}
                        </span>
                        <span className="text-[10.5px] text-slate-400 font-bold truncate hidden sm:inline">
                          · {st.name}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(st.uniqueCode)}
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shrink-0 transition ${
                          copiedCodeKey === st.uniqueCode
                            ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                        }`}
                      >
                        <i
                          className={`fa-solid ${
                            copiedCodeKey === st.uniqueCode ? 'fa-check' : 'fa-copy'
                          }`}
                        ></i>
                        <span>{copiedCodeKey === st.uniqueCode ? '¡Copiado!' : 'Copiar ID'}</span>
                      </button>
                    </div>
                  ))}

                  {/* If the account doesn't have a sucursal created yet, also show its pre-assigned SUC1 ID */}
                  {!stores.some((s) => s.type === 'sucursal') && defaultBranchPreviewCode && (
                    <div className="flex items-center justify-between gap-2 bg-slate-900/60 border border-dashed border-slate-700 rounded-lg px-2.5 py-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                          Sucursal #1
                        </span>
                        <span className="font-mono font-black text-emerald-300 text-xs tracking-wider truncate">
                          {defaultBranchPreviewCode}
                        </span>
                        <span className="text-[10px] text-slate-400 italic truncate">
                          (Reservado para tu 1ra Sucursal)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(defaultBranchPreviewCode)}
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shrink-0 transition ${
                          copiedCodeKey === defaultBranchPreviewCode
                            ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                        }`}
                      >
                        <i
                          className={`fa-solid ${
                            copiedCodeKey === defaultBranchPreviewCode ? 'fa-check' : 'fa-copy'
                          }`}
                        ></i>
                        <span>
                          {copiedCodeKey === defaultBranchPreviewCode ? '¡Copiado!' : 'Copiar ID'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {onOpenDevicePairing && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDevicePairing();
                  }}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-cyan-600/25 to-indigo-600/25 hover:from-cyan-600 hover:to-indigo-600 text-cyan-200 hover:text-white border border-cyan-500/40 font-black text-xs cursor-pointer flex items-center justify-between gap-2 transition shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-qrcode text-sm text-cyan-300"></i>
                    <span>Vincular Móvil o Tablet por QR (WebSocket en Vivo)</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-900/80 border border-cyan-500/40 text-[10px] font-extrabold text-emerald-300 shrink-0">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    ></span>
                    {connectedDevicesCount}{' '}
                    {connectedDevicesCount === 1 ? 'dispositivo' : 'dispositivos'}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
