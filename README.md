# Singapore Invoice PDF Generator

A React + Vite invoice generator with:

- Business details
- UEN
- GST registration number
- Customer details
- Invoice number/date/due date
- SGD currency
- Configurable GST rate
- Dynamic invoice items
- Automatic subtotal/GST/total calculation
- Company logo upload
- Live A4 invoice preview
- PDF download
- Responsive layout

## Run

Install Node.js, then:

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

## Notes

The GST rate is configurable in the UI rather than being hard-coded into the calculation. Verify the applicable Singapore tax requirements and rate for your business before using generated invoices for real transactions.
