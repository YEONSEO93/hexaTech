import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gray-50 p-6 -mt-32">
      <div className="w-full max-w-md space-y-12">
        <div className="flex justify-center">
          <Link href="/login">
            <Image
              src="/logo.png"
              alt="Image"
              width={200}
              height={60}
              className="mb-12"
            />
          </Link>
        </div>
        <div className="rounded-lg bg-white px-12 py-10 shadow-sm">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold">Forgotten your password?</h1>
            <p className="text-gray-600">
              There is nothing to worry about, we&apos;ll send you a message to
              help you reset your password.
            </p>
          </div>
          <form className="mt-8 space-y-6">
            <Input
              id="email"
              type="email"
              label="Email Address"
              placeholder="Enter personal or work email address"
              required
            />
            <Button type="submit" fullWidth>
              Send Reset Link
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
