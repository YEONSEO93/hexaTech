"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { checkSession } from "@/lib/supabase";

const LoginPage = () => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    const checkExistingSession = async () => {
      console.log('Checking existing session...');
      const { session } = await checkSession();
      if (session) {
        console.log('Found existing session:', session);
        const role = session.user.user_metadata.role || 'user';
        console.log('User role from session:', role);
        if (role === 'admin') {
          console.log('Redirecting admin to dashboard/admin');
          router.push("/dashboard/admin");
        } else {
          console.log('Redirecting user to dashboard');
          router.push("/dashboard");
        }
      }
    };
    checkExistingSession();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;

      console.log('Attempting login with:', { email });

      if (!email?.trim() || !password?.trim()) {
        throw new Error('Please enter both email and password');
      }

      // Use the API endpoint for authentication
      console.log('Sending request to /api/auth');
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email.trim(), // API expects username field
          password: password.trim(),
        }),
      });

      console.log('Auth response status:', response.status);
      const data = await response.json();
      console.log('Auth response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to login');
      }

      if (!data.session) {
        throw new Error('No session data returned');
      }

      // Store the session in localStorage
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      }));

      // Redirect based on role
      if (data.user.role === 'admin') {
        console.log('Redirecting admin to dashboard/admin');
        router.push("/dashboard/admin");
      } else {
        console.log('Redirecting user to dashboard');
        router.push("/dashboard");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error instanceof Error ? error.message : 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/background.jpg"
          alt="Image"
          className="absolute inset-0 object-cover w-full h-full"
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
        <div className="flex items-start justify-center flex-1">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Log In</h1>
            </div>
            {error && (
              <div className="p-4 rounded-md bg-red-50">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-5">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="Enter your email"
                  required
                />
                <Input
                  id="password"
                  name="password"
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
                <Button type="submit" fullWidth disabled={loading}>
                  {loading ? "Logging in..." : "Log In"}
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
