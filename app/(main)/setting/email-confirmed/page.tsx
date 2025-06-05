"use client";
import { useEffect, useState } from "react";
import { createSupabaseClientComponentClient } from "@/lib/supabase/client"; // adjust path as needed
import { useRouter } from "next/navigation";

export default function EmailConfirmedPage() {
    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createSupabaseClientComponentClient();

    useEffect(() => {
        async function syncEmail() {
            setLoading(true);
            setError(null);
            try {
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (userError || !user) throw new Error("Could not fetch user.");

                const { error: dbError } = await supabase
                    .from("users")
                    .update({ email: user.email })
                    .eq("id", user.id);
                if (dbError) throw dbError;

                setSuccess(true);
            } catch (err: any) {
                setError(err.message || "Something went wrong.");
            } finally {
                setLoading(false);
            }
        }
        syncEmail();
    }, [supabase]);

    return (
        <div className="max-w-md mx-auto mt-16 p-6 bg-white rounded shadow">
            <h1 className="text-2xl font-bold mb-4">Email Confirmation</h1>
            {loading && <p>Confirming your email, please wait...</p>}
            {success && (
                <div>
                    <p className="text-green-600 mb-2">Your email has been confirmed and updated!</p>
                    <button
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
                        onClick={() => router.push("/setting/account")}
                    >
                        Go to Account Settings
                    </button>
                </div>
            )}
            {error && <p className="text-red-600">{error}</p>}
        </div>
    );
}