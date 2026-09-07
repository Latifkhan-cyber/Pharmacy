import { Sale } from '../types'

export interface ReceiptStoreInfo {
  name?: string
  phone?: string
  address?: string
  footerText?: string
  currencySymbol?: string
}

export const printThermalReceipt = (sale: Sale, storeInfo?: ReceiptStoreInfo) => {
  const pharmacyName = storeInfo?.name || 'PrimeCare Pharmacy & Healthcare'
  const pharmacyPhone = storeInfo?.phone || '+92 300 1234567'
  const pharmacyAddress = storeInfo?.address || 'Plot 42-B, Health Boulevard, Medical District'
  const footerText = storeInfo?.footerText || 'Thank you for choosing PrimeCare! Keep medicines out of reach of children.'
  const cur = storeInfo?.currencySymbol || 'Rs.'

  const dateStr = new Date(sale.saleDate || Date.now()).toLocaleString()

  // Generate Items Table HTML
  const itemsHtml = (sale.items || [])
    .map(
      (item) => `
      <tr>
        <td style="padding: 4px 0; text-align: left; max-width: 140px; word-break: break-word;">
          <strong>${item.medicineName || item.batchNumber || 'Medicine'}</strong>
          ${item.batchNumber ? `<div style="font-size: 9px; color: #555;">Batch: ${item.batchNumber}</div>` : ''}
        </td>
        <td style="padding: 4px 0; text-align: center;">${item.quantity}</td>
        <td style="padding: 4px 0; text-align: right;">${cur}${Number(item.salePrice).toFixed(2)}</td>
        <td style="padding: 4px 0; text-align: right; font-weight: bold;">${cur}${Number(item.total).toFixed(2)}</td>
      </tr>
    `
    )
    .join('')

  const receiptHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt - ${sale.invoiceNumber}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace, sans-serif;
            width: 76mm;
            margin: 0 auto;
            padding: 8px 4px;
            color: #000;
            background: #fff;
            font-size: 11px;
            line-height: 1.3;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 2px solid #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th { border-bottom: 1px dashed #000; padding-bottom: 3px; }
          .flex-between { display: flex; justify-content: space-between; margin: 2px 0; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div style="font-size: 15px; font-weight: 900; text-transform: uppercase;">${pharmacyName}</div>
          <div style="font-size: 9px; margin-top: 2px;">${pharmacyAddress}</div>
          <div style="font-size: 9px;">Tel: ${pharmacyPhone}</div>
        </div>

        <div class="divider"></div>

        <div class="flex-between" style="font-size: 10px;">
          <span>INV: <strong>${sale.invoiceNumber}</strong></span>
          <span>${sale.paymentMethod.toUpperCase()}</span>
        </div>
        <div class="flex-between" style="font-size: 9px; color: #333;">
          <span>Date: ${dateStr}</span>
        </div>
        ${
          sale.customerName && sale.customerName !== 'Walk-in Customer'
            ? `<div style="font-size: 10px; margin-top: 2px;">Customer: <strong>${sale.customerName}</strong></div>`
            : ''
        }

        <div class="divider"></div>

        <table>
          <thead>
            <tr>
              <th style="text-align: left;">Item</th>
              <th style="text-align: center; width: 25px;">Qty</th>
              <th style="text-align: right; width: 45px;">Price</th>
              <th style="text-align: right; width: 50px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="divider"></div>

        <div style="font-size: 10px;">
          <div class="flex-between">
            <span>Subtotal:</span>
            <span>${cur}${Number(sale.subtotal).toFixed(2)}</span>
          </div>
          ${
            Number(sale.tax) > 0
              ? `<div class="flex-between"><span>Tax:</span><span>+${cur}${Number(sale.tax).toFixed(2)}</span></div>`
              : ''
          }
          ${
            Number(sale.discount) > 0
              ? `<div class="flex-between"><span>Discount:</span><span>-${cur}${Number(sale.discount).toFixed(2)}</span></div>`
              : ''
          }
          <div class="double-divider"></div>
          <div class="flex-between" style="font-size: 13px; font-weight: 900;">
            <span>GRAND TOTAL:</span>
            <span>${cur}${Number(sale.totalAmount).toFixed(2)}</span>
          </div>
          <div class="flex-between" style="margin-top: 3px;">
            <span>Paid Amount:</span>
            <span>${cur}${Number(sale.paidAmount).toFixed(2)}</span>
          </div>
          ${
            Number(sale.dueAmount) > 0
              ? `<div class="flex-between bold" style="color: #000;">
                  <span>Balance Due:</span>
                  <span>${cur}${Number(sale.dueAmount).toFixed(2)}</span>
                </div>`
              : ''
          }
        </div>

        <div class="divider"></div>

        <div class="text-center" style="font-size: 9px; margin-top: 6px; color: #444;">
          ${footerText}
        </div>
      </body>
    </html>
  `

  // Use hidden iframe to trigger direct isolated single print job without double rendering
  let printFrame = document.getElementById('receipt-print-iframe') as HTMLIFrameElement
  if (!printFrame) {
    printFrame = document.createElement('iframe')
    printFrame.id = 'receipt-print-iframe'
    printFrame.style.position = 'fixed'
    printFrame.style.right = '0'
    printFrame.style.bottom = '0'
    printFrame.style.width = '0'
    printFrame.style.height = '0'
    printFrame.style.border = 'none'
    document.body.appendChild(printFrame)
  }

  const frameDoc = printFrame.contentWindow?.document || printFrame.contentDocument
  if (frameDoc) {
    frameDoc.open()
    frameDoc.write(receiptHtml)
    frameDoc.close()

    setTimeout(() => {
      printFrame.contentWindow?.focus()
      printFrame.contentWindow?.print()
    }, 250)
  }
}
