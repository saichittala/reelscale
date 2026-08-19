"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export default function DashboardLoginPage() {
  const router = useRouter();
  const { isLoggedIn, login, role } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to dashboard main
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard/");
    }
  }, [isLoggedIn, router]);

  const handleSignIn = async () => {
    if (isSubmitting) return;
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await login(email.trim(), password);
      if (success) {
        // Redirection handled by useEffect, or force push
        router.push("/dashboard/");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSignIn();
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">
          <a href="/" className="logo">
            <div>
              <img
                src="/assets/logo.svg"
                alt="ReelScale Logo"
                className="login-icon-frame"
              />
            </div>
          </a>
        </div>
        <div className="login-title">Welcome back</div>
        <div className="login-sub">Sign in to manage your clients & revenue</div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="Enter your email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            className="form-input"
            type="password"
            placeholder="Enter your password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
          />
        </div>

        <button
          className="btn btn-primary login-submit-btn"
          onClick={handleSignIn}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className="btn-loader"></span> Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </div>
    </div>
  );
}