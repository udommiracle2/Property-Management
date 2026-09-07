import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    phone: { type: String, default: "" },
    rel: { type: String, default: "" },
  },
  { _id: false }
);

const employmentSchema = new mongoose.Schema(
  {
    employer: { type: String, default: "" },
    income: { type: Number, default: 0 },
    position: { type: String, default: "" },
  },
  { _id: false }
);

const tenantSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true, index: true },
    phone: { type: String, default: "" },
    unitId: { type: String, default: "", index: true },
    rent: { type: Number, default: 0 },
    status: { type: String, default: "Active" }, // Active | Past | etc.
    joined: { type: String, default: "" }, // ISO date string
    score: { type: Number, default: 0 },
    emergencyContact: { type: emergencyContactSchema, default: () => ({}) },
    employment: { type: employmentSchema, default: () => ({}) },
    notes: { type: String, default: "" },
    coTenantIds: [{ type: String }],
    pets: [{ type: mongoose.Schema.Types.Mixed }],
    documents: [{ type: mongoose.Schema.Types.Mixed }],
  },
  { timestamps: true }
);

export default mongoose.model("Tenant", tenantSchema);
