import { Card } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import Link from "next/link";

export default function RegisterPage() {
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
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">
            Join us and start your next adventure
          </p>
        </div>

        <Card className="p-6">
          <RegisterForm />
        </Card>
      </div>
    </main>
  );
}
