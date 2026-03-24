"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axiosInstance from "@/lib/axios";
import { ThemeToggle } from "@/components/common/ThemeToggle";

type State = "loading" | "success" | "error" | "no-token";

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background to-muted/40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>(token ? "loading" : "no-token");

  useEffect(() => {
    if (!token) return;
    axiosInstance
      .post("/auth/verify-email", { token })
      .then(() => setState("success"))
      .catch(() => setState("error"));
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-linear-to-br from-background to-muted/40">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-md text-center">
        <CardHeader className="pb-4">
          {state === "loading" && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              </div>
              <CardTitle>Verifying your email…</CardTitle>
              <CardDescription>Please wait a moment.</CardDescription>
            </>
          )}
          {state === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle>Email verified!</CardTitle>
              <CardDescription>
                Your account is now fully activated.
              </CardDescription>
            </>
          )}
          {state === "error" && (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle>Verification failed</CardTitle>
              <CardDescription>
                The link may have expired or already been used. Request a new
                one below.
              </CardDescription>
            </>
          )}
          {state === "no-token" && (
            <>
              <div className="flex justify-center mb-4">
                <MailOpen className="h-12 w-12 text-primary" />
              </div>
              <CardTitle>Check your inbox</CardTitle>
              <CardDescription>
                We sent you a verification link. Click it to activate your
                account.
              </CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          {state === "success" && (
            <Button onClick={() => router.push("/")} className="w-full">
              Continue to App
            </Button>
          )}
          {(state === "error" || state === "no-token") && (
            <ResendVerification />
          )}
          <Button variant="link" asChild>
            <Link href="/login">Back to login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ResendVerification() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      await axiosInstance.post("/auth/resend-verification");
      setSent(true);
    } catch {
      // silently fail — user may not be logged in
      setSent(true); // show success anyway to avoid email enumeration
    } finally {
      setSending(false);
    }
  };

  if (sent)
    return (
      <p className="text-sm text-muted-foreground">
        Verification email sent! Check your inbox.
      </p>
    );

  return (
    <Button
      onClick={resend}
      disabled={sending}
      variant="outline"
      className="w-full"
    >
      {sending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Resend verification email
    </Button>
  );
}
