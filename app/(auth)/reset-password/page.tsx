"use client";

import SingleLogoLayout from "@/components/layouts/SingleLogoLayout";
import { Button } from "@/components/ui/button";
import FeedbackMessage from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";
import { FormEvent, useState } from "react";

const ResetPassword = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const supabase = createClientComponentClient();

    const handlePasswordSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setError("Error updating password");
            setLoading(false);
            return;
        }
        setSuccess(`Password updated successfully. Redirecting to home page...`);
        setLoading(false);
        // Delay the redirect by 3 seconds
        setTimeout(() => {
            redirect("/");
        }, 3000);
    }

    return (
        <SingleLogoLayout>
            <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center text-gray-900">
                    Set Your Password
                </h1>
                {error && (
                    <FeedbackMessage type="error" message={error} />
                )}
                {success && (
                    <FeedbackMessage type="success" message={success} />
                )}
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <Input label="New Password" id="password" name="password" type="password" required minLength={8} placeholder="Enter new password" className="mt-1" disabled={loading} />
                    </div>
                    <div>
                        <Input label="Confirm Password" id="confirmPassword" name="confirmPassword" type="password" required minLength={8} placeholder="Confirm new password" className="mt-1" disabled={loading} />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || !!success}>
                        {loading ? 'Setting Password...' : 'Set Password and Log In'}
                    </Button>
                </form>
            </div>
        </SingleLogoLayout>
    );
}

export default ResetPassword;