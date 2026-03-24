import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import Link from "next/link";

export default function ForgotPasswordPage() {
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
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              🏠
            </div>
            <span>Airbnb Clone</span>
          </Link>
          <h1 className="text-3xl font-bold">Forgot Password</h1>
          <p className="text-muted-foreground">
            Enter your email and we will generate a reset link.
          </p>
        </div>

        <Card className="p-6">
          <ForgotPasswordForm />
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
