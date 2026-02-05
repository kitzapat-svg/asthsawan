"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Activity, Calendar, FileText, CheckCircle, AlertTriangle, Stethoscope } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle'; // <--- เรียกใช้ปุ่มปรับธีม

export default function RecordVisitPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // State เก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    pefr: '',
    control_level: 'Well-controlled',
    controller: 'Seretide',
    reliever: 'Salbutamol',
    adherence: '100',
    drp: '-',
    advice: '-',
    technique_check: 'ทำ',
    next_appt: '',
    note: '-',
    is_new_case: 'FALSE',
    inhaler_eval: '8' // คะแนนเต็ม 8
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const dataRow = [
        params.hn,                  // 1. hn
        today,                      // 2. date
        formData.pefr,              // 3. pefr
        formData.control_level,     // 4. control_level
        formData.controller,        // 5. controller
        formData.reliever,          // 6. reliever
        formData.adherence + '%',   // 7. adherence (เติม % ให้)
        formData.drp,               // 8. drp
        formData.advice,            // 9. advice
        formData.technique_check,   // 10. technique_check
        formData.next_appt,         // 11. next_appt
        formData.note,              // 12. note
        formData.is_new_case,       // 13. is_new_case
        formData.inhaler_eval       // 14. inhaler_eval
      ];

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'visits', // ชื่อ Tab ใน Google Sheets
          data: dataRow
        })
      });

      if (res.ok) {
        alert("บันทึกผลการรักษาเรียบร้อย!");
        router.push(`/staff/patient/${params.hn}`);
      } else {
        alert("เกิดข้อผิดพลาดในการบันทึก");
      }
    } catch (error) {
      console.error(error);
      alert("เชื่อมต่อ Server ไม่ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFCF8] dark:bg-black p-6 pb-20 font-sans text-[#2D2A26] dark:text-white transition-colors duration-300">
      
      <nav className="max-w-3xl mx-auto mb-8 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#6B6560] dark:text-zinc-400 hover:text-[#D97736] dark:hover:text-[#D97736] font-bold transition-colors"
        >
          <ArrowLeft size={20} /> ยกเลิก
        </button>
        
        {/* ปุ่มเปลี่ยนธีม */}
        <ThemeToggle />
      </nav>

      <div className="max-w-3xl mx-auto bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[8px_8px_0px_0px_#3D3834] dark:shadow-none p-8 transition-colors">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-zinc-800">
           <div className="w-12 h-12 bg-[#D97736] flex items-center justify-center text-white border-2 border-[#3D3834] dark:border-zinc-700">
              <Activity size={24} />
           </div>
           <div>
              <h1 className="text-xl font-black">บันทึกการตรวจรักษา (Visit)</h1>
              <p className="text-[#6B6560] dark:text-zinc-400 font-medium">HN: {params.hn}</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section 1: การประเมินผล (Evaluation) */}
          <div className="bg-[#F7F3ED] dark:bg-zinc-800/50 p-6 border border-[#3D3834]/20 dark:border-zinc-700 rounded-lg space-y-4 transition-colors">
             <h3 className="font-bold flex items-center gap-2 text-[#D97736]"><Activity size={18}/> 1. การประเมินผล (Clinical)</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-2">ค่า PEFR (L/min) <span className="text-red-500">*</span></label>
                    <input 
                        type="number" name="pefr" required
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] dark:focus:border-[#D97736] outline-none font-black text-xl text-center dark:text-white transition-colors"
                        value={formData.pefr} onChange={handleChange}
                        placeholder="000"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">ระดับการควบคุม (Control Level)</label>
                    <select name="control_level" value={formData.control_level} onChange={handleChange}
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none font-bold dark:text-white appearance-none cursor-pointer transition-colors"
                    >
                        <option value="Well-controlled">🟢 Well-controlled</option>
                        <option value="Partly Controlled">🟡 Partly Controlled</option>
                        <option value="Uncontrolled">🔴 Uncontrolled</option>
                    </select>
                </div>
             </div>

             <div className="flex items-center gap-4 pt-2">
                 <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" 
                        checked={formData.is_new_case === 'TRUE'}
                        onChange={(e) => setFormData({...formData, is_new_case: e.target.checked ? 'TRUE' : 'FALSE'})}
                        className="w-5 h-5 accent-[#D97736]"
                    />
                    <span className="font-bold text-sm dark:text-zinc-300">ผู้ป่วยรายใหม่ (New Case)</span>
                 </label>
             </div>
          </div>

          {/* Section 2: การใช้ยา (Medication) */}
          <div className="space-y-4">
             <h3 className="font-bold flex items-center gap-2 text-[#D97736]"><Stethoscope size={18}/> 2. การใช้ยา (Medication)</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-2">ยาควบคุม (Controller)</label>
                    <select name="controller" value={formData.controller} onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none dark:text-white transition-colors"
                    >
                        <option value="Seretide">Seretide</option>
                        <option value="Budesonide">Budesonide</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">ยาบรรเทา (Reliever)</label>
                    <select name="reliever" value={formData.reliever} onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none dark:text-white transition-colors"
                    >
                        <option value="Salbutamol">Salbutamol</option>
                        <option value="Berodual">Berodual</option>
                    </select>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-2">ความสม่ำเสมอ (Adherence %)</label>
                    <div className="flex items-center gap-2">
                        <input 
                            type="range" name="adherence" min="0" max="100" step="10"
                            className="w-full accent-[#D97736]"
                            value={formData.adherence} onChange={handleChange}
                        />
                        <span className="font-bold w-12 text-right dark:text-white">{formData.adherence}%</span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">ปัญหาการใช้ยา (DRP)</label>
                    <input type="text" name="drp" value={formData.drp} onChange={handleChange}
                        className="w-full px-4 py-2 bg-[#F7F3ED] dark:bg-zinc-800 border border-[#3D3834] dark:border-zinc-600 outline-none dark:text-white transition-colors"
                    />
                </div>
             </div>
          </div>

          {/* Section 3: เทคนิคพ่นยา (Inhaler Technique) */}
          <div className="space-y-4 border-t border-gray-200 dark:border-zinc-800 pt-4">
             <h3 className="font-bold flex items-center gap-2 text-[#D97736]"><CheckCircle size={18}/> 3. เทคนิคพ่นยา (Inhaler Technique)</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold mb-2">ตรวจสอบเทคนิค (Check)</label>
                    <select name="technique_check" value={formData.technique_check} onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none dark:text-white transition-colors"
                    >
                        <option value="ทำ">✅ ทำ (Check)</option>
                        <option value="ไม่ทำ">❌ ไม่ทำ (No Check)</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-bold mb-2">คะแนนประเมิน (เต็ม 8)</label>
                    <input 
                        type="number" name="inhaler_eval" min="0" max="8"
                        className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] dark:focus:border-[#D97736] outline-none font-bold text-center dark:text-white transition-colors"
                        value={formData.inhaler_eval} onChange={handleChange}
                    />
                </div>
             </div>
          </div>

          {/* Section 4: แผนการรักษา (Plan) */}
          <div className="bg-[#FFF9F0] dark:bg-orange-900/10 p-6 border border-[#D97736]/30 rounded-lg space-y-4 transition-colors">
             <h3 className="font-bold flex items-center gap-2 text-[#D97736]"><FileText size={18}/> 4. แผนการรักษา (Plan)</h3>
             
             <div>
                <label className="block text-sm font-bold mb-2">คำแนะนำ (Advice)</label>
                <input type="text" name="advice" value={formData.advice} onChange={handleChange}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-[#3D3834] dark:border-zinc-600 outline-none dark:text-white transition-colors"
                />
             </div>
             
             <div>
                <label className="block text-sm font-bold mb-2">บันทึกเพิ่มเติม (Note)</label>
                <textarea name="note" rows={2} value={formData.note} onChange={handleChange}
                    className="w-full px-4 py-2 bg-white dark:bg-zinc-800 border border-[#3D3834] dark:border-zinc-600 outline-none resize-none dark:text-white transition-colors"
                />
             </div>

             <div>
                <label className="block text-sm font-bold mb-2">วันนัดครั้งถัดไป (Next Appointment)</label>
                <input type="date" name="next_appt" value={formData.next_appt} onChange={handleChange}
                    className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] dark:focus:border-[#D97736] outline-none font-bold dark:text-white transition-colors"
                />
             </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#2D2A26] dark:bg-white text-white dark:text-black font-bold text-lg py-4 border-2 border-[#3D3834] dark:border-zinc-600 shadow-[4px_4px_0px_0px_#888] dark:shadow-none hover:bg-[#D97736] dark:hover:bg-gray-200 hover:shadow-[4px_4px_0px_0px_#3D3834] active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {loading ? "กำลังบันทึก..." : (
              <>
                <Save size={20} /> บันทึกผลการรักษา
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}
