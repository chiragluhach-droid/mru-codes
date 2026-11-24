import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { getProfile } from "@/lib/supabase/server";
import { examResults, findManageableExam } from "@/lib/exams-server";

const STATUS_LABEL = { submitted: "Submitted", in_progress: "In progress", absent: "Absent" } as const;

const istString = (d: Date | null) =>
  d ? d.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }) : "";

// GET /api/exams/[id]/export - marks sheet (.xlsx), absent students included
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await findManageableExam(profile, id))) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  const { exam, questions, rows, maxScore } = await examResults(id);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "C Programming Hub";
  const sheet = workbook.addWorksheet("Marks");
  sheet.columns = [
    { header: "S.No", key: "sno", width: 6 },
    { header: "Roll Number", key: "roll", width: 18 },
    { header: "Name", key: "name", width: 26 },
    { header: "Email", key: "email", width: 30 },
    { header: "Department", key: "dept", width: 12 },
    { header: "Batch", key: "batch", width: 8 },
    { header: "Section", key: "sec", width: 8 },
    { header: "Semester", key: "sem", width: 9 },
    { header: "Status", key: "status", width: 12 },
    ...questions.map((q, i) => ({ header: `Q${i + 1} (${q.points})`, key: `q_${q.id}`, width: 10 })),
    { header: `Total (${maxScore})`, key: "total", width: 11 },
    { header: "Percentage", key: "pct", width: 11 },
    { header: "Tab switches", key: "tabs", width: 12 },
    { header: "Started", key: "started", width: 20 },
    { header: "Submitted", key: "submitted", width: 20 },
  ];

  rows.forEach((r, i) => {
    sheet.addRow({
      sno: i + 1,
      roll: r.rollNumber ?? "",
      name: r.fullName,
      email: r.email,
      dept: r.department ?? "",
      batch: r.batch ?? "",
      sec: r.section ?? "",
      sem: r.semester ?? "",
      status: r.status === "submitted" && r.autoSubmitted ? "Auto-submitted" : STATUS_LABEL[r.status],
      ...Object.fromEntries(questions.map((q) => [`q_${q.id}`, r.status === "absent" ? "AB" : r.questionScores[q.id] ?? 0])),
      total: r.status === "absent" ? "AB" : r.score,
      pct: r.status === "absent" || maxScore === 0 ? "" : Math.round((r.score / maxScore) * 1000) / 10,
      tabs: r.status === "absent" ? "" : r.tabSwitches,
      started: istString(r.startedAt),
      submitted: istString(r.submittedAt),
    });
  });

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F46E5" } };
  header.alignment = { vertical: "middle" };
  sheet.views = [{ state: "frozen", ySplit: 1, xSplit: 3 }];
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } };

  const questionSheet = workbook.addWorksheet("Questions");
  questionSheet.columns = [
    { header: "No.", key: "no", width: 6 },
    { header: "Question", key: "title", width: 50 },
    { header: "Type", key: "type", width: 14 },
    { header: "Points", key: "points", width: 8 },
  ];
  questions.forEach((q, i) =>
    questionSheet.addRow({ no: `Q${i + 1}`, title: q.title, type: q.type === "mcq" ? "MCQ" : "Programming", points: q.points })
  );
  questionSheet.getRow(1).font = { bold: true };

  const buffer = Buffer.from((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
  const safeTitle = exam.title.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "exam";
  const classPart = [exam.targetDepartment, exam.targetBatch, exam.targetSection].filter(Boolean).join("-");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeTitle}${classPart ? `-${classPart}` : ""}-marks.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
