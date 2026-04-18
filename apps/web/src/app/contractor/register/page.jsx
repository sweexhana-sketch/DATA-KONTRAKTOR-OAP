import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import useUpload from "@/utils/useUpload";
import { ArrowLeft, Upload, Plus, X } from "lucide-react";

export default function ContractorRegisterPage() {
  const { data: user, loading: userLoading } = useUser();
  const [upload, { loading: uploadLoading }] = useUpload();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [existingData, setExistingData] = useState(null);

  // Data Pribadi
  const [nik, setNik] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  // Data Perusahaan
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("PT");
  const [npwp, setNpwp] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [establishmentYear, setEstablishmentYear] = useState("");

  // Klasifikasi & Bidang Usaha
  const [businessFields, setBusinessFields] = useState([]);
  const [newBusinessField, setNewBusinessField] = useState("");
  const [smallClassification, setSmallClassification] = useState("");
  const [mediumClassification, setMediumClassification] = useState("");
  const [largeClassification, setLargeClassification] = useState("");

  useEffect(() => {
    if (!userLoading && !user) {
      window.location.href = "/account/signin";
    }
  }, [user, userLoading]);

  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        const res = await fetch("/api/contractors/my-profile");
        if (res.ok) {
          const data = await res.json();
          if (data.contractor) {
            setExistingData(data.contractor);
            // Populate form dengan data yang sudah ada
            setNik(data.contractor.nik || "");
            setFullName(data.contractor.full_name || "");
            setBirthPlace(data.contractor.birth_place || "");
            setBirthDate(data.contractor.birth_date || "");
            setPhone(data.contractor.phone || "");
            setEmail(data.contractor.email || user?.email || "");
            setAddress(data.contractor.address || "");
            setCity(data.contractor.city || "");
            setCompanyName(data.contractor.company_name || "");
            setCompanyType(data.contractor.company_type || "PT");
            setNpwp(data.contractor.npwp || "");
            setCompanyAddress(data.contractor.company_address || "");
            setCompanyPhone(data.contractor.company_phone || "");
            setEstablishmentYear(data.contractor.establishment_year || "");
            setBusinessFields(data.contractor.business_field || []);
            setSmallClassification(data.contractor.small_classification || "");
            setMediumClassification(
              data.contractor.medium_classification || "",
            );
            setLargeClassification(data.contractor.large_classification || "");
          } else {
            setEmail(user?.email || "");
          }
        }
      } catch (err) {
        console.error("Error fetching existing data:", err);
      }
    };

    if (user) {
      fetchExistingData();
    }
  }, [user]);

  const addBusinessField = () => {
    if (newBusinessField.trim()) {
      setBusinessFields([...businessFields, newBusinessField.trim()]);
      setNewBusinessField("");
    }
  };

  const removeBusinessField = (index) => {
    setBusinessFields(businessFields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const contractorData = {
        nik,
        full_name: fullName,
        birth_place: birthPlace,
        birth_date: birthDate,
        phone,
        email,
        address,
        city,
        company_name: companyName,
        company_type: companyType,
        npwp,
        company_address: companyAddress,
        company_phone: companyPhone,
        establishment_year: establishmentYear
          ? parseInt(establishmentYear)
          : null,
        business_field: businessFields,
        small_classification: smallClassification,
        medium_classification: mediumClassification,
        large_classification: largeClassification,
      };

      let res;
      if (existingData) {
        // Update existing contractor
        res = await fetch(`/api/contractors/${existingData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contractorData),
        });
      } else {
        // Create new contractor
        res = await fetch("/api/contractors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contractorData),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Terjadi kesalahan");
      }

      setSuccess(
        existingData
          ? "Data berhasil diupdate!"
          : "Pendaftaran berhasil! Data Anda akan diverifikasi oleh admin.",
      );

      setTimeout(() => {
        window.location.href = "/contractor/profile";
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
                {existingData
                  ? "Update Data Kontraktor"
                  : "Pendaftaran Kontraktor OAP"}
              </h1>
              <p className="text-sm text-[#8A8FA6]">
                Dinas PUPR Papua Barat Daya
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Pribadi */}
          <div className="bg-white border border-[#E4E9F2] rounded p-6">
            <h2 className="text-lg font-semibold text-[#2A2E45] mb-4">
              Data Pribadi
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  NIK <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nik}
                  onChange={(e) => setNik(e.target.value)}
                  required
                  maxLength={16}
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                  placeholder="16 digit NIK"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Tempat Lahir
                </label>
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  No. Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Alamat <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Kota/Kabupaten
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                />
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
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Nama Perusahaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Jenis Perusahaan
                </label>
                <select
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                >
                  <option value="PT">PT (Perseroan Terbatas)</option>
                  <option value="CV">CV (Commanditaire Vennootschap)</option>
                  <option value="UD">UD (Usaha Dagang)</option>
                  <option value="Perorangan">Perorangan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  NPWP
                </label>
                <input
                  type="text"
                  value={npwp}
                  onChange={(e) => setNpwp(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                  placeholder="00.000.000.0-000.000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Alamat Kantor
                </label>
                <textarea
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Telepon Kantor
                </label>
                <input
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Tahun Berdiri
                </label>
                <input
                  type="number"
                  value={establishmentYear}
                  onChange={(e) => setEstablishmentYear(e.target.value)}
                  min="1900"
                  max={new Date().getFullYear()}
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                  placeholder="2020"
                />
              </div>
            </div>
          </div>

          {/* Klasifikasi & Bidang Usaha */}
          <div className="bg-white border border-[#E4E9F2] rounded p-6">
            <h2 className="text-lg font-semibold text-[#2A2E45] mb-4">
              Klasifikasi & Bidang Usaha
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Kelas Kecil
                </label>
                <input
                  type="text"
                  value={smallClassification}
                  onChange={(e) => setSmallClassification(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                  placeholder="K1, K2, K3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Kelas Menengah
                </label>
                <input
                  type="text"
                  value={mediumClassification}
                  onChange={(e) => setMediumClassification(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                  placeholder="M1, M2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                  Kelas Besar
                </label>
                <input
                  type="text"
                  value={largeClassification}
                  onChange={(e) => setLargeClassification(e.target.value)}
                  className="w-full h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                  placeholder="B1, B2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2A2E45] mb-2">
                Bidang Usaha
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newBusinessField}
                  onChange={(e) => setNewBusinessField(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), addBusinessField())
                  }
                  className="flex-1 h-10 px-3 border border-[#E4E9F2] rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#1570FF]"
                  placeholder="Contoh: Pembangunan Jalan"
                />
                <button
                  type="button"
                  onClick={addBusinessField}
                  className="px-4 h-10 bg-[#1570FF] text-white rounded text-sm flex items-center space-x-2 hover:bg-[#0F5FE6]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </div>

              {businessFields.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {businessFields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2 bg-[#EDF3FF] px-3 py-1 rounded-full"
                    >
                      <span className="text-sm text-[#1570FF]">{field}</span>
                      <button
                        type="button"
                        onClick={() => removeBusinessField(index)}
                        className="text-[#1570FF] hover:text-[#0F5FE6]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded p-4 text-sm text-green-800">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => (window.location.href = "/")}
              className="px-6 h-10 bg-white border border-[#E4E9F2] text-[#2A2E45] rounded text-sm font-semibold hover:bg-[#F7F9FC]"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 h-10 bg-[#1570FF] text-white rounded text-sm font-semibold hover:bg-[#0F5FE6] disabled:opacity-50"
            >
              {loading
                ? "Menyimpan..."
                : existingData
                  ? "Update Data"
                  : "Daftar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
