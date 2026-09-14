import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    adminId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    trade: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "", lowercase: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Vendor", vendorSchema);
