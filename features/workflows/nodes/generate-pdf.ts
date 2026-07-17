// Generate PDF for quotes, invoices, and OTP documents
// Uses a server-side PDF generation approach

export type QuoteData = {
  quoteNumber: string
  date: string
  validUntil: string

  dealership: {
    name: string
    address?: string
    phone?: string
    email?: string
    logo?: string
  }

  customer: {
    name: string
    phone?: string
    email?: string
    address?: string
  }

  vehicle: {
    stockNo: string
    make: string
    model: string
    variant?: string
    year: number
    odometer: number
    colour: string
    transmission: string
    fuelType: string
    vin?: string
    features: string[]
  }

  pricing: {
    price: number
    discount?: number
    tradeIn?: number
    deposit?: number
    netPrice: number
  }

  finance?: {
    termMonths: number
    interestRate: number
    monthlyInstalment: number
    residualValue?: number
    totalRepayment: number
    creditProvider: string
  }
}

export type DocumentType = "quote" | "invoice" | "otp"

/**
 * Generates HTML markup for a professional dealership quote/invoice/OTP document.
 * The HTML can be converted to PDF server-side or rendered in a browser.
 */
export function generateDocumentHtml(data: QuoteData, type: DocumentType): string {
  const title =
    type === "quote" ? "VEHICLE QUOTE" : type === "invoice" ? "INVOICE" : "OFFER TO PURCHASE"

  const currency = (amount: number) =>
    `R ${amount.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const featuresHtml = data.vehicle.features
    .map((f) => `<li style="margin-bottom:4px;color:#374151">${f}</li>`)
    .join("")

  const financeHtml = data.finance
    ? `
    <div style="margin-top:24px;border-top:2px solid #e5e7eb;padding-top:16px">
      <h3 style="font-size:14px;font-weight:600;color:#111827;margin:0 0 12px 0;text-transform:uppercase">Finance Breakdown</h3>
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:6px 0;color:#4b5563">Credit Provider</td><td style="padding:6px 0;font-weight:500;text-align:right">${data.finance.creditProvider}</td></tr>
        <tr><td style="padding:6px 0;color:#4b5563">Term</td><td style="padding:6px 0;font-weight:500;text-align:right">${data.finance.termMonths} months</td></tr>
        <tr><td style="padding:6px 0;color:#4b5563">Interest Rate</td><td style="padding:6px 0;font-weight:500;text-align:right">${data.finance.interestRate}%</td></tr>
        ${data.finance.residualValue ? `<tr><td style="padding:6px 0;color:#4b5563">Residual / Balloon</td><td style="padding:6px 0;font-weight:500;text-align:right">${currency(data.finance.residualValue)}</td></tr>` : ""}
        <tr><td style="padding:6px 0;color:#4b5563">Total Repayment</td><td style="padding:6px 0;font-weight:500;text-align:right">${currency(data.finance.totalRepayment)}</td></tr>
      </table>
      <div style="margin-top:12px;padding:12px;background:#fef2c0;border-radius:8px;text-align:center">
        <div style="font-size:12px;color:#92400e">Estimated Monthly Instalment</div>
        <div style="font-size:24px;font-weight:700;color:#111827">${currency(data.finance.monthlyInstalment)}</div>
        <div style="font-size:11px;color:#92400e">per month × ${data.finance.termMonths} months</div>
      </div>
    </div>`
    : ""

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @page { margin: 20mm; size: A4; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111827; margin: 0; padding: 0; }
  </style>
</head>
<body style="padding:40px;max-width:800px;margin:0 auto">
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:start;border-bottom:3px solid #f97316;padding-bottom:16px;margin-bottom:24px">
    <div>
      ${data.dealership.logo ? `<img src="${data.dealership.logo}" alt="Logo" style="max-height:60px;margin-bottom:8px"/>` : ""}
      <h1 style="font-size:18px;font-weight:700;margin:0;color:#111827">${data.dealership.name}</h1>
      ${data.dealership.address ? `<p style="font-size:12px;color:#6b7280;margin:2px 0">${data.dealership.address}</p>` : ""}
      ${data.dealership.phone ? `<p style="font-size:12px;color:#6b7280;margin:2px 0">${data.dealership.phone}</p>` : ""}
      ${data.dealership.email ? `<p style="font-size:12px;color:#6b7280;margin:2px 0">${data.dealership.email}</p>` : ""}
    </div>
    <div style="text-align:right">
      <div style="font-size:24px;font-weight:800;color:#f97316;margin-bottom:4px">${title}</div>
      <div style="font-size:12px;color:#6b7280">#${data.quoteNumber}</div>
      <div style="font-size:12px;color:#6b7280">Date: ${data.date}</div>
      <div style="font-size:12px;color:#6b7280">Valid until: ${data.validUntil}</div>
    </div>
  </div>

  <!-- Customer -->
  <div style="margin-bottom:24px">
    <h2 style="font-size:14px;font-weight:600;color:#374151;margin:0 0 8px 0;text-transform:uppercase">Prepared for</h2>
    <p style="margin:2px 0;font-size:14px;font-weight:500">${data.customer.name}</p>
    ${data.customer.phone ? `<p style="margin:2px 0;font-size:13px;color:#6b7280">${data.customer.phone}</p>` : ""}
    ${data.customer.email ? `<p style="margin:2px 0;font-size:13px;color:#6b7280">${data.customer.email}</p>` : ""}
    ${data.customer.address ? `<p style="margin:2px 0;font-size:13px;color:#6b7280">${data.customer.address}</p>` : ""}
  </div>

  <!-- Vehicle Details -->
  <div style="margin-bottom:24px">
    <h2 style="font-size:14px;font-weight:600;color:#374151;margin:0 0 8px 0;text-transform:uppercase">Vehicle Details</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 8px;background:#f9fafb;font-size:13px;color:#4b5563;width:40%">Stock No</td><td style="padding:6px 8px;font-size:13px;font-weight:500">${data.vehicle.stockNo}</td></tr>
      <tr><td style="padding:6px 8px;background:#f9fafb;font-size:13px;color:#4b5563">Make / Model</td><td style="padding:6px 8px;font-size:13px;font-weight:500">${data.vehicle.make} ${data.vehicle.model} ${data.vehicle.variant || ""}</td></tr>
      <tr><td style="padding:6px 8px;background:#f9fafb;font-size:13px;color:#4b5563">Year</td><td style="padding:6px 8px;font-size:13px;font-weight:500">${data.vehicle.year}</td></tr>
      <tr><td style="padding:6px 8px;background:#f9fafb;font-size:13px;color:#4b5563">Odometer</td><td style="padding:6px 8px;font-size:13px;font-weight:500">${data.vehicle.odometer.toLocaleString()} km</td></tr>
      <tr><td style="padding:6px 8px;background:#f9fafb;font-size:13px;color:#4b5563">Colour</td><td style="padding:6px 8px;font-size:13px;font-weight:500">${data.vehicle.colour}</td></tr>
      <tr><td style="padding:6px 8px;background:#f9fafb;font-size:13px;color:#4b5563">Transmission</td><td style="padding:6px 8px;font-size:13px;font-weight:500">${data.vehicle.transmission}</td></tr>
      <tr><td style="padding:6px 8px;background:#f9fafb;font-size:13px;color:#4b5563">Fuel Type</td><td style="padding:6px 8px;font-size:13px;font-weight:500">${data.vehicle.fuelType}</td></tr>
      ${data.vehicle.vin ? `<tr><td style="padding:6px 8px;background:#f9fafb;font-size:13px;color:#4b5563">VIN</td><td style="padding:6px 8px;font-size:13px;font-weight:500">${data.vehicle.vin}</td></tr>` : ""}
    </table>
  </div>

  <!-- Features -->
  ${featuresHtml ? `<div style="margin-bottom:24px"><h2 style="font-size:14px;font-weight:600;color:#374151;margin:0 0 8px 0;text-transform:uppercase">Features</h2><ul style="margin:0;padding-left:20px;list-style:none">${featuresHtml}</ul></div>` : ""}

  <!-- Pricing -->
  <div style="margin-bottom:24px">
    <h2 style="font-size:14px;font-weight:600;color:#374151;margin:0 0 8px 0;text-transform:uppercase">Pricing</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0;font-size:13px;color:#4b5563">Vehicle Price</td><td style="padding:6px 0;font-size:13px;text-align:right">${currency(data.pricing.price)}</td></tr>
      ${data.pricing.discount ? `<tr><td style="padding:6px 0;font-size:13px;color:#4b5563">Discount</td><td style="padding:6px 0;font-size:13px;text-align:right;color:#059669">-${currency(data.pricing.discount)}</td></tr>` : ""}
      ${data.pricing.tradeIn ? `<tr><td style="padding:6px 0;font-size:13px;color:#4b5563">Trade-In</td><td style="padding:6px 0;font-size:13px;text-align:right;color:#059669">-${currency(data.pricing.tradeIn)}</td></tr>` : ""}
      ${data.pricing.deposit ? `<tr><td style="padding:6px 0;font-size:13px;color:#4b5563">Deposit</td><td style="padding:6px 0;font-size:13px;text-align:right;color:#059669">-${currency(data.pricing.deposit)}</td></tr>` : ""}
      <tr><td style="padding:8px 0;border-top:2px solid #111827;font-size:15px;font-weight:700">Net Price</td><td style="padding:8px 0;border-top:2px solid #111827;font-size:15px;font-weight:700;text-align:right">${currency(data.pricing.netPrice)}</td></tr>
    </table>
  </div>

  ${financeHtml}

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
    <p>This is a ${type === "otp" ? "legally binding offer to purchase" : "quote"} from ${data.dealership.name}.</p>
    <p>${type === "otp" ? "Signatures required from both parties to finalize." : `Valid until ${data.validUntil}. E&OE.`}</p>
  </div>
</body>
</html>`
}

/**
 * Convert quote data to a finance amortization schedule.
 */
export function calculateAmortization(
  principal: number,
  annualRate: number,
  termMonths: number,
  residualValue: number = 0
) {
  const monthlyRate = annualRate / 100 / 12
  const amountFinanced = principal - residualValue

  if (monthlyRate === 0) {
    return {
      monthlyInstalment: Math.round(amountFinanced / termMonths),
      totalRepayment: amountFinanced,
      totalInterest: 0,
      schedule: [],
    }
  }

  const factor = (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1)

  const monthlyInstalment = Math.round(amountFinanced * factor)
  const totalRepayment = Math.round(monthlyInstalment * termMonths)
  const totalInterest = totalRepayment - amountFinanced

  return {
    monthlyInstalment,
    totalRepayment,
    totalInterest,
    schedule: [] as Array<{ month: number; payment: number; interest: number; principal: number; balance: number }>,
  }
}
