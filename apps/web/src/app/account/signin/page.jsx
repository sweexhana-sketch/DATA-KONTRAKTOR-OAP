import { useState } from "react";
import { signIn } from "@auth/create/react";
import logoPBD from "@/assets/logo-papua-barat-daya.png";

export default function SignInPage() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!email || !password) {
      setError("Mohon isi semua kolom");
      setLoading(false);
      return;
    }
    try {
      const result = await signIn("credentials", { email, password, redirect: false, callbackUrl: "/dashboard" });
      if (result?.error) {
        setError("Email atau password salah. Silakan coba lagi.");
        setLoading(false);
      } else {
        window.location.href = result?.url || "/dashboard";
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  };

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
          <p className="text-white/80 text-sm leading-relaxed max-w-xs">
            Sistem Informasi Data Kontraktor<br />Orang Asli Papua (OAP)
          </p>
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
            <div className="mb-7">
              <h2 className="text-2xl font-black text-gray-900">Masuk ke Sistem</h2>
              <p className="text-sm text-gray-500 mt-1">Silakan masuk dengan akun yang telah terdaftar</p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Masukkan email Anda"
                  className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a3a6b] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1a3a6b] transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ background: loading ? "#6b7280" : "linear-gradient(135deg, #1a3a6b, #2563eb)" }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Memproses...
                  </span>
                ) : "MASUK"}
              </button>

              <div className="text-center pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Belum memiliki akun?{" "}
                  <a href="/account/signup" className="font-bold text-[#1a3a6b] hover:underline">Daftar Sekarang</a>
                </p>
              </div>
            </form>
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
