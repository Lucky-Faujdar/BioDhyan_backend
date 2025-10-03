// src/routes/search.js
import express from "express";
import axios from "axios";
import NasaData from "../models/NasaData.js";

const router = express.Router();

// GET /api/search?q=...&page=1&limit=12
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const page = Math.max(1, parseInt(req.query.page || "1"));
    const limit = Math.min(100, parseInt(req.query.limit || "12"));
    const skip = (page - 1) * limit;

    console.log("Search query:", q, "Page:", page, "Limit:", limit);

    let results = [];
    let total = 0;

    if (q) {
      // 🔹 MongoDB text search with fallback
      try {
        results = await NasaData.find({ $text: { $search: q } }, { score: { $meta: "textScore" } })
          .sort({ score: { $meta: "textScore" } })
          .skip(skip)
          .limit(limit)
          .lean();

        total = await NasaData.countDocuments({ $text: { $search: q } });
      } catch (e) {
        console.warn("Text search failed, fallback to regex:", e.message);
      }

      // 🔹 Regex search fallback
      if (results.length === 0) {
        const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const fallbackQuery = { $or: [{ title: regex }, { explanation: regex }] };
        results = await NasaData.find(fallbackQuery)
          .skip(skip)
          .limit(limit)
          .lean();
        total = await NasaData.countDocuments(fallbackQuery);
      }

      // 🔹 NASA API fallback
      if (results.length === 0) {
        try {
          const nasaRes = await axios.get(
            `https://images-api.nasa.gov/search?q=${encodeURIComponent(q)}&media_type=image`
          );
          results = nasaRes.data.collection.items.slice(0, limit).map((item) => ({
            title: item.data[0].title,
            explanation: item.data[0].description,
            url: item.links?.[0]?.href,
            media_type: "image",
          }));
          total = results.length;
        } catch (e) {
          console.error("NASA API fallback failed:", e.message);
        }
      }
    } else {
      // No query: latest items from DB
      results = await NasaData.find()
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
      total = await NasaData.countDocuments();
    }

    return res.json({ total, page, limit, results });
  } catch (err) {
    console.error("Search API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
