import express from "express";
import axios from "axios";

const router = express.Router();

// This handles requests to POST /api/deepai/generate
router.post("/generate", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "A prompt is required." });
    }

    console.log("Prompt received for DeepAI:", prompt);

    const params = new URLSearchParams();
    params.append("text", prompt);

    const response = await axios.post(
      "https://api.deepai.org/api/text2img",
      params,
      {
        headers: {
          "api-key": process.env.DEEPAI_API_KEY,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const outputUrl = response.data.output_url;
    res.json({ outputUrl });

  } catch (err) {
    console.error("DeepAI error:", err.response?.data || err.message);
    res.status(500).json({
      error: "DeepAI request failed",
      details: err.response?.data || err.message,
    });
  }
});

export default router;