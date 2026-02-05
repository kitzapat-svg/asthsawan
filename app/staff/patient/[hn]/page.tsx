"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Calendar, User, 
  Ruler, QrCode, FileText, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Label 
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { ThemeToggle } from '@/components/theme-toggle';

// --- Types ---
interface Patient {
  hn: string;
  prefix: string;
  first_name: string;
  last_name: string;
  dob: string;
  height: string;
  best_pefr: string;
  status: string;
  public_token: string;
}

interface Visit {
  hn: string;
  date: string;
  pefr: string;
  control_level: string;
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false); // State สำหรับ Loading ตอนเปลี่ยนสถานะ

  // 1. ดึงข้อมูล
  useEffect(() => {
    fetchData();
  }, [params.hn]);

  const fetchData = async () => {
    try {
      const resPatients = await fetch('/api/db?type=patients');
      const dataPatients: Patient[] = await resPatients.json();
      const foundPatient = dataPatients.find(p => p.hn === params.hn);

      if (foundPatient) {
        setPatient(foundPatient);

        const resVisits = await fetch('/api/db?type=visits');
        const dataVisits: Visit[] = await resVisits.json();

        const history = dataVisits
          .filter(v => v.hn === params.hn)
          .map(v => ({
            date: new Date(v.date).toLocaleDateString('th-TH', { 
                day: '2-digit', 
                month: '2-digit',
                year: '2-digit' 
            }),
            fullDate: v.date,
            pefr: parseInt(v.pefr) || 0
          }))
          .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime());

        setVisitHistory(history);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันเปลี่ยนสถานะ
  const handleStatusChange = async (newStatus: string) => {
    if (!patient) return;
    const confirmChange = window.confirm(`ยืนยันการเปลี่ยนสถานะเป็น "${newStatus}"?`);
    if (!confirmChange) return;

    setUpdatingStatus(true);
    try {
      const res = await fetch('/api/db', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'patients',
          hn: patient.hn,
          status: newStatus
        })
      });

      if (res.ok) {
        setPatient({ ...patient, status: newStatus }); // อัปเดตหน้าจอทันที
        alert("อัปเดตสถานะเรียบร้อย");
      } else {
        alert("เกิดข้อผิดพลาดในการอัปเดต");
      }
    } catch (error) {
      console.error(error);
      alert("เชื่อมต่อ Server ไม่ได้");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // --- Logic คำนวณ ---
  const getAge = (dob: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    if (today.getMonth() < birthDate.getMonth() || 
       (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const calculatePredictedPEFR = (p: Patient) => {
    const age = getAge(p.dob);
    const height = parseFloat(p.height || "0");
    if (height === 0) return 0;
    let predicted = 0;
    if (["นาย", "ด.ช."].includes(p.prefix)) {
      predicted = (5.48 * height) - (1.51 * age) - 279.7;
    } else {
      predicted = (3.72 * height) - (2.24 * age) - 96.6;
    }
    return Math.max(0, Math.round(predicted));
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#FEFCF8] dark:bg-black text-[#2D2A26] dark:text-white">
      <Activity className="animate-spin text-[#D97736]" size={48} />
      <p className="text-[#6B6560] dark:text-zinc-400 font-bold">กำลังโหลดข้อมูล...</p>
    </div>
  );
  
  if (!patient) return <div className="p-10 text-center text-red-500 font-bold">ไม่พบข้อมูลผู้ป่วย HN: {params.hn}</div>;

  const predictedVal = calculatePredictedPEFR(patient);
  const age = getAge(patient.dob);
  const graphData = visitHistory.length > 0 ? visitHistory : [{ date: 'Start', pefr: 0 }];

  // Helper สำหรับสี Select Status
  const getStatusStyle = (status: string) => {
     if (status === 'Active') return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
     if (status === 'COPD') return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
     return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
  };

  return (
    <div className="min-h-screen bg-[#FEFCF8] dark:bg-black p-6 pb-20 font-sans text-[#2D2A26] dark:text-white transition-colors duration-300">
      
      {/* Header */}
      <nav className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#6B6560] dark:text-zinc-400 hover:text-[#D97736] dark:hover:text-[#D97736] font-bold transition-colors"
        >
          <ArrowLeft size={20} /> กลับหน้าหลัก
        </button>
        
        <div className="flex items-center gap-4">
            {/* Status Dropdown (แก้ไขได้) */}
            <div className="relative">
                <select 
                    value={patient.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updatingStatus}
                    className={`appearance-none px-4 py-1.5 text-xs font-bold border rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D97736] transition-all ${getStatusStyle(patient.status)} ${updatingStatus ? 'opacity-50' : ''}`}
                >
                    <option value="Active">🟢 Active</option>
                    <option value="COPD">🟠 COPD</option>
                    <option value="Discharge">⚪ Discharge</option>
                </select>
                {/* ลูกศร Custom */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10L5 6Z"/></svg>
                </div>
            </div>
            
            <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personal Info & QR */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-6 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none transition-colors">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-zinc-800">
                <div className="w-12 h-12 bg-[#D97736] flex items-center justify-center text-white border-2 border-[#3D3834] dark:border-zinc-700">
                    <User size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-black">{patient.prefix}{patient.first_name}</h1>
                    <p className="text-[#6B6560] dark:text-zinc-400 font-medium">{patient.last_name}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1"><FileText size={14}/> HN</p><p className="font-bold font-mono text-lg">{patient.hn}</p></div>
                <div><p className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1"><Calendar size={14}/> อายุ</p><p className="font-bold text-lg">{age} ปี</p></div>
                <div><p className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1"><Ruler size={14}/> ส่วนสูง</p><p className="font-bold text-lg">{patient.height || "-"} cm</p></div>
                <div><p className="text-[#6B6560] dark:text-zinc-500 flex items-center gap-1"><Activity size={14}/> Best PEFR</p><p className="font-bold text-lg">{patient.best_pefr || "-"} L/min</p></div>
            </div>
          </div>

          <div className="bg-[#2D2A26] dark:bg-zinc-800 p-6 text-white border-2 border-[#3D3834] dark:border-zinc-700 shadow-[6px_6px_0px_0px_#888] dark:shadow-none text-center transition-colors">
             <div className="bg-white p-4 w-fit mx-auto mb-4 border-4 border-[#D97736]">
                <QRCodeSVG value={`https://asthsawan.vercel.app/patient/${patient.public_token}`} size={150} />
             </div>
             <h3 className="font-bold text-lg flex items-center justify-center gap-2"><QrCode size={20}/> Patient QR Code</h3>
             <p className="text-white/60 text-sm mt-1">ให้ผู้ป่วยสแกนเพื่อดูผลการรักษา</p>
          </div>
        </div>

        {/* Right Column: Chart */}
        <div className="lg:col-span-2 space-y-6">
            {/* Predicted Values */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-[#F7F3ED] dark:bg-zinc-800 p-5 border-2 border-[#3D3834] dark:border-zinc-700 transition-colors">
                    <p className="text-[#6B6560] dark:text-zinc-400 text-xs font-bold uppercase">ค่ามาตรฐาน (Predicted)</p>
                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-4xl font-black text-[#D97736]">{predictedVal}</span>
                        <span className="text-sm font-bold text-[#6B6560] dark:text-zinc-500 mb-1">L/min</span>
                    </div>
                 </div>
                 <div className="bg-white dark:bg-zinc-900 p-5 border-2 border-[#3D3834] dark:border-zinc-700 transition-colors">
                    <p className="text-[#6B6560] dark:text-zinc-400 text-xs font-bold uppercase">เป้าหมาย (80%)</p>
                     <div className="flex items-end gap-2 mt-1">
                        <span className="text-4xl font-black text-green-600 dark:text-green-500">{Math.round(predictedVal * 0.8)}</span>
                        <span className="text-sm font-bold text-[#6B6560] dark:text-zinc-500 mb-1">L/min</span>
                    </div>
                 </div>
            </div>

            {/* Chart */}
            <div className="bg-white dark:bg-zinc-900 p-6 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-[#2D2A26] dark:text-white">
                        <Activity size={20} className="text-[#D97736]"/> แนวโน้มค่า PEFR
                    </h3>
                </div>
                
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#888888" />
                            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#888888'}} />
                            <YAxis domain={[0, 800]} tick={{fontSize: 12, fill: '#888888'}} />
                            <Tooltip contentStyle={{ borderRadius: '0px', border: '2px solid #3D3834', boxShadow: '4px 4px 0px 0px #3D3834', color: '#000' }}/>
                            
                            <ReferenceLine y={predictedVal * 0.8} stroke="#22c55e" strokeDasharray="3 3">
                                <Label value="Green Zone" fill="#22c55e" fontSize={10} position="insideTopRight" />
                            </ReferenceLine>
                            <ReferenceLine y={predictedVal * 0.6} stroke="#ef4444" strokeDasharray="3 3">
                                <Label value="Red Zone" fill="#ef4444" fontSize={10} position="insideTopRight" />
                            </ReferenceLine>
                            
                            <Line type="monotone" dataKey="pefr" stroke="#D97736" strokeWidth={3} dot={{ r: 4, fill: '#D97736', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Link href={`/staff/visit/${patient.hn}`}>
                    <button className="w-full py-4 border-2 border-[#3D3834] dark:border-zinc-600 font-bold hover:bg-[#F7F3ED] dark:hover:bg-zinc-800 dark:text-white transition-colors flex items-center justify-center gap-2">
                        <FileText size={20}/> บันทึกการตรวจ (Visit)
                    </button>
                </Link>

                <button className="py-4 bg-[#D97736] text-white border-2 border-[#3D3834] dark:border-zinc-700 shadow-[4px_4px_0px_0px_#3D3834] dark:shadow-none font-bold hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2">
                    <Activity size={20}/> พ่นยาฉุกเฉิน
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
