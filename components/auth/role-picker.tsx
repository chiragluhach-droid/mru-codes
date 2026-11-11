import Link from "next/link";
import { ArrowRight, GraduationCap, User } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AuthShell } from "@/components/auth/auth-shell";
import { loginPath, signupPath, type AuthRole } from "@/lib/auth-roles";

const ROLE_CARDS: Array<{ role: AuthRole; label: string; hint: string; Icon: typeof User }> = [
  { role: "student", label: "Student", hint: "Practice, take quizzes and submit assignments", Icon: User },
  { role: "teacher", label: "Teacher", hint: "Faculty login with your @mru.edu.in email", Icon: GraduationCap },
];

/** Landing step for /login: choose the student or teacher login. */
export function RolePicker() {
  return (
    <AuthShell title="C Programming Hub" subtitle="Start your journey to mastering C Programming">
      <Card className="border-border/50 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80 animate-[scale-in_0.3s_ease-out]">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-xl">Login as</CardTitle>
          <CardDescription>Choose who you are to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {ROLE_CARDS.map(({ role, label, hint, Icon }) => (
            <Link
              key={role}
              href={loginPath(role)}
              className="group flex items-center gap-4 rounded-lg border-2 border-border/50 p-4 transition-all hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{hint}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground mt-6">
        New student?{" "}
        <Link
          href={signupPath("student")}
          className="font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
        >
          Create an Account
        </Link>
      </p>
    </AuthShell>
  );
}
