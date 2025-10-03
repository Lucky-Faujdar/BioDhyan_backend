import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./utils/db.js";
import searchRoute from "./routes/search.js";
import deepaiRoute from "./routes/deepai.js";
import NasaData from "./models/NasaData.js";

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// --- CORS ---
app.use(
  cors({
    origin: ["http://localhost:5173", "https://nasa-project-6byr.onrender.com"], // Allow all temporarily for testing
    credentials: true,
  })
);

// --- Health Check ---
app.get("/api/health", (req, res) => res.json({ ok: true }));

// --- API Routes ---
app.use("/api/search", searchRoute);
app.use("/api/deepai", deepaiRoute);

// --- Serve Frontend ---
app.use(express.static(path.join(__dirname, "..", "..", "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "..", "dist", "index.html"));
});

// --- Start server after DB connection ---
async function start() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    // Ensure indexes
    try {
      await NasaData.init();
      console.log("✅ Indexes ensured");
    } catch (err) {
      console.warn("⚠️ Index init warning:", err.message);
    }

    app.listen(PORT, HOST, () =>
      console.log(`🚀 Server running at http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Server start failed:", err);
    process.exit(1);
  }
}

start();
