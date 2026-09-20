import mongoose from "mongoose";

const threadItemSchema = new mongoose.Schema(
  {
    text: { type: String, default: "" },
    from: { type: String, default: "" },
    // Who actually sent this — the reliable discriminator for left/right
    // alignment in the UI. `from` is just a display name and can collide
    // (the same person can be both an admin and a tenant).
    role: { type: String, enum: ["admin", "tenant"], default: "admin" },
    at: { type: String, default: "" },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    adminId: { type: String, required: true, index: true },
    from: { type: String, default: "" },
    subject: { type: String, default: "" },
    preview: { type: String, default: "" },
    time: { type: String, default: "" },
    unread: { type: Boolean, default: true },
    thread: [threadItemSchema],
    // Optional link to tenant for tenant-portal filtering
    tenantId: { type: String, default: "", index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);
