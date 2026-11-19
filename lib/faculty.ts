/**
 * Faculty (SoE – Computer Science & Technology) allowed to use the teacher
 * side of the app. There is no teacher signup: an account is a teacher if and
 * only if its email is listed here, and everyone else is a student.
 *
 * To add or remove a teacher, edit this list and redeploy, and update
 * public.faculty_emails in the database to match (see
 * prisma/manual-migrations/20261119_teacher_allowlist_guard.sql): a database
 * trigger downgrades any teacher whose email isn't in that table.
 */
export const FACULTY: ReadonlyArray<{ name: string; email: string }> = [
  { name: "Dr. Dipali Bansal", email: "dipalibansal@mru.edu.in" },
  { name: "Dr. Vivek Sharma", email: "hodcst@mru.edu.in" },
  { name: "Dr. Sachin Lakra", email: "sachin@mru.edu.in" },
  { name: "Dr. Manpreet Kaur", email: "manpreet@mru.edu.in" },
  { name: "Dr. Parneeta Dhaliwal", email: "parneeta.cst@mru.edu.in" },
  { name: "Dr. Prinima Gupta", email: "prinima@mru.edu.in" },
  { name: "Dr. Mrinal Pandey", email: "mrinal@mru.edu.in" },
  { name: "Dr. Punam Rattan", email: "punamrattan@mru.edu.in" },
  { name: "Dr. Abhishek Saxena", email: "abhisheksaxena@mru.edu.in" },
  { name: "Dr. Chandni Magoo", email: "chandnimagoo@mru.edu.in" },
  { name: "Dr. Deepti Thakral", email: "deeptithakral@mru.edu.in" },
  { name: "Dr. Mamta Arora", email: "mamta@mru.edu.in" },
  { name: "Dr. Manoj Kumar", email: "manoj@mru.edu.in" },
  { name: "Dr. Meena Chaudhary", email: "meena@mru.edu.in" },
  { name: "Dr. Narender", email: "narender@mru.edu.in" },
  { name: "Dr. Neelu Chaudhary", email: "neelu@mru.edu.in" },
  { name: "Dr. Ranjna Jain", email: "ranjnajain@mru.edu.in" },
  { name: "Dr. Sanjay Singh", email: "sanjaysingh@mru.edu.in" },
  { name: "Dr. Urmila", email: "urmila@mru.edu.in" },
  { name: "Dr. Ganga Sharma", email: "gangasharma@mru.edu.in" },
  { name: "Dr. Gunjan Chandwani", email: "gunjan@mru.edu.in" },
  { name: "Dr. Sujata", email: "sujata@mru.edu.in" },
  { name: "Dr. Simple", email: "simple@mru.edu.in" },
  { name: "Dr. Gunjan Aggarwal", email: "gunjanaggarwal@mru.edu.in" },
  { name: "Dr. Ravi Prakash", email: "raviprakashchaturvedi@mru.edu.in" },
  { name: "Dr. Dimple Saproo", email: "dimplesaproo@mru.edu.in" },
  { name: "Dr. Annu Mishra", email: "annumishra@mru.edu.in" },
  { name: "Dr. Divyanshu Sinha", email: "divyanshusinha@mru.edu.in" },
  { name: "Dr. Roshi Saxena", email: "roshisaxena@mru.edu.in" },
  { name: "Dr. Deepika Pahuja", email: "deepikapahuja@mru.edu.in" },
  { name: "Dr. Anu Priya Sharma", email: "anupriya@mru.edu.in" },
  { name: "Dr. Esha Khanna", email: "eshakhanna@mru.edu.in" },
  { name: "Dr. Shalu", email: "shalu@mru.edu.in" },
  { name: "Dr. Pooja Sachdeva", email: "poojaahuja.cst@mru.edu.in" },
  { name: "Dr. Pushpa", email: "pushpa@mru.edu.in" },
  { name: "Dr. Bhawana Srivastava", email: "bhawanasrivastava@mru.edu.in" },
  { name: "Ms. Aarti Kaushik", email: "aartikaushik@mru.edu.in" },
  { name: "Ms. Anjali Mehta", email: "anjalimehta@mru.edu.in" },
  { name: "Mr. Agha Imran Hussain", email: "agha@mru.edu.in" },
  { name: "Mr. Anup Singh Kushwaha", email: "anup@mru.edu.in" },
  { name: "Ms. Deepanshi Gupta", email: "deepanshi@mru.edu.in" },
  { name: "Ms. Jyoti Nanwal", email: "jyotinanwal@mru.edu.in" },
  { name: "Mr. Ram Chatterjee", email: "ram@mru.edu.in" },
  { name: "Ms. Tamanna Sachdeva", email: "tamannasachdeva@mru.edu.in" },
  { name: "Ms. Ashima Garg", email: "ashimagarg.cst@mru.edu.in" },
  { name: "Ms. Babita Yadav", email: "babitayadav@mru.edu.in" },
  { name: "Mr. Mahesh Swami", email: "maheshswami@mru.edu.in" },
  { name: "Ms. Juhi Pruthi", email: "juhipruthi@mru.edu.in" },
  { name: "Mr. Chandrashekhar Kothari", email: "chandrashekharkothari@mru.edu.in" },
];

/** Non-faculty accounts that still need teacher access (admins, developers). */
export const EXTRA_TEACHER_EMAILS: readonly string[] = ["chiragchehak@gmail.com"];

const TEACHER_EMAILS = new Set(
  [...FACULTY.map((f) => f.email), ...EXTRA_TEACHER_EMAILS].map((e) => e.toLowerCase())
);

export function normalizeEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase();
}

export function isTeacherEmail(email: string | null | undefined) {
  return TEACHER_EMAILS.has(normalizeEmail(email));
}

export function roleForEmail(email: string | null | undefined): "student" | "teacher" {
  return isTeacherEmail(email) ? "teacher" : "student";
}

export function facultyName(email: string | null | undefined) {
  const e = normalizeEmail(email);
  return FACULTY.find((f) => f.email === e)?.name ?? null;
}
