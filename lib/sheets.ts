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
