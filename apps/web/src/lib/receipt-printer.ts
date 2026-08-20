/**
 * Universal POS Thermal Receipt Printer
 * Uses an isolated hidden iframe so the print dialog renders ONLY the compact
 * 80mm receipt roll without blank pages or application bleed-through.
 */

export interface ReceiptItem {
  name: string;
  quantity: number;
  totalPrice: number;
}

export interface ReceiptOrder {
  orderNumber: string;
  totalAmount: number;
  items: ReceiptItem[];
}

export interface ReceiptData {
  restaurantName: string;
  branchName?: string;
  tableName: string;
  dateTime?: string;
  orders: ReceiptOrder[];
  subtotal?: number;
  taxAmount?: number;
  grandTotal: number;
}

export function printThermalReceipt(data: ReceiptData) {
  // 1. Remove any existing print iframe
  const existingFrame = document.getElementById('receipt-print-frame');
  if (existingFrame) {
    existingFrame.remove();
  }

  // 2. Create invisible iframe
  const iframe = document.createElement('iframe');
  iframe.id = 'receipt-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt - Table ${data.tableName}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          html, body {
            width: 72mm;
            max-width: 72mm;
            margin: 0 auto;
            padding: 3mm 1mm;
            background: #ffffff;
            color: #000000;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
            font-size: 11.5px;
            line-height: 1.35;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .center { text-align: center; }
          .bold { font-weight: 800; }
          .dashed {
            border-bottom: 1px dashed #000000;
            margin: 5px 0;
          }
          .dotted {
            border-bottom: 1px dotted #000000;
            margin: 4px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2.5px;
          }
          .item-name {
            max-width: 48mm;
            word-break: break-word;
            padding-right: 4px;
          }
          .title {
            font-size: 14px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 9.5px;
            color: #333333;
            margin-top: 1px;
          }
          .grand-total {
            font-size: 13.5px;
            font-weight: 900;
          }
          .footer {
            text-align: center;
            font-size: 9.5px;
            color: #333333;
            margin-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title">${data.restaurantName}</div>
          ${data.branchName ? `<div class="subtitle">${data.branchName}</div>` : ''}
          <div class="bold" style="margin-top: 3px; font-size: 12px;">TABLE ${data.tableName}</div>
          <div class="subtitle">${data.dateTime || new Date().toLocaleString()}</div>
        </div>

        <div class="dashed"></div>

        ${data.orders
          .map(
            (o) => `
          <div style="margin-bottom: 5px;">
            <div class="row bold" style="font-size: 10.5px; margin-bottom: 2px; border-bottom: 1px dotted #888; padding-bottom: 1px;">
              <span>Token #${o.orderNumber}</span>
              <span>₹${Number(o.totalAmount || 0).toLocaleString('en-IN')}</span>
            </div>
            ${o.items
              .map(
                (it) => `
              <div class="row" style="font-size: 10.5px; padding-left: 2px;">
                <span class="item-name">${it.quantity}x ${it.name}</span>
                <span class="bold">₹${Number(it.totalPrice || 0).toLocaleString('en-IN')}</span>
              </div>
            `,
              )
              .join('')}
          </div>
        `,
          )
          .join('')}

        <div class="dashed"></div>

        ${
          data.subtotal && data.subtotal !== data.grandTotal
            ? `
          <div class="row" style="font-size: 10.5px;">
            <span>Subtotal:</span>
            <span>₹${Number(data.subtotal).toLocaleString('en-IN')}</span>
          </div>
        `
            : ''
        }
        ${
          data.taxAmount
            ? `
          <div class="row" style="font-size: 10px; color: #444;">
            <span>GST Tax:</span>
            <span>₹${Number(data.taxAmount).toLocaleString('en-IN')}</span>
          </div>
        `
            : ''
        }

        <div class="row grand-total" style="margin-top: 3px; padding-top: 3px; border-top: 1px dotted #000;">
          <span>GRAND TOTAL:</span>
          <span>₹${Number(data.grandTotal || 0).toLocaleString('en-IN')}</span>
        </div>

        <div class="dashed"></div>

        <div class="footer">
          <div class="bold">*** THANK YOU FOR DINING WITH US ***</div>
          <div style="font-size: 8.5px; margin-top: 2px;">Please visit us again</div>
        </div>
      </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  // 3. Trigger isolated iframe print after loading
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  }, 100);
}
