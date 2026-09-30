import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyPayment } from "../lib/api.js";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER;

export default function Success() {
  const [params] = useSearchParams();
  // Paystack redirects back with ?reference=...&trxref=... (same value, twice)
  const tx_ref = params.get("reference") || params.get("trxref");
  const [state, setState] = useState("checking"); // checking | verified | failed

  useEffect(() => {
    if (!tx_ref) {
      setState("failed");
      return;
    }
    verifyPayment(tx_ref)
      .then((data) => setState(data.verified ? "verified" : "failed"))
      .catch(() => setState("failed"));
  }, [tx_ref]);

  const whatsappMessage = encodeURIComponent(
    `Hi! I just paid for VIP access. My reference number is ${tx_ref}.`
  );
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      {state === "checking" && (
        <p className="text-sage">Confirming your payment…</p>
      )}

      {state === "verified" && (
        <>
          <span className="text-4xl">✓</span>
          <h1 className="mt-4 font-display text-2xl text-ivory">
            Payment received
          </h1>
          <p className="mt-2 text-sm text-sage">
            Keep this reference number — you'll need it to get added:
          </p>
          <p className="mt-2 rounded-lg border border-white/10 bg-panel px-4 py-2 font-mono text-sm text-brass">
            {tx_ref}
          </p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="mt-6 w-full rounded-lg bg-emerald py-3 font-medium text-ink transition hover:opacity-90"
          >
            Confirm on WhatsApp
          </a>
          <p className="mt-3 text-xs text-sage/70">
            This opens WhatsApp with your reference already filled in — just
            hit send.
          </p>
        </>
      )}

      {state === "failed" && (
        <>
          <h1 className="font-display text-2xl text-ivory">
            We couldn't confirm this payment
          </h1>
          <p className="mt-2 text-sm text-sage">
            If money left your account, message us on WhatsApp with your
            details and we'll sort it out.
          </p>
          <Link
            to="/"
            className="mt-6 rounded-lg border border-white/10 px-4 py-2 text-sm text-ivory"
          >
            Back to VIP page
          </Link>
        </>
      )}
    </main>
  );
}
