/**
 * Optional seed script – creates a demo admin user.
 * Run: npm run seed
 */
import "dotenv/config";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/housing_system";

await connectDB(MONGODB_URI);

const email = process.env.SEED_ADMIN_EMAIL || "admin@housing.local";
const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
const name = process.env.SEED_ADMIN_NAME || "System Admin";

const existing = await User.findOne({ email });
if (existing) {
  console.log(`Admin already exists: ${email}`);
} else {
  const passwordHash = await User.hashPassword(password);
  await User.create({ name, email, passwordHash, role: "admin" });
  console.log(`Created admin user:`);
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
}

process.exit(0);
