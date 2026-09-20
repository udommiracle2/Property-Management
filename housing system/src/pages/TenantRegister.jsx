import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function TenantRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { tenantRegister } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await tenantRegister(name, email, password);
      navigate("/tenant"); // Hard-redirect to Tenant Portal
    } catch (err) {
      setError(err.message || "Activation failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full space-y-4 bg-white p-6 rounded-xl shadow">
        <h2 className="text-2xl font-bold text-center">Activate Resident Access</h2>

        {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded mt-1"
            />
          </div>
          <button type="submit" className="w-full bg-resident-600 hover:bg-resident-700 text-white py-2 rounded font-medium transition">
            Activate Account
          </button>
        </form>

        <p className="text-sm text-center text-slate-600">
          Already activated? <Link to="/login" className="text-resident-600 font-bold">Sign in</Link>
        </p>
      </div>
    </div>
  );
}