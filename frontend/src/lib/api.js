const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function getPlans() {
  const res = await fetch(`${API_URL}/api/plans`);
  if (!res.ok) throw new Error("Could not load plans.");
  return res.json();
}

export async function startPayment({ name, email, phone, plan }) {
  const res = await fetch(`${API_URL}/api/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, phone, plan }),
  });
  if (!res.ok) throw new Error("Could not start payment.");
  return res.json();
}

export async function verifyPayment(tx_ref) {
  const res = await fetch(`${API_URL}/api/verify/${tx_ref}`);
  if (!res.ok) throw new Error("Could not verify payment.");
  return res.json();
}