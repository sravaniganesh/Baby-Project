const puppeteer = require("puppeteer");

const generateInvoicePDF = async ({
  invoiceNumber,
  invoiceDate,
  user,
  item,
  seller,
}) => {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 24px; }
          h2 { margin-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background: #f5f5f5; }
          .right { text-align: right; }
        </style>
      </head>
      <body>
        <h2>Invoice</h2>
        <p><b>Invoice No:</b> ${invoiceNumber}</p>
        <p><b>Date:</b> ${invoiceDate}</p>

        <hr />

        <h3>Sold By</h3>
        <p>${seller.name || "Seller"}</p>

        <h3>Bill To</h3>
        <p>
          ${user.name}<br/>
          ${user.address.addressLine}<br/>
          ${user.address.city}, ${user.address.state} - ${user.address.pincode}<br/>
          Phone: ${user.address.phone}
        </p>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th class="right">Price</th>
              <th class="right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${item.title}</td>
              <td>${item.quantity}</td>
              <td class="right">₹${item.price}</td>
              <td class="right">₹${item.totalAmount}</td>
            </tr>
          </tbody>
        </table>

        <h3 style="text-align:right">Grand Total: ₹${item.totalAmount}</h3>
      </body>
    </html>
  `;

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({ format: "A4" });

  await browser.close();

  return pdfBuffer;
};

module.exports = { generateInvoicePDF };
