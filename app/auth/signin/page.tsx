"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ArrowRight, Lock } from "lucide-react";

export default function SignInPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    // เรียกใช้ระบบ Login ของ NextAuth
    const result = await signIn("credentials", {
      password: password,
      redirect: false, // เราจะจัดการเปลี่ยนหน้าเอง
    });

    if (result?.error) {
      setError(true);
      setLoading(false);
    } else {
      // ถ้าผ่าน ให้ไปที่ Dashboard
      router.push("/staff/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[#FEFCF8]">
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-40" 
           style={{ backgroundImage: 'radial-gradient(#D97736 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
      </div>

      <div className="z-10 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#D97736] p-4 border-2 border-[#3D3834] shadow-[4px_4px_0px_0px_#3D3834]">
            <Activity className="text-white w-12 h-12" />
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white border-2 border-[#3D3834] shadow-[8px_8px_0px_0px_#3D3834] p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-[#2D2A26] mb-2 tracking-tight">STAFF PORTAL</h1>
            <p className="text-[#6B6560] font-medium">เข้าสู่ระบบเจ้าหน้าที่</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold mb-2 text-[#2D2A26]">RASSWORD</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  placeholder="รหัสผ่าน..."
                  className={`w-full pl-10 pr-4 py-3 bg-white border-2 outline-none transition-all font-bold ${
                    error ? 'border-red-500 text-red-600 focus:shadow-[4px_4px_0px_0px_#EF4444]' : 'border-[#3D3834] focus:border-[#D97736] focus:shadow-[4px_4px_0px_0px_#D97736]'
                  }`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-red-500 text-sm font-bold mt-2">* รหัสผ่านไม่ถูกต้อง</p>}
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-[#2D2A26] text-white font-bold text-lg py-3 border-2 border-[#3D3834] shadow-[4px_4px_0px_0px_#888] hover:bg-[#D97736] hover:shadow-[4px_4px_0px_0px_#3D3834] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? "กำลังตรวจสอบ..." : (
                <>
                  เข้าสู่ระบบ <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
