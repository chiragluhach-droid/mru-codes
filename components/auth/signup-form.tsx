"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, ArrowRight, Eye, EyeOff, Building2, User, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import {
  BATCH_SECTION_FORMAT_MESSAGE,
  BATCH_SECTION_LABEL,
  departmentOptionsForRole,
  isValidBatchSection,
  normalizeBatchSection,
} from "@/lib/departments";
import { BatchSectionInput } from "@/components/batch-section-input";
import { AuthShell } from "@/components/auth/auth-shell";
import { dashboardPath, loginPath, signupPath, type AuthRole } from "@/lib/auth-roles";
import { isTeacherEmail } from "@/lib/faculty";
import { STUDENT_SIGNUP_CLOSED_MESSAGE, isAllowedStudentEmail } from "@/lib/student-allowlist";
import { cn } from "@/lib/utils";
import {
  AuthNoticeDialog,
  rememberEmail,
  takeRememberedEmail,
  type AuthNotice,
} from "@/components/auth/auth-notice-dialog";

/**
 * Which account type an email may create, or a pop-up explaining why not.
 * Teachers are exactly the faculty list; students are the 2026-batch list.
 */
function signupNotice(role: AuthRole, email: string): AuthNotice | null {
  if (role === "teacher") {
    if (isTeacherEmail(email)) return null;
    return {
      title: "This email isn't registered as a teacher",
      description: isAllowedStudentEmail(email)
        ? "This is a student email. Teacher accounts can only be created with an official faculty email. Create a student account instead."
        : "Teacher accounts can only be created with an official faculty email on the list. If you're faculty and think this is a mistake, contact the admin.",
      action: isAllowedStudentEmail(email) ? { label: "Create student account", href: signupPath("student") } : undefined,
    };
  }
  if (isTeacherEmail(email)) {
    return {
      title: "This is a faculty email",
      description: "Faculty can't create a student account. Create a teacher account instead.",
      action: { label: "Create teacher account", href: signupPath("teacher") },
    };
  }
  if (!isAllowedStudentEmail(email)) {
    return { title: "Email not on the 2026 batch list", description: STUDENT_SIGNUP_CLOSED_MESSAGE };
  }
  return null;
}

const signupSchema = z
  .object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    rollNumber: z.string().optional(),
    department: z.string().min(1, "Department is required"),
    section: z.string().optional(),
    role: z.enum(["student", "teacher"]),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["confirmPassword"], message: "Passwords don't match" });
    }
    // Which emails may sign up for which role is checked on submit (signupNotice).
    if (data.role === "student" && !isValidBatchSection(data.section)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["section"], message: BATCH_SECTION_FORMAT_MESSAGE });
    }
  });

type SignupFormData = z.infer<typeof signupSchema>;

const ROLE_TABS: Array<{ role: AuthRole; label: string; Icon: typeof User }> = [
  { role: "student", label: "Student", Icon: User },
  { role: "teacher", label: "Teacher", Icon: GraduationCap },
];

/** Signup for /signup/student and /signup/teacher; the toggle switches between them. */
export function SignupForm({ role }: { role: AuthRole }) {
  const isTeacher = role === "teacher";
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const response = await fetch(`/api/profile/me`);
          if (response.ok) {
            const { profile } = await response.json();
            router.replace(dashboardPath(profile?.role === "teacher" ? "teacher" : "student"));
          } else {
            router.replace("/dashboard");
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [router, supabase]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    mode: "onChange",
    defaultValues: {
      role,
      department: "",
      section: "",
    },
  });

  // Keep the email typed on the other form when a notice switched pages.
  useEffect(() => {
    const email = takeRememberedEmail();
    if (email) setValue("email", email, { shouldValidate: true });
  }, [setValue]);

  const selectedDepartment = watch("department");
  const departmentOptions = departmentOptionsForRole(role);

  const onSubmit = async (data: SignupFormData) => {
    const mismatch = signupNotice(role, data.email);
    if (mismatch) {
      rememberEmail(data.email);
      setNotice(mismatch);
      return;
    }

    const accountExists: AuthNotice = {
      title: "You already have an account",
      description: `An account with ${data.email.trim()} already exists. Log in, or reset your password if you've forgotten it.`,
      tone: "info",
      action: { label: "Log in", href: loginPath(role) },
      secondaryAction: { label: "Reset password", href: "/forgot-password" },
    };

    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}${loginPath(role)}`,
          data: {
            full_name: data.fullName,
            roll_number: isTeacher ? null : data.rollNumber,
            department: data.department,
            section: isTeacher ? null : normalizeBatchSection(data.section),
            role,
          },
        },
      });

      if (authError) {
        const code = (authError as { code?: string }).code;
        if (code === "user_already_exists" || code === "email_exists") {
          rememberEmail(data.email);
          setNotice(accountExists);
        } else if (authError.status === 429) {
          toast.error("Too many attempts. Please wait a few minutes and try again.");
        } else {
          toast.error(authError.message);
        }
        return;
      }

      // Supabase hides existing accounts by returning a user with no identities.
      if (authData.user && authData.user.identities?.length === 0) {
        rememberEmail(data.email);
        setNotice(accountExists);
        return;
      }

      if (authData.user) {
        toast.success("Account created! Check your email to verify.", { duration: 4000 });
        router.push(`/verify-account?email=${encodeURIComponent(data.email)}&role=${role}`);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      title="Join C Programming Hub"
      subtitle="Start your journey to mastering C Programming"
    >
      {/* Signup Card */}
      <Card className="border-border/50 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80 animate-[scale-in_0.3s_ease-out]">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <CardTitle className="text-xl">Create account</CardTitle>
          </div>
          <CardDescription>Fill in your details to get started</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Role selection: switches between /signup/student and /signup/teacher */}
            <div className="grid grid-cols-2 gap-3">
              {ROLE_TABS.map(({ role: tabRole, label, Icon }) => {
                const active = tabRole === role;
                return (
                  <Link
                    key={tabRole}
                    href={signupPath(tabRole)}
                    replace
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "p-4 rounded-lg border-2 text-center transition-all",
                      active ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
                    )}
                  >
                    <Icon className={cn("h-5 w-5 mx-auto mb-2", active ? "text-primary" : "text-muted-foreground")} />
                    <span className={cn("text-sm font-medium", active && "text-primary")}>{label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                className="h-11 bg-background/50 border-border/50"
                {...register("fullName")}
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-sm text-destructive">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={isTeacher ? "name@mru.edu.in" : "name_26@mru.ac.in"}
                className="h-11 bg-background/50 border-border/50"
                {...register("email")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                {isTeacher
                  ? "Use your official faculty email."
                  : "Use your university email. Only 2026 batch students can sign up."}
              </p>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 bg-background/50 border-border/50 pr-10"
                  {...register("password")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 bg-background/50 border-border/50 pr-10"
                  {...register("confirmPassword")}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Department (Student + Teacher) */}
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Department
              </Label>
              <Select
                value={selectedDepartment}
                onValueChange={(value) => setValue("department", value, { shouldValidate: true })}
                disabled={isLoading}
              >
                <SelectTrigger className="h-11 bg-background/50 border-border/50">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-sm text-destructive">{errors.department.message}</p>
              )}
            </div>

            {!isTeacher && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    placeholder="e.g., 2K26CSUN01001"
                    className="h-11 bg-background/50 border-border/50"
                    {...register("rollNumber")}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section">{BATCH_SECTION_LABEL}</Label>
                  <BatchSectionInput
                    id="section"
                    value={watch("section") ?? ""}
                    onChange={(value) => setValue("section", value, { shouldValidate: true })}
                    disabled={isLoading}
                    className="h-11 bg-background/50 border-border/50"
                  />
                  {errors.section && (
                    <p className="text-sm text-destructive">{errors.section.message}</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              className="w-full h-11 font-medium group"
              disabled={isLoading || !isValid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={loginPath(role)}
                className="font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-8 animate-[fade-in_0.5s_ease-out_0.3s_both]">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2 hover:text-foreground transition-colors">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground transition-colors">
          Privacy Policy
        </Link>
      </p>
      <AuthNoticeDialog notice={notice} onClose={() => setNotice(null)} />
    </AuthShell>
  );
}

