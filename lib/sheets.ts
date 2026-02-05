// lib/sheets.ts
import { google } from 'googleapis';

// 1. ตั้งค่าการยืนยันตัวตน
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Helper: แปลงข้อมูลแถว (Array) ให้เป็น Object (JSON)
const arrayToObject = (headers: string[], rows: any[][]) => {
  return rows.map((row) => {
    let obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || ""; 
    });
    return obj;
  });
};

// ฟังก์ชัน: ดึงข้อมูล
export async function getSheetData(tabName: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:Z`, 
    });
    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];
    
    // แถวแรกคือ Header, แถวถัดไปคือข้อมูล
    return arrayToObject(rows[0], rows.slice(1));
  } catch (error) {
    console.error(`Error fetching ${tabName}:`, error);
    return [];
  }
}

// ฟังก์ชัน: บันทึกข้อมูล (ต่อท้าย)
export async function appendData(tabName: string, values: any[]) {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:A`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });
    return { success: true };
  } catch (error) {
    console.error("Append Error:", error);
    return { success: false, error };
  }
}

// ... (โค้ดเดิมด้านบน)

// ฟังก์ชัน: อัปเดตสถานะผู้ป่วย
export async function updatePatientStatus(tabName: string, hn: string, newStatus: string) {
  try {
    // 1. ดึงคอลัมน์ A (HN) ทั้งหมดมาเพื่อหาว่าคนไข้อยู่แถวไหน
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:A`, 
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) return { success: false, error: "No data found" };

    // 2. หา Index ของแถวที่ HN ตรงกัน (บวก 1 เพราะ Array เริ่มที่ 0 แต่ Sheet เริ่มแถวที่ 1)
    const rowIndex = rows.findIndex((row) => row[0] === hn) + 1;

    if (rowIndex === 0) return { success: false, error: "HN not found" };

    // 3. สั่งอัปเดตเฉพาะ Cell ที่เป็น Status (สมมติว่า Status อยู่ Column H ตามโค้ด Register เดิม)
    // Column H คือ Column ที่ 8
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!H${rowIndex}`, // แก้เฉพาะช่อง H ของแถวนั้น
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[newStatus]]
      }
    });

    return { success: true };

  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error };
  }
}
