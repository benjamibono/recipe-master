"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [formData, setFormData] = useState({
    identifier: "", // This will hold either username or email
    password: "",
  });

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!resetEmail.trim()) {
        throw new Error("Email is required");
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast.success("Password reset instructions sent to your email");
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to send reset email"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.identifier.trim()) {
        throw new Error("Username or email is required");
      }
      if (!formData.password) {
        throw new Error("Password is required");
      }

      let loginEmail = formData.identifier;

      // If the identifier doesn't look like an email, try to find the user by username
      if (!formData.identifier.includes("@")) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email")
          .eq("username", formData.identifier)
          .single();

        if (profileError) {
          throw new Error("Invalid username or password");
        }

        loginEmail = profile.email;
      }

      // Sign in with email
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: formData.password,
        });

      if (signInError) {
        // Check if the error is due to email not being confirmed
        if (signInError.message.toLowerCase().includes("email not confirmed")) {
          throw new Error(
            "Please confirm your email address before logging in. Check your inbox for the confirmation link."
          );
        }
        throw new Error("Invalid username/email or password");
      }

      // Additional check for email confirmation
      if (!signInData.user?.email_confirmed_at) {
        throw new Error(
          "Please confirm your email address before logging in. Check your inbox for the confirmation link."
        );
      }

      toast.success("Logged in successfully");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-md py-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome Back</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="identifier">Username or Email</Label>
          <Input
            id="identifier"
            type="text"
            value={formData.identifier}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, identifier: e.target.value }))
            }
            placeholder="Enter your username or email"
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="link"
                  className="text-sm text-primary p-0 h-auto font-normal"
                >
                  Forgot password?
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Password</DialogTitle>
                </DialogHeader>
                {resetEmailSent ? (
                  <div className="text-center py-4">
                    <p className="mb-4">
                      Password reset instructions have been sent to your email.
                    </p>
                    <p className="text-sm text-gray-500">
                      Please check your inbox and follow the instructions to
                      reset your password.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handlePasswordReset} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail">Email</Label>
                      <Input
                        id="resetEmail"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Sending..." : "Send Reset Instructions"}
                    </Button>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Enter your password"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>

      <div className="mt-8 text-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">
              New to Recipe Master?
            </span>
          </div>
        </div>

        <Link href="/auth/register">
          <Button variant="outline" className="w-full">
            Create an Account
          </Button>
        </Link>
      </div>
    </div>
  );
}
