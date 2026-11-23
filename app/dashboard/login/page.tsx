"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { Button, Input } from "@/components/ui";

export default function DashboardLoginPage() {
  const router = useRouter();
  const { isLoggedIn, login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to dashboard main
  useEffect(() => {
    if (isLoggedIn) {
      router.push("/dashboard");
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
        router.push("/dashboard");
      } else {
        setError("Invalid credentials. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
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

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSignIn();
          }}
          className="login-form-wrap"
        >
          <div className="form-group mb-16">
            <Input
              label="Email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group mb-24">
            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="login-submit-btn w-full"
            disabled={isSubmitting}
            loading={isSubmitting}
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}