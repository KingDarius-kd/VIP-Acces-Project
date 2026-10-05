import PlanSelector from "../components/PlanSelector.jsx";
import FAQItem from "../components/FAQItem.jsx";

const benefits = [
  "Daily market breakdowns and setups shared with the group",
  "Direct access to ask questions during active sessions",
  "A smaller, focused group — not a crowded public channel",
  "Session replays if you miss a live walkthrough",
];

const faqs = [
  {
    question: "How fast will I get added to the group?",
    answer:
      "Once your payment goes through, send the confirmation message on Telegram using the button on the confirmation page. You'll be added shortly after.",
  },
  {
    question: "Which payment methods can I use?",
    answer:
      "Card (Visa, Mastercard), bank transfer or USSD if you're in Nigeria, and Mobile Money (MTN, Vodafone, AirtelTigo) if you're in Ghana. International cards work from any country.",
  },
  {
    question: "What's the difference between the two plans?",
    answer:
      "Premium Group gives you access to the shared group with daily sessions. Private Coaching is one-on-one, tailored directly to you.",
  },
  {
    question: "Can I get a refund?",
    answer:
      "Reach out on Telegram within 24 hours of payment if something went wrong and we'll sort it out.",
  },
];

export default function Landing() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16 sm:py-24">
      <header className="text-center">
        <svg
          viewBox="0 0 200 200"
          className="mx-auto h-10 w-10"
          aria-hidden="true"
        >
          <rect x="0" y="0" width="200" height="200" rx="40" fill="#0F1714" />
          <rect x="55" y="90" width="26" height="70" rx="5" fill="#C9A227" />
          <rect x="121" y="50" width="26" height="110" rx="5" fill="#C9A227" />
          <line
            x1="81"
            y1="125"
            x2="121"
            y2="85"
            stroke="#EDEAE0"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M143 72 L165 50 M165 50 L165 66 M165 50 L149 50"
            fill="none"
            stroke="#EDEAE0"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p className="mt-3 text-sm font-medium tracking-wide text-brass">
          Habby Forex
        </p>
        <h1 className="mt-4 font-display text-4xl leading-tight text-ivory sm:text-5xl">
          Learn to trade with
          <br />
          people who'll answer you back.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sage">
          A focused forex training group — live sessions, real setups, and
          direct access to ask questions as you learn.
        </p>
      </header>

      <section className="mt-12">
        <PlanSelector />
      </section>

      <section className="mt-14">
        <h2 className="font-display text-xl text-ivory">What you get</h2>
        <ul className="mt-4 space-y-3">
          {benefits.map((b) => (
            <li key={b} className="flex gap-3 text-sm text-ivory/90">
              <span className="mt-0.5 text-emerald">✓</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-xl text-ivory">
          Frequently asked questions
        </h2>
        <div className="mt-2">
          {faqs.map((f) => (
            <FAQItem key={f.question} {...f} />
          ))}
        </div>
      </section>

      <footer className="mt-16 text-center text-xs text-sage/70">
        Payments are processed securely by Paystack. We never see or store
        your card details. Trading involves risk — no outcome is guaranteed.
      </footer>
    </main>
  );
}