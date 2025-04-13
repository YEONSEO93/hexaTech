"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LoginPage = () => {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Add actual login logic here
    router.push("/users");
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/background.jpg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-col p-6 md:p-10">
        <div className="mb-32">
          <Link href="/login" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Image"
              width={200}
              height={60}
              className="mb-4"
            />
          </Link>
        </div>
        <div className="flex flex-1 items-start justify-center">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Log In</h1>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-5">
                <Input
                  id="username"
                  type="text"
                  label="Username"
                  placeholder="Enter your username"
                  required
                />
                <Input
                  id="password"
                  type="password"
                  label="Password"
                  placeholder="Enter your password"
                  helperText="It must be a combination of minimum 8 letters, numbers, and symbols."
                  required
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="remember"
                      className="h-4 w-4 rounded border-gray-300 text-[#001F4D] focus:ring-[#001F4D]"
                    />
                    <label htmlFor="remember" className="text-sm text-gray-600">
                      Remember me
                    </label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-[#001F4D] hover:text-[#001F4D]/80"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <Button type="submit" fullWidth>
                  Log In
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
