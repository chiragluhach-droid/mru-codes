"use client";

import Link from "next/link";
import { AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface AuthNotice {
  title: string;
  description: string;
  tone?: "warning" | "info";
  /** Main action, usually a link to the right page. */
  action?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
}

/** Pop-up for account mix-ups: wrong role for an email, account already exists, etc. */
export function AuthNoticeDialog({
  notice,
  onClose,
}: {
  notice: AuthNotice | null;
  onClose: () => void;
}) {
  const Icon = notice?.tone === "info" ? Info : AlertCircle;
  return (
    <Dialog open={Boolean(notice)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {notice && (
          <>
            <DialogHeader className="items-center text-center sm:items-center sm:text-center">
              <div
                className={
                  notice.tone === "info"
                    ? "mb-1 rounded-full bg-primary/10 p-3 text-primary"
                    : "mb-1 rounded-full bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400"
                }
              >
                <Icon className="h-6 w-6" />
              </div>
              <DialogTitle>{notice.title}</DialogTitle>
              <DialogDescription>{notice.description}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-center">
              {notice.secondaryAction && (
                <Button asChild variant="outline">
                  <Link href={notice.secondaryAction.href} onClick={onClose}>
                    {notice.secondaryAction.label}
                  </Link>
                </Button>
              )}
              {notice.action ? (
                <Button asChild>
                  <Link href={notice.action.href} onClick={onClose}>
                    {notice.action.label}
                  </Link>
                </Button>
              ) : (
                <Button onClick={onClose}>OK</Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const REMEMBERED_EMAIL_KEY = "auth:email";

/** Keeps the typed email when a notice sends the user to another auth page. */
export function rememberEmail(email: string) {
  try {
    sessionStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
  } catch {
    // Storage unavailable (private mode); the user retypes it.
  }
}

/** Reads and clears the email remembered by rememberEmail. */
export function takeRememberedEmail() {
  try {
    const email = sessionStorage.getItem(REMEMBERED_EMAIL_KEY);
    sessionStorage.removeItem(REMEMBERED_EMAIL_KEY);
    return email;
  } catch {
    return null;
  }
}
