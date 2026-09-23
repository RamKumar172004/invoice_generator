import React, { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./App.css";

const today = new Date().toISOString().slice(0, 10);

const initialCustomer = {
  name: "",
  project: "",
  address: "",
  email: "",
  phone: "",
};

const generateInvoiceNumber = () => {
  return Math.floor(100 + Math.random() * 900).toString();
};

function money(value) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    minimumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(`${value}T00:00:00`);

  return date.toLocaleDateString("en-SG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function App() {
  const invoiceRef = useRef(null);

  const [customer, setCustomer] = useState(initialCustomer);

  const [invoice, setInvoice] = useState({
    invoiceNumber: generateInvoiceNumber(),
    date: today,
    dueDate: "",
    terms: "Pay due within 30 days",
  });

  const [payment, setPayment] = useState({
    method: "Cash",
    bank: "DBS Bank",
    accountName: "",
    accountNumber: "",
    instructions: "Thank you for your payment.",
  });

  const [deposit, setDeposit] = useState(0);

  const [pdfFileName, setPdfFileName] = useState("");

  const [payNowNumber, setPayNowNumber] = useState("");

  const [items, setItems] = useState([
    {
      id: Date.now(),
      description: "",
      quantity: "",
      price: "",
    },
  ]);

  const [downloading, setDownloading] = useState(false);

  // --------------------------------
  // Update form data
  // --------------------------------

  const updateObject = (setter) => (event) => {
    setter((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  // --------------------------------
  // Add item
  // --------------------------------

  const addItem = () => {
    setItems((current) => [
      ...current,
      {
        id: Date.now(),
        description: "",
        quantity: 1,
        price: "",
      },
    ]);
  };

  // --------------------------------
  // Remove item
  // --------------------------------

  const removeItem = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  // --------------------------------
  // Update item
  // --------------------------------

  const updateItem = (id, field, value) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              [field]:
                field === "quantity" || field === "price"
                  ? Number(value)
                  : value,
            }
          : item,
      ),
    );
  };

  // --------------------------------
  // Calculate subtotal
  // --------------------------------

  const subtotal = items.reduce(
    (total, item) =>
      total + (Number(item.quantity) || 0) * (Number(item.price) || 0),
    0,
  );

  const depositAmount = Math.min(Number(deposit) || 0, subtotal);

  const balanceDue = subtotal - depositAmount;

  // --------------------------------
  // Download PDF
  // --------------------------------

  const downloadPDF = async () => {
    if (!invoiceRef.current) return;

    setDownloading(true);

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      // Convert canvas to compressed JPEG
      const imageData = canvas.toDataURL("image/jpeg");

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pageWidth = 210;
      const pageHeight = 297;

      const margin = 8;

      const contentWidth = pageWidth - margin * 2;

      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      if (contentHeight <= pageHeight - margin * 2) {
        pdf.addImage(
          imageData,
          "JPEG",
          margin,
          margin,
          contentWidth,
          contentHeight,
          undefined,
          "FAST",
        );
      } else {
        let remainingHeight = contentHeight;
        let sourceY = 0;

        const pageContentHeight = pageHeight - margin * 2;

        while (remainingHeight > 0) {
          const pageCanvas = document.createElement("canvas");

          const sourceHeight = Math.min(
            canvas.height - sourceY,
            Math.floor((pageContentHeight * canvas.width) / contentWidth),
          );

          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;

          const context = pageCanvas.getContext("2d");

          context.drawImage(
            canvas,
            0,
            sourceY,
            canvas.width,
            sourceHeight,
            0,
            0,
            canvas.width,
            sourceHeight,
          );

          // Compress each page image
          const pageImage = pageCanvas.toDataURL("image/jpeg", 0.75);

          const renderedHeight = (sourceHeight * contentWidth) / canvas.width;

          pdf.addImage(
            pageImage,
            "JPEG",
            margin,
            margin,
            contentWidth,
            renderedHeight,
            undefined,
            "FAST",
          );

          remainingHeight -= renderedHeight;
          sourceY += sourceHeight;

          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }

      const fileName =
        `${customer.project || "Invoice"}-${invoice.invoiceNumber}`.trim();

      pdf.save(`${fileName}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  // --------------------------------
  // Clear form
  // --------------------------------

  const clearForm = () => {
    setCustomer({
      name: "",
      project: "",
      address: "",
      email: "",
      phone: "",
    });

    setInvoice({
      number: generateInvoiceNumber(),
      date: today,
      dueDate: "",
      terms: "Payment due within 30 days",
    });

    setPayment({
      method: "Cash",
      bank: "",
      accountName: "",
      accountNumber: "",
      instructions: "Thank you for your payment.",
    });

    setDeposit(0);

    setItems([
      {
        id: Date.now(),
        description: "",
        quantity: 1,
        price: 0,
      },
    ]);
  };

  return (
    <div className="app">
      {/* =========================
          HEADER
      ========================== */}

      <header className="topbar">
        <div>
          <h1>Ram's Invoice Generator</h1>

          <p>Create professional invoices and download them as PDF.</p>
        </div>

        <button
          className="download-button"
          onClick={downloadPDF}
          disabled={downloading}
        >
          {downloading ? "Generating..." : "Download PDF"}
        </button>
      </header>

      {/* =========================
          MAIN
      ========================== */}

      <main className="layout">
        <section className="editor">
          {/* =========================
              CUSTOMER DETAILS
          ========================== */}

          <div className="card">
            <h2>Customer Details</h2>

            <div className="grid">
              <Input
                label="Customer / Company Name"
                name="name"
                value={customer.name}
                onChange={updateObject(setCustomer)}
                placeholder="Enter customer or company name"
              />

              <Input
                label="Project"
                name="project"
                value={customer.project}
                onChange={updateObject(setCustomer)}
                placeholder="Enter project name"
              />

              <Input
                label="Email"
                name="email"
                value={customer.email}
                onChange={updateObject(setCustomer)}
                placeholder="Enter customer email"
              />

              <Input
                label="Phone"
                name="phone"
                value={customer.phone}
                onChange={updateObject(setCustomer)}
                placeholder="Enter phone number"
              />

              <TextArea
                label="Customer Address"
                name="address"
                value={customer.address}
                onChange={updateObject(setCustomer)}
                placeholder="Enter customer address"
              />
            </div>
          </div>

          {/* =========================
              INVOICE DETAILS
          ========================== */}

          <div className="card">
            <h2>Invoice Details</h2>
            <div className="grid">
              <Input
                label="Invoice Number"
                name="invoiceNumber"
                type="text"
                value={invoice.invoiceNumber}
                onChange={updateObject(setInvoice)}
                placeholder="Enter invoice number"
              />

              <Input
                label="Invoice Date"
                type="date"
                name="date"
                value={invoice.date}
                onChange={updateObject(setInvoice)}
              />

              <Input
                label="Due Date"
                type="date"
                name="dueDate"
                value={invoice.dueDate}
                onChange={updateObject(setInvoice)}
              />

              <Input
                label="Payment Terms"
                name="terms"
                value={invoice.terms}
                onChange={updateObject(setInvoice)}
                placeholder="e.g. Payment due within 30 days"
              />
            </div>
          </div>

          {/* =========================
              ITEMS
          ========================== */}

          <div className="card">
            <div className="card-title">
              <h2>Invoice Items</h2>

              <button className="secondary-button" onClick={addItem}>
                + Add Item
              </button>
            </div>

            <div className="items-editor">
              {items.map((item) => (
                <div className="item-row" key={item.id}>
                  <div className="field item-description">
                    <label>Description</label>

                    <input
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, "description", e.target.value)
                      }
                      placeholder="Enter item description"
                    />
                  </div>

                  <div className="field small">
                    <label>Qty</label>

                    <input
                      type="number"
                      min="0"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, "quantity", e.target.value)
                      }
                      placeholder="Qty"
                    />
                  </div>

                  <div className="field small">
                    <label>Unit Price</label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        updateItem(item.id, "price", e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="item-total">
                    <span>Amount</span>

                    <strong>{money(item.quantity * item.price)}</strong>
                  </div>

                  <button
                    className="delete-button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove item"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* =========================
              PAYMENT DETAILS
          ========================== */}

          <div className="card">
            <h2>Payment Details</h2>

            <div className="grid">
              <Input
                label="Deposit Amount"
                type="number"
                min="0"
                step="0.01"
                name="deposit"
                value={deposit}
                onChange={(e) => setDeposit(e.target.value)}
              />
              {/* Payment Method */}

              <div className="field">
                <label>Payment Method</label>

                <select
                  name="method"
                  value={payment.method}
                  onChange={updateObject(setPayment)}
                >
                  <option value="Cash">Cash</option>

                  <option value="Bank Transfer">Bank Transfer</option>

                  <option value="PayNow">PayNow</option>

                  <option value="Credit Card">Credit Card</option>

                  <option value="Debit Card">Debit Card</option>

                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Pay Now */}

              {payment.method === "PayNow" && (
                <div className="field">
                  <label>PayNow Number</label>
                  <input
                    type="text"
                    value={payNowNumber}
                    onChange={(e) => setPayNowNumber(e.target.value)}
                    placeholder="Enter PayNow number"
                  />
                </div>
              )}

              {/* Bank */}

              {(payment.method === "Bank Transfer" ||
                payment.method === "PayNow") && (
                <Input
                  label="Bank"
                  name="bank"
                  value={payment.bank}
                  onChange={updateObject(setPayment)}
                />
              )}

              {/* Account Name */}

              {(payment.method === "Bank Transfer" ||
                payment.method === "PayNow") && (
                <Input
                  label="Account Name"
                  name="accountName"
                  value={payment.accountName}
                  onChange={updateObject(setPayment)}
                />
              )}

              {/* Account Number */}

              {payment.method === "Bank Transfer" && (
                <Input
                  label="Account Number"
                  name="accountNumber"
                  value={payment.accountNumber}
                  onChange={updateObject(setPayment)}
                />
              )}

              {/* Payment Instructions */}

              <TextArea
                label="Payment Instructions"
                name="instructions"
                value={payment.instructions}
                onChange={updateObject(setPayment)}
              />
            </div>
          </div>

          {/* =========================
              CLEAR
          ========================== */}

          <button className="reset-button" onClick={clearForm}>
            Clear Form
          </button>
        </section>

        {/* =================================================
            INVOICE PREVIEW
        ================================================== */}

        <section className="preview-section">
          <div className="preview-header">
            <h2>Live Preview</h2>

            <span>A4 • SGD</span>
          </div>

          <div className="invoice-paper" ref={invoiceRef}>
            {/* HEADER */}

            <div className="invoice-header">
              <div>
                <div className="tax-invoice">INVOICE</div>
                <div className="submitted-name">J Srinivasu</div>
              </div>

              <div className="invoice-heading">
                <div className="invoice-number">
                  Invoice No: {invoice.invoiceNumber}
                </div>
              </div>
            </div>

            {/* META */}

            <div className="invoice-meta">
              <div>
                <span>Invoice Date</span>

                <strong>{formatDate(invoice.date)}</strong>
              </div>

              <div>
                <span>Due Date</span>

                <strong>{formatDate(invoice.dueDate)}</strong>
              </div>

              <div>
                <span>Payment Method</span>

                <strong>{payment.method}</strong>
              </div>
            </div>

            {/* CUSTOMER */}

            <div className="bill-section">
              <span className="section-label">BILL TO</span>

              <h3>{customer.name || "Customer Name"}</h3>

              <p>Project: {customer.project || ""}</p>

              <p>Address: {customer.address || "-"}</p>

              <p>Email:{customer.email || "-"}</p>

              <p>Phone:{customer.phone || "-"}</p>
            </div>

            {/* ITEMS */}

            <table className="invoice-table">
              <thead>
                <tr>
                  <th>Item No.</th>

                  <th>Description</th>

                  <th>Qty</th>

                  <th>Unit Price</th>

                  <th>Amount</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>

                    <td>{item.description || ""}</td>

                    <td>{item.quantity || ""}</td>

                    <td>{money(item.price)}</td>

                    <td>{money(item.quantity * item.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* BOTTOM */}

            <div className="invoice-bottom">
              {/* PAYMENT */}

              <div className="payment-box">
                <span className="section-label">PAYMENT DETAILS</span>

                <p>
                  <strong>Currency:</strong> SGD (S$)
                </p>

                <p>
                  <strong>Method:</strong> {payment.method}
                </p>

                {payment.method === "Bank Transfer" && (
                  <>
                    <p>
                      <strong>Bank:</strong> {payment.bank || "-"}
                    </p>

                    <p>
                      <strong>Account Name:</strong>{" "}
                      {payment.accountName || "-"}
                    </p>

                    <p>
                      <strong>Account No.:</strong>{" "}
                      {payment.accountNumber || "-"}
                    </p>
                  </>
                )}

                {payment.method === "PayNow" && (
                  <>
                    <p>
                      <strong>Bank:</strong> {payment.bank || "-"}
                    </p>

                    <p>
                      <strong>Account Name:</strong>{" "}
                      {payment.accountName || "-"}
                    </p>

                    <p>
                      <strong>PayNow Number:</strong> {payNowNumber || "-"}
                    </p>
                  </>
                )}

                <p>{payment.instructions || ""}</p>

                <p>
                  <strong>Terms:</strong> {invoice.terms || "-"}
                </p>
              </div>

              {/* TOTAL */}

              <div className="totals">
                <div>
                  <span>Subtotal</span>

                  <strong>{money(subtotal)}</strong>
                </div>

                <div className="deposit-row">
                  <span>Deposit Paid</span>

                  <strong>- {money(depositAmount)}</strong>
                </div>

                <div className="grand-total">
                  <span>Balance Due</span>

                  <strong>{money(balanceDue)}</strong>
                </div>
              </div>
            </div>

            {/* FOOTER */}

            <div className="invoice-footer">
              <span>Thank you for your business.</span>

              <strong>Submitted by J Srinivasu</strong>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// ========================================
// INPUT COMPONENT
// ========================================

function Input({ label, ...props }) {
  return (
    <div className="field">
      <label>{label}</label>

      <input {...props} />
    </div>
  );
}

// ========================================
// TEXT AREA COMPONENT
// ========================================

function TextArea({ label, ...props }) {
  return (
    <div className="field">
      <label>{label}</label>

      <textarea rows="3" {...props} />
    </div>
  );
}

export default App;
