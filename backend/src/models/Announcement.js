import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    adminId: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    body: { type: String, default: "" },
    createdAt: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Announcement", announcementSchema);
