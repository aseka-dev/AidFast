import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon } from '../../components/icons/Icons';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@aidfast.lk');
  const [password, setPassword] = useState('AidFast@123');
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Where to redirect after login (default /dashboard)
  const locationState = location.state as { from?: { pathname: string } } | null;
  const from = locationState?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#f4f7f5]">

      {/* Left Column: Background Graphic Panel (Desktop) */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#094732] overflow-hidden select-none">
        <img
          src="/login-bg.jpg"
          alt="AidFast Pharmacy Management"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* Right Column: Sign In Form Card */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12">

        {/* Back Link */}
        <div className="w-full max-w-md mb-4 flex justify-between items-center text-xs">
          <Link
            to="/"
            className="text-emerald-800 hover:text-emerald-950 font-medium inline-flex items-center gap-1.5 transition"
          >
            Back to Community Portal
          </Link>
          <span className="text-gray-400"></span>
        </div>

        {/* Card */}
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-lg border border-gray-100/80">

          {/* Header */}
          <div className="mb-6">
            <span className="text-[11px] font-bold tracking-widest text-[#0e744e] uppercase block mb-1">
              WELCOME BACK
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#111827] tracking-tight">
              Sign in to AidFast
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5">
              Enter your pharmacy account credentials to continue.
            </p>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <span className="font-bold">⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Email address
              </label>
              <div className="relative rounded-xl border border-gray-200 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 bg-white transition">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <MailIcon className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@pharmacy.lk"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl focus:outline-hidden text-gray-900 placeholder:text-gray-300 bg-transparent"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-xl border border-gray-200 focus-within:border-emerald-600 focus-within:ring-1 focus-within:ring-emerald-600 bg-white transition">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <LockIcon className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl focus:outline-hidden text-gray-900 placeholder:text-gray-300 bg-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-hidden"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Keep me signed in & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs text-gray-600 font-normal">
                  Keep me signed in
                </span>
              </label>

              <button
                type="button"
                onClick={() => alert('Please contact your AidFast pharmacy administrator to reset credentials.')}
                className="text-xs font-medium text-gray-500 hover:text-emerald-700 transition"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-[#127753] hover:bg-[#0e6143] active:bg-[#0a4e35] text-white font-medium text-sm rounded-xl transition duration-150 shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in</span>
              )}
            </button>

          </form>

          {/* Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="border-t border-gray-200 w-full"></div>
            <span className="bg-white px-3 text-[11px] uppercase tracking-wider text-gray-400 font-medium absolute">
              OR
            </span>
          </div>

          {/* Register Pharmacy Card */}
          <div
            onClick={() => alert('Pharmacy onboarding is handled via AidFast administrator.')}
            className="bg-[#eaf4ee] hover:bg-[#dfefe5] border border-[#d4e8dd] rounded-xl p-3 text-center transition cursor-pointer"
          >
            <p className="text-xs font-bold text-[#0c593d]">
              Register your pharmacy
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              New to AidFast? Set up your pharmacy and owner account.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default LoginPage;
