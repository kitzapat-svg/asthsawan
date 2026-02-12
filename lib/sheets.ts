import { google } from 'googleapis';

// 1. ตั้งค่าการยืนยันตัวตน (Authentication)
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// Helper: แปลงข้อมูลแถว (Array) ให้เป็น Object แบบ Dynamic (สำหรับ Tab อื่นๆ)
const arrayToObject = (headers: string[], rows: any[][]) => {
  return rows.map((row) => {
    let obj: any = {};
    headers.forEach((header, index) => {
      obj[header] = row[index] || ""; 
    });
    return obj;
  });
};

// Helper: แปลงข้อมูลผู้ป่วยแบบระบุตำแหน่ง (เพื่อให้ตรงกับหน้า Register ใหม่)
const formatPatient = (row: string[]) => {
  return {
    hn: row[0] || "",
    prefix: row[1] || "",
    first_name: row[2] || "",
    last_name: row[3] || "",
    dob: row[4] || "",
    best_pefr: row[5] || "", // Index 5 = Predicted PEFR (Column F)
    height: row[6] || "",    // Index 6 = Height (Column G)
    status: row[7] || "Active",
    public_token: row[8] || "",
    phone: row[9] || "",
  };
};

// --- ฟังก์ชันหลัก ---

// 1. ดึงข้อมูล (Read)
export async function getSheetData(tabName: string) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:Z`, 
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) return [];

    // ถ้าเป็น Tab 'patients' ให้ใช้ตัวแปลงเฉพาะ เพื่อความแม่นยำของ Column
    if (tabName === 'patients') {
      // ตัด Header ออก (slice(1)) แล้ว map ด้วย formatPatient
      return rows.slice(1).map(formatPatient);
    }
    
    // สำหรับ Tab อื่นๆ (visits, technique_checks) ใช้แบบ Generic ตามชื่อหัวตาราง
    return arrayToObject(rows[0], rows.slice(1));

  } catch (error) {
    console.error(`Error fetching ${tabName}:`, error);
    return [];
  }
}

// 2. บันทึกข้อมูลใหม่ต่อท้าย (Create)
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

// 3. อัปเดตสถานะผู้ป่วย (Update Status)
export async function updatePatientStatus(tabName: string, hn: string, newStatus: string) {
  try {
    // ดึงคอลัมน์ A (HN) เพื่อหาบรรทัดที่ต้องการแก้ไข
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:A`, 
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) return { success: false, error: "No data found" };

    // หา Index ของแถวที่ HN ตรงกัน (+1 เพราะ Sheet เริ่มแถวที่ 1)
    const rowIndex = rows.findIndex((row) => row[0] === hn) + 1;

    if (rowIndex === 0) return { success: false, error: "HN not found" };

    // อัปเดต Column H (Status) ของแถวนั้น
    // Column H คือตำแหน่งที่ 8 (Index 7) ซึ่งตรงกับ formData.status ในหน้า Register
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!H${rowIndex}`, 
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
