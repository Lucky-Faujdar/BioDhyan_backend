// src/scripts/seed.js
import dotenv from "dotenv";
dotenv.config();
import axios from "axios";
import { connectDB } from "../utils/db.js";
import NasaData from "../models/NasaData.js";

const API_KEY = process.env.NASA_API_KEY;
if (!API_KEY) {
  console.error("Please set NASA_API_KEY in .env");
  process.exit(1);
}

async function fetchAndSeed(count = 50) {
  await connectDB(process.env.MONGO_URI);
  try {
    console.log(`Fetching ${count} APOD items from NASA...`);
    const res = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${API_KEY}&count=${count}`);
    const items = res.data;

    // Build bulk ops (upsert by date)
    const ops = items.map(it => ({
      updateOne: {
        filter: { date: it.date },
        update: { $set: it },
        upsert: true
      }
    }));

    if (ops.length) {
      const result = await NasaData.bulkWrite(ops);
      console.log("✅ Seed complete:", result.nUpserted, "upserted");
    } else {
      console.log("No items returned from NASA.");
    }
  } catch (err) {
    console.error("Seed error:", err.response?.data || err.message || err);
  } finally {
    process.exit(0);
  }
}

fetchAndSeed(50);
