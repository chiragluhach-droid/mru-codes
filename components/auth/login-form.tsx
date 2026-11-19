"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Sparkles, ArrowRight, Eye, EyeOff, Mail } from "lucide-react";
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
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  ROLE_LABEL,
  dashboardPath,
  loginPath,
  signupPath,
  type AuthRole,
} from "@/lib/auth-roles";
import { roleForEmail } from "@/lib/faculty";
import { STUDENT_SIGNUP_CLOSED_MESSAGE } from "@/lib/student-allowlist";
import {
  AuthNoticeDialog,
  rememberEmail,
  takeRememberedEmail,
  type AuthNotice,
} from "@/components/auth/auth-notice-dialog";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({ role, notAllowed = false }: { role: AuthRole; notAllowed?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showResendPrompt, setShowResendPrompt] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<AuthNotice | null>(null);
  const otherRole: AuthRole = role === "teacher" ? "student" : "teacher";
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.replace(dashboardPath(roleForEmail(user.email)));
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
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Keep the email typed on the other login page when a notice switched pages.
  useEffect(() => {
    const email = takeRememberedEmail();
    if (email) setValue("email", email);
  }, [setValue]);

  const handleResendVerification = async () => {
    if (!unverifiedEmail || resending) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: unverifiedEmail,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Verification email sent! Check your inbox.");
      setShowResendPrompt(false);
      setUnverifiedEmail("");
    } catch {
      toast.error("Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    // Teachers are exactly the faculty list, so the role is known from the
    // email alone and each login page only admits its own role.
    const accountRole = roleForEmail(data.email);
    if (accountRole !== role) {
      rememberEmail(data.email);
      setNotice(
        role === "teacher"
          ? {
              title: "This email isn't registered as a teacher",
              description:
                "Only faculty on the official list can log in as a teacher. If you're a student, use the student login.",
              action: { label: "Go to student login", href: loginPath("student") },
            }
          : {
              title: "This is a teacher account",
              description: "This email belongs to a faculty member. Please use the teacher login.",
              action: { label: "Go to teacher login", href: loginPath("teacher") },
            }
      );
      setIsLoading(false);
      return;
    }

    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        const isEmailNotVerified =
          error.message?.toLowerCase().includes("email not confirmed") ||
          error.message?.toLowerCase().includes("email not verified");
        if (isEmailNotVerified) {
          toast.error("Email not verified. Please check your inbox or resend the verification link.");
          setUnverifiedEmail(data.email);
          setShowResendPrompt(true);
        } else if (error.message?.toLowerCase().includes("invalid login credentials")) {
          setNotice({
            title: "Incorrect email or password",
            description:
              "Check your email and password and try again. If you don't have an account yet, create one; if you forgot your password, reset it.",
            tone: "info",
            action: { label: "Reset password", href: "/forgot-password" },
            secondaryAction: { label: "Create account", href: signupPath(role) },
          });
        } else if (error.status === 429) {
          toast.error("Too many attempts. Please wait a few minutes and try again.");
        } else {
          toast.error(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Failed to log in. Please try again.");
        setIsLoading(false);
        return;
      }

      // Require verified email before allowing access
      const isVerified = Boolean(
        (authData.user as { email_confirmed_at?: string | null; confirmed_at?: string | null })
          .email_confirmed_at ||
        (authData.user as { confirmed_at?: string | null }).confirmed_at
      );

      if (!isVerified) {
        toast.error("Email not verified. Please check your inbox or resend the verification link.");
        await supabase.auth.signOut();
        setUnverifiedEmail(data.email);
        setShowResendPrompt(true);
        setIsLoading(false);
        return;
      }

      toast.success("Welcome back!");

      if (typeof window !== "undefined") {
        window.location.href = dashboardPath(accountRole);
      } else {
        router.push(dashboardPath(accountRole));
        router.refresh();
      }
    } catch {
      toast.error("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

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
      title="C Programming Hub"
      subtitle="Start your journey to mastering C Programming"
    >
      {/* Login Card */}
      <Card className="border-border/50 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80 animate-[scale-in_0.3s_ease-out]">
        <CardHeader className="space-y-1 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <CardTitle className="text-xl">{ROLE_LABEL[role]} login</CardTitle>
          </div>
          <CardDescription>
            Not a {ROLE_LABEL[role].toLowerCase()}?{" "}
            <Link
              href={loginPath(otherRole)}
              className="font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
            >
              Login as a {ROLE_LABEL[otherRole].toLowerCase()}
            </Link>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {notAllowed && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                {STUDENT_SIGNUP_CLOSED_MESSAGE}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                  {errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="h-11 bg-background/50 border-border/50 focus:border-primary/50 transition-colors pr-10"
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
                <p className="text-sm text-destructive flex items-center gap-1">
                  <span className="inline-block w-1 h-1 rounded-full bg-destructive" />
                  {errors.password.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              className="w-full h-11 font-medium group"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  New here?
                </span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link
                href={signupPath(role)}
                className="font-medium text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
              >
                Create an Account
              </Link>
            </p>
          </CardFooter>
        </form>

        {showResendPrompt && unverifiedEmail && (
          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm text-foreground mb-2">
              Your email isn&apos;t verified yet. We sent a link to{" "}
              <span className="font-medium">{unverifiedEmail}</span>
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              Check your inbox or spam. Didn&apos;t get it? Click below to resend.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResendVerification}
                disabled={resending}
                className="gap-2"
              >
                {resending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Resend verification email
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResendPrompt(false);
                  setUnverifiedEmail("");
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-8 animate-[fade-in_0.5s_ease-out_0.3s_both]">
        By logging in, you agree to our{" "}
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

