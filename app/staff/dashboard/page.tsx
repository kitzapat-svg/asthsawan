"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LogOut, UserPlus, Users, Activity, FileText, 
  Search, X, Filter 
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { signOut, useSession } from "next-auth/react";

interface Patient {
  hn: string;
  prefix: string;
  first_name: string;
  last_name: string;
  dob: string;
  status: string; // Active, COPD, Discharge
  last_visit?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  
  // --- State สำหรับระบบค้นหา ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All'); // กรองตามสถานะได้ด้วย

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchPatients();
    }
  }, [status, router]);

  const fetchPatients = async () => {
    try {
      // ดึงข้อมูลทั้งหมดมาเก็บไว้ใน Client ก่อน (Client-side Search เร็วกว่าสำหรับข้อมูลหลักพัน)
      const res = await fetch('/api/db?type=patients'); 
      const data = await res.json();
      
      // เรียงลำดับ HN จากมากไปน้อย (คนใหม่สุดขึ้นก่อน) หรือตามต้องการ
      const sortedData = Array.isArray(data) 
        ? data.sort((a: any, b: any) => b.hn.localeCompare(a.hn)) 
        : [];
        
      setPatients(sortedData);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/auth/signin" });
  };

  // --- Logic การกรองข้อมูล (Search & Filter) ---
  const filteredPatients = patients.filter(patient => {
    // 1. กรองตามข้อความค้นหา (HN, ชื่อ, นามสกุล)
    const query = searchQuery.toLowerCase().trim();
    const matchSearch = 
      patient.hn.toLowerCase().includes(query) ||
      patient.first_name.toLowerCase().includes(query) ||
      patient.last_name.toLowerCase().includes(query);

    // 2. กรองตามสถานะ (Active, COPD, Discharge)
    const matchStatus = filterStatus === 'All' || patient.status === filterStatus;

    return matchSearch && matchStatus;
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FEFCF8] dark:bg-black">
        <Activity className="animate-spin text-[#D97736] mb-4" size={48} />
        <p className="text-[#6B6560] dark:text-zinc-400 font-bold animate-pulse">กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFCF8] dark:bg-black p-6 font-sans text-[#2D2A26] dark:text-white transition-colors duration-300">
      
      {/* Header */}
      <header className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <span className="bg-[#D97736] text-white px-2 py-1 transform -rotate-2">ASTHMA</span>
            CARE
          </h1>
          <p className="text-[#6B6560] dark:text-zinc-400 font-medium mt-1">
            ระบบดูแลผู้ป่วยโรคหอบหืด
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-700 rounded-full font-bold text-sm hidden md:block">
            👤 {session?.user?.name || "Staff"}
          </div>
          <ThemeToggle />
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-[#2D2A26] hover:bg-[#D97736] text-white font-bold transition-colors shadow-[4px_4px_0px_0px_#888] hover:shadow-none hover:translate-y-0.5 active:shadow-none"
          >
            <LogOut size={18} /> <span className="hidden sm:inline">ออกจากระบบ</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto space-y-8">
        
        {/* Actions Bar & Search */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
            {/* ปุ่มลงทะเบียน */}
            <Link href="/staff/register">
              <button className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-[#D97736] text-white font-bold text-lg border-2 border-[#3D3834] dark:border-zinc-600 shadow-[4px_4px_0px_0px_#3D3834] hover:translate-y-0.5 hover:shadow-none transition-all">
                <UserPlus size={24} /> ลงทะเบียนผู้ป่วยใหม่
              </button>
            </Link>

            {/* ช่องค้นหา และ ตัวกรอง */}
            <div className="flex-1 flex gap-2 max-w-xl">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="ค้นหา HN หรือ ชื่อ-สกุล..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-700 focus:border-[#D97736] outline-none font-bold text-[#2D2A26] dark:text-white transition-all placeholder:font-normal"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                
                {/* Dropdown กรองสถานะ */}
                <div className="relative">
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="h-full px-4 pl-9 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-700 font-bold cursor-pointer outline-none focus:border-[#D97736] appearance-none min-w-[120px]"
                    >
                        <option value="All">ทั้งหมด</option>
                        <option value="Active">Active</option>
                        <option value="COPD">COPD</option>
                        <option value="Discharge">Discharge</option>
                    </select>
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D97736]" size={16} />
                </div>
            </div>
        </div>

        {/* Patients List */}
        <div className="bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[8px_8px_0px_0px_#3D3834] dark:shadow-none p-6 transition-colors">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
            <Users size={24} className="text-[#D97736]" />
            <h2 className="text-xl font-black">รายชื่อผู้ป่วย ({filteredPatients.length})</h2>
          </div>

          {filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <Link key={patient.hn} href={`/staff/patient/${patient.hn}`}>
                  <div className="group relative bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-700 p-4 hover:border-[#D97736] transition-all cursor-pointer hover:-translate-y-1 hover:shadow-md">
                    <div className="flex justify-between items-start mb-2">
                        <span className="font-mono text-sm text-[#6B6560] dark:text-zinc-400 font-bold">HN: {patient.hn}</span>
                        <span className={`text-[10px] uppercase px-2 py-0.5 border font-bold ${
                            patient.status === 'Active' ? 'bg-green-100 text-green-700 border-green-200' :
                            patient.status === 'COPD' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                            'bg-gray-100 text-gray-600 border-gray-300'
                        }`}>
                            {patient.status}
                        </span>
                    </div>
                    <h3 className="text-lg font-black group-hover:text-[#D97736] transition-colors truncate">
                      {patient.prefix}{patient.first_name} {patient.last_name}
                    </h3>
                    <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1">
                            <Activity size={14}/> View History
                        </span>
                        <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-700 border-2 border-[#3D3834] dark:border-zinc-600 flex items-center justify-center group-hover:bg-[#D97736] group-hover:border-[#D97736] group-hover:text-white transition-all">
                            <FileText size={14} />
                        </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-50 dark:bg-zinc-800/50 border-2 border-dashed border-gray-200 dark:border-zinc-700">
                <Search size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 font-bold">ไม่พบข้อมูลผู้ป่วยที่ค้นหา</p>
                <p className="text-sm text-gray-400">ลองตรวจสอบคำสะกด หรือกด "ทั้งหมด" ในตัวกรอง</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
