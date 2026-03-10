import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  FileText,
} from "lucide-react";

export default function ContractorProfilePage() {
  const { data: user, loading: userLoading } = useUser();
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin";
    }
  }, [user, userLoading]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/contractors/my-profile");
        if (res.ok) {
          const data = await res.json();
          setContractor(data.contractor);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F7F9FC]">
        <div className="text-[#8A8FA6]">Memuat...</div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: {
        bg: "bg-yellow-50",
        text: "text-yellow-700",
        border: "border-yellow-200",
        icon: Clock,
      },
      approved: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        icon: CheckCircle,
      },
      rejected: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        icon: XCircle,
      },
    };

    const style = styles[status] || styles.pending;
    const Icon = style.icon;

    const labels = {
      pending: "Menunggu Verifikasi",
      approved: "Terverifikasi",
      rejected: "Ditolak",
    };

    return (
      <div
        className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${style.bg} ${style.border}`}
      >
        <Icon className={`w-4 h-4 ${style.text}`} />
        <span className={`text-sm font-medium ${style.text}`}>
          {labels[status]}
        </span>
      </div>
    );
  };

  if (!contractor) {
    return (
      <div className="min-h-screen bg-[#F7F9FC]">
        <div className="bg-white border-b border-[#E4E9F2] px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center space-x-4">
            <button
              onClick={() => (window.location.href = "/")}
              className="w-8 h-8 bg-white border border-[#E4E9F2] rounded-full flex items-center justify-center hover:bg-[#F7F9FC]"
            >
              <ArrowLeft className="w-4 h-4 text-[#6F7689]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#2A2E45]">
                Profil Kontraktor
              </h1>
              <p className="text-sm text-[#8A8FA6]">
                Dinas PUPR Papua Barat Daya
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-white border border-[#E4E9F2] rounded p-12 text-center">
            <FileText className="w-16 h-16 text-[#8A8FA6] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#2A2E45] mb-2">
              Anda Belum Terdaftar
            </h2>
            <p className="text-[#8A8FA6] mb-6">
              Silakan lengkapi data kontraktor Anda terlebih dahulu
            </p>
            <button
              onClick={() => (window.location.href = "/contractor/register")}
              className="px-6 h-10 bg-[#1570FF] text-white rounded text-sm font-semibold hover:bg-[#0F5FE6]"
            >
              Daftar Sekarang
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      {/* Header */}
      <div className="bg-white border-b border-[#E4E9F2] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => (window.location.href = "/")}
              className="w-8 h-8 bg-white border border-[#E4E9F2] rounded-full flex items-center justify-center hover:bg-[#F7F9FC]"
            >
              <ArrowLeft className="w-4 h-4 text-[#6F7689]" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#2A2E45]">
                Profil Kontraktor
              </h1>
              <p className="text-sm text-[#8A8FA6]">
                Dinas PUPR Papua Barat Daya
              </p>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/contractor/register")}
            className="px-4 h-9 bg-white border border-[#E4E9F2] text-[#2A2E45] rounded text-sm font-semibold hover:bg-[#F7F9FC] flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Data</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Status Card */}
        <div className="bg-white border border-[#E4E9F2] rounded p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#2A2E45]">
              Status Verifikasi
            </h2>
            {getStatusBadge(contractor.status)}
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
        </div>

        {/* Data Pribadi */}
        <div className="bg-white border border-[#E4E9F2] rounded p-6">
          <h2 className="text-lg font-semibold text-[#2A2E45] mb-4">
            Data Pribadi
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                NIK
              </label>
              <p className="text-sm text-[#2A2E45]">{contractor.nik}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                Nama Lengkap
              </label>
              <p className="text-sm text-[#2A2E45]">{contractor.full_name}</p>
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
          <h2 className="text-lg font-semibold text-[#2A2E45] mb-4">
            Data Perusahaan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#8A8FA6] mb-1">
                Nama Perusahaan
              </label>
              <p className="text-sm text-[#2A2E45]">
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
    </div>
  );
}
