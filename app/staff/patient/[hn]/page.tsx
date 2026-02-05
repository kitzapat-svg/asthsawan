"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Calendar, User, 
  Ruler, QrCode, FileText 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Label 
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { ThemeToggle } from '@/components/theme-toggle'; // <--- เรียกใช้ปุ่มปรับธีม

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

  // 1. ดึงข้อมูลคนไข้ + ประวัติการตรวจ
  useEffect(() => {
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

    fetchData();
  }, [params.hn]);

  // --- Logic การคำนวณ ---
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
      <p className="text-[#6B6560] dark:text-zinc-400 font-bold">กำลังโหลดข้อมูลเวชระเบียน...</p>
    </div>
  );
  
  if (!patient) return <div className="p-10 text-center text-red-500 font-bold">ไม่พบข้อมูลผู้ป่วย HN: {params.hn}</div>;

  const predictedVal = calculatePredictedPEFR(patient);
  const age = getAge(patient.dob);
  const graphData = visitHistory.length > 0 ? visitHistory : [{ date: 'Start', pefr: 0 }];

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
            <span className={`px-3 py-1 text-xs font-bold border rounded-full ${
                patient.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' : 
                patient.status === 'COPD' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800' : 
                'bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
            }`}>
                {patient.status}
            </span>
            
            {/* ปุ่มเปลี่ยนธีม */}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-[#F7F3ED] dark:bg-zinc-800 p-5 border-2 border-[#3D3834] dark:border-zinc-700 transition-colors">
                    <p className="text-[#6B6560] dark:text-zinc-400 text-xs font-bold uppercase">ค่ามาตรฐาน (Predicted)</p>
                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-4xl font-black text-[#D97736]">{predictedVal}</span>
                        <span className="text-sm font-bold text-[#6B6560] dark:text-zinc-500 mb-1">L/min</span>
                    </div>
                    <p className="text-xs text-[#6B6560] dark:text-zinc-500 mt-2">*คำนวณจากเพศ ส่วนสูง และอายุ</p>
                 </div>
                 <div className="bg-white dark:bg-zinc-900 p-5 border-2 border-[#3D3834] dark:border-zinc-700 transition-colors">
                    <p className="text-[#6B6560] dark:text-zinc-400 text-xs font-bold uppercase">เป้าหมาย (80% ของค่ามาตรฐาน)</p>
                     <div className="flex items-end gap-2 mt-1">
                        <span className="text-4xl font-black text-green-600 dark:text-green-500">{Math.round(predictedVal * 0.8)}</span>
                        <span className="text-sm font-bold text-[#6B6560] dark:text-zinc-500 mb-1">L/min</span>
                    </div>
                    <p className="text-xs text-[#6B6560] dark:text-zinc-500 mt-2">ควรคุมอาการให้ได้เกินค่านี้ (Green Zone)</p>
                 </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[6px_6px_0px_0px_#3D3834] dark:shadow-none transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2 text-[#2D2A26] dark:text-white">
                        <Activity size={20} className="text-[#D97736]"/> แนวโน้มค่า PEFR
                    </h3>
                    <div className="text-xs font-bold bg-gray-100 dark:bg-zinc-800 dark:text-zinc-300 px-2 py-1 rounded border dark:border-zinc-700 flex gap-2">
                        <span>จำนวนครั้งที่ตรวจ: {visitHistory.length}</span>
                    </div>
                </div>
                
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={graphData}>
                            {/* ปรับสี Grid และ Axes ให้เป็นสีเทา (Gray-500) เพื่อให้เห็นชัดทั้ง 2 ธีม */}
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} stroke="#888888" />
                            <XAxis dataKey="date" tick={{fontSize: 12, fill: '#888888'}} />
                            <YAxis domain={[0, 800]} tick={{fontSize: 12, fill: '#888888'}} />
                            
                            <Tooltip 
                                contentStyle={{ 
                                    borderRadius: '0px', 
                                    border: '2px solid #3D3834', 
                                    boxShadow: '4px 4px 0px 0px #3D3834',
                                    color: '#000' // บังคับตัวหนังสือใน Tooltip เป็นสีดำ
                                }}
                            />
                            
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
                
                <div className="mt-4 flex gap-4 text-xs font-bold justify-center text-[#2D2A26] dark:text-zinc-300">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div> &gt; 80% (ปลอดภัย)
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div> 60-80% (ระวัง)
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div> &lt; 60% (อันตราย)
                    </div>
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
