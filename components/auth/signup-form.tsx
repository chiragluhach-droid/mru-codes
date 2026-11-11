"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, ArrowRight, Eye, EyeOff, Building2 } from "lucide-react";
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
import type { Department } from "@/lib/departments";
import {
  SECTION_OPTIONS,
  departmentOptionsForRole,
  roleRequiresSection,
} from "@/lib/departments";
import { AuthShell } from "@/components/auth/auth-shell";
import { dashboardPath, loginPath } from "@/lib/auth-roles";
import { isTeacherEmail } from "@/lib/faculty";

// Only students sign up. Faculty accounts come from the list in lib/faculty.ts.
const role = "student";

const signupSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .refine((email) => !isTeacherEmail(email), "Faculty don't sign up. Please use the teacher login."),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  rollNumber: z.string().optional(),
  department: z.string().min(1, "Department is required"),
  section: z.string().optional(),
  role: z.enum(["student", "teacher"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // Section required only for students in CSE/AIML. Teachers never pick one.
  if (roleRequiresSection(data.role, data.department as Department)) {
    return Boolean(data.section && data.section.trim().length > 0);
  }
  return true;
}, {
  message: "Section is required for CSE/AIML",
  path: ["section"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
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

  const selectedDepartment = watch("department");
  const departmentOptions = departmentOptionsForRole(role);

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}${loginPath(role)}`,
          data: {
            full_name: data.fullName,
            roll_number: data.rollNumber,
            department: data.department,
            section: data.section,
            role,
          },
        },
      });

      if (authError) {
        const code = (authError as { code?: string }).code;
        if (code === "user_already_exists") {
          toast.error("An account with this email already exists. Please sign in instead.");
        } else {
          toast.error(authError.message);
        }
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
            <CardTitle className="text-xl">Create student account</CardTitle>
          </div>
          <CardDescription>
            Faculty member?{" "}
            <Link
              href={loginPath("teacher")}
              className="font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
            >
              Log in as a teacher
            </Link>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
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
                placeholder="you@example.com"
                className="h-11 bg-background/50 border-border/50"
                {...register("email")}
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Enter your email address
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
                onValueChange={(value) => {
                  setValue("department", value, { shouldValidate: true });
                  if (!roleRequiresSection(role, value as Department)) {
                    setValue("section", "", { shouldValidate: true });
                  }
                }}
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

            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number</Label>
              <Input
                id="rollNumber"
                placeholder="e.g., 21BCS001"
                className="h-11 bg-background/50 border-border/50"
                {...register("rollNumber")}
                disabled={isLoading}
              />
            </div>

            {/* Section (CSE/AIML only) */}
            {roleRequiresSection(role, selectedDepartment as Department) && (
              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <Select
                  value={watch("section")}
                  onValueChange={(value) => setValue("section", value, { shouldValidate: true })}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-11 bg-background/50 border-border/50">
                    <SelectValue placeholder="Select section" />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTION_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        Section {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.section && (
                  <p className="text-sm text-destructive">{errors.section.message}</p>
                )}
              </div>
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
    </AuthShell>
  );
}

