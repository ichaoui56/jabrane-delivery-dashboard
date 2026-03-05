'use server';

import { OrderForPDF } from '@/lib/utils/pdf-generator';

// Since pdfmake is client-side only, we'll create a simple wrapper
// that just passes data to the client
export async function generateInvoicePDF(order: OrderForPDF, merchantName: string) {
  // This is just a type definition for the client-side function
  // The actual PDF generation happens on the client side
  return {
    success: true as const,
    fileName: `invoice-${order.orderCode}.pdf`,
    order,
    merchantName
  };
}