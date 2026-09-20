import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "tenant"],
      default: "admin",
    },
    // Every account can act as an admin (landlord) for its own properties —
    // that needs no explicit flag, since admin-owned records are simply
    // scoped by adminId = this user's own id. tenantIds is what lets the
    // SAME account also be a tenant, possibly of several different
    // landlords: each entry links to one Tenant document (created by some
    // landlord) that shares this account's email. Capped at 5 — see
    // routes/auth.js. `role` above is now just "which side this account
    // defaults into" (set at registration, changeable by which mode a
    // session picks at login) — it no longer gates access to either side.
    tenantIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

userSchema.statics.hashPassword = async function (plain) {
  return bcrypt.hash(plain, 12);
};

export default mongoose.model("User", userSchema);
