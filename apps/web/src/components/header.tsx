"use client";

import { Mail } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function Header() {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex h-14 items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Mail className="h-4 w-4" />
            </div>
            <span className="font-semibold text-sm tracking-tight">
              CSI Mailer
            </span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm text-muted-foreground hidden sm:block">
            Bulk email via AWS SES
          </span>
        </div>
      </div>
    </header>
  );
}
