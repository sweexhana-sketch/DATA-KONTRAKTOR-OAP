import useAuth from "@/utils/useAuth";

export default function LogoutPage() {
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/account/signin",
      redirect: true,
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F7F9FC]">
      <div className="w-full max-w-md rounded bg-white p-8 border border-[#E4E9F2]">
        <h1 className="mb-6 text-center text-2xl font-bold text-[#2A2E45]">
          Keluar
        </h1>

        <button
          onClick={handleSignOut}
          className="w-full h-10 rounded bg-[#1570FF] text-white text-sm font-semibold hover:bg-[#0F5FE6]"
        >
          Keluar dari Sistem
        </button>
      </div>
    </div>
  );
}
