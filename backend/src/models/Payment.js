import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    invoiceId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    method: { type: String, default: "" },
    paidAt: { type: String, default: "" },
    note: { type: String, default: "" },
    receiptNo: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
