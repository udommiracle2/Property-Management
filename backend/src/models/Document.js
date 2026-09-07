import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    kind: { type: String, default: "" },
    entityType: { type: String, default: "" }, // property | unit | tenant | lease | ...
    entityId: { type: String, default: "", index: true },
    mime: { type: String, default: "" },
    dataUrl: { type: String, default: "" },
    uploadedAt: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
