"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Activity, Calendar, User, 
  Ruler, QrCode, FileText, ChevronDown, ChevronUp, Clock, Pill,
  AlertTriangle, Timer, CheckCircle
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
  controller: string;
  reliever: string;
  note: string;
  technique_check: string;
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

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
            ...v,
            dateDisplay: new Date(v.date).toLocaleDateString('th-TH', { 
                day: '2-digit', month: 'short', year: '2-digit' 
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

  // --- Logic คำนวณ Inhaler Review ---
  const getInhalerStatus = () => {
    const lastReview = [...visitHistory]
        .reverse()
        .find(v => v.technique_check === 'ทำ');

    if (!lastReview) {
        return { status: 'never', days: 0, lastDate: null };
    }

    const lastDate = new Date(lastReview.fullDate);
    const nextDate = new Date(lastDate);
    nextDate.setFullYear(nextDate.getFullYear() + 1); 

    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { status: 'overdue', days: Math.abs(diffDays), lastDate: lastDate };
    } else {
        return { status: 'ok', days: diffDays, lastDate: lastDate };
    }
  };

  const inhalerStatus = getInhalerStatus();

  // --- Helpers ---
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
  const getStatusStyle = (status: string) => {
     if (status === 'Active') return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800';
     if (status === 'COPD') return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
     return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
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

  return (
    <div className="min-h-screen bg-[#FEFCF8] dark:bg-black p-6 pb-20 font-sans text-[#2D2A26] dark:text-white transition-colors duration-300">
      
      {/* Header */}
      <nav className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#6B6560] dark:text-zinc-400 hover:text-[#D97736] dark:hover:text-[#D97736] font-bold transition-colors">
          <ArrowLeft size={20} /> กลับหน้าหลัก
        </button>
        <div className="flex items-center gap-4">
            <div className="relative">
                <select 
                    value={patient.status}
                    onChange={(e) => {
                        const newStatus = e.target.value;
                        const confirmChange = window.confirm(`ยืนยันการเปลี่ยนสถานะเป็น "${newStatus}"?`);
                        if (confirmChange) {
                            const update = async () => {
                                setUpdatingStatus(true);
                                await fetch('/api/db', { method: 'PUT', body: JSON.stringify({ type: 'patients', hn: patient.hn, status: newStatus })});
                                setPatient({...patient, status: newStatus});
                                setUpdatingStatus(false);
                            };
                            update();
                        }
                    }}
                    disabled={updatingStatus}
                    className={`appearance-none px-4 py-1.5 text-xs font-bold border rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#D97736] transition-all ${getStatusStyle(patient.status)} ${updatingStatus ? 'opacity-50' : ''}`}
                >
                    <option value="Active">🟢 Active</option>
                    <option value="COPD">🟠 COPD</option>
                    <option value="Discharge">⚪ Discharge</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M5 6L0 0H10L5 6Z"/></svg></div>
            </div>
            <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="space-y-6">
          {/* 1. ข้อมูลส่วนตัว */}
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

          {/* 2. QR Code */}
          <div className="bg-[#2D2A26] dark:bg-zinc-800 p-6 text-white border-2 border-[#3D3834] dark:border-zinc-700 shadow-[6px_6px_0px_0px_#888] dark:shadow-none text-center transition-colors">
             <div className="bg-white p-4 w-fit mx-auto mb-4 border-4 border-[#D97736]">
                <QRCodeSVG value={`https://asthsawan.vercel.app/patient/${patient.public_token}`} size={150} />
             </div>
             <h3 className="font-bold text-lg flex items-center justify-center gap-2"><QrCode size={20}/> Patient QR Code</h3>
             <p className="text-white/60 text-sm mt-1">ให้ผู้ป่วยสแกนเพื่อดูผลการรักษา</p>
          </div>

          {/* 3. แจ้งเตือนเทคนิคพ่นยา (Compact Style) */}
          <div className={`p-4 border-l-4 rounded-r-md flex flex-col gap-2 shadow-sm ${
                inhalerStatus.status === 'never' ? 'bg-red-50 border-red-500 dark:bg-red-900/20' :
                inhalerStatus.status === 'overdue' ? 'bg-orange-50 border-orange-500 dark:bg-orange-900/20' :
                'bg-blue-50 border-blue-500 dark:bg-blue-900/20'
            }`}>
                <div className="flex items-center gap-2">
                    <div className="shrink-0">
                        {inhalerStatus.status === 'ok' ? <Timer size={18} className="text-blue-500"/> : <AlertTriangle size={18} className={inhalerStatus.status === 'never' ? 'text-red-500' : 'text-orange-500'}/>}
                    </div>
                    <h4 className={`font-bold text-sm uppercase ${
                         inhalerStatus.status === 'never' ? 'text-red-700 dark:text-red-400' :
                         inhalerStatus.status === 'overdue' ? 'text-orange-700 dark:text-orange-400' :
                         'text-blue-700 dark:text-blue-400'
                    }`}>
                        Inhaler Review
                    </h4>
                </div>
                
                <div className="pl-6 text-xs leading-tight">
                    {inhalerStatus.status === 'never' && (
                        <p className="text-red-600 dark:text-red-300 font-bold">
                            ⚠️ ยังไม่เคยสอน
                        </p>
                    )}

                    {inhalerStatus.status === 'overdue' && (
                        <>
                             <p className="text-orange-800 dark:text-orange-200 font-bold">
                                ⚠️ เลยกำหนด {inhalerStatus.days} วัน
                             </p>
                             <p className="text-orange-600/70 dark:text-orange-400 mt-1">
                                ล่าสุด: {inhalerStatus.lastDate?.toLocaleDateString('th-TH', {day: '2-digit', month: 'short', year: '2-digit'})}
                             </p>
                        </>
                    )}

                    {inhalerStatus.status === 'ok' && (
                         <>
                             <p className="text-blue-800 dark:text-blue-200 font-bold">
                                ✅ อีก {inhalerStatus.days} วัน ครบกำหนด
                             </p>
                             <p className="text-blue-600/70 dark:text-blue-400 mt-1">
                                ล่าสุด: {inhalerStatus.lastDate?.toLocaleDateString('th-TH', {day: '2-digit', month: 'short', year: '2-digit'})}
                             </p>
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* Chart Section */}
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
                            <XAxis dataKey="dateDisplay" tick={{fontSize: 12, fill: '#888888'}} />
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

            {/* Action Buttons */}
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

            {/* History Table Section */}
            <div className="border-2 border-[#3D3834] dark:border-zinc-800 bg-white dark:bg-zinc-900 transition-colors">
                <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-between p-4 bg-[#F7F3ED] dark:bg-zinc-800 hover:bg-[#eae5dd] dark:hover:bg-zinc-700 transition-colors"
                >
                    <div className="flex items-center gap-2 font-bold text-[#2D2A26] dark:text-white">
                        <Clock size={20} className="text-[#D97736]"/> 
                        ประวัติการตรวจย้อนหลัง ({visitHistory.length})
                    </div>
                    {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {showHistory && (
                    <div className="overflow-x-auto p-4 animate-in slide-in-from-top-2 duration-300">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-3">วันที่</th>
                                    <th className="p-3">PEFR</th>
                                    <th className="p-3">อาการ</th>
                                    <th className="p-3">ยาที่ใช้</th>
                                    <th className="p-3">Inhaler Check</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                                {[...visitHistory].reverse().map((visit, index) => (
                                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                                        <td className="p-3 font-mono font-bold whitespace-nowrap dark:text-zinc-300">{visit.dateDisplay}</td>
                                        <td className="p-3">
                                            <span className={`font-black ${
                                                visit.pefr > predictedVal * 0.8 ? 'text-green-600' :
                                                visit.pefr > predictedVal * 0.6 ? 'text-yellow-600' : 'text-red-600'
                                            }`}>
                                                {visit.pefr}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-xs border ${
                                                visit.control_level === 'Well-controlled' ? 'bg-green-50 text-green-700 border-green-200' :
                                                visit.control_level === 'Partly Controlled' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {visit.control_level}
                                            </span>
                                        </td>
                                        <td className="p-3 text-xs dark:text-zinc-400">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1"><Pill size={10} className="text-blue-500"/> {visit.controller}</span>
                                                <span className="flex items-center gap-1"><Pill size={10} className="text-orange-500"/> {visit.reliever}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-xs">
                                            {visit.technique_check === 'ทำ' ? (
                                                <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> สอนแล้ว</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {visitHistory.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-6 text-center text-gray-400">ไม่มีประวัติการตรวจ</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
}
