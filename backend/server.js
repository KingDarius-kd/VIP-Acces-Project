import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "data", "payments.json");

const app = express();

// Prices live here, not in the browser — the frontend only ever sends a
// plan id, never an amount, so nobody can pay less by editing the request.
const PLANS = {
  vip: { label: "VIP Access (2 weeks)", price: 1000, currency: "GHS" },
  single: { label: "Single Session", price: 600, currency: "GHS" },
};

// Paystack signs the *raw* request body for webhook verification, so we
// capture it here before express.json() parses it into an object.
app.use(cors());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

// ---- tiny JSON-file "database" -------------------------------------------

function readPayments() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function savePayment(record) {
  const payments = readPayments();
  const exists = payments.some((p) => p.tx_ref === record.tx_ref);
  if (exists) return;
  payments.push(record);
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(payments, null, 2));
}

// ---- routes ----------------------------------------------------------------

// List the plans so the frontend never has to hardcode prices either
app.get("/api/plans", (req, res) => {
  res.json(
    Object.entries(PLANS).map(([id, plan]) => ({ id, ...plan }))
  );
});

// Kick off a payment: create a reference and ask Paystack for a checkout link
app.post("/api/initialize", async (req, res) => {
  try {
    const { email, name, phone, plan } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const selectedPlan = PLANS[plan];
    if (!selectedPlan) {
      return res.status(400).json({ error: "Invalid plan selected." });
    }

    const tx_ref = `vip-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    // Paystack takes amounts in the smallest currency unit
    // (pesewas for GHS) — so multiply by 100.
    const amountInSubunits = Math.round(selectedPlan.price * 100);

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: amountInSubunits,
          currency: selectedPlan.currency,
          reference: tx_ref,
          callback_url: `${process.env.FRONTEND_URL}/success`,
          metadata: {
            name: name || "",
            phone: phone || "",
            plan,
            plan_label: selectedPlan.label,
          },
        }),
      }
    );

    const data = await response.json();

    if (!data.status) {
      console.error("Paystack init failed:", data);
      return res.status(502).json({ error: "Could not start payment." });
    }

    res.json({ link: data.data.authorization_url, tx_ref });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error starting payment." });
  }
});

// Confirm a payment actually went through before showing the success page details
app.get("/api/verify/:tx_ref", async (req, res) => {
  try {
    const { tx_ref } = req.params;

    // If the webhook already logged it, trust that first.
    const existing = readPayments().find((p) => p.tx_ref === tx_ref);
    if (existing) return res.json({ verified: true, payment: existing });

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${tx_ref}`,
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );
    const data = await response.json();

    if (data.status && data.data.status === "success") {
      const record = {
        tx_ref,
        amount: data.data.amount / 100,
        currency: data.data.currency,
        email: data.data.customer?.email,
        name: data.data.metadata?.name,
        phone: data.data.metadata?.phone,
        plan: data.data.metadata?.plan,
        plan_label: data.data.metadata?.plan_label,
        paid_at: data.data.paid_at,
      };
      savePayment(record);
      return res.json({ verified: true, payment: record });
    }

    res.json({ verified: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error verifying payment." });
  }
});

// Paystack calls this directly — the authoritative record of what was paid.
// Paystack signs the raw body with your secret key; we recompute it and
// compare, so only requests that really came from Paystack are trusted.
app.post("/api/webhook", (req, res) => {
  const expectedSignature = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
    .update(req.rawBody)
    .digest("hex");

  if (req.headers["x-paystack-signature"] !== expectedSignature) {
    return res.status(401).end();
  }

  const event = req.body;

  if (event?.event === "charge.success") {
    const data = event.data;
    savePayment({
      tx_ref: data.reference,
      amount: data.amount / 100,
      currency: data.currency,
      email: data.customer?.email,
      name: data.metadata?.name,
      phone: data.metadata?.phone,
      plan: data.metadata?.plan,
      plan_label: data.metadata?.plan_label,
      paid_at: data.paid_at,
    });
  }

  res.status(200).end();
});

// Quick way for you to check what's come in without opening the JSON file —
// this is the list you check to manually add people to the group.
app.get("/api/payments", (req, res) => {
  res.json(readPayments());
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));