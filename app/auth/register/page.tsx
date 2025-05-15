"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useLanguage } from "../../contexts/LanguageContext";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";
import { Navbar } from "@/components/Navbar";
import { ChefHat /* ShieldCheck */ } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Usar el hook optimizado que aprovecha la caché
  useAuthRedirect({
    ifAuthenticated: "/",
    message: {
      authenticated: t("auth.already_logged_in", "Ya has iniciado sesión"),
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.username.trim()) {
        throw new Error("Username is required");
      }
      if (!formData.email.trim()) {
        throw new Error("Email is required");
      }
      if (!formData.password) {
        throw new Error("Password is required");
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      // Sign up the user with username in metadata
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        toast.success(
          "Registration successful! Please check your email to verify your account."
        );
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to register"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Hero/Value Proposition Section - Visible on LG screens and above */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5 items-center justify-center p-12">
          <div className="text-center">
            <ChefHat className="h-24 w-24 text-primary mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              {t("auth.join_app", "Join Recipe Master Today!")}
            </h1>
            <p className="text-gray-600 text-lg mb-2">
              {t(
                "auth.register_benefit1",
                "Organize your favorite recipes, create shopping lists, and plan your meals with ease."
              )}
            </p>
            <p className="text-gray-600 text-lg">
              {t(
                "auth.register_benefit2",
                "Unlock a world of culinary inspiration!"
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
                {t("auth.create_your_account", "Create Your Account")}
              </h1>
              <div className="flex items-center justify-center gap-1">
                <p className="text-gray-500">
                  {t("auth.already_have_account", "Already have an account?")}
                </p>
                <Link
                  href="/auth/login"
                  className="font-medium text-primary hover:underline"
                >
                  {t("auth.login_here", "Login here")}
                </Link>
              </div>
            </div>

            {/* Placeholder for Social Logins (optional enhancement) */}
            {/* <div className="space-y-3">
              <Button variant="outline" className="w-full">
                Sign up with Google
              </Button>
              <Button variant="outline" className="w-full">
                Sign up with Facebook
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">
                  Or continue with email
                </span>
              </div>
            </div> */}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t("auth.username")}</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder={t("auth.enter_username")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder={t("auth.enter_email")}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.password")}</Label>
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t("auth.confirm_password")}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  placeholder={t("auth.confirm_password")}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? t("auth.creating_account")
                  : t(
                      "auth.create_account_cta",
                      "Create Account & Get Started"
                    )}
              </Button>
            </form>

            {/* <div className="text-xs text-center text-gray-500">
              <ShieldCheck className="h-4 w-4 inline mr-1 text-green-600" />
              {t(
                "auth.tos_agreement_start",
                "By creating an account, you agree to our"
              )}{" "}
              <Link href="/terms" className="underline hover:text-primary">
                {t("auth.terms_of_service", "Terms of Service")}
              </Link>{" "}
              {t("auth.and", "and")}{" "}
              <Link href="/privacy" className="underline hover:text-primary">
                {t("auth.privacy_policy", "Privacy Policy")}
              </Link>
              .
            </div> */}
          </div>
        </div>
      </div>
    </>
  );
}
