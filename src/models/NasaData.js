// src/models/NasaData.js
import mongoose from "mongoose";

const NasaSchema = new mongoose.Schema({
  date: { type: String, unique: true }, // APOD has date
  title: String,
  explanation: String,
  url: String,
  hdurl: String,
  media_type: String,
  service_version: String
}, { timestamps: true });

// text index for fast full-text search on title and explanation
NasaSchema.index({ title: "text", explanation: "text" });

const NasaData = mongoose.model("NasaData", NasaSchema);
export default NasaData;
