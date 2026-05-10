const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;
const BUCKET = "photos";

export const config = {
  api: { bodyParser: { sizeLimit: "10mb" } },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  const token = req.headers["x-admin-token"];
  if (!token || token !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Server configuration missing" });
  }

  const { filename } = req.query;
  if (!filename) return res.status(400).json({ error: "Missing filename" });

  if (req.method === "POST") {
    try {
      const { data: base64data } = req.body;
      if (!base64data) return res.status(400).json({ error: "Missing data" });

      const base64 = base64data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      const contentType = base64data.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(filename)}`;
      const r = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: buffer,
      });

      if (!r.ok) {
        const err = await r.text();
        console.error("Supabase storage error:", err);
        return res.status(500).json({ error: "Upload failed", detail: err });
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(filename)}`;
      return res.status(200).json({ url: publicUrl });
    } catch (e) {
      return res.status(500).json({ error: "Upload error", detail: e.message });
    }
  }

  if (req.method === "DELETE") {
    try {
      const deleteUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(filename)}`;
      await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: "Delete error", detail: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-admin-token");
  if (req.method === "OPTIONS") return res.status(200).end();

  // Auth check
  const token = req.headers["x-admin-token"];
  if (!token || token !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Server configuration missing" });
  }

  const { filename } = req.query;
  if (!filename) return res.status(400).json({ error: "Missing filename" });

  // POST — upload photo
  if (req.method === "POST") {
    try {
      const { data: base64data } = req.body;
      if (!base64data) return res.status(400).json({ error: "Missing data" });

      // Convert base64 to buffer
      const base64 = base64data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64, "base64");
      const contentType = base64data.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(filename)}`;
      const r = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: buffer,
      });

      if (!r.ok) {
        const err = await r.text();
        return res.status(500).json({ error: "Upload failed", detail: err });
      }

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${encodeURIComponent(filename)}`;
      return res.status(200).json({ url: publicUrl });
    } catch (e) {
      return res.status(500).json({ error: "Upload error", detail: e.message });
    }
  }

  // DELETE — remove photo
  if (req.method === "DELETE") {
    try {
      const deleteUrl = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${encodeURIComponent(filename)}`;
      await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: "Delete error", detail: e.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
