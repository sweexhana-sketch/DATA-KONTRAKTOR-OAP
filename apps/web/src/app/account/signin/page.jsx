import { useState, useEffect, useRef } from "react";
import { signIn } from "@auth/create/react";
import logoPBD from "@/assets/logo-papua-barat-daya.png";

/* ── Ikon ── */
function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}
function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 5 * 60; // 5 menit
const RESEND_COOLDOWN = 60;      // 60 detik

export default function SignInPage() {
  // Step: 'credentials' | 'otp'
  const [step, setStep] = useState("credentials");

  // Credentials step
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP step
  const [otp, setOtp] = useState("");
  const [otpInput, setOtpInput] = useState(["", "", "", "", "", ""]);
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // State umum
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Lockout setelah 5x gagal OTP
  const [attempts, setAttempts] = useState(0);
  const [lockoutEnd, setLockoutEnd] = useState(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);

  /* ── Lockout countdown ── */
  useEffect(() => {
    if (!lockoutEnd) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockoutEnd - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockoutEnd(null);
        setLockoutRemaining(0);
        setAttempts(0);
        clearInterval(interval);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutEnd]);

  /* ── Resend cooldown countdown ── */
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  /* ── OTP Box input handler ── */
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/, "").slice(-1);
    const next = [...otpInput];
    next[index] = digit;
    setOtpInput(next);
    setOtp(next.join(""));
    if (digit && index < 5) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpInput[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      const next = text.split("");
      setOtpInput(next);
      setOtp(text);
      otpRefs[5].current?.focus();
    }
    e.preventDefault();
  };

  /* ── Step 1: kirim credentials, minta OTP ── */
  const handleCredentials = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Mohon isi semua kolom"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Terjadi kesalahan"); }
      else {
        setStep("otp");
        setResendCooldown(RESEND_COOLDOWN);
        setOtpInput(["", "", "", "", "", ""]);
        setOtp("");
        setTimeout(() => otpRefs[0].current?.focus(), 100);
      }
    } catch { setError("Terjadi kesalahan. Silakan coba lagi."); }
    setLoading(false);
  };

  /* ── Step 2: verifikasi OTP, login ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (lockoutEnd) return;
    if (otp.length < 6) { setError("Masukkan 6 digit kode OTP"); return; }
    setLoading(true);
    setError(null);
    try {
      // 1. Verifikasi OTP
      const verifyRes = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        if (newAttempts >= MAX_ATTEMPTS) {
          setLockoutEnd(Date.now() + LOCKOUT_SECONDS * 1000);
          setError(`Terlalu banyak percobaan. Akun dikunci selama 5 menit.`);
        } else {
          setError(`${verifyData.error || "Kode OTP salah"} (${MAX_ATTEMPTS - newAttempts}x tersisa)`);
        }
        setLoading(false);
        return;
      }

      // 2. OTP valid → signIn session
      const result = await signIn("credentials", {
        email, password, redirect: false, callbackUrl: "/dashboard",
      });
      if (result?.error) {
        setError("Terjadi kesalahan saat membuat sesi. Silakan coba lagi.");
      } else {
        window.location.href = result?.url || "/dashboard";
      }
    } catch { setError("Terjadi kesalahan. Silakan coba lagi."); }
    setLoading(false);
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); }
      else {
        setResendCooldown(RESEND_COOLDOWN);
        setOtpInput(["", "", "", "", "", ""]);
        setOtp("");
        setAttempts(0);
        setLockoutEnd(null);
        setTimeout(() => otpRefs[0].current?.focus(), 100);
      }
    } catch { setError("Gagal mengirim ulang OTP."); }
    setLoading(false);
  };

  const formatTime = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  /* ─────────── RENDER ─────────── */
  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a3a6b] to-[#0d2447] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white" style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
        <img src={logoPBD} alt="Logo Papua Barat Daya" className="w-44 h-44 object-contain mb-8 drop-shadow-2xl relative z-10" />
        <div className="text-center relative z-10">
          <p className="text-white/70 text-base uppercase tracking-widest font-medium mb-2">Pemerintah Provinsi</p>
          <h1 className="text-3xl font-black text-white mb-1">Papua Barat Daya</h1>
          <div className="w-20 h-1 bg-yellow-400 mx-auto rounded mb-6" />
          <h2 className="text-xl font-bold text-yellow-300 mb-2">Dinas PUPR</h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-xs">Sistem Informasi Data Kontraktor<br />Orang Asli Papua (OAP)</p>
          <p className="text-white/50 text-xs mt-8 italic">"Bersatu Membangun Negeri"</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center mb-8">
            <img src={logoPBD} alt="Logo Papua Barat Daya" className="w-20 h-20 object-contain mb-3" />
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Dinas PUPR</p>
              <h1 className="text-lg font-bold text-[#1a3a6b]">Provinsi Papua Barat Daya</h1>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">

            {/* ═══ STEP 1: Credentials ═══ */}
            {step === "credentials" && (
              <>
                <div className="mb-7">
                  <h2 className="text-2xl font-black text-gray-900">Masuk ke Sistem</h2>
                  <p className="text-sm text-gray-500 mt-1">Silakan masuk dengan akun yang telah terdaftar</p>
                </div>

                <form onSubmit={handleCredentials} className="space-y-5" noValidate>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat Email</label>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="Masukkan email Anda"
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a3a6b] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="Masukkan password Anda"
                        className="w-full h-12 px-4 pr-12 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a3a6b] transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a3a6b] transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{ background: loading ? "#6b7280" : "linear-gradient(135deg, #1a3a6b, #2563eb)" }}>
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Memproses...</span>
                      : "MASUK"}
                  </button>

                  <div className="text-center pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-500">Belum memiliki akun?{" "}<a href="/account/signup" className="font-bold text-[#1a3a6b] hover:underline">Daftar Sekarang</a></p>
                  </div>
                </form>
              </>
            )}

            {/* ═══ STEP 2: OTP ═══ */}
            {step === "otp" && (
              <>
                <div className="mb-6">
                  <button onClick={() => { setStep("credentials"); setError(null); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a3a6b] mb-4 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Kembali
                  </button>
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-[#1a3a6b]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Verifikasi OTP</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Kode 6 digit telah dikirim ke<br />
                    <span className="font-semibold text-[#1a3a6b]">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  {/* OTP Box */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Masukkan Kode OTP</label>
                    <div className="flex gap-2 justify-between">
                      {otpInput.map((digit, i) => (
                        <input
                          key={i}
                          ref={otpRefs[i]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          onPaste={i === 0 ? handleOtpPaste : undefined}
                          disabled={!!lockoutEnd}
                          className="w-12 h-14 text-center text-xl font-bold border-2 rounded-xl transition-all focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
                          style={{ borderColor: digit ? "#1a3a6b" : "#e5e7eb", color: "#1a3a6b" }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Kode berlaku selama 5 menit</p>
                  </div>

                  {/* Lockout banner */}
                  {lockoutEnd && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
                      <p className="text-sm font-semibold text-orange-700">Akun sementara dikunci</p>
                      <p className="text-2xl font-black text-orange-600 mt-1">{formatTime(lockoutRemaining)}</p>
                      <p className="text-xs text-orange-500 mt-1">Silakan coba lagi setelah countdown selesai</p>
                    </div>
                  )}

                  {/* Error */}
                  {error && !lockoutEnd && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button type="submit" disabled={loading || !!lockoutEnd || otp.length < 6}
                    className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg, #1a3a6b, #2563eb)" }}>
                    {loading
                      ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Memverifikasi...</span>
                      : "VERIFIKASI & MASUK"}
                  </button>

                  {/* Resend */}
                  <div className="text-center pt-1 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      Tidak menerima kode?{" "}
                      {resendCooldown > 0
                        ? <span className="text-gray-400">Kirim ulang dalam {resendCooldown}s</span>
                        : <button type="button" onClick={handleResend} disabled={loading}
                            className="font-bold text-[#1a3a6b] hover:underline disabled:opacity-50">
                            Kirim Ulang OTP
                          </button>
                      }
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © 2025 Dinas PUPR Provinsi Papua Barat Daya<br />
            Sistem Pendataan Kontraktor OAP — v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
