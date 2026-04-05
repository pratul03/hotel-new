"use client";

import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import Link from "next/link";
import Image from "next/image";
import { Skeleton as UISkeleton } from "@/components/ui/skeleton";
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react";

export default function ResetPasswordPage() {
  return (
    <main className="relative min-h-screen bg-linear-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle className="h-9 w-9" />
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 font-bold text-2xl mb-6"
          >
            <Image src="/icon.svg" alt="App logo" width={40} height={40} />
            <span>FND OUT SPACE</span>
          </Link>
          <h1 className="text-3xl font-bold">Set New Password</h1>
          <p className="text-muted-foreground">
            Choose a strong password to secure your account.
          </p>
        </div>

        <Card className="p-6">
          <Suspense
            fallback={
              <BoneyardSkeleton
                loading
                name="reset-password-form"
                fallback={
                  <div className="space-y-4">
                    <UISkeleton className="h-10 w-full" />
                    <UISkeleton className="h-10 w-full" />
                    <UISkeleton className="h-10 w-full" />
                    <UISkeleton className="h-11 w-full" />
                  </div>
                }
              >
                <p className="text-sm text-muted-foreground">
                  Loading reset form...
                </p>
              </BoneyardSkeleton>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Back to login
          </Link>
        </p>
      </div>
    </main>
  );
}
