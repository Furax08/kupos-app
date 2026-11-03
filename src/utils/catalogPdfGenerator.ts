import { jsPDF } from 'jspdf';
import { RatesConfig, formatCurrencyAmount } from '../components/ProductMultiRatePrice';

export interface CatalogPdfProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  price: number;
  image: string;
  stock: number;
  showCatalog: boolean;
}

const loadImageAsJpegDataUrl = (src: string, fallbackText: string): Promise<string> => {
  return new Promise((resolve) => {
    const drawPlaceholder = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 160, 160);
        ctx.strokeStyle = '#6366f1';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, 152, 152);
        ctx.fillStyle = '#a5b4fc';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(fallbackText.slice(0, 12), 80, 80);
      }
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };

    if (!src) {
      drawPlaceholder();
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          drawPlaceholder();
          return;
        }
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, 160, 160);

        // Center crop square
        const minSide = Math.min(img.width, img.height);
        const sx = (img.width - minSide) / 2;
        const sy = (img.height - minSide) / 2;
        ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 160, 160);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } catch {
        drawPlaceholder();
      }
    };
    img.onerror = () => {
      drawPlaceholder();
    };
    img.src = src;
  });
};

export const generateCatalogPDF = async ({
  storeName,
  storeToken,
  products,
  rates,
}: {
  storeName: string;
  storeToken: string;
  products: CatalogPdfProduct[];
  rates: RatesConfig;
}): Promise<void> => {
  const visibleProducts = products.filter((p) => p.showCatalog !== false);
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 12;

  const refCurrency = rates.refCurrency || 'USD';
  const refMultiplier = rates.refUSD || 1.0;
  const primaryCurr = rates.primaryCurrency || 'VES';
  const primaryRate = rates.primaryRate || 1.0;
  const secondaryCurr = rates.secondaryCurrency || 'COP';
  const secondaryRate = rates.secondaryRate || 1.0;

  const drawPageHeader = (pageNumber: number) => {
    // Dark Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 34, 'F');

    // Indigo Accent Line
    doc.setFillColor(99, 102, 241); // brand-500
    doc.rect(0, 34, pageWidth, 1.8, 'F');

    // Store Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(storeName || 'Mi Tienda - Catálogo Virtual', margin, 14);

    // Subtitle & Date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    const todayStr = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    doc.text(
      `Catálogo Oficial de Productos | Token: ${storeToken || 'VERIFICADO'} | Fecha: ${todayStr}`,
      margin,
      21
    );

    // Exchange Rates Summary Pill on Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text(
      `Tasas activas: 1 ${refCurrency} = ${primaryRate} ${primaryCurr}  |  1 ${refCurrency} = ${secondaryRate} ${secondaryCurr}`,
      margin,
      28
    );

    // Page indicator right-aligned
    doc.setTextColor(203, 213, 225);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Pág. ${pageNumber}`, pageWidth - margin, 14, { align: 'right' });
  };

  // Preload all visible product images
  const imageMap: Record<string, string> = {};
  for (const prod of visibleProducts) {
    imageMap[prod.id] = await loadImageAsJpegDataUrl(prod.image, prod.name);
  }

  let currentPage = 1;
  drawPageHeader(currentPage);

  if (visibleProducts.length === 0) {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(12);
    doc.text('No hay productos visibles actualmente en el catálogo.', margin, 55);
  } else {
    // 2-column card layout on each page
    const colGap = 6;
    const cardWidth = (pageWidth - margin * 2 - colGap) / 2; // ~90mm
    const cardHeight = 42;
    const startY = 42;
    let currentY = startY;

    for (let i = 0; i < visibleProducts.length; i++) {
      const prod = visibleProducts[i];
      const colIndex = i % 2;

      if (colIndex === 0 && i > 0) {
        currentY += cardHeight + 5;
      }

      if (currentY + cardHeight > pageHeight - 16) {
        doc.addPage();
        currentPage += 1;
        drawPageHeader(currentPage);
        currentY = startY;
      }

      const cardX = margin + colIndex * (cardWidth + colGap);

      // Card background & border
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.roundedRect(cardX, currentY, cardWidth, cardHeight, 3, 3, 'FD');

      // Product Image (32x32mm)
      const imgData = imageMap[prod.id];
      if (imgData) {
        try {
          doc.addImage(imgData, 'JPEG', cardX + 3, currentY + 5, 32, 32);
        } catch {
          // ignore image render error
        }
      }

      const textX = cardX + 38;
      const maxTextWidth = cardWidth - 41;

      // Category Badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(79, 70, 229); // indigo-600
      const unitBadge =
        prod.unit === 'peso' || prod.name.toLowerCase().includes('queso')
          ? `${prod.category.toUpperCase()} • VENTA POR KG`
          : prod.category.toUpperCase();
      doc.text(unitBadge, textX, currentY + 8);

      // Product Name (truncated to fit cleanly)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42); // slate-900
      const splitTitle = doc.splitTextToSize(prod.name, maxTextWidth);
      doc.text(splitTitle.slice(0, 2), textX, currentY + 13);

      // Calculate the 3 configured currencies
      const unitSuffix =
        prod.unit === 'peso' || prod.name.toLowerCase().includes('queso') ? '/Kg' : '';
      const primaryAmount = prod.price * primaryRate;
      const secondaryAmount = prod.price * secondaryRate;
      const refAmount = prod.price * refMultiplier;

      // 1. Primary Rate (Large Bold Emerald)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text(
        `${formatCurrencyAmount(primaryAmount, primaryCurr)} ${primaryCurr}${unitSuffix}`,
        textX,
        currentY + 26
      );

      // 2. Secondary Rate (Small below primary left)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(109, 40, 217); // violet-700
      doc.text(
        `${formatCurrencyAmount(secondaryAmount, secondaryCurr)} ${secondaryCurr}`,
        textX,
        currentY + 32
      );

      // 3. Reference Rate (Small below primary right)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85); // slate-700
      const refText = `Ref: ${refCurrency === 'EUR' ? '€' : '$'}${refAmount.toFixed(2)} ${refCurrency}`;
      doc.text(refText, cardX + cardWidth - 3, currentY + 32, { align: 'right' });

      // Optional Crypto Line (Small at bottom of card)
      const activeCrypto = rates.selectedCrypto || 'USDT';
      const cryptoPriceUSD = rates.crypto?.[activeCrypto] || 1;
      const cryptoVal = cryptoPriceUSD > 0 ? prod.price / cryptoPriceUSD : prod.price;
      const cryptoStr =
        activeCrypto === 'BTC' || activeCrypto === 'ETH' || activeCrypto === 'BNB'
          ? cryptoVal.toFixed(4)
          : cryptoVal.toFixed(2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text(`Cripto: ${cryptoStr} ${activeCrypto}`, textX, currentY + 37.5);
    }
  }

  // Footer
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generado por ${storeName || 'Mi Tienda'} - Catálogo Virtual Multimoneda (${primaryCurr} / ${secondaryCurr} / ${refCurrency})`,
    pageWidth / 2,
    pageHeight - 6,
    { align: 'center' }
  );

  const safeStoreSlug = (storeName || 'mi_tienda')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  doc.save(`catalogo_${safeStoreSlug || 'productos'}.pdf`);
};
