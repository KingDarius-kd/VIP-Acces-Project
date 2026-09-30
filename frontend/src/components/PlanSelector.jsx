import { useEffect, useState } from "react";
import { getPlans, startPayment } from "../lib/api.js";

export default function PlanSelector() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  useEffect(() => {
    getPlans()
      .then((data) => {
        setPlans(data);
        if (data.length) setSelectedPlan(data[0].id);
      })
      .catch(() => setError("Could not load pricing. Refresh the page."));
  }, []);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const { link } = await startPayment({ ...form, plan: selectedPlan });
      window.location.href = link;
    } catch (err) {
      setStatus("error");
      setError("Something went wrong starting your payment. Try again.");
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-panel p-8 shadow-xl shadow-black/20">
      <div className="space-y-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            type="button"
            onClick={() => setSelectedPlan(plan.id)}
            className={`w-full rounded-xl border px-5 py-4 text-left transition ${
              selectedPlan === plan.id
                ? "border-brass bg-panel2"
                : "border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-ivory">{plan.label}</span>
              <span className="font-display text-xl text-ivory">
                {plan.currency === "GHS" ? "₵" : plan.currency}
                {plan.price}
              </span>
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          required
          name="name"
          placeholder="Full name"
          value={form.name}
          onChange={handleChange}
          className="w-full rounded-lg border border-white/10 bg-panel2 px-4 py-3 text-sm text-ivory placeholder:text-sage/70 focus:border-brass focus:outline-none"
        />
        <input
          required
          type="email"
          name="email"
          placeholder="Email address"
          value={form.email}
          onChange={handleChange}
          className="w-full rounded-lg border border-white/10 bg-panel2 px-4 py-3 text-sm text-ivory placeholder:text-sage/70 focus:border-brass focus:outline-none"
        />
        <input
          name="phone"
          placeholder="Phone number (for Mobile Money)"
          value={form.phone}
          onChange={handleChange}
          className="w-full rounded-lg border border-white/10 bg-panel2 px-4 py-3 text-sm text-ivory placeholder:text-sage/70 focus:border-brass focus:outline-none"
        />

        <button
          type="submit"
          disabled={status === "loading" || !selectedPlan}
          className="w-full rounded-lg bg-brass py-3 font-medium text-ink transition hover:bg-brass-light disabled:opacity-60"
        >
          {status === "loading" ? "Starting payment…" : "Continue to payment"}
        </button>

        {status === "error" && <p className="text-sm text-red-400">{error}</p>}
        {error && status !== "error" && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </form>

      <div className="mt-5 flex flex-wrap gap-2 text-xs text-sage">
        <span className="rounded-full border border-white/10 px-3 py-1">
          Card
        </span>
        <span className="rounded-full border border-white/10 px-3 py-1">
          Bank transfer / USSD
        </span>
        <span className="rounded-full border border-white/10 px-3 py-1">
          Mobile Money
        </span>
      </div>
    </div>
  );
}