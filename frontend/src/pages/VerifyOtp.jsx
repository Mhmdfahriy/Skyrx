import { useState, useRef, useEffect } from "react";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function VerifyOTP() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [step, setStep] = useState(1); // 1 = OTP, 2 = Password
  
  const navigate = useNavigate();
  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && step === 1) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, step]);

  // Auto focus
  useEffect(() => {
    if (step === 1) {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(false);
    setMessage("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("");
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill("")]);
    
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerifyOTP = (e) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError(true);
      setMessage("Masukkan 6 digit kode OTP");
      return;
    }

    // Pindah ke step 2 (input password)
    setStep(2);
    setMessage("");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setError(true);
      setMessage("Password minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(true);
      setMessage("Password tidak cocok");
      return;
    }

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const email = localStorage.getItem("resetEmail");
      const otpCode = otp.join("");
      
      const res = await axios.post("/reset-password", { 
        email, 
        otp: otpCode,
        password: newPassword,
        password_confirmation: confirmPassword
      });

      setMessage("✓ Password berhasil direset!");
      setError(false);
      
      // Cleanup
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("otpVerified");
      
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || "Gagal mereset password");
      
      // Jika OTP salah, kembali ke step 1
      if (err.response?.data?.message?.toLowerCase().includes("otp")) {
        setStep(1);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setLoading(true);
    setMessage("");
    setError(false);

    try {
      const email = localStorage.getItem("resetEmail");
      await axios.post("/forgot-password", { email });
      
      setMessage("✓ Kode OTP baru telah dikirim ke email Anda");
      setError(false);
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      setStep(1);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(true);
      setMessage(err.response?.data?.message || "Gagal mengirim ulang OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-blue-50 p-4">
      <div className="bg-white shadow-lg rounded-xl max-w-md w-full p-8 space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {step === 1 ? (
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-800">
            {step === 1 ? "Verifikasi OTP" : "Reset Password"}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {step === 1 
              ? "Masukkan 6 digit kode yang telah dikirim ke email Anda"
              : "Masukkan password baru Anda"
            }
          </p>
          {step === 1 && (
            <p className="text-sm text-blue-600 font-medium mt-1">
              {localStorage.getItem("resetEmail")}
            </p>
          )}
        </div>

        {/* Step 1: OTP Input */}
        {step === 1 && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className={`w-12 h-12 sm:w-14 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 rounded-lg transition-all
                    ${error 
                      ? 'border-red-400 bg-red-50 text-red-600' 
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                    } focus:outline-none`}
                  disabled={loading}
                />
              ))}
            </div>

            {message && (
              <p className={`text-center text-sm font-medium ${
                error ? 'text-red-600' : 'text-green-600'
              }`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.some(digit => !digit)}
              className={`w-full flex justify-center items-center gap-2 py-3 rounded-lg font-semibold transition
                ${loading || otp.some(digit => !digit)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              Lanjutkan
            </button>

            {/* Resend OTP */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Tidak menerima kode?</p>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm disabled:opacity-50"
                >
                  Kirim Ulang OTP
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Kirim ulang dalam <span className="font-semibold text-blue-600">{countdown}s</span>
                </p>
              )}
            </div>
          </form>
        )}

        {/* Step 2: Password Input */}
        {step === 2 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-4">
              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full border border-gray-300 rounded-lg p-3 pr-12 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Konfirmasi Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            {message && (
              <p className={`text-center text-sm font-medium ${
                error ? 'text-red-600' : 'text-green-600'
              }`}>
                {message}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3 rounded-lg font-semibold transition
                ${loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              {loading && (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                </svg>
              )}
              {loading ? "Mereset..." : "Reset Password"}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              ← Kembali ke OTP
            </button>
          </form>
        )}

        {/* Back to Forgot Password */}
        {step === 1 && (
          <button
            onClick={() => navigate("/forgot-password")}
            className="w-full text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
        )}

      </div>
    </div>
  );
}