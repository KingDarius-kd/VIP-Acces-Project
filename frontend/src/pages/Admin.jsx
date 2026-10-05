import { useState } from "react";
import { getPayments } from "../lib/api.js";

export default function Admin() {
  const [password, setPassword] = useState("");
  const [payments, setPayments] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const data = await getPayments(password);
      // Newest first
      setPayments(data.slice().reverse());
      setStatus("idle");
    } catch (err) {
      setError(err.message || "Something went wrong.");
      setStatus("error");
    }
  }

  if (!payments) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col items-center justify-center px-6">
        <h1 className="font-display text-2xl text-ivory">Admin</h1>
        <form onSubmit={handleSubmit} className="mt-6 w-full space-y-3">
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-panel2 px-4 py-3 text-sm text-ivory placeholder:text-sage/70 focus:border-brass focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-lg bg-brass py-3 font-medium text-ink transition hover:bg-brass-light disabled:opacity-60"
          >
            {status === "loading" ? "Checking…" : "View payments"}
          </button>
          {status === "error" && (
            <p className="text-sm text-red-400">{error}</p>
          )}
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ivory">
          Payments ({payments.length})
        </h1>
        <button
          onClick={() => setPayments(null)}
          className="text-sm text-sage underline"
        >
          Lock
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-panel2 text-xs uppercase text-sage">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Reference</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.tx_ref} className="border-t border-white/10">
                <td className="px-4 py-3 text-ivory/80">
                  {p.paid_at ? new Date(p.paid_at).toLocaleString() : "-"}
                </td>
                <td className="px-4 py-3 text-ivory">{p.name || "-"}</td>
                <td className="px-4 py-3 text-ivory/80">{p.email || "-"}</td>
                <td className="px-4 py-3 text-ivory/80">
                  {p.plan_label || p.plan || "-"}
                </td>
                <td className="px-4 py-3 text-brass">
                  {p.currency} {p.amount}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-sage">
                  {p.tx_ref}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-sage">
                  No payments yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}