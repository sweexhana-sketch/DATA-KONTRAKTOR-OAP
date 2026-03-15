import { useState } from "react";
import { signIn } from "@auth/create/react";
import logoPBD from "@/assets/logo-papua-barat-daya.png";

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
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ===== Toast Success ===== */}
      {success && (
        <div style={{
          position: "fixed", top: "24px", right: "24px", zIndex: 9999,
          background: "linear-gradient(135deg, #16a34a, #15803d)",
          color: "white", borderRadius: "14px", padding: "16px 24px",
          display: "flex", alignItems: "center", gap: "12px",
          boxShadow: "0 8px 32px rgba(22,163,74,0.35)",
          animation: "slideInToast 0.4s cubic-bezier(0.16,1,0.3,1)",
          minWidth: "320px",
        }}>
          <style>{`
            @keyframes slideInToast {
              from { opacity: 0; transform: translateX(60px) scale(0.9); }
              to   { opacity: 1; transform: translateX(0) scale(1); }
            }
          `}</style>
          <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p style={{ fontWeight: "700", fontSize: "14px", margin: 0 }}>Akun Berhasil Dibuat!</p>
            <p style={{ fontSize: "12px", opacity: 0.85, margin: "2px 0 0" }}>Silakan login dengan akun baru Anda.</p>
          </div>
        </div>
      )}

      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1a3a6b] to-[#0d2447] flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute rounded-full border border-white" style={{ width: `${(i + 1) * 120}px`, height: `${(i + 1) * 120}px`, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
        <img src={logoPBD} alt="Logo" className="w-44 h-44 object-contain mb-8 drop-shadow-2xl relative z-10" />
        <div className="text-center relative z-10">
          <p className="text-white/70 text-base uppercase tracking-widest font-medium mb-2">Pemerintah Provinsi</p>
          <h1 className="text-3xl font-black text-white mb-1">Papua Barat Daya</h1>
          <div className="w-20 h-1 bg-yellow-400 mx-auto rounded mb-6" />
          <h2 className="text-xl font-bold text-yellow-300 mb-3">Dinas PUPR</h2>
          <p className="text-white/80 text-sm leading-relaxed max-w-xs">Sistem Pendataan Kontraktor<br />Orang Asli Papua (OAP)</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md py-6">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            
            {step === 1 ? (
              <>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-black text-gray-900">Daftar Akun</h2>
                  <p className="text-sm text-gray-500 mt-1">Langkah 1: Isi informasi pendaftaran</p>
                </div>

                <form onSubmit={onSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ahmad Rumbiak"
                      className="w-full h-12 px-4 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#1a3a6b] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com"
                      className="w-full h-12 px-4 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#1a3a6b] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 6 karakter"
                        className="w-full h-12 px-4 pr-12 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#1a3a6b] transition-all" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a3a6b]">
                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Konfirmasi Password</label>
                    <div className="relative">
                      <input type={showConfirm ? "text" : "password"} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Ulangi password"
                        className="w-full h-12 px-4 pr-12 border-2 border-gray-100 rounded-xl text-sm focus:outline-none focus:border-[#1a3a6b] transition-all" />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#1a3a6b]">
                        {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700 animate-[shake_0.5s_ease-in-out]">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
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

                  <button type="submit" disabled={loading} className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #1a3a6b, #4299e1)" }}>
                    {loading ? "MEMPROSES..." : "DAFTAR & KIRIM OTP"}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#1a3a6b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">Verifikasi Email</h2>
                  <p className="text-sm text-gray-500 mt-2">Kami telah mengirimkan kode OTP ke<br/><span className="font-bold text-gray-800">{email}</span></p>
                </div>

                <form onSubmit={onVerify} className="space-y-6">
                  <div>
                    <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                      placeholder="0 0 0 0 0 0"
                      className="w-full h-16 text-center text-3xl font-black tracking-[12px] border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-[#1a3a6b] transition-all placeholder:tracking-normal placeholder:text-gray-200" />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center text-sm text-red-700">
                      {error}
                    </div>
                  )}

                  <button type="submit" disabled={loading} className="w-full h-14 rounded-2xl text-sm font-bold text-white shadow-lg active:scale-[0.98] disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #1a3a6b, #2563eb)" }}>
                    {loading ? "VERIFIKASI..." : "KONFIRMASI PENDAFTARAN"}
                  </button>
                  
                  <div className="text-center">
                    <button type="button" onClick={handleResend} disabled={resendCooldown > 0 || loading}
                      className="text-sm font-bold text-[#1a3a6b] hover:underline disabled:text-gray-400">
                      {resendCooldown > 0 ? `Kirim ulang dalam ${resendCooldown}s` : "Kirim ulang kode OTP"}
                    </button>
                  </div>
                  
                  <button type="button" onClick={() => setStep(1)} className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    &larr; Kembali ke pengisian data
                  </button>
                </form>
              </>
            )}

            <div className="text-center pt-8 mt-6 border-t border-gray-50">
              <p className="text-sm text-gray-500">Sudah memiliki akun? <a href="/account/signin" className="font-bold text-[#1a3a6b] hover:underline">Masuk di sini</a></p>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-300 mt-4 uppercase tracking-widest">© 2025 DINAS PUPR PROVINSI PAPUA BARAT DAYA</p>
        </div>
      </div>
    </div>
  );
}

