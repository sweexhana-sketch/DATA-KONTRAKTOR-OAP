import { useState } from "react";
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

export default function SignUpPage() {
  const [step, setStep] = useState(1); // 1: Info, 2: OTP
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [otp, setOtp] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Step 1: Kirim OTP
  const onSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!name || !email || !password || !confirm) { setError("Semua kolom wajib diisi"); setLoading(false); return; }
    if (password !== confirm) { setError("Konfirmasi password tidak cocok"); setLoading(false); return; }
    if (password.length < 6) { setError("Password minimal 6 karakter"); setLoading(false); return; }

    try {
      const res = await fetch("/api/signup/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setStep(2);
      } else {
        setError(data.error || "Gagal mengirim OTP");
      }
    } catch {
      setError("Terjadi kesalahan koneksi");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verifikasi & Buat Akun
  const onVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!otp || otp.length < 6) { setError("Masukkan kode OTP 6-digit"); setLoading(false); return; }

    try {
      const res = await fetch("/api/signup/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name, otp }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { window.location.href = "/account/signin?signup=success"; }, 2500);
      } else {
        setError(data.error || "Verifikasi gagal");
      }
    } catch {
      setError("Terjadi kesalahan sistem");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/signup/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.ok) {
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown(c => {
            if (c <= 1) { clearInterval(timer); return 0; }
            return c - 1;
          });
        }, 1000);
      } else {
        const d = await res.json();
        setError(d.error || "Gagal kirim ulang OTP");
      }
    } catch { setError("Koneksi bermasalah"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden flex flex-col items-center justify-center p-6 md:p-10 font-['Inter',sans-serif]">
      {/* ===== Toast Success ===== */}
      {success && (
        <div style={{
          position: "fixed", top: "24px", right: "24px", zIndex: 9999,
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "black", borderRadius: "14px", padding: "16px 24px",
          display: "flex", alignItems: "center", gap: "12px",
          boxShadow: "0 8px 32px rgba(16,185,129,0.35)",
          animation: "slideInToast 0.4s cubic-bezier(0.16,1,0.3,1)",
          minWidth: "320px",
        }}>
          <style>{`
            @keyframes slideInToast {
              from { opacity: 0; transform: translateX(60px) scale(0.9); }
              to   { opacity: 1; transform: translateX(0) scale(1); }
            }
          `}</style>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: "700", fontSize: "14px", margin: 0 }}>Akun Berhasil Dibuat!</p>
            <p style={{ fontSize: "12px", opacity: 0.85, margin: "2px 0 0" }}>Mengarahkan ke halaman login...</p>
          </div>
        </div>
      )}

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
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider text-slate-300 uppercase">Pendaftaran Terbuka</span>
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
            Bergabung dengan <span className="text-cyan-400">SI PRO</span>
          </h2>
          <p className="text-sm lg:text-base text-slate-400 leading-relaxed max-w-md mx-auto lg:mx-0">
            Daftarkan perusahaan Anda dalam ekosistem Kontraktor Orang Asli Papua (OAP) Provinsi Papua Barat Daya untuk mendapatkan akses penuh.
          </p>
        </div>

        {/* Right Panel - Signup Card */}
        <div className="w-full lg:w-1/2 max-w-[440px]">
          <div className="rounded-3xl p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-2xl bg-[#0f172a]/60">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-12 bg-amber-500/20 blur-2xl" />

            {step === 1 ? (
              <div className="relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-8 text-center lg:text-left">
                  <h2 className="text-2xl font-black text-white tracking-wide">Daftar Akun Baru</h2>
                  <p className="text-sm text-slate-400 mt-2">Buat akun untuk memulai pendataan</p>
                </div>

                <form onSubmit={onSendOtp} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nama Lengkap</label>
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="e.g. Ahmad Rumbiak"
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all font-mono"
                    />
                  </div>
                  
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
                        placeholder="Minimal 6 karakter"
                        className="w-full px-4 py-3 pr-12 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
                      />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors" tabIndex={-1}>
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Konfirmasi Sandi</label>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirm} onChange={e => setConfirm(e.target.value)}
                        placeholder="Ulangi sandi"
                        className="w-full px-4 py-3 pr-12 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
                      />
                      <button type="button" onClick={() => setShowConfirm(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition-colors" tabIndex={-1}>
                        {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
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
                        ? <span className="flex items-center justify-center gap-2 text-black/70"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Memproses...</span>
                        : "DAFTAR & KIRIM OTP"}
                    </button>
                  </div>

                  <div className="text-center pt-4 border-t border-white/10 mt-6">
                    <p className="text-sm text-slate-400">Sudah memiliki akun?{" "}<a href="/account/signin" className="font-bold text-amber-400 hover:text-amber-300 hover:underline transition-colors border-white/10">Masuk Sekarang</a></p>
                  </div>
                </form>
              </div>
            ) : (
              // STEP 2: OTP VERIFICATION
              <div className="relative z-10 animate-in fade-in zoom-in-95 duration-500">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-black text-white">Verifikasi Email</h2>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Kode 6 digit telah dikirim ke email<br />
                    <span className="font-semibold text-amber-400">{email}</span>
                  </p>
                </div>

                <form onSubmit={onVerify} className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Masukkan Kode OTP</label>
                    <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                      placeholder="000000"
                      className="w-full h-14 bg-black/40 text-center text-2xl font-black tracking-[8px] text-white border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 transition-all placeholder:tracking-normal placeholder:text-white/20" />
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-2 text-sm text-red-400">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading || otp.length < 6}
                    className="w-full h-12 rounded-xl text-sm font-bold text-black transition-all active:scale-[0.98] disabled:opacity-50 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                    {loading
                      ? <span className="flex items-center justify-center gap-2 text-black/70"><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Memverifikasi...</span>
                      : "KONFIRMASI PENDAFTARAN"}
                  </button>
                  
                  <div className="text-center pt-2 border-t border-white/10 mt-4">
                    <p className="text-sm text-slate-400">
                      <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                        className="font-bold text-amber-400 hover:text-amber-300 transition-colors disabled:opacity-50">
                        {resendCooldown > 0 ? `Kirim ulang (${resendCooldown}s)` : "Kirim ulang kode OTP"}
                      </button>
                    </p>
                  </div>
                  
                  <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-slate-500 hover:text-white transition-colors flex justify-center items-center gap-1 mt-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    Kembali ke pengisian data
                  </button>
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
