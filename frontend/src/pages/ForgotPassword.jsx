import { useState } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(""); // reset message
    try {
      const res = await axios.post("/forgot-password", { email });
      setMessage(res.data.message);

      localStorage.setItem("resetEmail", email);
      setTimeout(() => navigate("/verify-otp"), 1000); // delay sedikit biar user lihat message
    } catch (err) {
      setMessage(err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-50 p-4">
      <div className="bg-white shadow-lg rounded-xl max-w-md w-full p-8 space-y-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center">
          Lupa Password
        </h2>
        <p className="text-sm text-gray-500 text-center">
          Masukkan email Anda untuk menerima kode OTP dan mereset password
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Masukkan email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          />

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            )}
            {loading ? "Mengirim..." : "Kirim OTP"}
          </button>
        </form>

        {message && (
          <p className="text-center text-gray-700 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
