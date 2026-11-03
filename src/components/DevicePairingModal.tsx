import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

export interface PairedDevicePeer {
  deviceId: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  role: 'host' | 'secondary';
  storeId: string;
  storeName: string;
  connectedAt: string;
  lastSeenAt: string;
}

export interface PairingSessionInfo {
  pairToken: string;
  pairingPin: string;
  roomKey: string;
  accountEmail: string;
  storeId: string;
  storeName: string;
  hostDeviceId: string;
  hostDeviceName: string;
  createdAt: string;
  expiresAt: string;
}

interface DevicePairingModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountEmail: string;
  storeId: string;
  storeName: string;
  currentDeviceId: string;
  currentDeviceName: string;
  currentDeviceType: 'mobile' | 'tablet' | 'desktop';
  currentDeviceRole: 'host' | 'secondary';
  wsConnected: boolean;
  lastSyncEventText: string;
  pairingSession: PairingSessionInfo | null;
  connectedDevices: PairedDevicePeer[];
  isGeneratingSession: boolean;
  onGenerateOrRefreshQR: (forceNew?: boolean) => void;
  onClaimPairingCode: (
    tokenOrPin: string,
    customDeviceName: string
  ) => Promise<{ ok: boolean; message: string }>;
  onUpdateDeviceName: (newName: string) => void;
  onKickDevice: (targetDeviceId: string) => void;
  onForceBroadcastSync: () => void;
}

export const DevicePairingModal: React.FC<DevicePairingModalProps> = ({
  isOpen,
  onClose,
  accountEmail,
  storeId,
  storeName,
  currentDeviceId,
  currentDeviceName,
  currentDeviceType,
  currentDeviceRole,
  wsConnected,
  lastSyncEventText,
  pairingSession,
  connectedDevices,
  isGeneratingSession,
  onGenerateOrRefreshQR,
  onClaimPairingCode,
  onUpdateDeviceName,
  onKickDevice,
  onForceBroadcastSync,
}) => {
  const [activeTab, setActiveTab] = useState<'qr_host' | 'join_device'>('qr_host');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [deviceNameInput, setDeviceNameInput] = useState<string>(currentDeviceName);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimFeedback, setClaimFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Embedded Camera QR Scanner for pairing a mobile/tablet directly
  const [isCameraScanning, setIsCameraScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    setDeviceNameInput(currentDeviceName);
  }, [currentDeviceName]);

  // Generate QR when modal opens or pairingSession changes
  useEffect(() => {
    if (!isOpen) return;
    if (!pairingSession && accountEmail) {
      onGenerateOrRefreshQR(false);
    }
  }, [isOpen, pairingSession, accountEmail]);

  const pairingUrl = React.useMemo(() => {
    if (!pairingSession?.pairToken) return '';
    const base = `${window.location.origin}${window.location.pathname}`;
    return `${base}?pair=${encodeURIComponent(pairingSession.pairToken)}&store=${encodeURIComponent(
      pairingSession.storeId || storeId
    )}`;
  }, [pairingSession, storeId]);

  const wsEndpointDisplay = React.useMemo(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}/ws/device-pairing`;
  }, []);

  useEffect(() => {
    let active = true;
    if (!pairingUrl) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(pairingUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl('');
      });
    return () => {
      active = false;
    };
  }, [pairingUrl]);

  // Cleanup camera scanner when closing modal or switching tabs
  useEffect(() => {
    if (!isOpen || activeTab !== 'join_device') {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
            setIsCameraScanning(false);
          });
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore
    }
    document.body.removeChild(textarea);
  };

  const extractTokenFromScannedText = (rawText: string): string => {
    const trimmed = rawText.trim();
    try {
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        const parsed = new URL(trimmed);
        const pairParam = parsed.searchParams.get('pair');
        if (pairParam) return pairParam.trim().toUpperCase();
      }
    } catch {
      // fallback to regex
    }
    const match16 = trimmed.match(/[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}/i);
    if (match16) return match16[0].toUpperCase();
    const match = trimmed.match(/PAIR-[A-Z0-9]{4}-[A-Z0-9]{4}/i);
    if (match) return match[0].toUpperCase();
    return trimmed.toUpperCase();
  };

  const startQrCameraScanner = async () => {
    setCameraError('');
    setClaimFeedback(null);
    setIsCameraScanning(true);

    setTimeout(async () => {
      try {
        const html5Qr = new Html5Qrcode('pairing-qr-reader-box');
        scannerRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 210, height: 210 } },
          async (decodedText) => {
            const extractedToken = extractTokenFromScannedText(decodedText);
            if (scannerRef.current) {
              await scannerRef.current.stop().catch(() => {});
              scannerRef.current = null;
            }
            setIsCameraScanning(false);
            setJoinCodeInput(extractedToken);
            setIsClaiming(true);
            const result = await onClaimPairingCode(
              extractedToken,
              deviceNameInput.trim() || currentDeviceName
            );
            setIsClaiming(false);
            setClaimFeedback({
              type: result.ok ? 'success' : 'error',
              text: result.message,
            });
          },
          () => {
            // ignore frame scan misses
          }
        );
      } catch {
        setIsCameraScanning(false);
        setCameraError(
          'No se pudo acceder a la cámara en este navegador. Puedes escribir el código PAIR o el PIN de 6 dígitos abajo.'
        );
      }
    }, 120);
  };

  const stopQrCameraScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setIsCameraScanning(false);
  };

  const handleManualClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanToken = extractTokenFromScannedText(joinCodeInput);
    if (!cleanToken) {
      setClaimFeedback({
        type: 'error',
        text: 'Ingresa el código QR (ej. PAIR-XXXX-XXXX) o el PIN de 6 dígitos.',
      });
      return;
    }
    setIsClaiming(true);
    setClaimFeedback(null);
    const cleanName = deviceNameInput.trim() || currentDeviceName;
    onUpdateDeviceName(cleanName);
    const result = await onClaimPairingCode(cleanToken, cleanName);
    setIsClaiming(false);
    setClaimFeedback({
      type: result.ok ? 'success' : 'error',
      text: result.message,
    });
  };

  const getDeviceIcon = (type: 'mobile' | 'tablet' | 'desktop') => {
    if (type === 'mobile') return 'fa-solid fa-mobile-screen-button';
    if (type === 'tablet') return 'fa-solid fa-tablet-screen-button';
    return 'fa-solid fa-laptop';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-800 border-2 border-cyan-500/40 rounded-3xl p-4 sm:p-6 max-w-xl w-full max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl text-xs">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 pb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-cyan-600/30 shrink-0">
              <i className="fa-solid fa-qrcode text-lg"></i>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white">
                  Vincular Móviles y Tablets por QR
                </h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                    wsConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  ></span>
                  {wsConnected ? 'WebSocket Activo' : 'Reconectando WS...'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Tienda: <strong className="text-cyan-300">{storeName}</strong> • Sincronización en
                tiempo real
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ minWidth: 0, minHeight: 36 }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition"
          >
            <i className="fa-solid fa-arrow-left text-cyan-400"></i>
            <span>Volver</span>
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('qr_host')}
            className={`py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer flex items-center justify-center gap-2 transition ${
              activeTab === 'qr_host'
                ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-qrcode"></i>
            <span>Mostrar QR de Tienda</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join_device')}
            className={`py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer flex items-center justify-center gap-2 transition ${
              activeTab === 'join_device'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <i className="fa-solid fa-mobile-screen-button"></i>
            <span>Escanear / Ingresar Código</span>
          </button>
        </div>

        {/* TAB 1: GENERATE & DISPLAY STORE QR CODE */}
        {activeTab === 'qr_host' && (
          <div className="space-y-4">
            <div className="bg-slate-900/95 border border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
              {/* Scannable QR Box */}
              <div className="bg-white p-3 rounded-2xl shadow-xl border-4 border-cyan-500/30 shrink-0 flex flex-col items-center justify-center">
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt={`QR de vinculación para ${storeName}`}
                    className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                  />
                ) : (
                  <div className="w-44 h-44 sm:w-48 sm:h-48 flex flex-col items-center justify-center text-slate-600 gap-2">
                    <i className="fa-solid fa-spinner animate-spin text-2xl text-cyan-600"></i>
                    <span className="text-[11px] font-bold">Generando QR seguro...</span>
                  </div>
                )}
                <span className="mt-1.5 text-[9px] font-black uppercase tracking-wider text-slate-800">
                  Escanea con otro móvil o tablet
                </span>
              </div>

              {/* Pairing Details & Security Codes */}
              <div className="flex-1 space-y-3 w-full">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 block">
                    Cuenta y Sucursal Específica
                  </span>
                  <div className="text-sm font-black text-white truncate">{storeName}</div>
                  <div className="text-[11px] text-slate-400 truncate">{accountEmail}</div>
                </div>

                {/* Unique Token & 6-Digit PIN */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-2.5">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      Código Único QR (16 car.)
                    </span>
                    <div className="flex items-center justify-between gap-1.5 mt-1">
                      <span className="font-mono text-[11px] font-black text-cyan-300 truncate">
                        {pairingSession?.pairToken || '---'}
                      </span>
                      {pairingSession?.pairToken && (
                        <button
                          type="button"
                          onClick={() => handleCopy(pairingSession.pairToken, 'token')}
                          className={`px-2 py-1 rounded-lg border text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shrink-0 transition ${
                            copiedField === 'token'
                              ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                              : 'bg-slate-900 hover:bg-slate-700 border-slate-600 text-slate-200'
                          }`}
                          title="Copiar código"
                        >
                          <i
                            className={`fa-solid ${
                              copiedField === 'token' ? 'fa-check' : 'fa-copy'
                            }`}
                          ></i>
                          <span>{copiedField === 'token' ? '¡Copiado!' : 'Copiar'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-2.5">
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">
                      PIN Rápido (6 dígitos)
                    </span>
                    <div className="flex items-center justify-between gap-1.5 mt-1">
                      <span className="font-mono text-sm font-black text-amber-300 tracking-widest">
                        {pairingSession?.pairingPin || '------'}
                      </span>
                      {pairingSession?.pairingPin && (
                        <button
                          type="button"
                          onClick={() => handleCopy(pairingSession.pairingPin, 'pin')}
                          className={`px-2 py-1 rounded-lg border text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shrink-0 transition ${
                            copiedField === 'pin'
                              ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300'
                              : 'bg-slate-900 hover:bg-slate-700 border-slate-600 text-slate-200'
                          }`}
                          title="Copiar PIN"
                        >
                          <i
                            className={`fa-solid ${
                              copiedField === 'pin' ? 'fa-check' : 'fa-copy'
                            }`}
                          ></i>
                          <span>{copiedField === 'pin' ? '¡Copiado!' : 'Copiar'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* WebSocket Channel Info */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-bold">Canal WebSocket:</span>
                    <span className="font-mono text-emerald-400 truncate max-w-[180px]">
                      {wsEndpointDisplay}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400 font-bold">Última actividad:</span>
                    <span className="text-slate-200 font-semibold truncate max-w-[180px]">
                      {lastSyncEventText || 'Canal listo en tiempo real'}
                    </span>
                  </div>
                </div>

                {/* Actions: Copy Direct Pairing Link & Regenerate QR */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <button
                    type="button"
                    disabled={!pairingUrl}
                    onClick={() => handleCopy(pairingUrl, 'url')}
                    className="flex-1 min-h-[38px] px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-black text-[11px] cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-cyan-600/20 transition"
                  >
                    <i
                      className={`fa-solid ${
                        copiedField === 'url' ? 'fa-check' : 'fa-link'
                      }`}
                    ></i>
                    <span>
                      {copiedField === 'url' ? '¡Enlace Copiado!' : 'Copiar Enlace de Vinculación'}
                    </span>
                  </button>

                  <button
                    type="button"
                    disabled={isGeneratingSession}
                    onClick={() => onGenerateOrRefreshQR(true)}
                    title="Generar un nuevo código QR e invalidar el anterior"
                    className="min-h-[38px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-extrabold text-[11px] cursor-pointer flex items-center justify-center gap-1.5 transition"
                  >
                    <i
                      className={`fa-solid fa-arrows-rotate ${
                        isGeneratingSession ? 'animate-spin text-cyan-400' : ''
                      }`}
                    ></i>
                    <span>Nuevo QR</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCAN QR OR ENTER CODE TO PAIR THIS DEVICE */}
        {activeTab === 'join_device' && (
          <div className="bg-slate-900/95 border border-slate-700 rounded-2xl p-4 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wider">
                  Conectar este Móvil o Tablet a una Tienda
                </h4>
                <p className="text-[11px] text-slate-400">
                  Escanea el QR del dispositivo principal o introduce el código PAIR / PIN de 6
                  dígitos.
                </p>
              </div>
              {!isCameraScanning ? (
                <button
                  type="button"
                  onClick={startQrCameraScanner}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-emerald-600/25"
                >
                  <i className="fa-solid fa-camera"></i>
                  <span>Escanear QR con Cámara</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopQrCameraScanner}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                >
                  <i className="fa-solid fa-stop"></i>
                  <span>Detener Cámara</span>
                </button>
              )}
            </div>

            {isCameraScanning && (
              <div className="bg-slate-950 border-2 border-emerald-500/40 rounded-2xl p-3 text-center space-y-2">
                <div
                  id="pairing-qr-reader-box"
                  className="w-full max-w-[260px] mx-auto overflow-hidden rounded-xl"
                ></div>
                <p className="text-[11px] text-emerald-300 font-bold">
                  Apunta la cámara al código QR de la tienda para vincular automáticamente...
                </p>
              </div>
            )}

            {cameraError && (
              <div className="bg-amber-500/15 border border-amber-500/40 text-amber-200 px-3 py-2 rounded-xl text-[11px] font-bold">
                {cameraError}
              </div>
            )}

            <form onSubmit={handleManualClaimSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Nombre de este Dispositivo
                  </label>
                  <input
                    type="text"
                    value={deviceNameInput}
                    onChange={(e) => setDeviceNameInput(e.target.value)}
                    placeholder="Ej. Tablet Caja 2 / Móvil Pasillo"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-white font-bold text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Código QR (PAIR-...) o PIN de 6 dígitos *
                  </label>
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="PAIR-XXXX-XXXX o 123456"
                    className="w-full bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-amber-300 font-mono font-black text-xs outline-none uppercase"
                  />
                </div>
              </div>

              {claimFeedback && (
                <div
                  className={`px-3 py-2.5 rounded-xl text-[11px] font-bold border ${
                    claimFeedback.type === 'success'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {claimFeedback.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isClaiming}
                className="w-full min-h-[42px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-black py-2.5 px-4 rounded-xl shadow-lg shadow-emerald-600/25 cursor-pointer flex items-center justify-center gap-2 text-xs transition"
              >
                <i className="fa-solid fa-bolt"></i>
                <span>
                  {isClaiming
                    ? 'Vinculando por WebSocket...'
                    : 'Vincular y Sincronizar con la Tienda Ahora'}
                </span>
              </button>
            </form>
          </div>
        )}

        {/* CONNECTED DEVICES IN REAL TIME */}
        <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-white">
                Dispositivos Conectados a {storeName} ({connectedDevices.length})
              </span>
            </div>
            <button
              type="button"
              onClick={onForceBroadcastSync}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-cyan-300 font-extrabold text-[10px] cursor-pointer flex items-center gap-1 transition"
              title="Enviar estado actual inmediatamente a todos los dispositivos vinculados"
            >
              <i className="fa-solid fa-rotate text-[9px]"></i>
              <span>Sincronizar Ahora</span>
            </button>
          </div>

          {connectedDevices.length === 0 ? (
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3 text-center text-[11px] text-slate-400">
              Conectando este dispositivo al canal WebSocket de la tienda...
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {connectedDevices.map((dev) => {
                const isSelf = dev.deviceId === currentDeviceId;
                return (
                  <div
                    key={dev.deviceId}
                    className={`flex items-center justify-between gap-2.5 p-2.5 rounded-xl border ${
                      isSelf
                        ? 'bg-slate-800/95 border-cyan-500/40'
                        : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          dev.role === 'host'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}
                      >
                        <i className={`${getDeviceIcon(dev.deviceType)} text-sm`}></i>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-white text-xs truncate">
                            {dev.deviceName}
                          </span>
                          {isSelf && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-black uppercase">
                              Este dispositivo
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              dev.role === 'host'
                                ? 'bg-indigo-500/20 text-indigo-300'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {dev.role === 'host' ? 'Principal' : 'Vinculado'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="text-emerald-400 font-bold">● En línea</span>
                          <span>•</span>
                          <span>Sucursal: {dev.storeName}</span>
                        </div>
                      </div>
                    </div>

                    {!isSelf && currentDeviceRole === 'host' && (
                      <button
                        type="button"
                        onClick={() => onKickDevice(dev.deviceId)}
                        title="Desvincular este dispositivo"
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-[10px] font-extrabold cursor-pointer shrink-0 transition"
                      >
                        Desvincular
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
