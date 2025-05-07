"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { ExcelRow } from "@/types/excel";

// mapping header to ExcelRow field
// "DATA ENTERED BY (COLLABORATOR)" → "company"
const headerMap: Record<string, keyof ExcelRow> = {
  "DATA ENTERED BY (COLLABORATOR)": "company",
  "STATUS Please indicate whether the event is Pending Announcement OR Announced":
    "status",
  "EVENT NAME If commercial in confidence, please include generic name/description":
    "eventTitle",
  "START DATE (if known) DD/MM/YYYY": "startDate",
  "END DATE (if known) DD/MM/YYYY": "endDate",
  "VENUE / LOCATION": "venueName",
  "Total attendees including participants, spectators, ancillary":
    "totalAttendeeCategory",
  // "Total attendee number": "totalAttendees",
  "CATEGORY Please refer to the categories in the Event Categorisation tab to make your selection":
    "categoryName",
  "SUB-CATEGORY Olympic/Para, Non-Olympic/Para, Arts & Culture":
    "subCategoryName",
  NOTES: "details",
  "EVENT YEAR": "eventYear",
  "EVENT MONTH Please enter the event name in the adjacent corresponding monthly Calendar":
    "eventDate",
};

// remove newlines, spaces, and special characters from the header
// to make it easier to compare
function cleanKey(key: string): string {
  return key
    .replace(/\n/g, " ")
    .replace(/↵/g, " ")
    .replace(/\s+/g, " ")
    .replace(/"/g, "")
    .trim();
}

const monthNameToNumber: Record<string, string> = {
  JAN: "01",
  FEB: "02",
  MAR: "03",
  APR: "04",
  MAY: "05",
  JUN: "06",
  JUL: "07",
  AUG: "08",
  SEP: "09",
  OCT: "10",
  NOV: "11",
  DEC: "12",
};

// parse excel serial date (string or excel serial → YYYY-MM-DD)
function parseExcelDate(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === "number") {
    // console.log("🔎 date value raw(number):", value);
    const base = new Date(1899, 12, 30);
    const date = new Date(base.getTime() + value * 86400000);
    // console.log("🔎 date value parsed:", date);
    return date.toISOString().split("T")[0];
  }

  if (typeof value === "string") {
    // console.log("🔎 date value raw(string):", value);
    const parts = value.trim().split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const fullYear = year.length === 2 ? "20" + year : year;
      return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  return null;
}

export default function ExcelUploader() {
  const [data, setData] = useState<ExcelRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [results, setResults] = useState<
    {
      index: number;
      success: boolean;
      skipped?: boolean;
      error?: string;
    }[]
  >([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const binaryStr = evt.target?.result;
      const workbook = XLSX.read(binaryStr, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as Record<
        string,
        unknown
      >[];
      console.log("Raw data:", raw);
      const parsedData = raw.map((row): ExcelRow => {
        const obj = {} as Record<keyof ExcelRow, ExcelRow[keyof ExcelRow]>;

        let fallbackDateRaw = "";
        let fallbackYear = "";

        for (const originalKey in row) {
          const cleaned = cleanKey(originalKey);
          const mappedKey = headerMap[cleaned];
          const value = row[originalKey];

          if (mappedKey) {
            if (mappedKey === "eventDate") fallbackDateRaw = value as string;
            if (mappedKey === "eventYear") fallbackYear = value as string;

            if (mappedKey === "startDate" || mappedKey === "endDate") {
              const parsed = parseExcelDate(value);
              if (parsed) {
                obj[mappedKey] = parsed as ExcelRow[keyof ExcelRow];
              } else if (
                mappedKey === "startDate" &&
                fallbackYear &&
                fallbackDateRaw
              ) {
                // "15 AUG" → ["15", "AUG"]
                const parts = fallbackDateRaw.trim().split(" ");
                const day = parts[0]?.padStart(2, "0");
                const monthAbbr = parts[1]?.toUpperCase();
                const month = monthNameToNumber[monthAbbr ?? ""];

                if (day && month) {
                  const fallbackDate = `${fallbackYear}-${month}-${day}`;
                  obj[mappedKey] = fallbackDate as ExcelRow[keyof ExcelRow];
                } else {
                  obj[mappedKey] = undefined;
                }
              } else {
                obj[mappedKey] = undefined;
              }
            } else {
              obj[mappedKey] = value as ExcelRow[keyof ExcelRow];
            }
          }
        }

        return obj as ExcelRow;
      });

      console.log("Parsed rows:", parsedData);
      setData(parsedData);
    };

    reader.readAsBinaryString(file);
  };

  const uploadToServer = async () => {
    if (data.length === 0) {
      alert("No data to upload. Please select a valid Excel file.");
      return;
    }

    console.log("Data to upload:", data);
    const res = await fetch("/api/imports", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await res.json();
    console.log("Server response:", result);
    setResults(result.results); // ✅ save results to state

    if (!res.ok) {
      alert("Failed to upload!");
    } else {
      alert("Successfully uploaded!");
    }
  };
  return (
    <div className="flex flex-col items-start gap-4 p-4 border rounded-md max-w-4xl w-full">
      <label className="font-semibold">
        Upload Excel File
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileUpload}
          className="mt-2 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0 file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </label>

      {fileName && (
        <p className="text-sm text-gray-600">Selected file: {fileName}</p>
      )}

      <button
        onClick={uploadToServer}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Upload to server
      </button>

      {results.length > 0 && (
        <div className="mt-6 w-full">
          <h2 className="text-lg font-semibold mb-2">📊 Upload Summary</h2>
          <p>Total Rows: {results.length}</p>
          <p className="text-green-600">
            ✅ Success: {results.filter((r) => r.success && !r.skipped).length}
          </p>
          <p className="text-yellow-600">
            ⚠️ Skipped: {results.filter((r) => r.skipped).length}
          </p>
          <p className="text-red-600">
            ❌ Failed: {results.filter((r) => !r.success && !r.skipped).length}
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">Row</th>
                  <th className="border px-2 py-1">Status</th>
                  <th className="border px-2 py-1">Details</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.index}>
                    <td className="border px-2 py-1 text-center">
                      {r.index + 1}
                    </td>
                    <td
                      className={`border px-2 py-1 text-center ${
                        r.success
                          ? "text-green-600"
                          : r.skipped
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {r.success
                        ? "✅ Success"
                        : r.skipped
                        ? "⚠️ Skipped"
                        : "❌ Failed"}
                    </td>
                    <td className="border px-2 py-1 text-gray-800">
                      {r.error || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
