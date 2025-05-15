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
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";
import { Navbar } from "@/components/Navbar";
import { ChefHat } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [formData, setFormData] = useState({
    identifier: "", // This will hold either username or email
    password: "",
  });

  // Usar el hook optimizado que aprovecha la caché
  useAuthRedirect({
    ifAuthenticated: "/",
    message: {
      authenticated: t("auth.already_logged_in", "Ya has iniciado sesión"),
    },
  });

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!resetEmail.trim()) {
        throw new Error(t("errors.required_email", "Email is required"));
      }

      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;

      setResetEmailSent(true);
      toast.success(
        t(
          "auth.reset_email_sent",
          "Password reset instructions sent to your email"
        )
      );
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("auth.reset_email_failed", "Failed to send reset email")
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
        throw new Error(
          t("errors.required_username_email", "Username or email is required")
        );
      }
      if (!formData.password) {
        throw new Error(t("errors.required_password", "Password is required"));
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
          throw new Error(
            t("auth.invalid_credentials", "Invalid username or password")
          );
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
            t(
              "auth.email_not_confirmed",
              "Please confirm your email address before logging in. Check your inbox for the confirmation link."
            )
          );
        }
        throw new Error(
          t("auth.invalid_credentials", "Invalid username/email or password")
        );
      }

      // Additional check for email confirmation
      if (!signInData.user?.email_confirmed_at) {
        throw new Error(
          t(
            "auth.email_not_confirmed",
            "Please confirm your email address before logging in. Check your inbox for the confirmation link."
          )
        );
      }

      toast.success(t("auth.login_success", "Logged in successfully"));
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("auth.login_failed", "Failed to log in")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Hero/Welcome Section - Visible on LG screens and above */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5 items-center justify-center p-12">
          <div className="text-center">
            <ChefHat className="h-24 w-24 text-primary mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {t("auth.welcome_to_app", "Welcome to Recipe Master!")}
            </h1>
            <p className="text-gray-600 text-lg">
              {t(
                "auth.login_greeting",
                "Access your saved recipes, shopping lists, and more."
              )}
            </p>
          </div>
        </div>

        {/* Form Section */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-12 bg-white">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              {/* Mobile-only Welcome Icon - Hidden on LG and above */}
              <ChefHat className="h-16 w-16 text-primary mx-auto mb-4 lg:hidden" />
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                {t("auth.login_now", "Log In")}
              </h1>
              <p className="text-gray-500">
                {t("auth.dont_have_account", "Don't have an account?")}{" "}
                <Link
                  href="/auth/register"
                  className="font-medium text-primary hover:underline"
                >
                  {t("auth.register_here", "Register here")}
                </Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="identifier">
                  {t("auth.username_or_email")}
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  value={formData.identifier}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      identifier: e.target.value,
                    }))
                  }
                  placeholder={t("auth.enter_username_or_email")}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="link"
                        className="text-sm text-primary p-0 h-auto font-normal"
                      >
                        {t("auth.forgot_password")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t("auth.reset_password")}</DialogTitle>
                      </DialogHeader>
                      {resetEmailSent ? (
                        <div className="text-center py-4">
                          <p className="mb-4">
                            {t("auth.reset_email_sent_message")}
                          </p>
                          <p className="text-sm text-gray-500">
                            {t("auth.check_inbox")}
                          </p>
                        </div>
                      ) : (
                        <form
                          onSubmit={handlePasswordReset}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label htmlFor="resetEmail">
                              {t("auth.email")}
                            </Label>
                            <Input
                              id="resetEmail"
                              type="email"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              placeholder={t("auth.enter_email")}
                              required
                            />
                          </div>
                          <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                          >
                            {loading
                              ? t("auth.sending")
                              : t("auth.send_reset_instructions")}
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
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder={t("auth.enter_password")}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t("auth.logging_in") : t("auth.login")}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
