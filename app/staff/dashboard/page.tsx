"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  LogOut, 
  Activity, 
  Calendar,
  FileText,
  Plus,
  ArrowUpRight
} from 'lucide-react';

// ประกาศ Type ของข้อมูลคนไข้
interface Patient {
  hn: string;
  name: string;
  age: string;
  status: string;
  lastVisit?: string;
}

export default function StaffDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. ตรวจสอบ Login และดึงข้อมูล
  useEffect(() => {
    const isAuth = localStorage.getItem("isLoggedIn");
    // ถ้าไม่ได้ Login ให้ดีดกลับไปหน้าแรก ( Uncomment บรรทัดล่างเมื่อใช้งานจริง )
    // if (!isAuth) router.push("/");

    fetch('/api/db?type=patients')
      .then(res => res.json())
      .then(data => {
        // ถ้า API ส่งมา error หรือว่าง ให้กันไว้ก่อน
        if (Array.isArray(data)) {
          setPatients(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [router]);

  // 2. ฟังก์ชันกรองข้อมูล (Search)
  const filteredPatients = patients.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.hn?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen pb-20 font-sans text-[#2D2A26]">
      
      {/* --- NAVBAR --- */}
      <nav className="border-b-2 border-[#3D3834] bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D97736] border-2 border-[#3D3834] shadow-[2px_2px_0px_0px_#3D3834] flex items-center justify-center text-white">
              <Activity size={24} />
            </div>
            <span className="font-bold text-xl tracking-tight">Asthma Care Connect</span>
          </div>
          
          <button 
            onClick={() => {
              localStorage.removeItem("isLoggedIn");
              router.push("/");
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold border-2 border-[#3D3834] hover:bg-red-50 hover:text-red-600 transition-all active:translate-y-0.5"
          >
            <LogOut size={16} /> ออกจากระบบ
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Total Patients */}
          <div className="bg-white p-6 border-2 border-[#3D3834] shadow-[4px_4px_0px_0px_#3D3834] relative overflow-hidden group hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users size={80} />
            </div>
            <p className="text-[#6B6560] font-bold text-sm uppercase tracking-wider mb-1">ผู้ป่วยทั้งหมด</p>
            <h2 className="text-5xl font-extrabold text-[#D97736]">{patients.length}</h2>
            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-green-700 bg-green-50 w-fit px-2 py-1 border border-green-200">
              <ArrowUpRight size={14} /> +2 คนในเดือนนี้
            </div>
          </div>

          {/* Card 2: Risk Cases */}
          <div className="bg-[#F7F3ED] p-6 border-2 border-[#3D3834] shadow-[4px_4px_0px_0px_#3D3834] relative group hover:-translate-y-1 transition-transform">
             <div className="absolute top-0 right-0 p-4 opacity-10">
              <Activity size={80} />
            </div>
            <p className="text-[#6B6560] font-bold text-sm uppercase tracking-wider mb-1">กลุ่มเสี่ยงสูง (High Risk)</p>
            <h2 className="text-5xl font-extrabold text-[#2D2A26]">0</h2>
            <p className="mt-4 text-sm text-[#6B6560]">ต้องการการดูแลเป็นพิเศษ</p>
          </div>

          {/* Card 3: Today's Visits */}
          <div className="bg-[#D97736] text-white p-6 border-2 border-[#3D3834] shadow-[4px_4px_0px_0px_#3D3834] relative group hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 right-0 p-4 opacity-20 text-black">
              <Calendar size={80} />
            </div>
            <p className="text-white/80 font-bold text-sm uppercase tracking-wider mb-1">นัดหมายวันนี้</p>
            <h2 className="text-5xl font-extrabold text-white">0</h2>
            <button className="mt-4 bg-white text-[#D97736] text-xs font-bold px-3 py-1.5 border border-black shadow-[2px_2px_0px_0px_black] hover:translate-y-0.5 active:shadow-none transition-all">
              ดูตารางนัดหมาย
            </button>
          </div>
        </div>

        {/* --- TOOLBAR & SEARCH --- */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-6">
          <div className="w-full md:w-1/2 relative">
            <label className="block text-sm font-bold mb-2 ml-1">ค้นหาผู้ป่วย</label>
            <div className="relative">
              <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
              <input 
                type="text" 
                placeholder="ระบุ HN, ชื่อ-นามสกุล..." 
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-[#3D3834] shadow-[4px_4px_0px_0px_#2D2A26] outline-none focus:border-[#D97736] focus:shadow-[4px_4px_0px_0px_#D97736] transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

        <Link href="/staff/register">
          <button className="flex items-center gap-2 bg-[#2D2A26] text-white px-6 py-3 font-bold border-2 border-[#3D3834] shadow-[4px_4px_0px_0px_#888] hover:bg-[#D97736] hover:shadow-[4px_4px_0px_0px_#3D3834] active:translate-y-0.5 active:shadow-none transition-all">
            <Plus size={20} /> ลงทะเบียนผู้ป่วยใหม่
          </button>
        </Link>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white border-2 border-[#3D3834] shadow-[6px_6px_0px_0px_#3D3834]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F3ED] border-b-2 border-[#3D3834] text-sm uppercase tracking-wider text-[#6B6560]">
                  <th className="p-4 font-extrabold border-r border-[#3D3834]/20">HN</th>
                  <th className="p-4 font-extrabold border-r border-[#3D3834]/20">ชื่อ-นามสกุล</th>
                  <th className="p-4 font-extrabold border-r border-[#3D3834]/20">อายุ</th>
                  <th className="p-4 font-extrabold border-r border-[#3D3834]/20">สถานะ</th>
                  <th className="p-4 font-extrabold text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3D3834]/10">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400 animate-pulse">
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={40} className="opacity-20"/>
                        <span>ไม่พบข้อมูลผู้ป่วย</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient, index) => (
                    <tr key={index} className="group hover:bg-[#FFF9F0] transition-colors">
                      <td className="p-4 border-r border-[#3D3834]/10 font-mono font-bold text-[#D97736]">
                        {patient.hn}
                      </td>
                      <td className="p-4 border-r border-[#3D3834]/10 font-medium">
                        {patient.name}
                      </td>
                      <td className="p-4 border-r border-[#3D3834]/10 text-gray-600">
                        {patient.age || "-"}
                      </td>
                      <td className="p-4 border-r border-[#3D3834]/10">
                        <span className={`inline-flex items-center px-2.5 py-0.5 border border-current text-xs font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)] ${
                          patient.status === 'Uncontrolled' 
                            ? 'bg-red-50 text-red-700 border-red-200' 
                            : 'bg-green-50 text-green-700 border-green-200'
                        }`}>
                          {patient.status || "Unknown"}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button className="text-sm font-bold text-[#2D2A26] underline decoration-2 decoration-[#D97736]/30 hover:decoration-[#D97736] hover:text-[#D97736] transition-all">
                          ดูประวัติ
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Footer of Table */}
          <div className="bg-[#F7F3ED] p-3 text-xs text-right text-[#6B6560] font-medium border-t-2 border-[#3D3834]">
            แสดงผล {filteredPatients.length} รายการ
          </div>
        </div>

      </main>
    </div>
  );
}
