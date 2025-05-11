"use client";

import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { resetPassword } from "@/lib/supabase/auth";
import { useState } from "react";
import FeedbackMessage from "@/components/ui/feedback-message";

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const email = (formData.get("email") as string)?.trim() || "";
        if (!email) {
            return setError("Email is required");
        }
        const { error } = await resetPassword(email);

        if (error) {
            console.error("Error resetting password:", error);
            return setError(error);
        }

        setLoading(false);
        setSuccess("Password reset email successfully sent. Please check your inbox.");
    }

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
                    {success ?
                        <div className="flex justify-center">
                            <p>{success}</p>
                        </div>
                        : <>
                            <div className="space-y-2 text-center">
                                <h1 className="text-2xl font-bold">Forgotten your password?</h1>
                                <p className="text-gray-600">
                                    There is nothing to worry about, we&apos;ll send you a message to
                                    help you reset your password.
                                </p>
                            </div>
                            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                                {error && (
                                    <FeedbackMessage type="error" message={error} />
                                )}
                                {success && (
                                    <FeedbackMessage type="success" message={success} />
                                )}
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    label="Email Address"
                                    placeholder="Enter personal or work email address"
                                    required
                                />
                                <Button type="submit" fullWidth disabled={loading}>
                                    {loading ? "Sending..." : "Send Reset Link"}
                                </Button>
                            </form>
                        </>}


                </div>
            </div>
        </div>
    );
}
