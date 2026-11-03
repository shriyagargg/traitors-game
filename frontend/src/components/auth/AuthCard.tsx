"use client";

import React, { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";
import { SocialAuth } from "./SocialAuth";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  validateEmail,
  evaluatePasswordStrength,
} from "@/services/auth";

export type AuthMode = "login" | "register" | "forgot";

interface AuthCardProps {
  initialMode?: AuthMode;
  onModeChange?: (mode: AuthMode) => void;
}

export function AuthCard({ initialMode = "login", onModeChange }: AuthCardProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  // Form Fields - Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Form Fields - Register
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Fields - Forgot Password
  const [resetEmail, setResetEmail] = useState("");

  // UI State: Loading, Errors, Success
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (onModeChange) onModeChange(newMode);
  };

  // Password Strength for Registration
  const passwordStrength = evaluatePasswordStrength(regPassword);
  const passwordsMatch = regPassword.length > 0 && regPassword === regConfirmPassword;

  // Handlers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateEmail(loginEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (!loginPassword) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({
        email: loginEmail,
        password: loginPassword,
        rememberMe,
      });

      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Unable to connect to the authentication service.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (regUsername.trim().length < 3) {
      setErrorMessage("Username must be at least 3 characters.");
      return;
    }
    if (!validateEmail(regEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }
    if (regPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await registerUser({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        confirmPassword: regConfirmPassword,
      });

      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Unable to register initiate at this time.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateEmail(resetEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(resetEmail);
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } catch {
      setErrorMessage("Unable to process password reset request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto rounded-3xl bg-[#120A14]/85 border border-gold-antique/30 backdrop-blur-xl p-7 sm:p-9 shadow-[0_10px_40px_rgba(36,16,31,0.6)] z-10 relative">
      {/* 1. Pill Tabs: Login / Register (Hidden in Forgot Password state) */}
      {mode !== "forgot" ? (
        <div className="flex items-center justify-center mb-6">
          <div className="inline-flex rounded-full p-1 bg-[#1A0E1C] border border-gold-antique/20 shadow-inner">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`px-8 py-2 rounded-full text-sm font-sans transition-all duration-300 ${
                mode === "login"
                  ? "bg-gold-light text-background font-semibold shadow-[0_0_15px_rgba(242,216,154,0.35)]"
                  : "text-text-secondary hover:text-text-main font-medium"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`px-8 py-2 rounded-full text-sm font-sans transition-all duration-300 ${
                mode === "register"
                  ? "bg-gold-light text-background font-semibold shadow-[0_0_15px_rgba(242,216,154,0.35)]"
                  : "text-text-secondary hover:text-text-main font-medium"
              }`}
            >
              Register
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center mb-4">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="text-xs font-sans text-gold-antique hover:text-gold-light underline tracking-wider"
          >
            ← Return to Council Login
          </button>
        </div>
      )}

      {/* 2. Feedback Message Banners */}
      {errorMessage && (
        <div className="mb-5 rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-2.5 text-xs font-sans text-rose-200">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="mb-5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-2.5 text-xs font-sans text-emerald-200">
          {successMessage}
        </div>
      )}

      {/* 3. Form Content Based on Mode */}
      {mode === "login" && (
        <>
          <h2 className="font-cormorant text-2xl sm:text-3xl font-normal text-text-main text-center mb-6 tracking-wide">
            Login to Your Account
          </h2>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-[#170C1B]/90 border border-gold-antique/25 focus-within:border-gold-antique/70 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all">
              <Mail className="w-5 h-5 text-gold-antique/80 shrink-0" />
              <input
                type="email"
                placeholder="Email address"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full bg-transparent text-sm font-sans text-text-main placeholder:text-text-secondary/50 focus:outline-none"
              />
            </div>

            {/* Password Field */}
            <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-[#170C1B]/90 border border-gold-antique/25 focus-within:border-gold-antique/70 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all">
              <Lock className="w-5 h-5 text-gold-antique/80 shrink-0" />
              <input
                type={showLoginPassword ? "text" : "password"}
                placeholder="Password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full bg-transparent text-sm font-sans text-text-main placeholder:text-text-secondary/50 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="text-gold-antique/70 hover:text-gold-light transition p-0.5"
                aria-label="Toggle password visibility"
              >
                {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs font-sans text-text-secondary pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    rememberMe
                      ? "bg-gold-antique border-gold-antique text-background"
                      : "border-gold-antique/40 bg-bg-secondary"
                  }`}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span>Remember me</span>
              </label>

              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="text-text-secondary hover:text-gold-light underline transition cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {/* Primary Action Button: Login → */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold-light to-gold-antique hover:from-gold-antique hover:to-gold-light text-background font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_25px_rgba(242,216,154,0.35)] hover:shadow-[0_0_30px_rgba(212,175,55,0.45)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-background" />
                  <span>Entering Council...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4 text-background" />
                </>
              )}
            </button>
          </form>

          {/* Social Authentication */}
          <SocialAuth />

          {/* Bottom Switch Link */}
          <p className="text-center font-sans text-xs text-text-secondary mt-6">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("register")}
              className="text-gold-light hover:text-gold-antique font-medium underline transition"
            >
              Register here
            </button>
          </p>
        </>
      )}

      {mode === "register" && (
        <>
          <h2 className="font-cormorant text-2xl sm:text-3xl font-normal text-text-main text-center mb-6 tracking-wide">
            Create Your Account
          </h2>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Username Field */}
            <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-[#170C1B]/90 border border-gold-antique/25 focus-within:border-gold-antique/70 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all">
              <User className="w-5 h-5 text-gold-antique/80 shrink-0" />
              <input
                type="text"
                placeholder="Username (Council Alias)"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
                className="w-full bg-transparent text-sm font-sans text-text-main placeholder:text-text-secondary/50 focus:outline-none"
              />
            </div>

            {/* Email Field */}
            <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-[#170C1B]/90 border border-gold-antique/25 focus-within:border-gold-antique/70 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all">
              <Mail className="w-5 h-5 text-gold-antique/80 shrink-0" />
              <input
                type="email"
                placeholder="Email address"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                className="w-full bg-transparent text-sm font-sans text-text-main placeholder:text-text-secondary/50 focus:outline-none"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-[#170C1B]/90 border border-gold-antique/25 focus-within:border-gold-antique/70 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all">
                <Lock className="w-5 h-5 text-gold-antique/80 shrink-0" />
                <input
                  type={showRegPassword ? "text" : "password"}
                  placeholder="Password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  className="w-full bg-transparent text-sm font-sans text-text-main placeholder:text-text-secondary/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="text-gold-antique/70 hover:text-gold-light transition p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Password Strength Feedback */}
              {regPassword.length > 0 && (
                <div className="mt-2 px-1">
                  <div className="flex items-center justify-between text-[11px] font-sans text-text-secondary mb-1">
                    <span>Strength: {passwordStrength.label}</span>
                    <span>{passwordStrength.feedback}</span>
                  </div>
                  <div className="h-1 w-full bg-charcoal-800 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-full flex-1 transition-all duration-300 ${
                          passwordStrength.score >= level
                            ? passwordStrength.color
                            : "bg-charcoal-700/50"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-[#170C1B]/90 border border-gold-antique/25 focus-within:border-gold-antique/70 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all">
                <Lock className="w-5 h-5 text-gold-antique/80 shrink-0" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-transparent text-sm font-sans text-text-main placeholder:text-text-secondary/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gold-antique/70 hover:text-gold-light transition p-0.5"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {regConfirmPassword.length > 0 && (
                <div className="text-[11px] font-sans mt-1 px-1">
                  {passwordsMatch ? (
                    <span className="text-emerald-400">✓ Passwords match</span>
                  ) : (
                    <span className="text-rose-400">✗ Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            {/* Primary Action Button: Create Account */}
            <button
              type="submit"
              disabled={loading || (regConfirmPassword.length > 0 && !passwordsMatch)}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold-light to-gold-antique hover:from-gold-antique hover:to-gold-light text-background font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_25px_rgba(242,216,154,0.35)] hover:shadow-[0_0_30px_rgba(212,175,55,0.45)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-background" />
                  <span>Enrolling Initiate...</span>
                </>
              ) : (
                <>
                  <span>CREATE ACCOUNT</span>
                  <ArrowRight className="w-4 h-4 text-background" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch Link */}
          <p className="text-center font-sans text-xs text-text-secondary mt-6">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-gold-light hover:text-gold-antique font-medium underline transition"
            >
              Login here
            </button>
          </p>
        </>
      )}

      {mode === "forgot" && (
        <>
          <h2 className="font-cormorant text-2xl sm:text-3xl font-normal text-text-main text-center mb-3 tracking-wide">
            Reset Your Password
          </h2>
          <p className="text-center text-xs font-sans text-text-secondary mb-6 leading-relaxed">
            Enter your registered email address and The Architect will dispatch password restoration instructions.
          </p>

          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-[#170C1B]/90 border border-gold-antique/25 focus-within:border-gold-antique/70 focus-within:shadow-[0_0_15px_rgba(212,175,55,0.15)] transition-all">
              <Mail className="w-5 h-5 text-gold-antique/80 shrink-0" />
              <input
                type="email"
                placeholder="Email address"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                className="w-full bg-transparent text-sm font-sans text-text-main placeholder:text-text-secondary/50 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-gold-light to-gold-antique hover:from-gold-antique hover:to-gold-light text-background font-semibold text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all duration-300 shadow-[0_0_25px_rgba(242,216,154,0.35)] hover:shadow-[0_0_30px_rgba(212,175,55,0.45)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-background" />
                  <span>Dispatching Link...</span>
                </>
              ) : (
                <>
                  <span>SEND RESET LINK</span>
                  <ArrowRight className="w-4 h-4 text-background" />
                </>
              )}
            </button>
          </form>

          <p className="text-center font-sans text-xs text-text-secondary mt-6">
            Remember your credentials?{" "}
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="text-gold-light hover:text-gold-antique font-medium underline transition"
            >
              Back to Login
            </button>
          </p>
        </>
      )}
    </div>
  );
}
