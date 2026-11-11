"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Mail } from "lucide-react";
import toast from "react-hot-toast";
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
import { AuthShell } from "@/components/auth/auth-shell";
import { isTeacherEmail } from "@/lib/faculty";
import { loginPath } from "@/lib/auth-roles";

const setupSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .refine(isTeacherEmail, "This email is not on the faculty list"),
});

type SetupFormData = z.infer<typeof setupSchema>;

/** Faculty enter their listed email and get a link to set (or reset) their password. */
export function FacultySetupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormData>({ resolver: zodResolver(setupSchema) });

  const onSubmit = async ({ email }: SetupFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/faculty-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        toast.error(result.error || "Something went wrong. Please try again.");
        return;
      }
      setSentTo(email.trim());
      toast.success("Check your inbox for the password link.");
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell title="C Programming Hub" subtitle="Faculty account setup">
      <Card className="border-border/50 shadow-xl shadow-primary/5 backdrop-blur-sm bg-card/80 animate-[scale-in_0.3s_ease-out]">
        {sentTo ? (
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 mx-auto text-green-600 dark:text-green-500" />
            <p className="font-semibold">Check your email</p>
            <p className="text-sm text-muted-foreground">
              We sent a link to <span className="font-medium text-foreground">{sentTo}</span>.
              Open it to set your password, then log in. Check spam if you don&apos;t see it.
            </p>
            <Button asChild className="w-full h-11 mt-2">
              <Link href={loginPath("teacher")}>Go to teacher login</Link>
            </Button>
          </CardContent>
        ) : (
          <>
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-primary" />
                <CardTitle className="text-xl">Set your password</CardTitle>
              </div>
              <CardDescription>
                First time here, or forgot your password? Enter your faculty email and
                we&apos;ll send you a link.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardContent className="space-y-2">
                <Label htmlFor="email">Faculty email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@mru.edu.in"
                  className="h-11 bg-background/50 border-border/50"
                  {...register("email")}
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-4">
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  Send password link
                </Button>
                <Link
                  href={loginPath("teacher")}
                  className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to teacher login
                </Link>
              </CardFooter>
            </form>
          </>
        )}
      </Card>
    </AuthShell>
  );
}
