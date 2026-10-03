import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { verifyPayment } from "../lib/api.js";

const TELEGRAM_USERNAME = import.meta.env.VITE_TELEGRAM_USERNAME;

export default function Success() {
  const [params] = useSearchParams();
  const tx_ref = params.get("reference") || params.get("trxref");
  const [state, setState] = useState("checking"); // checking | verified | failed
  const [payment, setPayment] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!tx_ref) {
      setState("failed");
      return;
    }
    verifyPayment(tx_ref)
      .then((data) => {
        if (data.verified) {
          setPayment(data.payment);
          setState("verified");
        } else {
          setState("failed");
        }
      })
      .catch(() => setState("failed"));
  }, [tx_ref]);

  const message = payment
    ? `Hi! I just paid for ${payment.plan_label || "VIP access"}.\n` +
      `Name: ${payment.name || "-"}\n` +
      `Amount: ${payment.currency} ${payment.amount}\n` +
      `Reference: ${tx_ref}`
    : `Hi! I just paid for VIP access. My reference number is ${tx_ref}.`;

  function handleCopy() {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const telegramLink = `https://t.me/${TELEGRAM_USERNAME}`;

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
            Copy this message, then send it on Telegram to get added:
          </p>

          <button
            onClick={handleCopy}
            className="mt-3 w-full whitespace-pre-line rounded-lg border border-white/10 bg-panel px-4 py-3 text-left font-mono text-xs text-brass transition hover:border-brass/50"
          >
            {message}
          </button>
          <p className="mt-1 text-xs text-sage/70">
            {copied ? "Copied!" : "Tap the box above to copy"}
          </p>

          <a
            href={telegramLink}
            target="_blank"
            rel="noreferrer"
            className="mt-6 w-full rounded-lg bg-emerald py-3 font-medium text-ink transition hover:opacity-90"
          >
            Open Telegram
          </a>
          <p className="mt-3 text-xs text-sage/70">
            This opens the chat — paste the message above and hit send.
          </p>
        </>
      )}

      {state === "failed" && (
        <>
          <h1 className="font-display text-2xl text-ivory">
            We couldn't confirm this payment
          </h1>
          <p className="mt-2 text-sm text-sage">
            If money left your account, message us on Telegram with your
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