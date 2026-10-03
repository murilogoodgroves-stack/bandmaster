import React, { useState } from 'react';
import { isSupabaseAuthConfigured, supabaseClient } from '../services/supabaseClient';

type AuthMode = 'sign-in' | 'sign-up' | 'reset' | 'update-password';

export const AuthScreen: React.FC<{
  passwordRecovery?: boolean;
  onPasswordUpdated?: () => void;
}> = ({ passwordRecovery = false, onPasswordUpdated }) => {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activeMode: AuthMode = passwordRecovery ? 'update-password' : mode;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabaseClient) return;

    setMessage('');
    setError('');
    setSubmitting(true);

    try {
      if (activeMode === 'reset') {
        const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        });
        if (resetError) throw resetError;
        setMessage('If an account exists for this email, a password-reset link will be sent.');
      } else if (activeMode === 'update-password') {
        if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
        const { error: updateError } = await supabaseClient.auth.updateUser({ password });
        if (updateError) throw updateError;
        setMessage('Your password has been updated.');
        setPassword('');
        onPasswordUpdated?.();
      } else if (activeMode === 'sign-up') {
        if (password.length < 8) {
          throw new Error('Use a password with at least 8 characters.');
        }
        const { data, error: signUpError } = await supabaseClient.auth.signUp({
          email,
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage('Check your email to confirm your account before signing in.');
        }
      } else {
        const { error: signInError } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Authentication failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSupabaseAuthConfigured) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-brand-bg-outer p-6 text-gray-200">
        <section className="max-w-xl rounded-xl border border-amber-500/40 bg-brand-bg-card p-8">
          <h1 className="text-2xl font-bold text-white">Account sign-in is not configured</h1>
          <p className="mt-3 text-gray-300">
            Configure the Supabase project URL and public anon key before enabling customer accounts. The server also needs
            matching server-side Supabase settings before protected APIs can be used.
          </p>
        </section>
      </main>
    );
  }

  const heading = activeMode === 'sign-up' ? 'Create your account'
    : activeMode === 'update-password' ? 'Choose a new password'
      : activeMode === 'reset' ? 'Reset your password' : 'Sign in to Bandmate';

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-bg-outer p-6 text-gray-200">
      <section className="w-full max-w-md rounded-xl border border-brand-border bg-brand-bg-card p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white">{heading}</h1>
        <p className="mt-2 text-sm text-gray-400">Your band workspace is private to your account.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {activeMode === 'sign-up' && (
            <label className="block text-sm text-gray-300">
              Name
              <input
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-lg bg-brand-bg-content p-3 text-white"
                maxLength={120}
                required
              />
            </label>
          )}
          <label className="block text-sm text-gray-300">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg bg-brand-bg-content p-3 text-white"
              maxLength={254}
              required
            />
          </label>
          {activeMode !== 'reset' && (
            <label className="block text-sm text-gray-300">
              Password
              <input
                type="password"
                autoComplete={activeMode === 'sign-in' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg bg-brand-bg-content p-3 text-white"
                minLength={8}
                required
              />
            </label>
          )}

          {error && <p role="alert" className="rounded-lg border border-red-500/40 bg-red-900/20 p-3 text-sm text-red-200">{error}</p>}
          {message && <p role="status" className="rounded-lg border border-green-500/40 bg-green-900/20 p-3 text-sm text-green-200">{message}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-accent py-3 font-bold text-white hover:bg-brand-accent-dark disabled:opacity-60"
          >
            {submitting ? 'Please wait…'
              : activeMode === 'sign-up' ? 'Create account'
                : activeMode === 'update-password' ? 'Update password'
                  : activeMode === 'reset' ? 'Send reset link' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap gap-4 text-sm">
          {!passwordRecovery && mode !== 'sign-in' && <button className="text-gray-300 underline" onClick={() => { setMode('sign-in'); setError(''); setMessage(''); }}>Back to sign in</button>}
          {!passwordRecovery && mode === 'sign-in' && <>
            <button className="text-gray-300 underline" onClick={() => { setMode('sign-up'); setError(''); setMessage(''); }}>Create account</button>
            <button className="text-gray-300 underline" onClick={() => { setMode('reset'); setError(''); setMessage(''); }}>Forgot password?</button>
          </>}
        </div>
      </section>
    </main>
  );
};
