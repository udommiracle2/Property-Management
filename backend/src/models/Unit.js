import mongoose from "mongoose";

const unitSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    propertyId: { type: String, required: true, index: true },
    label: { type: String, required: true },
    bedrooms: { type: Number, default: 0 },
    sqft: { type: Number, default: 0 },
    rent: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Vacant", "Occupied", "Under Maintenance", "Notice Given"],
      default: "Vacant",
    },
    photoDataUrls: [{ type: String }],
    floorPlanDataUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Unit", unitSchema);
