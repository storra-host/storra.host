"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BugIcon } from "./bug-icon";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Severity = "low" | "medium" | "high";

const severityLabel: Record<Severity, string> = {
  low: "Low - cosmetic / typo",
  medium: "Medium - something broken",
  high: "High - can’t use the site",
};

function getSafePageUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const u = new URL(window.location.href);
    // Never include URL fragments in bug reports. E2EE keys live in #k=...
    u.hash = "";
    return u.toString();
  } catch {
    return window.location.origin + window.location.pathname + window.location.search;
  }
}

export function BugReportButton() {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [contactEmail, setContactEmail] = useState("");
  const [sending, setSending] = useState(false);

  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setSummary("");
      setDetails("");
      setSeverity("medium");
      setContactEmail("");
    }
  };

  const canSubmit =
    summary.trim().length > 0 && details.trim().length > 0 && !sending;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!canSubmit) return;
    setSending(true);
    try {
      const pageUrl = getSafePageUrl();
      const r = await fetch("/api/bug-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: summary.trim(),
          details: details.trim(),
          severity,
          contactEmail: contactEmail.trim() || undefined,
          pageUrl,
        }),
      });
      if (!r.ok) {
        const j = (await r.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(j.error?.message ?? "Could not send report");
      }
      toast.success("Report sent. Thank you.");
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            "border-0 bg-transparent text-slate-600 shadow-none",
            "ring-0 ring-offset-0 outline-none",
            "hover:bg-transparent active:bg-transparent",
            "dark:text-zinc-400 dark:hover:bg-transparent dark:active:bg-transparent",
            "focus:bg-transparent focus:outline-none focus:ring-0",
            "focus-visible:bg-transparent focus-visible:ring-0",
            "transition-[color,opacity] hover:text-slate-900 dark:hover:text-zinc-100"
          )}
          title="Report a bug"
          aria-label="Report a bug"
        >
          <BugIcon />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogTitle>Report a bug</DialogTitle>
        <DialogDescription>
          Sent to the operator (Discord). Do not paste secrets, keys, or file
          contents.
        </DialogDescription>
        <form onSubmit={submit} className="mt-3 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="bug-summary">Short summary</Label>
            <Input
              id="bug-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              required
              maxLength={140}
              placeholder="e.g. Upload stops at 50% on mobile"
            />
            <p className="text-xs text-slate-500 dark:text-zinc-500">
              One line, max 140 characters
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bug-details">What happened</Label>
            <Textarea
              id="bug-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              required
              maxLength={4000}
              rows={4}
              placeholder="Steps to reproduce, what you expected, what you saw…"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bug-severity">Impact</Label>
            <Select
              value={severity}
              onValueChange={(v) => setSeverity(v as Severity)}
            >
              <SelectTrigger id="bug-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{severityLabel.low}</SelectItem>
                <SelectItem value="medium">{severityLabel.medium}</SelectItem>
                <SelectItem value="high">{severityLabel.high}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bug-contact">Contact (optional)</Label>
            <Input
              id="bug-contact"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              maxLength={320}
              placeholder="you@email.com - only if you want a reply"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200/80 pt-3 dark:border-zinc-700/80">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {sending && <Loader2 className="h-4 w-4 animate-spin" />}
              Send
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
