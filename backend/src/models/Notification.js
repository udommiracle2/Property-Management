import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    kind: { type: String, default: "" },
    title: { type: String, default: "" },
    body: { type: String, default: "" },
    refType: { type: String, default: "" },
    refId: { type: String, default: "" },
    createdAt: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
