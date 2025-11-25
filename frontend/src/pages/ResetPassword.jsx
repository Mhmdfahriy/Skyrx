import { useState } from "react";
import axios from "../api/axios";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = kirim otp, 2 = verifikasi otp
  const [message, setMessage] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/forgot-password", { email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || "Gagal mengirim OTP");
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/reset-password", {
        email,
        otp,
        password: newPassword,
      });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Gagal reset password");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white shadow-md p-6 rounded-lg w-96">
        <h2 className="text-2xl font-bold text-center mb-4">
          Reset Password
        </h2>

        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <input
              type="email"
              placeholder="Masukkan email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Kirim OTP
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleResetPassword}>
            <input
              type="text"
              placeholder="Masukkan kode OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />
            <input
              type="password"
              placeholder="Password baru"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 mb-3"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
            >
              Reset Password
            </button>
          </form>
        )}

        {message && (
          <p className="text-center text-sm text-gray-700 mt-3">{message}</p>
        )}
      </div>
    </div>
  );
}
