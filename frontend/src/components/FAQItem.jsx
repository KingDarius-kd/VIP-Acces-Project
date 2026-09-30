export default function FAQItem({ question, answer }) {
  return (
    <details className="group border-b border-white/10 py-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-ivory">
        <span className="font-medium">{question}</span>
        <span className="shrink-0 text-brass transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-sage">
        {answer}
      </p>
    </details>
  );
}
