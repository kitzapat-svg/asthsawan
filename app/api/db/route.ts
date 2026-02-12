import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth"; // 1. Import session
import { authOptions } from "../auth/[...nextauth]/route"; // 2. Import config
import { getSheetData, appendData, updatePatientStatus } from '@/lib/sheets';

const SHEET_CONFIG = {
  PATIENTS_TAB: 'patients',
  VISITS_TAB: 'visits',
  TECHNIQUE_TAB: 'technique_checks',
};

// Helper function: Normalize Data (ตัด 0 นำหน้า)
const normalize = (val: any) => String(val).trim().replace(/^0+/, '');

export async function GET(request: Request) {
  // 3. ตรวจสอบสิทธิ์ (Security Guard) 👮‍♂️
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const hn = searchParams.get('hn'); // รับ parameter hn เพิ่ม

    let tabName = '';
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    else if (type === 'visits') tabName = SHEET_CONFIG.VISITS_TAB;
    else if (type === 'technique_checks') tabName = SHEET_CONFIG.TECHNIQUE_TAB;
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const data = await getSheetData(tabName);
    
    if (!data) return NextResponse.json([]);

    // 4. กรองข้อมูลที่ Server ก่อนส่งกลับ (Privacy Shield) 🛡️
    if (hn) {
        // ถ้ามีการส่ง HN มา ให้กรองเอาเฉพาะข้อมูลของ HN นั้น
        const filteredData = Array.isArray(data) 
            ? data.filter((item: any) => normalize(item.hn || item[0]) === normalize(hn)) // รองรับทั้งแบบ Object และ Array
            : data;
        return NextResponse.json(filteredData);
    }

    // ถ้าไม่มี HN (เช่นดึงรายชื่อทั้งหมดไปทำ Dashboard) ก็ส่งไปทั้งหมด
    return NextResponse.json(data);

  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// ... (ส่วน POST และ PUT ทำเหมือนเดิม คือเพิ่มบรรทัดตรวจสอบ session ด้านบนสุด)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ... โค้ดเดิม ...
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ... โค้ดเดิม ...
}
