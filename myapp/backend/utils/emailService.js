const nodemailer = require("nodemailer");

const sendInvoiceEmail = async ({ to, invoiceBuffer, invoiceNumber }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.INVOICE_EMAIL, // your gmail
      pass: process.env.INVOICE_EMAIL_PASSWORD, // app password
    },
  });

  await transporter.sendMail({
    from: `"Shop App" <${process.env.INVOICE_EMAIL}>`,
    to,
    subject: `Invoice for your order (${invoiceNumber})`,
    text: "Thank you for your purchase. Please find your invoice attached.",
    attachments: [
      {
        filename: `Invoice-${invoiceNumber}.pdf`,
        content: invoiceBuffer,
      },
    ],
  });
};

module.exports = { sendInvoiceEmail };
