import express from "express";
import axios from "axios";

const router = express.Router();

const NASA_KEY = process.env.NASA_API_KEY || "";

// helper function to validate YYYY-MM-DD
function isValidDateString(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === s;
}

// GET /api/discover?dob=YYYY-MM-DD
router.get("/discover", async (req, res) => {
  try {
    const date = req.query.dob?.trim();
    if (!date) return res.status(400).json({ error: "Missing dob parameter" });
    if (!isValidDateString(date)) return res.status(400).json({ error: "Invalid date format (YYYY-MM-DD)" });

    // Fetch APOD (Astronomy Picture of the Day)
    const apodResp = await axios.get("https://api.nasa.gov/planetary/apod", {
      params: { api_key: NASA_KEY, date },
    });

    res.json({
      date,
      apod: apodResp.data,
      note: "Check media_type: 'image' or 'video'",
    });
  } catch (err) {
    console.error("NASA fetch error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch NASA data" });
  }
});

export default router;
