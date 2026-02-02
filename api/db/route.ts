// app/api/db/route.ts
import { NextResponse } from 'next/server';
import { getSheetData, appendData } from '@/lib/sheets';
import { SHEET_CONFIG } from '@/lib/config';

// รองรับการอ่านข้อมูล (GET)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // เช่น ?type=patients
  
  let tabName = "";
  // ตรวจสอบความถูกต้อง (Security Check)
  if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
  else if (type === 'visits') tabName = SHEET_CONFIG.VISITS_TAB;
  else return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  try {
    const data = await getSheetData(tabName);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}

// รองรับการบันทึกข้อมูล (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, data } = body; 
    
    let tabName = "";
    if (type === 'patients') tabName = SHEET_CONFIG.PATIENTS_TAB;
    else if (type === 'visits') tabName = SHEET_CONFIG.VISITS_TAB;
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    
    const result = await appendData(tabName, data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save data" }, { status: 500 });
  }
}