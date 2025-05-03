"use client";

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';

export default function SetPasswordPage() {
  const router = useRouter();
  const supabase = createClientComponentClient<Database>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  useEffect(() => {
    setError(null);
    setMessage(null);
    setLoading(true); 
    setShowPasswordForm(false);
    
    let timerId: NodeJS.Timeout | null = null;

    const processHash = async () => {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const errorDescription = params.get('error_description');
        const errorCode = params.get('error_code');

        window.history.replaceState(null, '', window.location.pathname + window.location.search);

        if (errorCode || errorDescription) {
          const displayError = errorCode === 'otp_expired'
            ? 'Email link is invalid or has expired. Please request a new one.'
            : errorDescription || 'Failed to verify link.';
          setError(displayError);
          setLoading(false);
          return; 
        }

        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            setError('Failed to process authentication token after verification.');
            setLoading(false);
          } else if (data.session) {
            const user = data.session.user;
            const { data: userData, error: dbError } = await supabase
              .from('users')
              .select('must_change_password')
              .eq('id', user.id)
              .single();

            if (dbError) {
              setError('Session established, but failed to retrieve user details.');
              setShowPasswordForm(false);
            } else if (userData && userData.must_change_password === true) {
              setShowPasswordForm(true);
              setError(null);
              setMessage(null);
            } else if (userData && userData.must_change_password === false) {
              setMessage('Password already set. Redirecting...');
              setShowPasswordForm(false);
              setTimeout(() => router.push('/dashboard'), 1500); 
            } else {
              setError('User account status unclear after login. Contact support.');
              setShowPasswordForm(false);
            }
            if (timerId) clearTimeout(timerId);
            setLoading(false);
          } else {
            setError('Failed to establish a valid session after verification.');
            if (timerId) clearTimeout(timerId);
            setLoading(false);
          }
        } else {
          const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              setMessage('You are already logged in. Redirecting...');
              setTimeout(() => router.push('/dashboard'), 1500); 
            } else {
              setError('Invalid access. Please use the link provided in your email.');
            }
            if (timerId) clearTimeout(timerId);
            setLoading(false);
        }
    };

    processHash();

    timerId = setTimeout(() => {
        if (loading) { 
            setError("An unexpected error occurred while processing the link. Please try again.");
            setLoading(false);
        }
    }, 15000);

    return () => {
      if (timerId) clearTimeout(timerId); 
    };

  }, [supabase, router]);

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters long."); return; }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: password });
      if (updateError) throw updateError;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          const { error: dbError } = await supabase
              .from('users')
              .update({ must_change_password: false })
              .eq('id', user.id);
          if (dbError) {
              console.warn("Failed to update must_change_password flag after password set:", dbError.message);
          }
      }

      setMessage("Password successfully set! Redirecting to dashboard...");
      setShowPasswordForm(false);
      setTimeout(() => router.push('/dashboard'), 2000);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to set password. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
        <div className="mb-8">
          <Image src="/logo.png" alt="Logo" width={200} height={60} priority />
        </div>
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">
            Set Your Password
        </h1>

        {loading && <p className="text-center text-gray-600">Verifying invitation...</p>}

        {!loading && error && <p className="text-center text-red-600">Error: {error}</p>}

        {!loading && !error && message && <p className="text-center text-green-600">{message}</p>}

        {!loading && !error && !message && showPasswordForm && (
             <form onSubmit={handlePasswordSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="password">New Password</label>
                     <Input id="password" name="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" className="mt-1" disabled={loading} />
                 </div>
                 <div>
                     <label htmlFor="confirmPassword">Confirm Password</label>
                     <Input id="confirmPassword" name="confirmPassword" type="password" required minLength={8} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" className="mt-1" disabled={loading} />
                 </div>
                 <Button type="submit" className="w-full" disabled={loading}>
                     {loading ? 'Setting Password...' : 'Set Password and Log In'}
                 </Button>
             </form>
        )}

        {!loading && !error && !message && !showPasswordForm && (
            <p className="text-center text-gray-600">Please wait or check the link provided in your email.</p>
        )}
      </div>
    </div>
  );
}