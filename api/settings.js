const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { key } = req.query;
  if (!key) return res.status(400).json({ error: "Missing key" });

  // GET — public, anyone can read settings
  if (req.method === "GET") {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/settings?key=eq.${key}&select=value`,
        { headers }
      );
      const data = await r.json();
      return res.status(200).json({ value: data?.[0]?.value ?? null });
    } catch (e) {
      return res.status(500).json({ error: "Failed to get setting" });
    }
  }

  // POST — requires admin token
  if (req.method === "POST") {
    const token = req.headers["x-admin-token"];
    if (!token || token !== ADMIN_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const { value } = req.body;
      await fetch(`${SUPABASE_URL}/rest/v1/settings?key=eq.${key}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ value }),
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: "Failed to set setting" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
