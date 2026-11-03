import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  RefreshCw,
  Zap,
  Volume2,
  VolumeX,
  Upload,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  Barcode,
  QrCode,
  Layers,
  Sparkles,
  ZoomIn,
} from 'lucide-react';

export interface ScannableProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  barcode: string;
  price: number;
  stock: number;
  image: string;
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  mode: 'pos' | 'addProduct';
  products: ScannableProduct[];
  primaryCurrency: string;
  primaryRate: number;
  onClose: () => void;
  /** Called in POS mode when a scanned code matches a product in inventory */
  onPOSProductFound: (product: ScannableProduct, rawCode: string) => void;
  /** Called in POS mode when a scanned code is NOT in inventory and user clicks "Create Product" */
  onCreateNewProductWithCode: (barcode: string) => void;
  /** Called in Add Product mode when a barcode/QR is scanned or selected */
  onAssignBarcodeToForm: (barcode: string, existingProduct?: ScannableProduct) => void;
}

interface ScanFeedback {
  code: string;
  timestamp: string;
  matchedProduct?: ScannableProduct;
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
];

let sharedScannerAudioCtx: AudioContext | null = null;

// Reproduce un pitido potente y nítido estilo lector láser de supermercado cuando captura el código de barras
export function playScannerBeep(success = true) {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!sharedScannerAudioCtx || sharedScannerAudioCtx.state === 'closed') {
      sharedScannerAudioCtx = new AudioCtx();
    }
    const ctx = sharedScannerAudioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    if (success) {
      // Pitido clásico agudo y claro de escáner láser comercial (2350 Hz -> 2600 Hz)
      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(2350, now);
      osc1.frequency.setValueAtTime(2650, now + 0.045);
      osc2.frequency.setValueAtTime(1175, now);

      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.008, now + 0.14);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.15);
      osc2.stop(now + 0.15);
    } else {
      // Sonido doble grave de alerta cuando el código no existe en inventario aún
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(480, now);
      osc1.frequency.setValueAtTime(340, now + 0.12);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.008, now + 0.26);

      osc1.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.27);
    }
  } catch {
    // Ignore audio errors if blocked by browser autoplay policy
  }
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  mode,
  products,
  primaryCurrency,
  primaryRate,
  onClose,
  onPOSProductFound,
  onCreateNewProductWithCode,
  onAssignBarcodeToForm,
}) => {
  const readerElementId = 'lumina-pos-qr-barcode-reader';
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const lastScannedCodeRef = useRef<{ code: string; time: number }>({ code: '', time: 0 });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Zoom / Enfoque cercano optimizado para escanear a 10 cm - 15 cm
  const [closeRangeZoom, setCloseRangeZoom] = useState<number>(1.35);
  const [laserCapturedFlash, setLaserCapturedFlash] = useState<boolean>(false);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [continuousPOS, setContinuousPOS] = useState<boolean>(true);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [manualCodeInput, setManualCodeInput] = useState<string>('');
  const [lastFeedback, setLastFeedback] = useState<ScanFeedback | null>(null);
  const [scanHistoryCount, setScanHistoryCount] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

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
    setCopiedCode(text);
    setTimeout(() => {
      setCopiedCode((prev) => (prev === text ? null : prev));
    }, 2200);
  };

  // Busca un producto por código de barras exacto, parcial limpio, ID o contenido JSON de QR
  const findProductByScannedCode = useCallback(
    (rawText: string): { cleanCode: string; product?: ScannableProduct } => {
      let cleanCode = rawText.trim();
      try {
        if (cleanCode.startsWith('{') && cleanCode.endsWith('}')) {
          const parsed = JSON.parse(cleanCode);
          if (parsed.barcode) cleanCode = String(parsed.barcode).trim();
          else if (parsed.id) cleanCode = String(parsed.id).trim();
        }
      } catch {
        // Not JSON, use raw code
      }

      const normalizedTarget = cleanCode.toLowerCase();
      const found = products.find((p) => {
        const b = (p.barcode || '').trim().toLowerCase();
        const id = (p.id || '').trim().toLowerCase();
        return (
          b === normalizedTarget ||
          id === normalizedTarget ||
          // Soporte EAN-13 / UPC-A con cero inicial (ej. 0750... vs 750...)
          (b.length >= 8 &&
            normalizedTarget.length >= 8 &&
            b.replace(/^0+/, '') === normalizedTarget.replace(/^0+/, ''))
        );
      });

      return { cleanCode, product: found };
    },
    [products]
  );

  // Procesa cualquier código detectado por la cámara, imagen o prueba rápida
  const handleDecodedCode = useCallback(
    (rawText: string, fromManualOrQuick = false) => {
      const now = Date.now();
      // Evitar lecturas duplicadas en ráfaga del mismo código en menos de 1.3 segundos
      if (
        !fromManualOrQuick &&
        lastScannedCodeRef.current.code === rawText &&
        now - lastScannedCodeRef.current.time < 1300
      ) {
        return;
      }
      lastScannedCodeRef.current = { code: rawText, time: now };

      const { cleanCode, product } = findProductByScannedCode(rawText);
      if (!cleanCode) return;

      // Destello visual del láser y vibración háptica al capturar
      setLaserCapturedFlash(true);
      setTimeout(() => setLaserCapturedFlash(false), 420);
      try {
        if (navigator.vibrate) {
          navigator.vibrate(70);
        }
      } catch {
        // ignore
      }

      const timeStr = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      if (mode === 'addProduct') {
        if (soundEnabled) playScannerBeep(true);
        setLastFeedback({
          code: cleanCode,
          timestamp: timeStr,
          matchedProduct: product,
        });
        onAssignBarcodeToForm(cleanCode, product);
        return;
      }

      // Modo POS: Siempre suena el pitido láser al capturar el código
      if (product) {
        if (soundEnabled) playScannerBeep(true);
        setLastFeedback({
          code: cleanCode,
          timestamp: timeStr,
          matchedProduct: product,
        });
        setScanHistoryCount((c) => c + 1);
        onPOSProductFound(product, cleanCode);

        if (!continuousPOS) {
          onClose();
        }
      } else {
        if (soundEnabled) playScannerBeep(true);
        setLastFeedback({
          code: cleanCode,
          timestamp: timeStr,
          matchedProduct: undefined,
        });
      }
    },
    [
      findProductByScannedCode,
      mode,
      soundEnabled,
      onAssignBarcodeToForm,
      onPOSProductFound,
      continuousPOS,
      onClose,
    ]
  );

  // Aplicar zoom cercano (10-15 cm) y enfoque continuo tanto por hardware como CSS
  const applyCloseRangeCameraOptimization = useCallback(
    async (zoomLevel: number) => {
      const container = document.getElementById(readerElementId);
      if (container) {
        const videoEl = container.querySelector('video') as HTMLVideoElement | null;
        if (videoEl) {
          videoEl.style.transition = 'transform 0.2s ease-out';
          videoEl.style.transform = `scale(${zoomLevel})`;
          videoEl.style.transformOrigin = 'center center';
        }
      }

      const instance = html5QrCodeRef.current;
      if (!instance || !instance.isScanning) return;
      try {
        const capabilities = instance.getRunningTrackCapabilities() as unknown as {
          zoom?: { min?: number; max?: number };
          focusMode?: string[];
        };
        const advancedConstraints: Record<string, unknown> = {};
        if (
          capabilities?.focusMode &&
          Array.isArray(capabilities.focusMode) &&
          capabilities.focusMode.includes('continuous')
        ) {
          advancedConstraints.focusMode = 'continuous';
        }
        if (capabilities?.zoom && typeof capabilities.zoom.max === 'number') {
          const minZ = capabilities.zoom.min ?? 1;
          const maxZ = capabilities.zoom.max;
          const clampedZoom = Math.min(maxZ, Math.max(minZ, zoomLevel));
          advancedConstraints.zoom = clampedZoom;
        }
        if (Object.keys(advancedConstraints).length > 0) {
          await instance.applyVideoConstraints({
            advanced: [advancedConstraints as unknown as MediaTrackConstraintSet],
          });
        }
      } catch {
        // Fallback visual CSS scale already applied above
      }
    },
    []
  );

  const stopScanner = useCallback(async () => {
    const instance = html5QrCodeRef.current;
    if (!instance) return;
    try {
      if (instance.isScanning) {
        await instance.stop();
      }
      instance.clear();
    } catch {
      // ignore stop errors when unmounting
    } finally {
      setIsCameraActive(false);
      setTorchOn(false);
      setTorchSupported(false);
    }
  }, []);

  const startScanner = useCallback(
    async (overrideCameraId?: string, overrideFacing?: 'environment' | 'user') => {
      if (!isOpen) return;
      setCameraError(null);
      setIsCameraStarting(true);

      await stopScanner();

      try {
        const el = document.getElementById(readerElementId);
        if (!el) {
          setIsCameraStarting(false);
          return;
        }

        const scanner = new Html5Qrcode(readerElementId, {
          formatsToSupport: SUPPORTED_FORMATS,
          verbose: false,
          useBarCodeDetectorIfSupported: true,
        });
        html5QrCodeRef.current = scanner;

        const targetFacing = overrideFacing || facingMode;
        const cameraIdOrConfig: string | MediaTrackConstraints = overrideCameraId
          ? overrideCameraId
          : selectedCameraId
          ? selectedCameraId
          : {
              facingMode: targetFacing,
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            };

        await scanner.start(
          cameraIdOrConfig,
          {
            fps: 24,
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const width = Math.max(220, Math.min(Math.floor(viewfinderWidth * 0.88), 360));
              const height = Math.max(115, Math.min(Math.floor(viewfinderHeight * 0.52), 165));
              return { width, height };
            },
            aspectRatio: 1.5,
            disableFlip: false,
          },
          (decodedText) => {
            handleDecodedCode(decodedText, false);
          },
          () => {
            // Frame without barcode — ignore
          }
        );

        setIsCameraActive(true);
        try {
          sessionStorage.removeItem('lumina_camera_denied');
        } catch {
          // ignore
        }

        // Optimizar enfoque continuo y zoom para distancia corta 10-15 cm
        setTimeout(() => {
          applyCloseRangeCameraOptimization(closeRangeZoom);
        }, 180);

        // Listar dispositivos de video disponibles
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoInputs = devices
              .filter((d) => d.kind === 'videoinput' && d.deviceId)
              .map((d, idx) => ({
                id: d.deviceId,
                label: d.label || `Cámara ${idx + 1}`,
              }));
            if (videoInputs.length > 0) {
              setCameras(videoInputs);
            }
          }
        } catch {
          // ignore
        }

        // Comprobar si la cámara soporta linterna (torch)
        try {
          const capabilities = scanner.getRunningTrackCapabilities() as unknown as {
            torch?: boolean;
          };
          setTorchSupported(Boolean(capabilities && capabilities.torch));
        } catch {
          setTorchSupported(false);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'No se pudo acceder a la cámara del navegador.';
        const isPermDenied = message.includes('Permission') || message.includes('NotAllowed');
        if (isPermDenied) {
          try {
            sessionStorage.setItem('lumina_camera_denied', '1');
          } catch {
            // ignore
          }
        }
        setCameraError(
          isPermDenied
            ? 'Permiso de cámara no concedido. Pulsa "Activar Cámara" y acepta el permiso, o sube una foto / escribe el código abajo.'
            : 'No se detectó una cámara disponible. Puedes pulsar "Activar Cámara", subir una foto del código o escribirlo abajo.'
        );
        setIsCameraActive(false);
      } finally {
        setIsCameraStarting(false);
      }
    },
    [
      isOpen,
      stopScanner,
      selectedCameraId,
      facingMode,
      handleDecodedCode,
      applyCloseRangeCameraOptimization,
      closeRangeZoom,
    ]
  );

  // Al abrir el modal: iniciar la cámara automáticamente para que sea directo y práctico
  useEffect(() => {
    if (isOpen) {
      setLastFeedback(null);
      setScanHistoryCount(0);
      setManualCodeInput('');
      setCameraError(null);

      let cancelled = false;
      const autoStart = async () => {
        try {
          if (sessionStorage.getItem('lumina_camera_denied') === '1') {
            return;
          }
          if (!cancelled) {
            await startScanner();
          }
        } catch {
          // ignore
        }
      };

      const timer = setTimeout(autoStart, 120);
      return () => {
        cancelled = true;
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }
  }, [isOpen]);

  const handleChangeZoom = (newZoom: number) => {
    setCloseRangeZoom(newZoom);
    applyCloseRangeCameraOptimization(newZoom);
  };

  const handleToggleFacingMode = async () => {
    const nextFacing = facingMode === 'environment' ? 'user' : 'environment';
    setSelectedCameraId('');
    setFacingMode(nextFacing);
    await startScanner('', nextFacing);
  };

  const handleSelectCameraDevice = async (camId: string) => {
    setSelectedCameraId(camId);
    await startScanner(camId);
  };

  const handleToggleTorch = async () => {
    const instance = html5QrCodeRef.current;
    if (!instance || !isCameraActive) return;
    try {
      const nextTorch = !torchOn;
      await instance.applyVideoConstraints({
        advanced: [{ torch: nextTorch } as unknown as MediaTrackConstraintSet],
      });
      setTorchOn(nextTorch);
    } catch {
      // ignore if unsupported on device
    }
  };

  // Escanear código de barras o QR desde una foto/imagen subida
  const handleScanFromImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCameraError(null);
      await stopScanner();
      const tempScanner = new Html5Qrcode(readerElementId, {
        formatsToSupport: SUPPORTED_FORMATS,
        verbose: false,
      });
      const decodedText = await tempScanner.scanFile(file, true);
      handleDecodedCode(decodedText, true);
    } catch {
      setCameraError(
        'No se detectó ningún código de barras o QR en la imagen seleccionada. Intenta con una foto más clara.'
      );
      if (soundEnabled) playScannerBeep(false);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Generar un código alfanumérico de 16 caracteres (formato M42T-75HK-GJJ8-T68J)
  const handleGenerateRandomEAN13 = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const block = () =>
      Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join(
        ''
      );
    const generated = `${block()}-${block()}-${block()}-${block()}`;
    setManualCodeInput(generated);
    handleDecodedCode(generated, true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-slate-900 border-2 border-rose-500/50 rounded-3xl max-w-lg w-full p-3.5 sm:p-5 shadow-2xl space-y-3 text-xs max-h-[95vh] overflow-y-auto">
        {/* Header práctico con indicador de Láser 10-15 cm */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/90 pb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border-2 border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
              <Barcode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-white truncate flex items-center gap-2">
                {mode === 'pos'
                  ? 'Escáner Láser de Código de Barras'
                  : 'Escanear Código para Producto'}
              </h3>
              <p className="text-[11px] text-rose-300 font-bold truncate">
                📏 Coloca el código de barras a 10 cm o 15 cm sobre la línea roja
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ minWidth: 0, minHeight: 38 }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition"
            title="Cerrar escáner"
          >
            <i className="fa-solid fa-xmark text-rose-400 text-sm"></i>
            <span>Cerrar</span>
          </button>
        </div>

        {/* Visor de Cámara en Vivo con Línea Roja Láser de Alta Visibilidad */}
        <div
          className={`relative bg-black border-2 rounded-2xl overflow-hidden min-h-[240px] sm:min-h-[265px] flex flex-col items-center justify-center transition-all duration-200 ${
            laserCapturedFlash
              ? 'border-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.65)]'
              : 'border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.2)]'
          }`}
        >
          <div
            id={readerElementId}
            className="w-full max-w-[460px] mx-auto overflow-hidden [&_#qr-shaded-region]:!hidden"
          />

          {/* Guía Láser Roja superpuesta cuando la cámara está activa */}
          {isCameraActive && !cameraError && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-between p-3">
              {/* Indicador superior de distancia ideal 10-15 cm */}
              <div className="px-3 py-1 rounded-full bg-slate-950/90 border border-rose-500/50 text-white text-[11px] font-extrabold flex items-center gap-2 shadow-lg">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>Distancia ideal: 10 cm a 15 cm · Enfoque Macro Activo</span>
              </div>

              {/* Marco de lectura con esquinas y LÍNEA ROJA LÁSER intensa */}
              <div
                className={`w-[88%] max-w-[340px] h-36 sm:h-40 rounded-2xl relative flex items-center justify-center transition-all duration-150 ${
                  laserCapturedFlash
                    ? 'border-2 border-emerald-400 bg-emerald-500/15 shadow-[0_0_30px_rgba(16,185,129,0.5)]'
                    : 'border-2 border-white/30 bg-black/10'
                }`}
              >
                {/* Esquinas estilo lector profesional */}
                <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-rose-500 rounded-tl-xl" />
                <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-rose-500 rounded-tr-xl" />
                <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-rose-500 rounded-bl-xl" />
                <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-rose-500 rounded-br-xl" />

                {/* LÍNEA ROJA LÁSER CENTRAL (cambia a verde brillante al capturar) */}
                <div
                  className={`w-[96%] transition-all duration-150 ${
                    laserCapturedFlash
                      ? 'h-1.5 bg-emerald-400 shadow-[0_0_24px_#10b981,0_0_10px_#34d399]'
                      : 'h-[3px] bg-red-500 shadow-[0_0_18px_#ef4444,0_0_8px_#ff0000,0_0_3px_#ffffff]'
                  }`}
                />

                {/* Haz de luz rojo secundario suave */}
                {!laserCapturedFlash && (
                  <div className="absolute inset-x-3 top-1/2 -translate-y-1/2 h-6 bg-gradient-to-b from-transparent via-red-500/20 to-transparent animate-pulse" />
                )}
              </div>

              {/* Etiqueta inferior de estado */}
              <div className="px-3 py-1 rounded-full bg-slate-950/90 border border-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1.5">
                <QrCode className="w-3 h-3 text-rose-400" />
                <span>Alinea las barras con la línea roja · Pitido automático al capturar</span>
              </div>
            </div>
          )}

          {isCameraStarting && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <Camera className="w-8 h-8 text-rose-400 animate-bounce" />
              <span className="text-xs font-extrabold text-white">
                Activando lector láser de cámara (10–15 cm)...
              </span>
              <span className="text-[11px] text-slate-400">
                Acepta el permiso de cámara si el navegador lo solicita
              </span>
            </div>
          )}

          {!isCameraActive && !isCameraStarting && !cameraError && (
            <div className="p-5 text-center space-y-3 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border-2 border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
                <Barcode className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-200 font-bold leading-relaxed">
                Pulsa el botón para encender el lector con línea roja y escanear a 10 o 15 cm de distancia.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playScannerBeep(true);
                    startScanner();
                  }}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black flex items-center gap-2 cursor-pointer shadow-lg shadow-rose-600/30"
                >
                  <Camera className="w-4 h-4" />
                  <span>Encender Escáner Láser</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[44px] px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Foto</span>
                </button>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-5 text-center space-y-3 max-w-sm mx-auto">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-200 font-semibold leading-relaxed">{cameraError}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => startScanner()}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Reintentar Cámara</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir Foto de Código</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Selector rápido de Enfoque Cercano (10 cm / 15 cm) + Controles prácticos */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-2.5 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <span className="text-[11px] font-extrabold text-slate-200 flex items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5 text-rose-400" />
              <span>Enfoque de Cercanía (10–15 cm):</span>
            </span>
            <div className="flex items-center gap-1">
              {[
                { label: '1x Lejos', value: 1 },
                { label: '15 cm (1.35x)', value: 1.35 },
                { label: '10 cm (1.75x)', value: 1.75 },
                { label: 'Macro (2.1x)', value: 2.1 },
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleChangeZoom(preset.value)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold border cursor-pointer transition ${
                    Math.abs(closeRangeZoom - preset.value) < 0.05
                      ? 'bg-rose-600 text-white border-rose-400 shadow-sm'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-700/70">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleFacingMode}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
                title="Cambiar entre cámara trasera y frontal"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                <span>{facingMode === 'environment' ? 'Trasera' : 'Frontal'}</span>
              </button>

              {torchSupported && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`min-h-[38px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border cursor-pointer ${
                    torchOn
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                  title="Encender o apagar linterna para iluminar el código a 10-15 cm"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Linterna</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const next = !soundEnabled;
                  setSoundEnabled(next);
                  if (next) playScannerBeep(true);
                }}
                className={`min-h-[38px] px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border cursor-pointer ${
                  soundEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
                title="Sonido láser al capturar código de barras"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5" />
                )}
                <span>{soundEnabled ? 'Sonido ON' : 'Sin Sonido'}</span>
              </button>
            </div>

            {mode === 'pos' && (
              <button
                type="button"
                onClick={() => setContinuousPOS((c) => !c)}
                className={`min-h-[38px] px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border cursor-pointer ${
                  continuousPOS
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
                title="En modo continuo puedes escanear varios productos seguidos sin que se cierre la ventana"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{continuousPOS ? 'Escaneo Continuo' : 'Cerrar al Escanear'}</span>
              </button>
            )}
          </div>

          {/* Selector de lente si el teléfono tiene múltiples cámaras traseras (Gran Angular / Macro / Principal) */}
          {cameras.length > 1 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-slate-400 font-bold shrink-0">Cámara / Lente:</span>
              <select
                value={selectedCameraId}
                onChange={(e) => handleSelectCameraDevice(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-semibold"
              >
                <option value="">
                  Automático ({facingMode === 'environment' ? 'Trasera Principal' : 'Frontal'})
                </option>
                {cameras.map((cam, idx) => (
                  <option key={cam.id} value={cam.id}>
                    {cam.label || `Cámara ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Resultado inmediato del último escaneo */}
        {lastFeedback && (
          <div
            className={`p-3 rounded-2xl border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition ${
              lastFeedback.matchedProduct
                ? 'bg-emerald-950/60 border-emerald-500/60'
                : mode === 'addProduct'
                ? 'bg-indigo-950/60 border-indigo-500/60'
                : 'bg-amber-950/60 border-amber-500/60'
            }`}
          >
            <div className="flex items-start gap-2.5 min-w-0">
              {lastFeedback.matchedProduct ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Barcode className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-black text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700 text-xs">
                    {lastFeedback.code}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(lastFeedback.code)}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition ${
                      copiedCode === lastFeedback.code
                        ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-800 hover:bg-slate-700 border-slate-600 text-slate-200'
                    }`}
                    title="Copiar este código al portapapeles"
                  >
                    <i
                      className={`fa-solid ${
                        copiedCode === lastFeedback.code ? 'fa-check' : 'fa-copy'
                      }`}
                    ></i>
                    <span>{copiedCode === lastFeedback.code ? '¡Copiado!' : 'Copiar'}</span>
                  </button>
                  <span className="text-[10px] text-slate-400">{lastFeedback.timestamp}</span>
                  {scanHistoryCount > 0 && mode === 'pos' && (
                    <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-extrabold">
                      +{scanHistoryCount} escaneados
                    </span>
                  )}
                </div>

                {lastFeedback.matchedProduct ? (
                  <p className="text-xs text-emerald-300 font-extrabold mt-1">
                    {mode === 'pos' ? '✅ Agregado al carrito: ' : '📦 Producto existente: '}
                    {lastFeedback.matchedProduct.name} ($
                    {lastFeedback.matchedProduct.price.toFixed(2)} /{' '}
                    {(lastFeedback.matchedProduct.price * primaryRate).toFixed(2)} {primaryCurrency})
                  </p>
                ) : mode === 'addProduct' ? (
                  <p className="text-xs text-indigo-300 font-bold mt-1">
                    ✅ Código capturado y asignado al producto
                  </p>
                ) : (
                  <p className="text-xs text-amber-300 font-bold mt-1">
                    ⚠️ Código capturado, pero aún no está registrado en tu inventario
                  </p>
                )}
              </div>
            </div>

            {mode === 'pos' && !lastFeedback.matchedProduct && (
              <button
                type="button"
                onClick={() => onCreateNewProductWithCode(lastFeedback.code)}
                className="min-h-[42px] px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-lg"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Crear Producto con este Código</span>
              </button>
            )}
          </div>
        )}

        {/* Opciones adicionales prácticas: Escanear imagen o escribir código manualmente */}
        <div className="bg-slate-800/75 border border-slate-700/80 rounded-2xl p-3 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <Barcode className="w-3.5 h-3.5 text-rose-400" />
              Ingreso Manual o Desde Foto
            </span>

            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScanFromImageFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="min-h-[36px] px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Subir Foto</span>
              </button>

              {mode === 'addProduct' && (
                <button
                  type="button"
                  onClick={handleGenerateRandomEAN13}
                  className="min-h-[36px] px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generar Código</span>
                </button>
              )}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCodeInput.trim()) {
                handleDecodedCode(manualCodeInput.trim(), true);
              }
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={manualCodeInput}
              onChange={(e) => setManualCodeInput(e.target.value.toUpperCase())}
              placeholder="Escribe o pega el código de barras aquí..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
            <button
              type="submit"
              className="min-h-[38px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold cursor-pointer shrink-0"
            >
              Capturar
            </button>
          </form>

          {products.length > 0 && (
            <div className="pt-1.5 border-t border-slate-700/60">
              <span className="text-[10px] text-slate-400 block mb-1.5">
                ⚡ Toque rápido de productos con código en tu inventario:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {products.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleDecodedCode(p.barcode, true)}
                    className="min-h-[34px] px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
                  >
                    <span className="font-mono text-[10px] text-emerald-400 font-bold">
                      {p.barcode}
                    </span>
                    <span className="text-[10px] text-slate-300 font-semibold">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-0.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] w-full px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-emerald-600/25"
          >
            Listo / Volver a Ventas
          </button>
        </div>
      </div>
    </div>
  );
};
