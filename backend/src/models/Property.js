import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    adminId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, default: "" },
    type: { type: String, default: "" }, // e.g. Apartment, House, Commercial
    monthlyRevenue: { type: Number, default: 0 },
    ownerId: { type: String, default: "" },
    ownershipPct: { type: Number, default: 100 },
    amenities: [{ type: String }],
    photoDataUrls: [{ type: String }],
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Property", propertySchema);
