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

// Prices are set in USD (what shows on the page) but charged in GHS, since
// that's the only currency this Paystack account is approved for. The USD
// figure is just for display — Paystack never sees it.
const PLANS = {
  premium: { label: "Premium Group", priceUSD: 80 },
  coaching: { label: "Private Coaching", priceUSD: 200 },
};

// Use this if the live rate lookup ever fails — update it occasionally by
// checking a current USD→GHS rate so it doesn't drift too far from reality.
const FALLBACK_USD_TO_GHS_RATE = 11.5;

let cachedRate = null;
let cachedAt = 0;
const RATE_CACHE_MS = 60 * 60 * 1000; // 1 hour

async function getUsdToGhsRate() {
  const now = Date.now();
  if (cachedRate && now - cachedAt < RATE_CACHE_MS) return cachedRate;

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    const rate = data?.rates?.GHS;
    if (typeof rate === "number" && rate > 0) {
      cachedRate = rate;
      cachedAt = now;
      return rate;
    }
    throw new Error("GHS rate missing from response");
  } catch (err) {
    console.error("Exchange rate lookup failed, using fallback:", err.message);
    return FALLBACK_USD_TO_GHS_RATE;
  }
}

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

// List the plans with both the USD display price and the live GHS amount
// that will actually be charged, so the frontend can show both.
app.get("/api/plans", async (req, res) => {
  const rate = await getUsdToGhsRate();
  res.json(
    Object.entries(PLANS).map(([id, plan]) => ({
      id,
      label: plan.label,
      priceUSD: plan.priceUSD,
      chargeAmount: Math.round(plan.priceUSD * rate),
      chargeCurrency: "GHS",
    }))
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

    const rate = await getUsdToGhsRate();
    const ghsAmount = Math.round(selectedPlan.priceUSD * rate);

    const tx_ref = `vip-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    // Paystack takes amounts in the smallest currency unit
    // (pesewas for GHS) — so multiply by 100.
    const amountInSubunits = Math.round(ghsAmount * 100);

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
          currency: "GHS",
          reference: tx_ref,
          callback_url: `${process.env.FRONTEND_URL}/success`,
          metadata: {
            name: name || "",
            phone: phone || "",
            plan,
            plan_label: selectedPlan.label,
            price_usd: selectedPlan.priceUSD,
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
        price_usd: data.data.metadata?.price_usd,
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
      price_usd: data.metadata?.price_usd,
      paid_at: data.paid_at,
    });
  }

  res.status(200).end();
});

// Quick way for you to check what's come in without opening the JSON file —
// this is the list you check to manually add people to the group. Guarded
// by a password since it contains customer emails and names.
app.get("/api/payments", (req, res) => {
  const password = req.headers["x-admin-password"];
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json(readPayments());
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));