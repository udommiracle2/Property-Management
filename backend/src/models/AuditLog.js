import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    adminId: { type: String, required: true, index: true },
    actor: { type: String, default: "" },
    action: { type: String, default: "" },
    entityType: { type: String, default: "" },
    entityId: { type: String, default: "" },
    detail: { type: String, default: "" },
    at: { type: String, default: "" },
  },
  { timestamps: true }
);

// Keep the collection from growing unbounded
auditLogSchema.index({ at: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
