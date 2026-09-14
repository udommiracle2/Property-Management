import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    adminId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    due: { type: String, default: "" },
    paid: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Pending", "Paid", "Overdue", "Partial", "Cancelled"],
      default: "Pending",
    },
    method: { type: String, default: "" },
    lateFee: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Invoice", invoiceSchema);
