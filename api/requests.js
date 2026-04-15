const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  // GET all requests — admin only
  if (req.method === "GET") {
    const token = req.headers["x-admin-token"];
    if (!token || token !== ADMIN_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/requests?select=*&order=submitted_at.desc`,
        { headers }
      );
      const data = await r.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: "Failed to get requests" });
    }
  }

  // POST — add new booking request (public — guests submit this)
  if (req.method === "POST") {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/requests`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=representation" },
        body: JSON.stringify(req.body),
      });
      const data = await r.json();
      return res.status(200).json(data);
    } catch (e) {
      return res.status(500).json({ error: "Failed to add request" });
    }
  }

  // PATCH — update request (admin only)
  if (req.method === "PATCH") {
    const token = req.headers["x-admin-token"];
    if (!token || token !== ADMIN_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Missing id" });
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/requests?id=eq.${id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(req.body),
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: "Failed to update request" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
