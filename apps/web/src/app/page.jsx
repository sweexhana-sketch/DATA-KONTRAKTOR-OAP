import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

export default function HomePage() {
  const { data: user, loading: userLoading } = useUser();
  const [userRole, setUserRole] = useState(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin";
    }
  }, [user, userLoading]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.id) {
        try {
          const res = await fetch("/api/user/role");
          if (res.ok) {
            const data = await res.json();
            setUserRole(data.role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        } finally {
          setRoleLoading(false);
        }
      }
    };
    fetchUserRole();
  }, [user]);

  if (userLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="text-[#8A8FA6]">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const navigate = (path) => {
    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E4E9F2] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#2A2E45]">
              Sistem Pendataan Kontraktor OAP
            </h1>
            <p className="text-sm text-[#8A8FA6]">
              Dinas PUPR Papua Barat Daya
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-semibold text-[#2A2E45]">
                {user.email}
              </div>
              <div className="text-xs text-[#8A8FA6]">
                {userRole === "admin" ? "Administrator" : "Kontraktor"}
              </div>
            </div>
            <button
              onClick={() => navigate("/account/logout")}
              className="w-8 h-8 bg-white border border-[#E4E9F2] rounded-full flex items-center justify-center hover:bg-[#F7F9FC]"
              title="Keluar"
            >
              <LogOut className="w-4 h-4 text-[#6F7689]" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#2A2E45] mb-2">
            Selamat Datang
          </h2>
          <p className="text-[#8A8FA6]">
            Pilih menu di bawah untuk melanjutkan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {userRole === "admin" ? (
            <>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="bg-white border border-[#E4E9F2] rounded p-6 hover:bg-[#FAFBFD] text-left transition-colors"
              >
                <LayoutDashboard className="w-8 h-8 text-[#1570FF] mb-3" />
                <h3 className="text-lg font-semibold text-[#2A2E45] mb-2">
                  Dashboard Admin
                </h3>
                <p className="text-sm text-[#8A8FA6]">
                  Lihat statistik dan kelola data kontraktor
                </p>
              </button>

              <button
                onClick={() => navigate("/admin/contractors")}
                className="bg-white border border-[#E4E9F2] rounded p-6 hover:bg-[#FAFBFD] text-left transition-colors"
              >
                <Users className="w-8 h-8 text-[#1570FF] mb-3" />
                <h3 className="text-lg font-semibold text-[#2A2E45] mb-2">
                  Daftar Kontraktor
                </h3>
                <p className="text-sm text-[#8A8FA6]">
                  Kelola dan verifikasi data kontraktor
                </p>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => navigate("/contractor/register")}
                className="bg-white border border-[#E4E9F2] rounded p-6 hover:bg-[#FAFBFD] text-left transition-colors"
              >
                <FileText className="w-8 h-8 text-[#1570FF] mb-3" />
                <h3 className="text-lg font-semibold text-[#2A2E45] mb-2">
                  Pendaftaran Data
                </h3>
                <p className="text-sm text-[#8A8FA6]">
                  Daftar atau update data kontraktor Anda
                </p>
              </button>

              <button
                onClick={() => navigate("/contractor/profile")}
                className="bg-white border border-[#E4E9F2] rounded p-6 hover:bg-[#FAFBFD] text-left transition-colors"
              >
                <CheckCircle className="w-8 h-8 text-[#1570FF] mb-3" />
                <h3 className="text-lg font-semibold text-[#2A2E45] mb-2">
                  Profil Saya
                </h3>
                <p className="text-sm text-[#8A8FA6]">
                  Lihat status dan data pendaftaran Anda
                </p>
              </button>
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded p-4">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">
                Informasi Penting
              </h4>
              <p className="text-sm text-blue-800">
                {userRole === "admin"
                  ? "Sebagai admin, Anda dapat melihat, memverifikasi, dan mengelola semua data kontraktor yang terdaftar."
                  : "Pastikan data yang Anda masukkan sesuai dengan dokumen resmi. Data akan diverifikasi oleh admin PUPR."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
