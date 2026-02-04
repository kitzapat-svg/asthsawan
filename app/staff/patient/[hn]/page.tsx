"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Activity, Calendar, User, 
  Ruler, QrCode, AlertCircle, FileText 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, Label 
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';

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

// ข้อมูลจำลองสำหรับกราฟ
const MOCK_VISITS = [
  { date: '01/01', pefr: 350 },
  { date: '15/01', pefr: 380 },
  { date: '01/02', pefr: 400 },
  { date: '15/02', pefr: 320 },
  { date: '01/03', pefr: 410 },
];

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. ดึงข้อมูลคนไข้ตาม HN
  useEffect(() => {
    fetch('/api/db?type=patients')
      .then(res => res.json())
      .then((data: Patient[]) => {
        const found = data.find(p => p.hn === params.hn);
        if (found) setPatient(found);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
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

  if (loading) return <div className="p-10 text-center text-gray-400">กำลังโหลดข้อมูล...</div>;
  if (!patient) return <div className="p-10 text-center text-red-500">ไม่พบข้อมูลผู้ป่วย HN: {params.hn}</div>;

  const predictedVal = calculatePredictedPEFR(patient);
  const age = getAge(patient.dob);

  return (
    <div className="min-h-screen bg-[#FEFCF8] p-6 pb-20 font-sans text-[#2D2A26]">
      
      {/* Header */}
      <nav className="max-w-5xl mx-auto mb-8 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#6B6560] hover:text-[#D97736] font-bold transition-colors"
        >
          <ArrowLeft size={20} /> กลับหน้าหลัก
        </button>
        <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-bold border rounded-full ${
                patient.status === 'Active' ? 'bg-green-100 text-green-800 border-green-200' : 
                patient.status === 'COPD' ? 'bg-orange-100 text-orange-800 border-orange-200' : 
                'bg-gray-100 text-gray-800 border-gray-200'
            }`}>
                {patient.status}
            </span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Personal Info & QR */}
        <div className="space-y-6">
          <div className="bg-white p-6 border-2 border-[#3D3834] shadow-[6px_6px_0px_0px_#3D3834]">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-[#D97736] flex items-center justify-center text-white border-2 border-[#3D3834]">
                    <User size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-black">{patient.prefix}{patient.first_name}</h1>
                    <p className="text-[#6B6560] font-medium">{patient.last_name}</p>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-[#6B6560] flex items-center gap-1"><FileText size={14}/> HN</p><p className="font-bold font-mono text-lg">{patient.hn}</p></div>
                <div><p className="text-[#6B6560] flex items-center gap-1"><Calendar size={14}/> อายุ</p><p className="font-bold text-lg">{age} ปี</p></div>
                <div><p className="text-[#6B6560] flex items-center gap-1"><Ruler size={14}/> ส่วนสูง</p><p className="font-bold text-lg">{patient.height || "-"} cm</p></div>
                <div><p className="text-[#6B6560] flex items-center gap-1"><Activity size={14}/> Best PEFR</p><p className="font-bold text-lg">{patient.best_pefr || "-"} L/min</p></div>
            </div>
          </div>

          <div className="bg-[#2D2A26] p-6 text-white border-2 border-[#3D3834] shadow-[6px_6px_0px_0px_#888] text-center">
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
                 <div className="bg-[#F7F3ED] p-5 border-2 border-[#3D3834]">
                    <p className="text-[#6B6560] text-xs font-bold uppercase">ค่ามาตรฐาน (Predicted)</p>
                    <div className="flex items-end gap-2 mt-1">
                        <span className="text-4xl font-black text-[#D97736]">{predictedVal}</span>
                        <span className="text-sm font-bold text-[#6B6560] mb-1">L/min</span>
                    </div>
                    <p className="text-xs text-[#6B6560] mt-2">*คำนวณจากเพศ ส่วนสูง และอายุ</p>
                 </div>
                 <div className="bg-white p-5 border-2 border-[#3D3834]">
                    <p className="text-[#6B6560] text-xs font-bold uppercase">เป้าหมาย (80% ของค่ามาตรฐาน)</p>
                     <div className="flex items-end gap-2 mt-1">
                        <span className="text-4xl font-black text-green-600">{Math.round(predictedVal * 0.8)}</span>
                        <span className="text-sm font-bold text-[#6B6560] mb-1">L/min</span>
                    </div>
                    <p className="text-xs text-[#6B6560] mt-2">ควรคุมอาการให้ได้เกินค่านี้ (Green Zone)</p>
                 </div>
            </div>

            <div className="bg-white p-6 border-2 border-[#3D3834] shadow-[6px_6px_0px_0px_#3D3834]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Activity size={20} className="text-[#D97736]"/> แนวโน้มค่า PEFR</h3>
                    <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">ข้อมูลจำลอง</span>
                </div>
                
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={MOCK_VISITS}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis dataKey="date" tick={{fontSize: 12}} />
                            <YAxis domain={[0, 800]} tick={{fontSize: 12}} />
                            <Tooltip contentStyle={{ borderRadius: '0px', border: '2px solid #3D3834', boxShadow: '4px 4px 0px 0px #3D3834' }}/>
                            
                            {/* แก้ไขตรงนี้: ใช้ <Label> ซ้อนใน <ReferenceLine> แทนการใช้ Props */}
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
                <button className="py-4 border-2 border-[#3D3834] font-bold hover:bg-[#F7F3ED] transition-colors flex items-center justify-center gap-2"><FileText size={20}/> บันทึกการตรวจ (Visit)</button>
                <button className="py-4 bg-[#D97736] text-white border-2 border-[#3D3834] shadow-[4px_4px_0px_0px_#3D3834] font-bold hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2"><Activity size={20}/> พ่นยาฉุกเฉิน</button>
            </div>
        </div>
      </div>
    </div>
  );
}
