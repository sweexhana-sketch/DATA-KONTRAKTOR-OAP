import { useState } from "react";
import useUser from "@/utils/useUser";
import { Shield, AlertTriangle } from "lucide-react";

export default function MakeAdminPage() {
  const { data: user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleMakeAdmin = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/make-admin", {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Terjadi kesalahan");
      }

      setSuccess(true);

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="text-[#8A8FA6]">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="text-[#8A8FA6]">Silakan login terlebih dahulu</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC] p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#E4E9F2] rounded p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#EDF3FF] rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#1570FF]" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-[#2A2E45] text-center mb-2">
            Buat Admin Pertama
          </h1>
          <p className="text-sm text-[#8A8FA6] text-center mb-6">
            Akun: {user.email}
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-yellow-900 mb-1">
                  Peringatan Penting!
                </p>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>
                    • Halaman ini harus DIHAPUS setelah admin pertama dibuat
                  </li>
                  <li>
                    • Siapapun yang mengakses halaman ini dapat menjadi admin
                  </li>
                  <li>• Gunakan hanya untuk setup awal aplikasi</li>
                </ul>
              </div>
            </div>
          </div>

          {success && (
            <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
              <p className="text-sm text-green-800 text-center">
                ✓ Akun berhasil dijadikan admin! Mengalihkan...
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
              <p className="text-sm text-red-800 text-center">{error}</p>
            </div>
          )}

          <button
            onClick={handleMakeAdmin}
            disabled={loading || success}
            className="w-full h-10 bg-[#1570FF] text-white rounded text-sm font-semibold hover:bg-[#0F5FE6] disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Jadikan Admin"}
          </button>

          <button
            onClick={() => (window.location.href = "/")}
            className="w-full h-10 mt-3 bg-white border border-[#E4E9F2] text-[#2A2E45] rounded text-sm font-semibold hover:bg-[#F7F9FC]"
          >
            Kembali ke Beranda
          </button>
        </div>

        <div className="mt-4 bg-red-50 border border-red-200 rounded p-4">
          <p className="text-xs text-red-800 text-center">
            <strong>JANGAN LUPA:</strong> Hapus file
            /apps/web/src/app/admin/make-first-admin/page.jsx setelah admin
            pertama dibuat!
          </p>
        </div>
      </div>
    </div>
  );
}
