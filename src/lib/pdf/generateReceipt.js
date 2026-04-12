import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import QRCode from 'qrcode';

/**
 * Generates a professional Payment Receipt PDF
 * Design based on "Server Copy" specifications.
 * @param {Object} options - mode: 'download' or 'view'
 */
export async function generateReceipt({ student, payment, appSettings, mode = 'download' }) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Branding Tokens
  const brandColor = appSettings?.brand_color || '#C9A227';
  const logoUrl = appSettings?.logo_url || '/brand/logo.png';
  const stampUrl = '/brand/stamp.png';
  const timezone = appSettings?.primary_timezone || 'Asia/Dhaka';

  // Helper for hex to RGB
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };
  const [r, g, b] = hexToRgb(brandColor);

  // 2. Draw Decorative Triangles (As per SVG design)
  doc.setFillColor(r, g, b, 0.08);
  
  // Top-Left Triangle
  doc.path([
    { op: 'm', c: [0, 0] },
    { op: 'l', c: [80, 0] },
    { op: 'l', c: [0, 60] },
    { op: 'h' }
  ], 'F');

  // Bottom-Left Triangle
  doc.path([
    { op: 'm', c: [0, pageHeight] },
    { op: 'l', c: [120, pageHeight] },
    { op: 'l', c: [0, pageHeight - 90] },
    { op: 'h' }
  ], 'F');

  // 3. Header Branding
  try {
    const logoImg = await loadImage(logoUrl);
    doc.addImage(logoImg, 'PNG', 15, 12, 30, 30);
  } catch (e) {
    doc.setFontSize(22);
    doc.setTextColor(r, g, b);
    doc.setFont('helvetica', 'bold');
    doc.text(appSettings?.company_name || 'GT GROUP', 15, 30);
  }

  doc.setFontSize(20);
  doc.setTextColor(30, 30, 30);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL PAYMENT RECEIPT', pageWidth - 15, 25, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(appSettings?.system_slogan || 'Verified Study Abroad Partner', pageWidth - 15, 32, { align: 'right' });

  // 4. Document ID Bar
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(0.4);
  doc.line(15, 48, pageWidth - 15, 48);

  const receiptNum = payment.receipt_number || `GT-${new Date().getFullYear()}-${Math.floor(10000000 + Math.random() * 90000000)}`;
  
  // Date Formatting: 2026-04-01 | (GMT+6) 2:17 PM
  const now = new Date(payment.payment_date || new Date());
  const gmtLabel = timezone === 'Asia/Dhaka' ? '(GMT+6)' : 
                   timezone === 'Asia/Seoul' ? '(GMT+9)' : 
                   timezone === 'Asia/Ho_Chi_Minh' ? '(GMT+7)' : 
                   timezone === 'Asia/Colombo' ? '(GMT+5:30)' : '(GMT)';
                   
  const formattedDate = now.toISOString().split('T')[0] + ' | ' + 
                        gmtLabel + ' ' + 
                        now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text(`RECEIPT NO: ${receiptNum}`, 15, 56);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`DATE: ${formattedDate}`, 15, 62);
  
  doc.text(`OFFICE: ${payment.offices?.name || 'GT Group Global'}`, pageWidth - 15, 56, { align: 'right' });
  doc.text(`METHOD: ${payment.payment_method || 'N/A'}`, pageWidth - 15, 62, { align: 'right' });

  // 5. Student Information
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(15, 70, pageWidth - 30, 40, 2, 2, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(r, g, b);
  doc.setFont('helvetica', 'bold');
  doc.text('STUDENT DETAILS', 20, 80);

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Full Name:', 20, 88);
  doc.setFont('helvetica', 'bold');
  const studentFullName = `${student.last_name} ${student.first_name}`.toUpperCase();
  doc.text(studentFullName, 50, 88);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Passport No:', 20, 95);
  doc.setFont('helvetica', 'bold');
  doc.text(student.passport_number || 'N/A', 50, 95);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Semester:', 120, 88);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.semester || 'N/A', 150, 88);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Transaction ID:', 120, 95);
  doc.setFont('helvetica', 'bold');
  doc.text(payment.transaction_id || 'INTERNAL', 150, 95);

  // 6. Fee Table
  doc.autoTable({
    startY: 120,
    margin: { left: 15, right: 15 },
    head: [['DESCRIPTION', 'FEE TYPE', 'SUBTOTAL', 'DISCOUNT', 'TOTAL PAID']],
    body: [
      [
        payment.notes || 'Processing Fee',
        payment.fee_type || payment.category || 'N/A',
        `${payment.currency} ${(payment.amount + (payment.discount_value || 0)).toLocaleString()}`,
        `${payment.discount_value > 0 ? '-' : ''}${payment.currency} ${(payment.discount_value || 0).toLocaleString()}`,
        `${payment.currency} ${payment.amount.toLocaleString()}`
      ]
    ],
    headStyles: { 
      fillColor: [40, 40, 40], 
      textColor: [255, 255, 255], 
      fontStyle: 'bold', 
      fontSize: 9, 
      halign: 'center',
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 40 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right', textColor: [180, 0, 0] },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold', textColor: [r, g, b] }
    },
    bodyStyles: { fontSize: 9, cellPadding: 5 }
  });

  let finalY = doc.lastAutoTable.finalY + 15;

  // 7. Stamp & QR Verification
  try {
    const stampImg = await loadImage(stampUrl);
    doc.addImage(stampImg, 'PNG', pageWidth - 70, finalY, 50, 50);
  } catch (e) {}

  // Multi-line QR string
  const qrText = `Receipt #: ${receiptNum}
Date: ${formattedDate}
Student: ${studentFullName}
Passport: ${student.passport_number || 'N/A'}
Total Paid: ${payment.currency} ${payment.amount}
Promo Code: ${payment.promo_codes?.code || 'NONE'}
Processor: ${payment.users?.full_name || 'System'}`;

  try {
    const qrBuffer = await QRCode.toDataURL(qrText, { scale: 4, margin: 1 });
    doc.addImage(qrBuffer, 'PNG', 15, finalY, 30, 30);
    
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text('SCAN TO VERIFY RECORD', 15, finalY + 34);
    doc.text('OFFICIAL CRM SECURE COPY', 15, finalY + 37);
  } catch (e) {
    console.error("QR Error", e);
  }

  // 8. Footer
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text('This is a computer-generated document. No physical signature is required.', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text(`Security Hash: ${payment.id}`, pageWidth / 2, pageHeight - 11, { align: 'center' });

  // 9. Output Mode
  const safeStudentName = studentFullName.replace(/\s+/g, '_');
  const safeOffice = (payment.offices?.name || 'GT_Office').replace(/\s+/g, '_');
  const filename = `receipt_number_${receiptNum}-office-${safeOffice}-Student_Name-${safeStudentName}-passport_number-${student.passport_number || 'NA'}.pdf`;

  if (mode === 'view') {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  } else {
    doc.save(filename);
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Load fail'));
    img.src = url;
  });
}
