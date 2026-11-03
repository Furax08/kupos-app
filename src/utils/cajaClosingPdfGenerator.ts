import { jsPDF } from 'jspdf';
import { formatCurrencyAmount, RatesConfig } from '../components/ProductMultiRatePrice';

export interface CajaClosingSaleItem {
  id: string;
  cartName: string;
  clientName?: string;
  total: number;
  date: string;
  status?: string;
  paymentMethod?: string;
  abono?: number;
}

export interface CajaClosingExpenseItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  deductFromCaja?: boolean;
}

export interface CajaClosingReportParams {
  storeName: string;
  storeToken?: string;
  cashierName?: string;
  openedAt: string;
  closedAt: string;
  initialAmountUSD: number;
  cashSalesUSD: number;
  cardSalesUSD: number;
  creditSalesUSD: number;
  expenses: CajaClosingExpenseItem[];
  salesHistory: CajaClosingSaleItem[];
  rates: RatesConfig;
  countersResetForNextDay: boolean;
  nextDayInitialAmountUSD?: number;
}

export const generateCajaClosingPDF = ({
  storeName,
  storeToken,
  cashierName,
  openedAt,
  closedAt,
  initialAmountUSD,
  cashSalesUSD,
  cardSalesUSD,
  creditSalesUSD,
  expenses,
  salesHistory,
  rates,
  countersResetForNextDay,
  nextDayInitialAmountUSD = 0,
}: CajaClosingReportParams): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  const refCurr = rates.refCurrency || 'USD';
  const priCurr = rates.primaryCurrency || 'VES';
  const priRate = rates.primaryRate || 1;
  const secCurr = rates.secondaryCurrency || 'COP';
  const secRate = rates.secondaryRate || 1;

  const totalCollectedUSD = cashSalesUSD + cardSalesUSD;
  const totalDayOperationUSD = cashSalesUSD + cardSalesUSD + creditSalesUSD;
  const totalExpensesUSD = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const cashDrawerExpectedUSD = initialAmountUSD + cashSalesUSD;
  const netBalanceAfterExpensesUSD = totalCollectedUSD - totalExpensesUSD;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(0, 40, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`REPORTE DE CIERRE DE CAJA DIARIO`, margin, 15);

  doc.setFontSize(11);
  doc.setTextColor(52, 211, 153);
  doc.text(`${storeName || 'Mi Tienda'} ${storeToken ? `(${storeToken})` : ''}`, margin, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Apertura: ${openedAt || 'Hoy'}   |   Cierre: ${closedAt}`, margin, 29);
  doc.text(
    `Responsable: ${cashierName || 'Administrador'}   |   Tasa: 1 ${refCurr} = ${formatCurrencyAmount(priRate, priCurr)} ${priCurr}`,
    margin,
    35
  );

  let y = 50;

  // Section 1: Resumen Ejecutivo de Ventas (Efectivo, Puntos/Digital, Fiados)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. RESUMEN DE VENTAS Y ARQUEO DE CAJA (EFECTIVO, PUNTOS Y FIADOS)', margin, y);
  y += 5;

  const boxWidth = (pageWidth - margin * 2 - 8) / 3;
  const boxHeight = 28;

  const summaryCards = [
    {
      title: 'EFECTIVO EN CAJA',
      usd: cashSalesUSD,
      subtitle: `Base inicial: $${initialAmountUSD.toFixed(2)} | En gaveta: $${cashDrawerExpectedUSD.toFixed(2)}`,
      bg: [236, 253, 245] as [number, number, number],
      border: [16, 185, 129] as [number, number, number],
      textCol: [5, 150, 105] as [number, number, number],
    },
    {
      title: 'PUNTOS / PAGO MÓVIL / DIGITAL',
      usd: cardSalesUSD,
      subtitle: 'Tarjetas, transferencias, Zelle y Binance',
      bg: [238, 242, 255] as [number, number, number],
      border: [99, 102, 241] as [number, number, number],
      textCol: [67, 56, 202] as [number, number, number],
    },
    {
      title: 'FIADOS (CRÉDITOS DEL DÍA)',
      usd: creditSalesUSD,
      subtitle: 'Cuentas por cobrar registradas en el turno',
      bg: [255, 251, 235] as [number, number, number],
      border: [245, 158, 11] as [number, number, number],
      textCol: [180, 83, 9] as [number, number, number],
    },
  ];

  summaryCards.forEach((card, idx) => {
    const x = margin + idx * (boxWidth + 4);
    doc.setFillColor(...card.bg);
    doc.setDrawColor(...card.border);
    doc.roundedRect(x, y, boxWidth, boxHeight, 2.5, 2.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...card.textCol);
    doc.text(card.title, x + 3, y + 6);

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`$${card.usd.toFixed(2)} ${refCurr}`, x + 3, y + 14);

    doc.setFontSize(8.5);
    doc.setTextColor(...card.textCol);
    doc.text(`${formatCurrencyAmount(card.usd * priRate, priCurr)} ${priCurr}`, x + 3, y + 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    const subLines = doc.splitTextToSize(card.subtitle, boxWidth - 6);
    doc.text(subLines[0] || '', x + 3, y + 25.5);
  });

  y += boxHeight + 8;

  // Consolidated Totals Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 32, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('BALANCE CONSOLIDADO DEL CIERRE', margin + 4, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `• Total Recaudado (Efectivo + Puntos): $${totalCollectedUSD.toFixed(2)} ${refCurr} (${formatCurrencyAmount(totalCollectedUSD * priRate, priCurr)} ${priCurr})`,
    margin + 4,
    y + 13.5
  );
  doc.text(
    `• Total Operación Bruta (Incluyendo Fiados): $${totalDayOperationUSD.toFixed(2)} ${refCurr} (${formatCurrencyAmount(totalDayOperationUSD * priRate, priCurr)} ${priCurr} | ${formatCurrencyAmount(totalDayOperationUSD * secRate, secCurr)} ${secCurr})`,
    margin + 4,
    y + 19.5
  );
  doc.text(
    `• Gastos Operativos del Día: -$${totalExpensesUSD.toFixed(2)} ${refCurr}   |   Ingreso Neto Libre: $${netBalanceAfterExpensesUSD.toFixed(2)} ${refCurr} (${formatCurrencyAmount(netBalanceAfterExpensesUSD * priRate, priCurr)} ${priCurr})`,
    margin + 4,
    y + 25.5
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(countersResetForNextDay ? 5 : 100, countersResetForNextDay ? 150 : 116, countersResetForNextDay ? 105 : 139);
  doc.text(
    countersResetForNextDay
      ? `✓ Contadores de Caja reinicializados automáticamente para el día siguiente (Nueva base: $${nextDayInitialAmountUSD.toFixed(2)} ${refCurr})`
      : `• Cierre parcial / informativo (Contadores de caja mantenidos sin reiniciar)`,
    margin + 4,
    y + 30.2
  );

  y += 40;

  // Section 2: Detalle de Ventas Registradas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  const activeSales = salesHistory.filter((s) => s.status !== 'voided');
  doc.text(`2. DETALLE DE TRANSACCIONES DEL DÍA (${activeSales.length} VENTAS ACTIVAS)`, margin, y);
  y += 4;

  // Table Header
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('TICKET / FECHA', margin + 2, y + 4.8);
  doc.text('CLIENTE', margin + 48, y + 4.8);
  doc.text('MODALIDAD / ESTADO', margin + 102, y + 4.8);
  doc.text(`MONTO (${refCurr})`, pageWidth - margin - 38, y + 4.8, { align: 'right' });
  doc.text(`MONTO (${priCurr})`, pageWidth - margin - 2, y + 4.8, { align: 'right' });
  y += 7;

  if (activeSales.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No se registraron transacciones individuales en este turno.', margin + 2, y + 6);
    y += 12;
  } else {
    const maxRows = Math.min(activeSales.length, 25);
    for (let i = 0; i < maxRows; i++) {
      const s = activeSales[i];
      if (y > pageHeight - 25) {
        doc.addPage();
        y = 20;
      }
      if (i % 2 === 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
      }

      const isFiado = s.status === 'fiado' || s.status === 'credit';
      const methodText = isFiado
        ? `FIADO (Abono: $${(s.abono || 0).toFixed(2)})`
        : s.paymentMethod === 'cash' || s.paymentMethod === 'primary'
        ? 'Efectivo'
        : s.paymentMethod === 'mixto'
        ? 'Pago Mixto'
        : 'Punto / Digital';

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`${s.id.slice(-8)} • ${(s.date || '').slice(0, 16)}`, margin + 2, y + 4.5);
      doc.text((s.clientName || s.cartName || 'Cliente').slice(0, 26), margin + 48, y + 4.5);
      doc.text(methodText, margin + 102, y + 4.5);

      doc.setFont('helvetica', 'bold');
      doc.text(`$${s.total.toFixed(2)}`, pageWidth - margin - 38, y + 4.5, { align: 'right' });
      doc.text(
        `${formatCurrencyAmount(s.total * priRate, priCurr)}`,
        pageWidth - margin - 2,
        y + 4.5,
        { align: 'right' }
      );
      y += 6.5;
    }
  }

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Documento oficial de Cierre de Caja generado por ${storeName || 'Mi Tienda'} • ${closedAt}`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  const dateSlug = new Date().toISOString().slice(0, 10);
  const storeSlug = (storeName || 'mi_tienda')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  doc.save(`cierre_caja_${storeSlug}_${dateSlug}.pdf`);
};
