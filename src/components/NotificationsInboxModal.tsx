import React, { useState, useMemo } from 'react';
import { RatesConfig, formatCurrencyAmount } from './ProductMultiRatePrice';
import { OfflineSyncItem } from '../utils/offlineSyncDB';

export interface InboxProductItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  barcode?: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  image: string;
}

export interface InboxDeletedProductItem extends InboxProductItem {
  deletedAt?: number | string;
}

export interface InboxSaleItem {
  id: string;
  total: number;
  date: string;
  status?: string;
  clientName?: string;
  clientPhone?: string;
  clientDni?: string;
  cartName?: string;
  paymentMethod?: string;
  paymentReference?: string;
  subtotalUSD?: number;
  taxLabel?: string;
  taxRatePct?: number;
  taxAmountUSD?: number;
  changeUSD?: number;
  note?: string;
  fromVirtualCatalog?: boolean;
  attendedBy?: string;
  attendedRole?: string;
  storeName?: string;
  splitPayments?: Array<{
    method: string;
    amountUSD: number;
    amountInput: number;
    currency: string;
    reference?: string;
  }>;
  abono?: number;
  abonosHistory?: Array<{ amountUSD: number; date?: string; method?: string; note?: string }>;
  items?: Array<{
    id?: string;
    name: string;
    qty: number;
    price: number;
    brand?: string;
    weightLabel?: string;
  }>;
  voidReason?: string;
  voidedAt?: string;
}

interface NotificationsInboxModalProps {
  isOpen: boolean;
  inlineMode?: boolean;
  onClose: () => void;
  initialTab?: 'stock' | 'registro' | 'reports' | 'debtors';
  products: InboxProductItem[];
  deletedProducts?: InboxDeletedProductItem[];
  salesHistory: InboxSaleItem[];
  activityLogItems?: OfflineSyncItem[];
  onClearActivityLog?: () => void;
  rates: RatesConfig;
  readAlertIds: string[];
  onMarkAsRead: (alertId: string) => void;
  onMarkAllAsRead: (alertIds: string[]) => void;
  onQuickRestock: (productId: string, addAmount: number) => void;
  onGoToInventoryProduct: (productName: string) => void;
  onGoToDebtor: (clientName: string) => void;
  weeklyBackupAlertId: string;
  isWeeklyBackupDue: boolean;
  lastBackupAt: string | null;
  onTriggerExportJSON: () => void;
  onGoToBackupTab: () => void;
}

interface PlatformEmailMessage {
  id: string;
  kind: 'STOCK_LOW' | 'ADDED' | 'DELETED' | 'EDITED' | 'SALE';
  subject: string;
  sender: string;
  timestampLabel: string;
  sortTimeMs: number;
  summaryPreview: string;
  fullDetailsLines: Array<{ label: string; value: string; highlight?: boolean }>;
  fullDescription: string;
  productRef?: InboxProductItem;
  saleRef?: InboxSaleItem;
  amountUSD?: number;
}

export const NotificationsInboxModal: React.FC<NotificationsInboxModalProps> = ({
  isOpen,
  inlineMode = false,
  onClose,
  products,
  deletedProducts = [],
  salesHistory,
  activityLogItems = [],
  onClearActivityLog,
  rates,
  readAlertIds,
  onMarkAsRead,
  onMarkAllAsRead,
  onQuickRestock,
  onGoToInventoryProduct,
  onGoToDebtor,
}) => {
  const [mailFilter, setMailFilter] = useState<
    'ALL' | 'STOCK_LOW' | 'ADDED' | 'DELETED' | 'EDITED' | 'SALE'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedMailId, setExpandedMailId] = useState<string | null>(null);

  // Construir la lista unificada de Correos ✉️ (Stock por acabarse de UN SOLO COLOR + Todo lo agregado, borrado o hecho en la plataforma)
  const allEmails = useMemo<PlatformEmailMessage[]>(() => {
    const emails: PlatformEmailMessage[] = [];
    const primaryCurr = rates.primaryCurrency || 'VES';
    const primaryRate = rates.primaryRate || 1;
    const refCurr = rates.refCurrency || 'USD';

    // 1. CORREOS DE STOCK POR ACABARSE / AGOTADOS (Todos con el mismo tipo 'STOCK_LOW' para que sean de UN SOLO COLOR)
    const criticalStockProducts = products.filter((p) => p.stock <= p.minStock);
    criticalStockProducts.forEach((p, idx) => {
      const isWeighted =
        p.unit === 'peso' || p.unit === 'kg' || p.name.toLowerCase().includes('queso');
      const unitLabel = isWeighted ? 'Kg' : p.unit === 'unidad' ? 'und' : p.unit || 'und';
      const isZero = p.stock <= 0;
      const alertId = `stock-${p.id}-${isZero ? 'out' : 'low'}-${p.stock}`;
      const localPrice = formatCurrencyAmount(p.price * primaryRate, primaryCurr);

      emails.push({
        id: alertId,
        kind: 'STOCK_LOW',
        subject: `Stock por acabarse: ${p.name} (${p.brand || 'Genérico'})`,
        sender: 'Control de Inventario · Alerta de Existencia',
        timestampLabel: isZero ? 'Urgente · Sin stock (0)' : 'Atención · Stock por acabarse',
        sortTimeMs: Date.now() + 100000 - idx * 100, // Prioridad arriba para que se vean de primero
        summaryPreview: `Quedan ${Number(p.stock.toFixed(2))} ${unitLabel} disponibles (Mínimo configurado: ${p.minStock} ${unitLabel}) · Precio: $${p.price.toFixed(2)} ${refCurr} (${localPrice} ${primaryCurr})`,
        fullDescription: isZero
          ? `El producto "${p.name}" de la marca "${p.brand || 'Genérico'}" se ha quedado en 0 ${unitLabel}. Se recomienda reponer unidades en inventario para continuar vendiéndolo.`
          : `El producto "${p.name}" de la marca "${p.brand || 'Genérico'}" está por acabarse con solo ${Number(p.stock.toFixed(2))} ${unitLabel} en almacén (el límite de alerta es ${p.minStock} ${unitLabel}).`,
        fullDetailsLines: [
          { label: 'Producto Completo', value: p.name, highlight: true },
          { label: 'Marca', value: p.brand || 'Genérico' },
          { label: 'Categoría / Pasillo', value: p.category || 'General' },
          {
            label: 'Stock Actual en Tienda',
            value: `${Number(p.stock.toFixed(2))} ${unitLabel}`,
            highlight: true,
          },
          { label: 'Stock Mínimo de Alerta', value: `${p.minStock} ${unitLabel}` },
          {
            label: 'Precio de Venta',
            value: `$${p.price.toFixed(2)} ${refCurr} / ${localPrice} ${primaryCurr}`,
          },
          { label: 'Costo Unitario', value: `$${(p.cost || 0).toFixed(2)} ${refCurr}` },
          ...(p.barcode ? [{ label: 'Código de Barras', value: p.barcode }] : []),
        ],
        productRef: p,
        amountUSD: p.price,
      });
    });

    // 2. CORREOS DE PRODUCTOS BORRADOS / EN PAPELERA
    deletedProducts.forEach((dp, idx) => {
      const delTimeMs =
        typeof dp.deletedAt === 'number'
          ? dp.deletedAt
          : dp.deletedAt
          ? new Date(dp.deletedAt).getTime()
          : Date.now() - (idx + 1) * 60000;
      const dateStr = new Date(delTimeMs).toLocaleString('es-VE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const localPrice = formatCurrencyAmount((dp.price || 0) * primaryRate, primaryCurr);

      emails.push({
        id: `deleted-prod-${dp.id}-${delTimeMs}`,
        kind: 'DELETED',
        subject: `Producto borrado de inventario: ${dp.name} (${dp.brand || 'Genérico'})`,
        sender: 'Registro de Plataforma · Eliminación',
        timestampLabel: dateStr,
        sortTimeMs: delTimeMs,
        summaryPreview: `Se borró "${dp.name}" (Marca: ${dp.brand || 'Genérico'}) · Categoría: ${dp.category} · Tenía stock de ${dp.stock} ${dp.unit}`,
        fullDescription: `Este producto fue eliminado del catálogo activo y enviado al registro de productos borrados.`,
        fullDetailsLines: [
          { label: 'Acción Realizada', value: '🗑️ Producto Borrado / Eliminado', highlight: true },
          { label: 'Nombre del Producto', value: dp.name, highlight: true },
          { label: 'Marca', value: dp.brand || 'Genérico' },
          { label: 'Categoría', value: dp.category || 'General' },
          { label: 'Stock al Momento de Borrar', value: `${dp.stock} ${dp.unit || 'und'}` },
          {
            label: 'Precio Registrado',
            value: `$${(dp.price || 0).toFixed(2)} ${refCurr} (${localPrice} ${primaryCurr})`,
          },
          { label: 'Fecha y Hora de Eliminación', value: dateStr },
        ],
        amountUSD: dp.price,
      });
    });

    // 3. CORREOS DE LA BITÁCORA DE ACTIVIDAD (Agregados, Borrados, Editados, Precios, Stock, etc.)
    activityLogItems.forEach((item) => {
      const t = (item.type || '').toUpperCase();
      const lbl = item.label || 'Actividad en la plataforma';
      const det = item.details || '';
      const lowerLbl = lbl.toLowerCase();
      const lowerDet = det.toLowerCase();

      let kind: PlatformEmailMessage['kind'] = 'EDITED';
      let sender = 'Auditoría de Plataforma · Modificación';

      if (
        t === 'PRODUCT_OUT_OF_STOCK' ||
        lowerLbl.includes('agotó') ||
        lowerLbl.includes('agotado') ||
        lowerLbl.includes('stock bajo')
      ) {
        kind = 'STOCK_LOW';
        sender = 'Control de Inventario · Alerta de Existencia';
      } else if (
        t === 'PRODUCT_ADDED' ||
        lowerLbl.includes('se agregó') ||
        lowerLbl.includes('nuevo producto') ||
        lowerLbl.includes('creado') ||
        lowerLbl.includes('restaurado')
      ) {
        kind = 'ADDED';
        sender = 'Registro de Plataforma · Nuevo Ingreso';
      } else if (
        t === 'PRODUCT_DELETE' ||
        lowerLbl.includes('elimin') ||
        lowerLbl.includes('borr') ||
        lowerLbl.includes('papelera') ||
        lowerLbl.includes('anulada')
      ) {
        kind = 'DELETED';
        sender = 'Registro de Plataforma · Eliminación / Anulación';
      } else if (
        t.includes('SALE') ||
        t.includes('DEBT') ||
        t.includes('CART') ||
        lowerLbl.includes('venta') ||
        lowerLbl.includes('cobro') ||
        lowerLbl.includes('fiado') ||
        lowerLbl.includes('abono')
      ) {
        kind = 'SALE';
        sender = 'Caja y Facturación POS';
      } else {
        kind = 'EDITED';
        sender = 'Auditoría de Plataforma · Actualización';
      }

      const createdMs = item.createdAt ? new Date(item.createdAt).getTime() : Date.now();
      const dateStr = (() => {
        try {
          return new Date(item.createdAt).toLocaleString('es-VE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });
        } catch {
          return String(item.createdAt || 'Reciente');
        }
      })();

      const payloadDetails: Array<{ label: string; value: string; highlight?: boolean }> = [
        { label: 'Asunto / Evento', value: lbl, highlight: true },
        { label: 'Detalle Registrado', value: det || 'Operación completada en la plataforma' },
        { label: 'Fecha y Hora Exacta', value: dateStr },
        { label: 'Código de Operación', value: item.type || 'SISTEMA' },
      ];

      if (item.payload && typeof item.payload === 'object') {
        const pObj = item.payload as Record<string, unknown>;
        if (pObj.orderNumber) {
          payloadDetails.push({
            label: 'Nº de Orden Único',
            value: `#${String(pObj.orderNumber)}`,
            highlight: true,
          });
        }
        if (pObj.fromVirtualCatalog !== undefined) {
          payloadDetails.push({
            label: 'Origen de la Transacción',
            value: pObj.fromVirtualCatalog
              ? '🌐 Catálogo Virtual (Pedido Web)'
              : '🏪 Mostrador / Caja POS',
            highlight: Boolean(pObj.fromVirtualCatalog),
          });
        }
        if (pObj.attendedBy) {
          payloadDetails.push({
            label: 'Atendido por (Titular / Cajero)',
            value: String(pObj.attendedBy),
            highlight: true,
          });
        }
        if (pObj.storeName) {
          payloadDetails.push({
            label: 'Tienda o Sucursal',
            value: String(pObj.storeName),
          });
        }
        if (pObj.clientName || pObj.customerName) {
          payloadDetails.push({
            label: 'Cliente',
            value: String(pObj.clientName || pObj.customerName),
          });
        }
        if (pObj.paymentMethod || pObj.paymentMethodTitle || pObj.method) {
          payloadDetails.push({
            label: 'Método de Pago',
            value: String(pObj.paymentMethodTitle || pObj.paymentMethod || pObj.method),
          });
        }
        if (pObj.paymentReference) {
          payloadDetails.push({
            label: 'Referencia de Pago',
            value: String(pObj.paymentReference),
          });
        }
        if (pObj.name) {
          payloadDetails.push({
            label: 'Nombre de Producto / Registro',
            value: String(pObj.name),
            highlight: true,
          });
        }
        if (pObj.brand) {
          payloadDetails.push({ label: 'Marca', value: String(pObj.brand) });
        }
        if (pObj.category) {
          payloadDetails.push({ label: 'Categoría', value: String(pObj.category) });
        }
        if (pObj.oldPrice !== undefined && pObj.newPrice !== undefined) {
          payloadDetails.push({
            label: 'Cambio de Precio',
            value: `De $${Number(pObj.oldPrice).toFixed(2)} a $${Number(pObj.newPrice).toFixed(2)} ${refCurr}`,
            highlight: true,
          });
        }
        if (pObj.oldStock !== undefined && pObj.newStock !== undefined) {
          payloadDetails.push({
            label: 'Ajuste de Stock',
            value: `De ${pObj.oldStock} a ${pObj.newStock} unidades`,
            highlight: true,
          });
        }
      }

      if (typeof item.amountUSD === 'number' && item.amountUSD > 0) {
        payloadDetails.push({
          label: 'Monto involucrado',
          value: `$${item.amountUSD.toFixed(2)} ${refCurr} (${formatCurrencyAmount(
            item.amountUSD * primaryRate,
            primaryCurr
          )} ${primaryCurr})`,
          highlight: true,
        });
      }

      emails.push({
        id: `log-${item.id}`,
        kind,
        subject: lbl,
        sender,
        timestampLabel: dateStr,
        sortTimeMs: Number.isNaN(createdMs) ? Date.now() : createdMs,
        summaryPreview: det || 'Haz clic en este correo para ver todos los detalles de la operación.',
        fullDescription:
          det ||
          'Notificación automática generada por la plataforma al registrar este movimiento.',
        fullDetailsLines: payloadDetails,
        amountUSD: item.amountUSD,
      });
    });

    // 4. CORREOS DE VENTAS, COBROS, FIADOS Y ANULACIONES EN HISTORIAL DE VENTAS (CON DETALLE COMPLETO)
    salesHistory.slice(0, 50).forEach((sale, idx) => {
      const isVoided = sale.status === 'voided';
      const isFiado = sale.status === 'fiado' || sale.status === 'credit';
      const isFromCatalog = Boolean(
        sale.fromVirtualCatalog ||
          (sale.cartName && sale.cartName.toLowerCase().includes('catálogo')) ||
          (sale.note && sale.note.toLowerCase().includes('catálogo'))
      );
      const clientLabel = sale.clientName || sale.cartName || 'Cliente de Contado';
      const localTotal = formatCurrencyAmount((sale.total || 0) * primaryRate, primaryCurr);
      const attendedByLabel = sale.attendedBy || 'Propietario (Dueño)';
      const storeLabel = sale.storeName || 'Tienda Principal';

      const itemsDetailedLines =
        Array.isArray(sale.items) && sale.items.length > 0
          ? sale.items.map((it, itemIdx) => {
              const lineUSD = (it.price || 0) * (it.qty || 1);
              const linePri = formatCurrencyAmount(lineUSD * primaryRate, primaryCurr);
              return {
                label: `Producto #${itemIdx + 1}`,
                value: `${it.weightLabel || `${it.qty}x`} ${it.name}${
                  it.brand ? ` (${it.brand})` : ''
                } · Unit: $${(it.price || 0).toFixed(2)} · Subtotal: $${lineUSD.toFixed(
                  2
                )} ${refCurr} (${linePri} ${primaryCurr})`,
              };
            })
          : [];

      const itemsText =
        Array.isArray(sale.items) && sale.items.length > 0
          ? sale.items
              .map(
                (it) =>
                  `${it.weightLabel || `${it.qty}x`} ${it.name}${
                    it.brand ? ` (${it.brand})` : ''
                  } ($${((it.price || 0) * (it.qty || 1)).toFixed(2)})`
              )
              .join(', ')
          : 'Productos varios de mostrador';

      const splitSummary =
        Array.isArray(sale.splitPayments) && sale.splitPayments.length > 0
          ? sale.splitPayments
              .map(
                (sp) =>
                  `${sp.method}: $${sp.amountUSD.toFixed(2)}${
                    sp.reference ? ` (Ref: ${sp.reference})` : ''
                  }`
              )
              .join(' + ')
          : '';

      const restFiadoUSD = isFiado ? Math.max(0, (sale.total || 0) - (sale.abono || 0)) : 0;

      emails.push({
        id: `sale-mail-${sale.id}`,
        kind: isVoided ? 'DELETED' : 'SALE',
        subject: isVoided
          ? `🚫 Orden Anulada #${sale.id}: ${clientLabel} ($${(sale.total || 0).toFixed(2)})`
          : isFiado
          ? `📝 Fiado Orden #${sale.id}${isFromCatalog ? ' [🌐 Catálogo Virtual]' : ''}: ${clientLabel} ($${(sale.total || 0).toFixed(2)})`
          : `✅ Cobro Orden #${sale.id}${isFromCatalog ? ' [🌐 Catálogo Virtual]' : ''}: ${clientLabel} (${localTotal} ${primaryCurr} / $${(sale.total || 0).toFixed(2)})`,
        sender: `${
          isFromCatalog ? '🌐 Pedido de Catálogo Virtual' : '🏪 Caja POS Mostrador'
        } · Atendido por: ${attendedByLabel} · ${storeLabel}`,
        timestampLabel: sale.date || 'Reciente',
        sortTimeMs: Date.now() - (idx + 1) * 15000,
        summaryPreview: `Orden #${sale.id} · ${
          isFromCatalog ? '🌐 Catálogo Virtual' : '🏪 Caja POS'
        } · Atendido por: ${attendedByLabel} (${storeLabel}) · Cliente: ${clientLabel} · Total: ${localTotal} ${primaryCurr} ($${(
          sale.total || 0
        ).toFixed(2)} ${refCurr}) · Llevó: ${itemsText}`,
        fullDescription: isVoided
          ? `Esta orden (#${sale.id}) fue anulada${
              sale.voidReason ? ` por el motivo: "${sale.voidReason}"` : ''
            } y las unidades fueron devueltas al inventario. Atendido por: ${attendedByLabel} en ${storeLabel}.`
          : `Transacción completa de la Orden #${sale.id} (${
              isFromCatalog ? 'proveniente del Catálogo Virtual 🌐' : 'realizada en Caja POS 🏪'
            }) para el cliente ${clientLabel}, atendida por ${attendedByLabel} en ${storeLabel}.`,
        fullDetailsLines: [
          { label: 'Número de Orden Único', value: `#${sale.id}`, highlight: true },
          {
            label: 'Origen de la Transacción',
            value: isFromCatalog
              ? '🌐 Catálogo Virtual (Pedido Online)'
              : '🏪 Venta en Mostrador / Caja POS',
            highlight: isFromCatalog,
          },
          { label: 'Atendido por (Titular / Rol)', value: attendedByLabel, highlight: true },
          { label: 'Tienda o Sucursal', value: storeLabel, highlight: true },
          { label: 'Cliente', value: clientLabel, highlight: true },
          ...(sale.clientPhone ? [{ label: 'Teléfono del Cliente', value: sale.clientPhone }] : []),
          ...(sale.clientDni ? [{ label: 'Documento / Cédula', value: sale.clientDni }] : []),
          {
            label: 'Estado de la Operación',
            value: isVoided
              ? '🚫 Orden Anulada (Stock devuelto)'
              : isFiado
              ? '📝 Cuenta Fiada (Crédito)'
              : '✅ Cobrada y Completada',
          },
          {
            label: 'Método de Pago',
            value: splitSummary
              ? `Pago Mixto (${splitSummary})`
              : `${sale.paymentMethod || 'Efectivo'}${
                  sale.paymentReference ? ` · Ref: ${sale.paymentReference}` : ''
                }`,
          },
          ...(typeof sale.subtotalUSD === 'number'
            ? [
                {
                  label: 'Subtotal',
                  value: `$${sale.subtotalUSD.toFixed(2)} ${refCurr} (${formatCurrencyAmount(
                    sale.subtotalUSD * primaryRate,
                    primaryCurr
                  )} ${primaryCurr})`,
                },
              ]
            : []),
          ...(typeof sale.taxAmountUSD === 'number' && sale.taxAmountUSD > 0
            ? [
                {
                  label: `Impuesto (${sale.taxLabel || 'IVA'}${
                    sale.taxRatePct ? ` ${sale.taxRatePct}%` : ''
                  })`,
                  value: `+$${sale.taxAmountUSD.toFixed(2)} ${refCurr} (+${formatCurrencyAmount(
                    sale.taxAmountUSD * primaryRate,
                    primaryCurr
                  )} ${primaryCurr})`,
                },
              ]
            : []),
          {
            label: 'Monto Total Cobrado',
            value: `${localTotal} ${primaryCurr} ($${(sale.total || 0).toFixed(2)} ${refCurr})`,
            highlight: true,
          },
          ...(typeof sale.changeUSD === 'number' && sale.changeUSD > 0
            ? [
                {
                  label: 'Vuelto Entregado',
                  value: `$${sale.changeUSD.toFixed(2)} ${refCurr} (${formatCurrencyAmount(
                    sale.changeUSD * primaryRate,
                    primaryCurr
                  )} ${primaryCurr})`,
                },
              ]
            : []),
          ...(isFiado
            ? [
                {
                  label: 'Abono Inicial Recibido',
                  value: `$${(sale.abono || 0).toFixed(2)} ${refCurr} (${formatCurrencyAmount(
                    (sale.abono || 0) * primaryRate,
                    primaryCurr
                  )} ${primaryCurr})`,
                },
                {
                  label: 'Saldo Pendiente por Cobrar (Fiado)',
                  value: `$${restFiadoUSD.toFixed(2)} ${refCurr} (${formatCurrencyAmount(
                    restFiadoUSD * primaryRate,
                    primaryCurr
                  )} ${primaryCurr})`,
                  highlight: true,
                },
              ]
            : []),
          ...itemsDetailedLines,
          { label: 'Resumen de Productos', value: itemsText },
          { label: 'Fecha y Hora Exacta', value: sale.date || 'Reciente' },
          ...(sale.note ? [{ label: 'Nota / Observación', value: sale.note }] : []),
          ...(sale.voidReason ? [{ label: 'Motivo de Anulación', value: sale.voidReason }] : []),
        ],
        saleRef: sale,
        amountUSD: sale.total,
      });
    });

    return emails.sort((a, b) => b.sortTimeMs - a.sortTimeMs);
  }, [products, deletedProducts, activityLogItems, salesHistory, rates]);

  if (!isOpen && !inlineMode) return null;

  // Filtrar correos según pestaña y búsqueda
  const filteredEmails = allEmails.filter((mail) => {
    if (mailFilter !== 'ALL' && mail.kind !== mailFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      mail.subject.toLowerCase().includes(q) ||
      mail.summaryPreview.toLowerCase().includes(q) ||
      mail.sender.toLowerCase().includes(q) ||
      mail.fullDetailsLines.some(
        (d) => d.label.toLowerCase().includes(q) || d.value.toLowerCase().includes(q)
      )
    );
  });

  const stockLowCount = allEmails.filter((m) => m.kind === 'STOCK_LOW').length;
  const addedCount = allEmails.filter((m) => m.kind === 'ADDED').length;
  const deletedCount = allEmails.filter((m) => m.kind === 'DELETED').length;
  const editedCount = allEmails.filter((m) => m.kind === 'EDITED').length;
  const salesCount = allEmails.filter((m) => m.kind === 'SALE').length;

  const unreadIds = allEmails
    .map((m) => m.id)
    .filter((id) => !readAlertIds.includes(id));

  // Estilos por tipo de correo:
  // ¡IMPORTANTE! Todos los correos de "Stock por acabarse" ('STOCK_LOW') usan UN SOLO COLOR UNIFICADO (Ámbar/Naranja Intenso)
  const getMailVisualTheme = (kind: PlatformEmailMessage['kind']) => {
    if (kind === 'STOCK_LOW') {
      return {
        cardBg: 'bg-amber-950/40 hover:bg-amber-950/55 border-amber-500/70',
        expandedBorder: 'border-amber-400 ring-2 ring-amber-400/30',
        iconBox: 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/25',
        badge: '⚠️ STOCK POR ACABARSE',
        badgeClass: 'bg-amber-500 text-slate-950 border-amber-300',
        accentText: 'text-amber-300',
      };
    }
    if (kind === 'ADDED') {
      return {
        cardBg: 'bg-slate-900/95 hover:bg-slate-800/95 border-emerald-500/45',
        expandedBorder: 'border-emerald-400 ring-2 ring-emerald-400/25',
        iconBox: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        badge: '➕ AGREGADO A LA PLATAFORMA',
        badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        accentText: 'text-emerald-300',
      };
    }
    if (kind === 'DELETED') {
      return {
        cardBg: 'bg-slate-900/95 hover:bg-slate-800/95 border-rose-500/45',
        expandedBorder: 'border-rose-400 ring-2 ring-rose-400/25',
        iconBox: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        badge: '🗑️ BORRADO / ANULADO',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        accentText: 'text-rose-300',
      };
    }
    if (kind === 'SALE') {
      return {
        cardBg: 'bg-slate-900/95 hover:bg-slate-800/95 border-indigo-500/40',
        expandedBorder: 'border-indigo-400 ring-2 ring-indigo-400/25',
        iconBox: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        badge: '🛒 VENTA / COBRO EN CAJA',
        badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
        accentText: 'text-indigo-300',
      };
    }
    return {
      cardBg: 'bg-slate-900/95 hover:bg-slate-800/95 border-cyan-500/40',
      expandedBorder: 'border-cyan-400 ring-2 ring-cyan-400/25',
      iconBox: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      badge: '✏️ EDITADO / ACTUALIZADO',
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      accentText: 'text-cyan-300',
    };
  };

  const inboxBody = (
    <div className="bg-slate-800 border-2 border-slate-700 rounded-3xl w-full shadow-2xl overflow-hidden text-xs">
      {/* Cabecera de la Bandeja de Correos ✉️ */}
      <div className="bg-slate-900 border-b border-slate-700 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 text-amber-400 flex items-center justify-center text-lg shrink-0 shadow-md">
            <span>✉️</span>
            {unreadIds.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full border border-slate-900">
                {unreadIds.length}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>✉️ Bandeja de Correos y Notificaciones de la Plataforma</span>
            </h3>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Desliza hacia abajo para ver cada correo uno encima del otro · Toca cualquier correo
              para abrir y ver la información completa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadIds.length > 0 && (
            <button
              type="button"
              onClick={() => onMarkAllAsRead(allEmails.map((m) => m.id))}
              className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-extrabold text-[11px] cursor-pointer transition flex items-center gap-1.5"
            >
              <i className="fa-solid fa-envelope-open"></i>
              <span>Marcar todos como leídos</span>
            </button>
          )}
          {onClearActivityLog && activityLogItems.length > 0 && (
            <button
              type="button"
              onClick={onClearActivityLog}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-600/25 border border-slate-700 text-slate-300 hover:text-rose-200 font-bold text-[11px] cursor-pointer transition"
            >
              Limpiar bitácora
            </button>
          )}
          {!inlineMode && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 hover:text-white font-extrabold text-xs cursor-pointer flex items-center gap-1.5"
            >
              <i className="fa-solid fa-arrow-left text-amber-400"></i>
              <span>Cerrar</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros de Correos y Buscador */}
      <div className="bg-slate-900/75 border-b border-slate-700/80 px-4 sm:px-6 py-3 space-y-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'ALL', label: `✉️ Todos los Correos (${allEmails.length})` },
            {
              id: 'STOCK_LOW',
              label: `⚠️ Stock por Acabarse (${stockLowCount})`,
              unifiedAmber: true,
            },
            { id: 'ADDED', label: `➕ Agregados (${addedCount})` },
            { id: 'DELETED', label: `🗑️ Borrados (${deletedCount})` },
            { id: 'EDITED', label: `✏️ Cambios / Ediciones (${editedCount})` },
            { id: 'SALE', label: `🛒 Ventas y Cobros (${salesCount})` },
          ].map((tab) => {
            const isActive = mailFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMailFilter(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-[11px] font-black whitespace-nowrap cursor-pointer border transition flex items-center gap-1.5 ${
                  isActive
                    ? tab.unifiedAmber
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md shadow-amber-500/25'
                      : 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                    : tab.unifiedAmber
                    ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                    : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar correo por producto, marca, acción, borrado, agregado o cliente..."
            className="w-full bg-slate-800 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-400 outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista Vertical de Correos Apilados Uno Encima del Otro */}
      <div className="p-3 sm:p-5 space-y-3">
        {filteredEmails.length === 0 ? (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-xl">
              <span>✉️</span>
            </div>
            <h4 className="text-sm font-extrabold text-white">
              No hay correos en esta categoría en este momento
            </h4>
            <p className="text-xs text-slate-400">
              Cada vez que agregues, edites o borres un producto, cambie el stock o realices una
              venta, aparecerá aquí como un correo detallado.
            </p>
          </div>
        ) : (
          filteredEmails.map((mail, index) => {
            const theme = getMailVisualTheme(mail.kind);
            const isExpanded = expandedMailId === mail.id;
            const isUnread = !readAlertIds.includes(mail.id);

            return (
              <div
                key={mail.id}
                className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden shadow-md ${
                  theme.cardBg
                } ${isExpanded ? theme.expandedBorder : ''}`}
              >
                {/* Encabezado del Correo (Clicable para abrir/cerrar toda la información) */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    const nextExpanded = isExpanded ? null : mail.id;
                    setExpandedMailId(nextExpanded);
                    if (isUnread) {
                      onMarkAsRead(mail.id);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      const nextExpanded = isExpanded ? null : mail.id;
                      setExpandedMailId(nextExpanded);
                      if (isUnread) {
                        onMarkAsRead(mail.id);
                      }
                    }
                  }}
                  className="p-3.5 sm:p-4 cursor-pointer select-none flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* Icono de Sobre de Correo ✉️ */}
                      <div
                        className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${theme.iconBox}`}
                      >
                        <i
                          className={`fa-solid ${
                            isExpanded || !isUnread ? 'fa-envelope-open-text' : 'fa-envelope'
                          } text-sm sm:text-base`}
                        ></i>
                        <span className="text-[8px] font-black leading-none mt-0.5">
                          #{index + 1}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        {/* Fila 1: Etiqueta de categoría + Remitente + Hora */}
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isUnread && (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0"
                              title="Correo no leído"
                            />
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${theme.badgeClass}`}
                          >
                            {theme.badge}
                          </span>
                          <span className="text-[10.5px] font-bold text-slate-300">
                            De: {mail.sender}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 ml-auto">
                            🕒 {mail.timestampLabel}
                          </span>
                        </div>

                        {/* Fila 2: Asunto del Correo (Nombre y marca completos sin recortar) */}
                        <h4 className="font-black text-white text-xs sm:text-sm leading-snug break-words whitespace-normal">
                          ✉️ {mail.subject}
                        </h4>

                        {/* Fila 3: Resumen previo visible en la tarjeta */}
                        <p className="text-[11px] text-slate-200 leading-relaxed break-words whitespace-normal">
                          {mail.summaryPreview}
                        </p>
                      </div>
                    </div>

                    {/* Botón visual Ver Información Completa */}
                    <div className="shrink-0 flex flex-col items-end justify-between self-stretch">
                      <span
                        className={`px-2.5 py-1.5 rounded-xl border text-[10.5px] font-black flex items-center gap-1.5 transition ${
                          isExpanded
                            ? 'bg-white text-slate-950 border-white shadow'
                            : 'bg-slate-950/80 hover:bg-slate-950 text-slate-200 border-slate-700'
                        }`}
                      >
                        <i
                          className={`fa-solid ${
                            isExpanded ? 'fa-chevron-up' : 'fa-envelope-open'
                          }`}
                        ></i>
                        <span className="hidden sm:inline">
                          {isExpanded ? 'Ocultar Detalles' : 'Ver Información Completa'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cuerpo Desplegable del Correo con TODA LA INFORMACIÓN COMPLETA */}
                {isExpanded && (
                  <div className="border-t border-slate-700/80 bg-slate-950/90 p-4 sm:p-5 space-y-3.5 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📨</span>
                        <span className={`text-xs font-black uppercase ${theme.accentText}`}>
                          Información Completa del Correo #{index + 1}
                        </span>
                      </div>
                      <span className="text-[10.5px] font-mono text-slate-400">
                        ID: {mail.id}
                      </span>
                    </div>

                    {/* Explicación detallada */}
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                      {mail.fullDescription}
                    </p>

                    {/* Tabla / Ficha técnica con todos los detalles del correo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mail.fullDetailsLines.map((detail, dIdx) => (
                        <div
                          key={`${mail.id}-det-${dIdx}`}
                          className={`p-2.5 rounded-xl border flex flex-col justify-between gap-0.5 ${
                            detail.highlight
                              ? 'bg-slate-900 border-amber-500/40'
                              : 'bg-slate-900/60 border-slate-800'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {detail.label}
                          </span>
                          <span
                            className={`text-xs font-extrabold break-words whitespace-normal ${
                              detail.highlight ? 'text-white' : 'text-slate-200'
                            }`}
                          >
                            {detail.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Botones de Acción Directa según el tipo de correo */}
                    {mail.productRef && (
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const isW =
                              mail.productRef!.unit === 'peso' ||
                              mail.productRef!.unit === 'kg';
                            onQuickRestock(mail.productRef!.id, isW ? 5 : 10);
                          }}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow flex items-center gap-1.5 transition"
                        >
                          <i className="fa-solid fa-boxes-stacked"></i>
                          <span>
                            Reponer +
                            {mail.productRef.unit === 'peso' || mail.productRef.unit === 'kg'
                              ? '5 Kg'
                              : '10 und'}{' '}
                            ahora
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onGoToInventoryProduct(mail.productRef!.name);
                          }}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs cursor-pointer shadow flex items-center gap-1.5 transition"
                        >
                          <i className="fa-solid fa-box-open"></i>
                          <span>Ver Producto en Inventario</span>
                        </button>
                      </div>
                    )}

                    {mail.saleRef && mail.saleRef.clientName && (
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onGoToDebtor(mail.saleRef!.clientName!);
                          }}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-black text-xs cursor-pointer shadow flex items-center gap-1.5 transition"
                        >
                          <i className="fa-solid fa-user-check"></i>
                          <span>Ver Cliente en Cuentas / Historial</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  if (inlineMode) {
    return inboxBody;
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-3xl w-full max-h-[92vh] overflow-y-auto">{inboxBody}</div>
    </div>
  );
};
