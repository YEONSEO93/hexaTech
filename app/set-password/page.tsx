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
    console.log('[SetPasswordPage] Component mounted. Attempting to process URL hash.');
    setError(null);
    setMessage(null);
    setLoading(true); 
    setShowPasswordForm(false);
    
    // Used to store timeout ID for fallback timer (so we can cancel it later)
    // (TypeScript uses NodeJS.Timeout as the type in some environments)
    let timerId: NodeJS.Timeout | null = null;

    // Check URL Hash for tokens
    const processHash = async () => {
        const hash = window.location.hash.substring(1); // Remove '#'
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const errorDescription = params.get('error_description');
        const errorCode = params.get('error_code');

        console.log('[SetPasswordPage] URL Hash Params:', params.toString());
        console.log('[SetPasswordPage] Access Token found:', !!accessToken);
        console.log('[SetPasswordPage] Refresh Token found:', !!refreshToken);
        console.log('[SetPasswordPage] Error Code found:', errorCode);
        console.log('[SetPasswordPage] Error Description found:', errorDescription);

        // Clean the hash from the URL immediately
        window.history.replaceState(null, '', window.location.pathname + window.location.search);

        // Handle errors passed in the URL hash
        if (errorCode || errorDescription) {
          console.error('[SetPasswordPage] Error received in URL hash:', errorCode, errorDescription);
          const displayError = errorCode === 'otp_expired'
            ? 'Email link is invalid or has expired. Please request a new one.'
            : errorDescription || 'Failed to verify link.';
          setError(displayError);
          setLoading(false);
          // No need to clear timer here as it won't be set if error happens first
          return; 
        }

        // If tokens are present, try to set the session manually
        if (accessToken && refreshToken) {
          console.log('[SetPasswordPage] Access/Refresh tokens found. Attempting manual setSession...');

          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('[SetPasswordPage] Error setting session manually:', sessionError);
            setError('Failed to process authentication token after verification.');
            setLoading(false);
          } else if (data.session) {
            console.log('[SetPasswordPage] Manual session set successfully! User ID:', data.session.user.id);

            // --- DB check logic --- 
            const user = data.session.user;
            console.log('[SetPasswordPage] Checking must_change_password flag after manual session set...');
            const { data: userData, error: dbError } = await supabase
              .from('users')
              .select('must_change_password')
              .eq('id', user.id)
              .single();

            if (dbError) {
              console.error('[SetPasswordPage] DB error fetching flag (after manual set): ', dbError);
              setError('Session established, but failed to retrieve user details.');
              setShowPasswordForm(false);
            } else if (userData && userData.must_change_password === true) {
              console.log('[SetPasswordPage] User needs to set password (manual flow). Showing form.');
              setShowPasswordForm(true);
              setError(null);
              setMessage(null);
            } else if (userData && userData.must_change_password === false) {
              console.log('[SetPasswordPage] User already has password set (manual flow). Redirecting.');
              setMessage('Password already set. Redirecting...');
              setShowPasswordForm(false);
              setTimeout(() => router.push('/dashboard'), 1500); 
            } else {
              console.error('[SetPasswordPage] User data inconsistent after manual set.', userData);
              setError('User account status unclear after login. Contact support.');
              setShowPasswordForm(false);
            }
            // --- IMPORTANT: Clear timer *before* setting loading false ---
            if (timerId) clearTimeout(timerId);
            setLoading(false); // Set loading false after DB check completes
            // --- End of DB check --- 

          } else {
            console.error('[SetPasswordPage] setSession completed but no session data returned.');
            setError('Failed to establish a valid session after verification.');
            // --- IMPORTANT: Clear timer *before* setting loading false ---
            if (timerId) clearTimeout(timerId);
            setLoading(false);
          }
        } else {
          // No tokens found in hash
          console.log('[SetPasswordPage] No tokens found in URL hash...');
          const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              console.log('[SetPasswordPage] User accessed page directly but has active session. Redirecting...');
              setMessage('You are already logged in. Redirecting...');
              setTimeout(() => router.push('/dashboard'), 1500); 
            } else {
              setError('Invalid access. Please use the link provided in your email.');
            }
            // --- IMPORTANT: Clear timer *before* setting loading false ---
            if (timerId) clearTimeout(timerId);
            setLoading(false);
        }
    };

    // Run the hash processing logic
    processHash();

    // Set the fallback timer *after* processHash is called
    timerId = setTimeout(() => {
        // Check loading state when timer fires
        if (loading) { 
            console.warn(`[SetPasswordPage] Fallback timer (15s) fired while still loading.`);
            setError("An unexpected error occurred while processing the link. Please try again.");
            setLoading(false);
        } else {
            console.log('[SetPasswordPage] Fallback timer fired, but loading was already false. Cleanup potentially missed?');
        }
    }, 15000);


    // Cleanup function for the useEffect hook
    return () => {
      console.log("[SetPasswordPage] Effect cleanup. Clearing timer.");
      // Ensure timer is cleared on unmount
      if (timerId) clearTimeout(timerId); 
    };

  }, [supabase, router]); // Dependencies

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters long."); return; }
    setLoading(true);
    try {
      // Since session was set manually, updateUser should work
      const { error: updateError } = await supabase.auth.updateUser({ password: password });
      if (updateError) throw updateError;

      // Also update the must_change_password flag in the users table
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
          console.log('[SetPasswordPage] Updating must_change_password flag for user:', user.id);
          const { error: dbError } = await supabase
              .from('users')
              .update({ must_change_password: false })
              .eq('id', user.id);
          if (dbError) {
              // Log warning but proceed, password was set. User might see password page again if they re-login before flag update propagates?
              console.warn("Failed to update must_change_password flag after password set:", dbError.message);
          } else {
              console.log('[SetPasswordPage] must_change_password flag updated successfully.');
          }
      } else {
           console.warn('[SetPasswordPage] Could not get user after password update to clear flag.');
      }

      setMessage("Password successfully set! Redirecting to dashboard...");
      setShowPasswordForm(false);
      setTimeout(() => router.push('/dashboard'), 2000);

    } catch (err: unknown) {
      console.error("Error setting password:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to set password. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
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
                 <Button type="submit" fullWidth disabled={loading}>
                     {loading ? 'Setting Password...' : 'Set Password and Log In'}
                 </Button>
             </form>
        )}

        {/* Fallback message if not loading, no error, no message, and form not shown */}
        {!loading && !error && !message && !showPasswordForm && (
            <p className="text-center text-gray-600">Please wait or check the link provided in your email.</p>
        )}
      </div>
    </div>
  );
}