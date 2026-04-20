import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Building,
  User,
  Send,
} from "lucide-react";

export default function AdminContractorDetailPage({ params }) {
  const { data: user, loading: userLoading } = useUser();
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

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
            if (data.role !== "admin") {
              window.location.href = "/";
            }
            setUserRole(data.role);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      }
    };
    fetchUserRole();
  }, [user]);

  useEffect(() => {
    const fetchContractor = async () => {
      if (!userRole) return;

      try {
        const res = await fetch(`/api/contractors/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setContractor(data.contractor);
        }
      } catch (error) {
        console.error("Error fetching contractor:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userRole === "admin") {
      fetchContractor();
    }
  }, [userRole, params.id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/contractors/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractor.id,
          status: "approved",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setContractor(data.contractor);
      }
    } catch (error) {
      console.error("Error approving contractor:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert("Mohon isi alasan penolakan");
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/contractors/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractor.id,
          status: "rejected",
          rejection_reason: rejectionReason,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setContractor(data.contractor);
        setShowRejectModal(false);
        setRejectionReason("");
      }
    } catch (error) {
      console.error("Error rejecting contractor:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (userLoading || loading || !userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="text-[#8A8FA6]">Memuat...</div>
      </div>
    );
  }

  if (!contractor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="text-[#8A8FA6]">Kontraktor tidak ditemukan</div>
      </div>
    );
  }

  const handleDitunjuk = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/contractors/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractor.id,
          status: "ditunjuk",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setContractor(data.contractor);
      }
    } catch (error) {
      console.error("Error setting ditunjuk:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelDitunjuk = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/contractors/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractor_id: contractor.id,
          status: "approved",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setContractor(data.contractor);
      }
    } catch (error) {
      console.error("Error cancelling ditunjuk:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
        icon: Clock,
        label: "Menunggu Verifikasi",
      },
      approved: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        icon: CheckCircle,
        label: "Terverifikasi",
      },
      ditunjuk: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        icon: Send,
        label: "Ditunjuk → SI PRO",
      },
      rejected: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircle,
        label: "Ditolak",
      },
    };

    const style = styles[status] || styles.pending;
    const Icon = style.icon;

    return (
      <div
        className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${style.bg} ${style.border}`}
      >
        <Icon className={`w-4 h-4 ${style.text}`} />
        <span className={`text-sm font-medium ${style.text}`}>
          {style.label}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E4E9F2] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => (window.location.href = "/admin/contractors")}
              className="w-8 h-8 bg-white border border-[#E4E9F2] rounded-full flex items-center justify-center hover:bg-[#F7F9FC]"
            >
              <ArrowLeft className="w-4 h-4 text-[#6F7689]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#2A2E45]">
                Detail Kontraktor
              </h1>
              <p className="text-sm text-[#8A8FA6]">{contractor.full_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Status & Actions */}
        <div className="bg-white border border-[#E4E9F2] rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-[#2A2E45] mb-2">
                Status Verifikasi
              </h2>
              {getStatusBadge(contractor.status)}
            </div>

            {contractor.status === "pending" && (
              <div className="flex space-x-3">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="px-4 h-9 bg-green-600 text-white rounded text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Setujui</span>
                </button>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="px-4 h-9 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Tolak</span>
                </button>
              </div>
            )}

            {contractor.status === "approved" && (
              <button
                onClick={handleDitunjuk}
                disabled={actionLoading}
                className="px-5 h-9 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                <span>{actionLoading ? "Memproses..." : "Tunjuk → SI PRO"}</span>
              </button>
            )}

            {contractor.status === "ditunjuk" && (
              <button
                onClick={handleCancelDitunjuk}
                disabled={actionLoading}
                className="px-4 h-9 bg-gray-100 text-gray-600 border border-gray-300 rounded text-sm font-semibold hover:bg-gray-200 disabled:opacity-50 flex items-center space-x-2"
              >
                <XCircle className="w-4 h-4" />
                <span>{actionLoading ? "Memproses..." : "Batalkan Penunjukan"}</span>
              </button>
            )}
          </div>

          {contractor.status === "rejected" && contractor.rejection_reason && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <p className="text-sm font-medium text-red-900 mb-1">
                Alasan Penolakan:
              </p>
              <p className="text-sm text-red-800">
                {contractor.rejection_reason}
              </p>
            </div>
          )}

          {contractor.status === "approved" && contractor.verified_at && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <p className="text-sm text-green-800">
                Diverifikasi pada:{" "}
                {new Date(contractor.verified_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {contractor.status === "ditunjuk" && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <div className="flex items-center gap-2 mb-1">
                <Send className="w-4 h-4 text-blue-600" />
                <p className="text-sm font-semibold text-blue-800">
                  Ditunjuk untuk Sinkronisasi ke SI PRO
                </p>
              </div>
              <p className="text-sm text-blue-700">
                Kontraktor ini akan muncul saat Admin SI PRO melakukan sinkronisasi data.
              </p>
            </div>
          )}
        </div>

        {/* Data Pribadi */}
        <div className="bg-white border border-[#E4E9F2] rounded p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="w-5 h-5 text-[#1570FF]" />
            <h2 className="text-lg font-semibold text-[#2A2E45]">
              Data Pribadi
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                NIK
              </label>
              <p className="text-sm text-[#2A2E45] font-medium">
                {contractor.nik}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                Nama Lengkap
              </label>
              <p className="text-sm text-[#2A2E45] font-medium">
                {contractor.full_name}
              </p>
            </div>

            {contractor.birth_place && (
              <div>
                <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                  Tempat Lahir
                </label>
                <p className="text-sm text-[#2A2E45]">
                  {contractor.birth_place}
                </p>
              </div>
            )}

            {contractor.birth_date && (
              <div>
                <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                  Tanggal Lahir
                </label>
                <p className="text-sm text-[#2A2E45]">
                  {new Date(contractor.birth_date).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                No. Telepon
              </label>
              <p className="text-sm text-[#2A2E45]">{contractor.phone}</p>
            </div>

            {contractor.email && (
              <div>
                <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                  Email
                </label>
                <p className="text-sm text-[#2A2E45]">{contractor.email}</p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                Alamat
              </label>
              <p className="text-sm text-[#2A2E45]">{contractor.address}</p>
            </div>

            {contractor.city && (
              <div>
                <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                  Kota/Kabupaten
                </label>
                <p className="text-sm text-[#2A2E45]">{contractor.city}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                Provinsi
              </label>
              <p className="text-sm text-[#2A2E45]">{contractor.province}</p>
            </div>
          </div>
        </div>

        {/* Data Perusahaan */}
        <div className="bg-white border border-[#E4E9F2] rounded p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Building className="w-5 h-5 text-[#1570FF]" />
            <h2 className="text-lg font-semibold text-[#2A2E45]">
              Data Perusahaan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                Nama Perusahaan
              </label>
              <p className="text-sm text-[#2A2E45] font-medium">
                {contractor.company_name}
              </p>
            </div>

            {contractor.company_type && (
              <div>
                <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                  Jenis Perusahaan
                </label>
                <p className="text-sm text-[#2A2E45]">
                  {contractor.company_type}
                </p>
              </div>
            )}

            {contractor.npwp && (
              <div>
                <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                  NPWP
                </label>
                <p className="text-sm text-[#2A2E45]">{contractor.npwp}</p>
              </div>
            )}

            {contractor.company_address && (
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                  Alamat Kantor
                </label>
                <p className="text-sm text-[#2A2E45]">
                  {contractor.company_address}
                </p>
              </div>
            )}

            {contractor.company_phone && (
              <div>
                <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                  Telepon Kantor
                </label>
                <p className="text-sm text-[#2A2E45]">
                  {contractor.company_phone}
                </p>
              </div>
            )}

            {contractor.establishment_year && (
              <div>
                <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                  Tahun Berdiri
                </label>
                <p className="text-sm text-[#2A2E45]">
                  {contractor.establishment_year}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Klasifikasi & Bidang Usaha */}
        <div className="bg-white border border-[#E4E9F2] rounded p-6">
          <h2 className="text-lg font-semibold text-[#2A2E45] mb-4">
            Klasifikasi & Bidang Usaha
          </h2>

          <div className="space-y-4">
            {(contractor.small_classification ||
              contractor.medium_classification ||
              contractor.large_classification) && (
              <div>
                <label className="block text-xs font-medium text-[#8A8FA6] mb-2">
                  Klasifikasi
                </label>
                <div className="flex flex-wrap gap-2">
                  {contractor.small_classification && (
                    <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-200">
                      Kecil: {contractor.small_classification}
                    </span>
                  )}
                  {contractor.medium_classification && (
                    <span className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full border border-green-200">
                      Menengah: {contractor.medium_classification}
                    </span>
                  )}
                  {contractor.large_classification && (
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full border border-purple-200">
                      Besar: {contractor.large_classification}
                    </span>
                  )}
                </div>
              </div>
            )}

            {contractor.business_field &&
              contractor.business_field.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-[#8A8FA6] mb-2">
                    Bidang Usaha
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {contractor.business_field.map((field, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#EDF3FF] text-[#1570FF] text-sm rounded-full border border-[#BFDBFE]"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#2A2E45] mb-4">
              Tolak Pendaftaran
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                placeholder="Masukkan alasan penolakan..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="px-4 h-9 bg-white border border-[#E4E9F2] text-[#2A2E45] rounded text-sm font-semibold hover:bg-[#F7F9FC]"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-4 h-9 bg-red-600 text-white rounded text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Memproses..." : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
