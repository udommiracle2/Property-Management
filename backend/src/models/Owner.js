import mongoose from "mongoose";

const ownerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true },
    phone: { type: String, default: "" },
    ownershipPct: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Owner", ownerSchema);
