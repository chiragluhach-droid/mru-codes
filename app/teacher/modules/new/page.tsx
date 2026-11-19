"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ModuleDetailsForm } from "@/components/modules/module-details-form";
import type { ModuleDetails } from "@/lib/modules";

export default function NewModulePage() {
  const router = useRouter();

  const handleCreate = async (values: ModuleDetails) => {
    const response = await fetch("/api/modules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      toast.error(result.error || "Failed to create module");
      return;
    }
    toast.success("Module created. Now add your video lessons.");
    router.push(`/teacher/modules/${result.module.id}`);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/teacher/modules"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to modules
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>New module</CardTitle>
          <CardDescription>
            Start with the basics. You&apos;ll upload video lessons on the next screen, then publish when it&apos;s ready.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModuleDetailsForm submitLabel="Create module" onSubmit={handleCreate} />
        </CardContent>
      </Card>
    </div>
  );
}
