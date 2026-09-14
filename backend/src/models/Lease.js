import mongoose from "mongoose";

const depositRefundSchema = new mongoose.Schema(
  {
    amount: { type: Number, default: 0 },
    date: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const recurringSchema = new mongoose.Schema(
  {
    dayOfMonth: { type: Number, default: 1 },
    active: { type: Boolean, default: false },
  },
  { _id: false }
);

const leaseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    adminId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    unitId: { type: String, required: true, index: true },
    start: { type: String, default: "" },
    end: { type: String, default: "" },
    rent: { type: Number, default: 0 },
    deposit: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["Active", "Expiring", "Expired", "Terminated", "Draft"],
      default: "Active",
    },
    signedAt: { type: String, default: "" },
    signatureName: { type: String, default: "" },
    addendums: [{ type: mongoose.Schema.Types.Mixed }],
    notices: [{ type: mongoose.Schema.Types.Mixed }],
    depositRefund: { type: depositRefundSchema, default: () => ({}) },
    recurring: { type: recurringSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export default mongoose.model("Lease", leaseSchema);
