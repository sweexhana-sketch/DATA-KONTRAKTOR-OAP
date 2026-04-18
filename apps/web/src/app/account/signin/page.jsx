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
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col items-center justify-center p-6 md:p-10 font-['Inter',sans-serif]">
      {/* Premium Dark Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full bg-blue-900/20 blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-amber-600/10 blur-3xl" />
        <div className="absolute -bottom-60 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-teal-900/10 blur-3xl animate-pulse" style={{ animationDuration: '12s' }} />
        {/* Construction Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)]" style={{ backgroundSize: '48px 48px' }} />
        {/* Overlay Dark Tints */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-black/60 to-transparent mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-black/80 to-transparent mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-center justify-center h-full">
        
        {/* Left Panel - Branding */}
        <div className="w-full lg:w-1/2 text-center lg:text-left space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-2 shadow-lg">
            <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">Akses Terintegrasi SI PRO</span>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center lg:items-center gap-6">
            <div className="relative shrink-0 group">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl scale-125 transition-all group-hover:bg-amber-500/30 group-hover:scale-150" />
              <img src={logoPBD.src || logoPBD} alt="Logo" className="relative h-28 w-28 lg:h-32 lg:w-32 drop-shadow-2xl" />
            </div>
            <div className="space-y-1">
               <h1 className="text-6xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-yellow-300 to-orange-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.2)] tracking-tight">SIKAP</h1>
            </div>
          </div>
          
          <h2 className="text-xl lg:text-2xl font-bold text-white/90 uppercase tracking-widest mt-4">
            Sistem Pendataan <span className="text-cyan-400">Terpadu</span>
          </h2>
          <p className="text-sm lg:text-base text-slate-400 leading-relaxed max-w-md mx-auto lg:mx-0">
            Platform resmi pengelolaan data profil perusahaan dan tenaga ahli untuk Kontraktor Orang Asli Papua (OAP) Provinsi Papua Barat Daya.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4 opacity-80">
            <div className="flex items-center gap-2 text-sm text-slate-300 font-medium"><div className="p-1.5 rounded bg-white/5 border border-white/10"><svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg></div>Infrastruktur</div>
            <div className="flex items-center gap-2 text-sm text-slate-300 font-medium"><div className="p-1.5 rounded bg-white/5 border border-white/10"><svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg></div>Terverifikasi</div>
          </div>
        </div>

        {/* Right Panel - Login Card */}
        <div className="w-full lg:w-1/2 max-w-[440px]">
          <div className="rounded-3xl p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-2xl bg-[#0f172a]/60">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-12 bg-amber-500/20 blur-2xl" />

            {/* ═══ STEP 1: Credentials ═══ */}
            {step === "credentials" && (
              <div className="relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-8 text-center lg:text-left">
                  <h2 className="text-2xl font-black text-white tracking-wide">Portal Masuk</h2>
                  <p className="text-sm text-slate-400 mt-2">Silakan masuk dengan akun yang terdaftar</p>
                </div>

                <form onSubmit={handleCredentials} className="space-y-5" noValidate>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alamat Email</label>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="email@perusahaan.com"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sandi</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pr-12 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-sm text-red-400 animate-[shake_0.5s_ease-in-out]">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {error}
                    </div>
                  )}

                  <style jsx global>{`
                    @keyframes shake {
                      0%, 100% { transform: translateX(0); }
                      25% { transform: translateX(-5px); }
                      75% { transform: translateX(5px); }
                    }
                  `}</style>

                  <div className="pt-2">
                    <button type="submit" disabled={loading}
                      className="w-full h-12 rounded-xl text-sm font-bold text-black transition-all active:scale-[0.98] disabled:opacity-60 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                      {loading
                        ? <span className="flex items-center justify-center gap-2 text-black/70"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Pengecekan...</span>
                        : "MASUK KONTRAKTOR"}
                    </button>
                  </div>

                  <div className="text-center pt-4 border-t border-white/10 mt-6">
                    <p className="text-sm text-slate-400">Belum memiliki akun?{" "}<a href="/account/signup" className="font-bold text-amber-400 hover:text-amber-300 hover:underline transition-colors border-white/10">Daftar Sekarang</a></p>
                  </div>
                </form>
              </div>
            )}

            {/* ═══ STEP 2: OTP ═══ */}
            {step === "otp" && (
              <div className="relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-6">
                  <button onClick={() => { setStep("credentials"); setError(null); }} className="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Kembali
                  </button>
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black text-white">Verifikasi Keamanan</h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Kode 6 digit telah dikirim ke email<br />
                    <span className="font-semibold text-amber-400">{email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  {/* OTP Box */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Masukkan Kode OTP</label>
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
                          className="w-11 h-12 sm:w-12 sm:h-14 bg-black/40 text-center text-xl font-bold text-white border-2 rounded-xl transition-all focus:outline-none disabled:bg-white/5 disabled:border-white/5 disabled:text-white/20"
                          style={{ borderColor: digit ? "rgb(245,158,11)" : "rgba(255,255,255,0.1)" }}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-amber-500/70 mt-2 font-medium">Sesi kode berlaku 5 menit</p>
                  </div>

                  {/* Lockout banner */}
                  {lockoutEnd && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                      <p className="text-sm font-semibold text-red-400">Terlalu banyak percobaan</p>
                      <p className="text-2xl font-black text-red-500 mt-1">{formatTime(lockoutRemaining)}</p>
                      <p className="text-xs text-red-400/70 mt-1">Sistem dikunci sementara untuk keamanan</p>
                    </div>
                  )}

                  {/* Error */}
                  {error && !lockoutEnd && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-sm text-red-400">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <button type="submit" disabled={loading || !!lockoutEnd || otp.length < 6}
                    className="w-full h-12 rounded-xl text-sm font-bold text-black transition-all active:scale-[0.98] disabled:opacity-50 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                    {loading
                      ? <span className="flex items-center justify-center gap-2 text-black/70"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Mengautentikasi...</span>
                      : "VERIFIKASI & MASUK"}
                  </button>

                  {/* Resend */}
                  <div className="text-center pt-2 border-t border-white/10 mt-4">
                    <p className="text-sm text-slate-400">
                      Tidak menerima kode?{" "}
                      {resendCooldown > 0
                        ? <span className="text-slate-500">Kirim ulang ({resendCooldown}s)</span>
                        : <button type="button" onClick={handleResend} disabled={loading}
                            className="font-bold text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50">
                            Kirim Ulang Email
                          </button>
                      }
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>
          
          <p className="text-center text-xs text-slate-500 mt-6 tracking-wide">
            © 2025 Dinas PUPR Provinsi Papua Barat Daya<br />
            Sistem Pendataan Kontraktor OAP — v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
