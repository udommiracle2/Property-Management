import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    adminId: { type: String, required: true, index: true },
    date: { type: String, default: "" },
    category: { type: String, default: "" },
    description: { type: String, default: "" },
    amount: { type: Number, required: true },
    propertyId: { type: String, default: "" },
    unitId: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Expense", expenseSchema);
