"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, UserPlus, AlertCircle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function RegisterPatientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    hn: '',
    prefix: 'นาย',
    first_name: '',
    last_name: '',
    dob: '',
    height: '',
    phone: '',
    status: 'Active',
  });

  // ฟังก์ชันสร้าง Token แบบ UUID v4 (ปลอดภัยสูง)
  const generateToken = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback (กรณี Browser เก่ามาก)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. จัดรูปแบบ HN ให้ครบ 7 หลัก
      const rawHN = formData.hn.trim();
      const formattedHN = rawHN.padStart(7, '0');

      // 2. เช็ค HN ซ้ำ
      const checkRes = await fetch(`/api/db?type=patients&hn=${formattedHN}`);
      const existingPatients = await checkRes.json();

      if (Array.isArray(existingPatients) && existingPatients.length > 0) {
        alert(`❌ HN: ${formattedHN} มีอยู่ในระบบแล้ว! กรุณาตรวจสอบอีกครั้ง`);
        setLoading(false);
        return;
      }

      // 3. สร้าง Token แบบ UUID
      const public_token = generateToken();
      
      // คำนวณ Best PEFR
      const age = new Date().getFullYear() - new Date(formData.dob).getFullYear();
      let predicted_pefr = 0;
      const h = parseFloat(formData.height);
      
      if (['นาย', 'ด.ช.'].includes(formData.prefix)) {
         predicted_pefr = (5.48 * h) - (1.51 * age) - 279.7;
      } else {
         predicted_pefr = (3.72 * h) - (2.24 * age) - 96.6;
      }
      predicted_pefr = Math.max(0, Math.round(predicted_pefr));

      // เตรียมข้อมูลลงตาราง
      const patientData = [
        formattedHN,               // 0: HN
        formData.prefix,           // 1: Prefix
        formData.first_name.trim(),// 2: First Name
        formData.last_name.trim(), // 3: Last Name
        formData.dob,              // 4: DOB
        predicted_pefr.toString(), // 5: Predicted PEFR
        formData.height,           // 6: Height
        formData.status,           // 7: Status
        public_token,              // 8: Token (UUID)
        formData.phone.trim()      // 9: Phone
      ];

      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'patients', data: patientData })
      });

      if (res.ok) {
        alert(`✅ ลงทะเบียนสำเร็จ!\nHN: ${formattedHN}\nToken: ${public_token}`); // แสดง Token ให้เห็นตอน Alert เพื่อความมั่นใจ (optional)
        router.push('/staff/dashboard');
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
    <div className="min-h-screen bg-[#FEFCF8] dark:bg-black p-6 font-sans text-[#2D2A26] dark:text-white transition-colors duration-300">
      
      <nav className="max-w-2xl mx-auto mb-8 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[#6B6560] dark:text-zinc-400 hover:text-[#D97736] font-bold transition-colors"
        >
          <ArrowLeft size={20} /> ยกเลิก
        </button>
        <ThemeToggle />
      </nav>

      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-900 border-2 border-[#3D3834] dark:border-zinc-800 shadow-[8px_8px_0px_0px_#3D3834] dark:shadow-none p-8 transition-colors">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100 dark:border-zinc-800">
           <div className="w-12 h-12 bg-[#D97736] flex items-center justify-center text-white border-2 border-[#3D3834] dark:border-zinc-700">
              <UserPlus size={24} />
           </div>
           <div>
              <h1 className="text-2xl font-black">ลงทะเบียนผู้ป่วยใหม่</h1>
              <p className="text-[#6B6560] dark:text-zinc-400 font-medium">กรอกข้อมูลให้ครบถ้วน</p>
           </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className="block text-sm font-bold mb-2">HN (Hospital Number) <span className="text-red-500">*</span></label>
            <input 
                type="text" 
                name="hn" 
                required 
                className="w-full px-4 py-3 bg-[#F7F3ED] dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 focus:border-[#D97736] outline-none font-bold text-lg dark:text-white placeholder:font-normal"
                placeholder="Ex. 1234"
                value={formData.hn}
                onChange={handleChange}
            />
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <AlertCircle size={12}/> ระบบจะเติม 0 ด้านหน้าให้ครบ 7 หลัก และตรวจสอบ HN ซ้ำอัตโนมัติ
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-1">
                <label className="block text-sm font-bold mb-2">คำนำหน้า</label>
                <select name="prefix" value={formData.prefix} onChange={handleChange} className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none font-bold dark:text-white">
                    <option value="นาย">นาย</option>
                    <option value="นาง">นาง</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="ด.ช.">ด.ช.</option>
                    <option value="ด.ญ.">ด.ญ.</option>
                </select>
            </div>
            <div className="col-span-3">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold mb-2">ชื่อ</label>
                        <input type="text" name="first_name" required className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none dark:text-white" value={formData.first_name} onChange={handleChange} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold mb-2">นามสกุล</label>
                        <input type="text" name="last_name" required className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none dark:text-white" value={formData.last_name} onChange={handleChange} />
                    </div>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-bold mb-2">วันเกิด (DOB)</label>
                <input type="date" name="dob" required className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none font-bold dark:text-white" value={formData.dob} onChange={handleChange} />
            </div>
            <div>
                <label className="block text-sm font-bold mb-2">ส่วนสูง (cm)</label>
                <input type="number" name="height" required className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none font-bold dark:text-white" value={formData.height} onChange={handleChange} placeholder="165" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">เบอร์โทรศัพท์ (ถ้ามี)</label>
            <input type="tel" name="phone" className="w-full px-4 py-3 bg-white dark:bg-zinc-800 border-2 border-[#3D3834] dark:border-zinc-600 outline-none dark:text-white" value={formData.phone} onChange={handleChange} placeholder="08x-xxx-xxxx" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-[#2D2A26] dark:bg-white text-white dark:text-black font-bold text-lg py-4 border-2 border-[#3D3834] dark:border-zinc-600 shadow-[4px_4px_0px_0px_#888] hover:bg-[#D97736] hover:shadow-[4px_4px_0px_0px_#3D3834] dark:hover:bg-gray-200 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2">
            {loading ? "กำลังตรวจสอบและบันทึก..." : <><Save size={20} /> ยืนยันการลงทะเบียน</>}
          </button>

        </form>
      </div>
    </div>
  );
}
