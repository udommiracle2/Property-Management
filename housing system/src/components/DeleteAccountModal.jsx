import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "./ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function DeleteAccountModal({ open, onClose }) {
  const { deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setPassword("");
    setError("");
    setLoading(false);
    onClose();
  }

  async function handleDelete() {
    if (!password) {
      setError("Enter your password to confirm.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await deleteAccount(password);
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message || "Could not delete account.");
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Delete your account"
      subtitle="This permanently removes your login. This can't be undone."
      footer={
        <>
          <button onClick={handleClose} className="btn-ghost">Cancel</button>
          <button onClick={handleDelete} disabled={loading} className="btn-danger disabled:opacity-60">
            {loading ? "Deleting…" : "Delete my account"}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {error && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}
        <p className="text-sm text-stone-600 dark:text-stone-400">
          Confirm your password to permanently delete your account. Your saved property, lease, and payment
          records are not affected.
        </p>
        <div>
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleDelete()}
          />
        </div>
      </div>
    </Modal>
  );
}
