"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Activity, Calendar, User, FileText, CheckCircle, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Label 
} from 'recharts';

// --- Types ---
interface Patient {
  hn: string;
  prefix: string;
  first_name: string;
  last_name: string;
  dob: string;
  height: string;
  public_token: string;
}

interface Visit {
  hn: string;
  date: string;
  pefr: string;
  control_level: string;
  next_appt: string;
  advice: string;
}

export default function PatientPublicPage() {
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [lastVisit, setLastVisit] = useState<Visit | null>(null);
  const [visitHistory, setVisitHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. หาคนไข้จาก Token (Column I)
        const resPatients = await fetch('/api/db?type=patients');
        const dataPatients: Patient[] = await resPatients.json();
        const foundPatient = dataPatients.find(p => p.public_token === params.token);

        if (foundPatient) {
          setPatient(foundPatient);

          // 2. ดึงประวัติการรักษาของคนไข้คนนี้
          const resVisits = await fetch('/api/db?type=visits');
          const dataVisits: Visit[] = await resVisits.json();

          // กรองเฉพาะ HN ของคนไข้คนนี้ และเรียงวันที่ล่าสุดขึ้นก่อน
          const myVisits = dataVisits
            .filter(v => v.hn === foundPatient.hn)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

          if (myVisits.length > 0) {
            setLastVisit(myVisits[0]); // Visit ล่าสุด
            
            // ข้อมูลสำหรับกราฟ (เรียงเก่าไปใหม่)
            const graphData = [...myVisits]
              .reverse()
              .map(v => ({
                date: new Date(v.date).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' }),
                pefr: parseInt(v.pefr) || 0
              }));
            setVisitHistory(graphData);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.token]);

  // Helper: สีสถานะ
  const getStatusColor = (level: string) => {
    if (level === 'Well-controlled') return 'bg-green-500 text-white';
    if (level === 'Partly Controlled') return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getStatusIcon = (level: string) => {
    if (level === 'Well-controlled') return <CheckCircle size={32} />;
    if (level === 'Partly Controlled') return <AlertTriangle size={32} />;
    return <XCircle size={32} />;
  };

  const getStatusText = (level: string) => {
    if (level === 'Well-controlled') return 'คุมอาการได้ดี (Well)';
    if (level === 'Partly Controlled') return 'คุมได้บางส่วน (Partly)';
    return 'ยังคุมไม่ได้ (Uncontrolled)';
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FEFCF8]">
      <div className="animate-spin text-[#D97736] mb-4"><Activity size={40} /></div>
      <p className="text-[#6B6560] font-bold">กำลังโหลดข้อมูล...</p>
    </div>
  );

  if (!patient) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FEFCF8] text-center">
      <AlertTriangle size={48} className="text-red-500 mb-4" />
      <h1 className="text-xl font-black text-[#2D2A26]">ไม่พบข้อมูล</h1>
      <p className="text-[#6B6560] mt-2">QR Code อาจไม่ถูกต้อง หรือข้อมูลถูกลบไปแล้ว</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F2F2F2] pb-10 font-sans text-[#2D2A26]">
      
      {/* Header Mobile Style */}
      <div className="bg-[#2D2A26] text-white p-6 rounded-b-[30px] shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity size={120} />
        </div>
        <div className="relative z-10">
            <p className="text-white/60 text-sm font-bold mb-1">สวัสดีคุณ</p>
            <h1 className="text-3xl font-black">{patient.first_name} {patient.last_name}</h1>
            <div className="flex items-center gap-2 mt-2 text-white/80 text-sm">
                <FileText size={14} /> HN: {patient.hn}
            </div>
        </div>
      </div>

      <div className="px-5 -mt-8 relative z-20 space-y-6">
        
        {/* 1. Status Card (ใบรายงานผลล่าสุด) */}
        <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
            <h2 className="text-[#6B6560] font-bold text-xs uppercase mb-4 tracking-wider">ผลการประเมินล่าสุด</h2>
            
            {lastVisit ? (
                <div className="text-center">
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg ${getStatusColor(lastVisit.control_level)}`}>
                        {getStatusIcon(lastVisit.control_level)}
                    </div>
                    <h3 className="text-xl font-black text-[#2D2A26] mb-1">
                        {getStatusText(lastVisit.control_level)}
                    </h3>
                    <p className="text-[#6B6560] text-sm">อัปเดตเมื่อ: {new Date(lastVisit.date).toLocaleDateString('th-TH')}</p>
                </div>
            ) : (
                <div className="text-center py-4 text-gray-400">
                    ยังไม่มีประวัติการตรวจ
                </div>
            )}
        </div>

        {/* 2. Next Appointment (วันนัด) */}
        {lastVisit?.next_appt && (
            <div className="bg-[#D97736] text-white rounded-2xl p-6 shadow-lg flex items-center justify-between">
                <div>
                    <p className="text-white/80 text-xs font-bold uppercase mb-1">นัดหมายครั้งต่อไป</p>
                    <h3 className="text-2xl font-black">
                        {new Date(lastVisit.next_appt).toLocaleDateString('th-TH', { dateStyle: 'long' })}
                    </h3>
                </div>
                <div className="bg-white/20 p-3 rounded-full">
                    <Calendar size={24} />
                </div>
            </div>
        )}

        {/* 3. Doctor's Advice (คำแนะนำ) */}
        {lastVisit?.advice && lastVisit.advice !== '-' && (
             <div className="bg-white rounded-2xl p-6 shadow-md border-l-8 border-[#2D2A26]">
                <h3 className="font-bold flex items-center gap-2 mb-2 text-[#2D2A26]">
                    <Clock size={18} /> คำแนะนำจากแพทย์/เภสัช
                </h3>
                <p className="text-gray-600 leading-relaxed bg-[#F7F3ED] p-3 rounded-lg">
                    "{lastVisit.advice}"
                </p>
            </div>
        )}

        {/* 4. Mini Chart */}
        {visitHistory.length > 0 && (
             <div className="bg-white rounded-2xl p-6 shadow-md">
                <h3 className="font-bold flex items-center gap-2 mb-4 text-[#D97736]">
                    <Activity size={18} /> แนวโน้มค่าปอด (PEFR)
                </h3>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={visitHistory}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" tick={{fontSize: 10}} />
                            <YAxis domain={[0, 800]} tick={{fontSize: 10}} width={30} />
                            <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px' }}/>
                            <Line 
                                type="monotone" 
                                dataKey="pefr" 
                                stroke="#D97736" 
                                strokeWidth={3} 
                                dot={{ r: 3, fill: '#D97736', stroke: '#fff', strokeWidth: 1 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        )}

      </div>

      <div className="text-center mt-10 text-gray-400 text-xs">
         <p>© Sawankhalok Hospital Asthma Clinic</p>
      </div>

    </div>
  );
}
