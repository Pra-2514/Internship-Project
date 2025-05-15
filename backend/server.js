const express = require('express');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json()); // to parse JSON body

const EXCEL_FILE = path.join(__dirname, 'schedule.xlsx');

// Helper: Read existing Excel or create new workbook
function readOrCreateWorkbook() {
  if (fs.existsSync(EXCEL_FILE)) {
    return XLSX.readFile(EXCEL_FILE);
  } else {
    // Create a new workbook with headers
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
      { Date: "Date", Doctor: "Doctor", Topic: "Topic", Start: "Start", End: "End" }
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Schedule');
    XLSX.writeFile(wb, EXCEL_FILE);
    return wb;
  }
}

app.post('/api/save', (req, res) => {
  const { doctor, topic, start, end, date } = req.body;

  if (!doctor || !topic || !start || !end || !date) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const wb = readOrCreateWorkbook();
    const ws = wb.Sheets['Schedule'] || wb.Sheets[wb.SheetNames[0]];

    // Convert worksheet to JSON to append new data
    const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

    // Remove header row if it contains headers
    if (data.length && data[0].Date === "Date") {
      data.shift();
    }

    // Append new row
    data.push({ Date: date, Doctor: doctor, Topic: topic, Start: start, End: end });

    // Convert back to sheet and write
    const newWs = XLSX.utils.json_to_sheet(data, { skipHeader: false });
    wb.Sheets['Schedule'] = newWs;

    XLSX.writeFile(wb, EXCEL_FILE);

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving data:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
