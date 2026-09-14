import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    adminId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    unitId: { type: String, default: "", index: true },
    tenantId: { type: String, default: "", index: true },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Emergency"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "In Progress", "Completed", "Cancelled", "On Hold"],
      default: "Open",
    },
    created: { type: String, default: "" },
    updated: { type: String, default: "" },
    vendorId: { type: String, default: "" },
    photos: [{ type: String }],
    isPreventive: { type: Boolean, default: false },
    scheduleCron: { type: String, default: "" },
    dueAt: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Maintenance", maintenanceSchema);
