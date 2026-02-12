import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth"; // เรียกใช้ session
import { authOptions } from "../auth/[...nextauth]/route"; // ดึง config จากไฟล์ auth
import { getSheetData, appendData, updatePatientStatus } from '@/lib/sheets';

const SHEET_CONFIG = {
  PATIENTS_TAB: 'patients',
  VISITS_TAB: 'visits',
  TECHNIQUE_TAB: 'technique_checks',
};

// Helper: ตัดเลข 0 นำหน้าออก เพื่อให้เทียบ HN ได้แม่นยำ
const normalize = (val: any) => String(val).trim().replace(/^0+/, '');

// --- GET: ดึงข้อมูล (ล็อคสิทธิ์ + กรองข้อมูล) ---
export async function GET(request: Request) {
  // 1. Security Check: ตรวจสอบว่า Login หรือยัง?
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

    // 2. Privacy Check: กรองข้อมูลที่ Server ก่อนส่งกลับ
    if (hn) {
        // ถ้ามีการส่ง HN มา ให้กรองเอาเฉพาะข้อมูลของ HN นั้น
        const filteredData = Array.isArray(data) 
            ? data.filter((item: any) => normalize(item.hn || item[0]) === normalize(hn))
            : data;
        return NextResponse.json(filteredData);
    }

    // ถ้าไม่มี HN (เช่นดึงรายชื่อผู้ป่วยทั้งหมดไปหน้า Dashboard) ก็ส่งไปทั้งหมด
    return NextResponse.json(data);

  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

// --- POST: บันทึกข้อมูล (ล็อคสิทธิ์) ---
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, data } = body;

    let tabName = '';
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    else if (type === 'visits') tabName = SHEET_CONFIG.VISITS_TAB;
    else if (type === 'technique_checks') tabName = SHEET_CONFIG.TECHNIQUE_TAB;
    else return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const result = await appendData(tabName, data);

    if (result.success) {
      return NextResponse.json({ message: 'Success' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

// --- PUT: อัปเดตข้อมูล (ล็อคสิทธิ์) ---
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, hn, status } = body;

    if (!type || !hn || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let tabName = "";
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

    const result = await updatePatientStatus(tabName, hn, status);
    
    if (result.success) {
      return NextResponse.json({ message: "Update success" });
    } else {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

  } catch (error) {
    return NextResponse.json({ error: "Failed to update data" }, { status: 500 });
  }
}
