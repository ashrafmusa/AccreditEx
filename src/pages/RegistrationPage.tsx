/**
 * RegistrationPage — Self-service free trial sign-up
 *
 * Creates a Firebase Auth account + Organization + User doc in one flow.
 * After successful submission the onAuthStateChanged listener takes over
 * and transitions the user directly into the app → onboarding wizard.
 */

import {
    selfRegister,
    type SelfRegistrationData,
} from "@/services/registrationService";
import { useTenantStore } from "@/stores/useTenantStore";
import { useUserStore } from "@/stores/useUserStore";
import type { Organization, User } from "@/types";
import { UserRole } from "@/types";
import { motion } from "framer-motion";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const ORG_TYPES: { value: Organization["type"]; label: string }[] = [
  { value: "hospital", label: "Hospital / Medical Center" },
  { value: "clinic", label: "Clinic / Polyclinic" },
  { value: "laboratory", label: "Laboratory / Diagnostic Center" },
  { value: "group", label: "Hospital Group / Health Network" },
  { value: "other", label: "Other Healthcare Organization" },
];

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const setCurrentUser = useUserStore((state) => state.setCurrentUser);

  const [form, setForm] = useState<SelfRegistrationData>({
    fullName: "",
    email: "",
    password: "",
    organizationName: "",
    organizationType: "hospital",
    country: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: keyof SelfRegistrationData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): string | null => {
    if (!form.fullName.trim()) return "Full name is required.";
    if (!form.email.trim() || !form.email.includes("@"))
      return "A valid work email is required.";
    if (form.password.length < 8)
      return "Password must be at least 8 characters.";
    if (form.password !== confirmPassword) return "Passwords do not match.";
    if (!form.organizationName.trim()) return "Organization name is required.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await selfRegister(form);
      // Manually hydrate the Zustand store immediately after docs are written.
      // onAuthStateChanged fires before the setDoc calls complete (race condition),
      // so we cannot rely on it for the initial navigation after registration.
      const now = new Date().toISOString();
      const userProfile: User = {
        id: result.userId,
        name: form.fullName,
        email: form.email.toLowerCase().trim(),
        role: UserRole.Admin,
        organizationId: result.orgId,
        isActive: true,
        createdAt: now,
      };
      setCurrentUser(userProfile);
      useTenantStore.getState().loadOrganizationForUser(result.orgId);
      // Navigation is handled by App.tsx once currentUser is set.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("email-already-in-use")) {
        setError(
          "An account with this email already exists. Please log in instead.",
        );
      } else if (msg.includes("weak-password")) {
        setError("Password is too weak. Please choose a stronger password.");
      } else if (msg.includes("permission-denied")) {
        setError(
          "Unable to create your organization. Please try again or contact support.",
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      {/* Background grid */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radial glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 600px 600px at 30% 50%, rgba(0,137,123,0.1) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-lg"
      >
        {/* Logo + headline */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/15 border border-brand-primary/30 text-brand-primary text-sm font-semibold mb-6">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-primary" />
            </span>
            14-Day Free Trial — No Card Required
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Start Your Free Trial
          </h1>
          <p className="text-white/60 mt-2 text-sm">
            Full Professional access for 14 days. No credit card needed.
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full name */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                placeholder="Dr. Sarah Al-Rashidi"
                className="w-full px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/60 focus:border-brand-primary/40 transition"
                required
              />
            </div>

            {/* Work email */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Work Email
              </label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="sarah@hospital.com"
                className="w-full px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/60 focus:border-brand-primary/40 transition"
                required
              />
            </div>

            {/* Password */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/60 focus:border-brand-primary/40 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/60 focus:border-brand-primary/40 transition"
                  required
                />
              </div>
            </div>

            {/* Organization name */}
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">
                Organization Name
              </label>
              <input
                type="text"
                autoComplete="organization"
                value={form.organizationName}
                onChange={(e) => update("organizationName", e.target.value)}
                placeholder="King Fahad Medical City"
                className="w-full px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/60 focus:border-brand-primary/40 transition"
                required
              />
            </div>

            {/* Organization type + Country */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">
                  Organization Type
                </label>
                <select
                  value={form.organizationType}
                  onChange={(e) =>
                    update(
                      "organizationType",
                      e.target.value as Organization["type"],
                    )
                  }
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-white/15 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/60 focus:border-brand-primary/40 transition"
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5">
                  Country (optional)
                </label>
                <input
                  type="text"
                  autoComplete="country-name"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  placeholder="Saudi Arabia"
                  className="w-full px-4 py-2.5 rounded-xl bg-white/8 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/60 focus:border-brand-primary/40 transition"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl bg-linear-to-r from-brand-primary to-brand-primary/80 text-white font-semibold text-sm shadow-xl shadow-teal-600/25 hover:shadow-teal-600/40 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Creating your account…
                </>
              ) : (
                "Start My Free Trial →"
              )}
            </button>
          </form>

          {/* What's included */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-xs font-medium text-white/40 mb-3 text-center">
              INCLUDED IN YOUR 14-DAY TRIAL
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                "Unlimited projects",
                "Document control",
                "Risk & CAPA management",
                "AI assistant (21+ tools)",
                "Audit hub",
                "Analytics & reports",
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-1.5 text-xs text-white/60"
                >
                  <span className="text-brand-primary">✓</span> {feature}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-white/50">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-brand-primary hover:text-brand-primary/80 font-medium transition"
            >
              Sign in
            </button>
          </p>
          <p className="text-xs text-white/30">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default RegistrationPage;
