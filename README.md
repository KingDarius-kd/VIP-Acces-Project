# VIP Access — Payment Page

A payment page that replaces manual account-detail sharing. Customers land on
the page, pay by card, Nigerian bank transfer/USSD, or Mobile Money, and get
a reference number to confirm with you on WhatsApp so you can add them to
the VIP group.

```
vip-access-project/
├── frontend/   React + Vite + Tailwind — the page customers see
├── backend/    Node + Express — talks to Flutterwave, logs payments
└── README.md
```

## How it works

1. Customer opens the page, sees the VIP offer, clicks **Get VIP Access**.
2. The frontend asks the backend to start a payment.
3. The backend calls Flutterwave and gets back a secure checkout link.
4. Customer is sent to that link, pays with whichever method they prefer
   (card, bank transfer, USSD, or Mobile Money).
5. Flutterwave sends them back to the **/success** page with a reference
   number, and separately notifies your backend via a webhook.
6. The backend records every successful payment in `backend/data/payments.json`
   — this is your source of truth, so you're never just trusting a screenshot.
7. The success page shows the reference and a **Confirm on WhatsApp** button
   that opens a pre-filled message so the customer doesn't have to type
   anything.
8. You check the reference against `payments.json` (or the log we can turn
   into a simple dashboard later) and add them to the VIP group.

## 1. Get your Flutterwave keys

1. Create a free account at [flutterwave.com](https://flutterwave.com).
2. In the dashboard, go to **Settings → API Keys**.
3. Copy your **Public Key** and **Secret Key** (use the **Test** keys first).
4. In **Settings → Webhooks**, set the webhook URL to
   `https://your-backend-url.com/api/webhook` once the backend is deployed,
   and set a **Secret Hash** (any random string) — you'll need it below.

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# open .env and paste in your Flutterwave keys
npm install
npm run dev
```

The backend runs on `http://localhost:4000` by default.

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# open .env and set VITE_API_URL if your backend isn't on localhost:4000
npm install
npm run dev
```

The site runs on `http://localhost:5173`.

## 4. Customize before going live

- `frontend/src/pages/Landing.jsx` — headline, price, benefits, FAQ copy
- `frontend/src/pages/Success.jsx` — the WhatsApp number the button messages
- `backend/.env` — the VIP price and currency
- Swap the placeholder logo/image in `frontend/public/`

## 5. Going live

- Switch your Flutterwave keys from **Test** to **Live** in both `.env` files.
- Flutterwave requires a verified business on your account before Live keys
  can accept real money — do this early, it can take a few days.
- Deploy the backend somewhere like Render or Railway (free tiers work for
  low volume), and the frontend to Vercel or Netlify.
- Update the webhook URL in the Flutterwave dashboard to your live backend
  URL.

## Costs

- Flutterwave: free to sign up, no monthly fee — they take a small
  percentage per successful transaction only.
- Hosting: free tiers on Vercel/Netlify (frontend) and Render/Railway
  (backend) are enough for this kind of low-traffic page.
- A custom domain is optional, roughly $10–15/year if you want one.
