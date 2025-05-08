"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { useAuthRedirect } from "@/lib/hooks/useAuthRedirect";
import { useLanguage } from "../contexts/LanguageContext";

export default function SettingsPage() {
  const { t } = useLanguage();
  const { user, profile } = useAuthContext();
  const [loading, setLoading] = useState(false);

  // Redirigir si no está autenticado
  useAuthRedirect({
    ifNotAuthenticated: "/auth/login",
    message: {
      notAuthenticated: t(
        "auth.login_required",
        "Inicia sesión para acceder a la configuración"
      ),
    },
  });

  const [formData, setFormData] = useState({
    username: profile?.username || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Actualizar username
  const updateUsername = async () => {
    if (!formData.username.trim()) {
      toast.error(
        t("errors.required_username", "El nombre de usuario es obligatorio")
      );
      return;
    }

    // Verificar si el nombre de usuario ya existe para otro usuario
    try {
      const { data: existingProfile, error: existingProfileError } =
        await supabase
          .from("profiles")
          .select("username")
          .eq("username", formData.username)
          .not("id", "eq", user?.id) // Excluir el perfil del usuario actual
          .single();

      if (existingProfileError && existingProfileError.code !== "PGRST116") {
        // PGRST116: single row not found
        throw existingProfileError;
      }

      if (existingProfile) {
        toast.error(
          t("errors.username_taken", "Ese nombre de usuario ya está en uso")
        );
        return;
      }
    } catch (error) {
      console.error("Error verificando nombre de usuario:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "settings.update_failed",
              "Error al verificar el nombre de usuario"
            )
      );
      return; // Detener si hay un error en la verificación
    }

    setLoading(true);
    try {
      // Actualizar username en la tabla profiles
      const { error } = await supabase
        .from("profiles")
        .update({
          username: formData.username,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast.success(
        t("settings.username_updated", "Nombre de usuario actualizado")
      );
    } catch (error) {
      console.error("Error actualizando username:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "settings.update_failed",
              "Error al actualizar el nombre de usuario"
            )
      );
    } finally {
      setLoading(false);
    }
  };

  // Actualizar email
  const updateEmail = async () => {
    if (!formData.email.trim()) {
      toast.error(t("errors.required_email", "El email es obligatorio"));
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser(
        { email: formData.email },
        {
          emailRedirectTo: `${
            window.location.origin
          }/auth/login?message=${encodeURIComponent(
            t(
              "auth.email_changed_login_required",
              "Email actualizado. Por favor, inicia sesión con tu nuevo correo electrónico."
            )
          )}`,
        }
      );

      if (error) throw error;

      toast.success(
        t(
          "settings.email_verification_sent_logout",
          "Se ha enviado un correo de verificación a tu nueva dirección de email. Después de confirmar, tu sesión se cerrará y tendrás que iniciar sesión nuevamente con tu nuevo correo."
        )
      );
    } catch (error) {
      console.error("Error actualizando email:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings.update_failed", "Error al actualizar el email")
      );
    } finally {
      setLoading(false);
    }
  };

  // Actualizar contraseña
  const updatePassword = async () => {
    if (!formData.currentPassword) {
      toast.error(
        t(
          "errors.required_current_password",
          "La contraseña actual es obligatoria"
        )
      );
      return;
    }
    if (!formData.newPassword) {
      toast.error(
        t("errors.required_new_password", "La nueva contraseña es obligatoria")
      );
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error(
        t("errors.password_mismatch", "Las contraseñas no coinciden")
      );
      return;
    }
    if (formData.newPassword.length < 6) {
      toast.error(
        t(
          "errors.password_too_short",
          "La contraseña debe tener al menos 6 caracteres"
        )
      );
      return;
    }

    setLoading(true);
    try {
      // Primero verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: formData.currentPassword,
      });

      if (signInError) {
        throw new Error(
          t("errors.incorrect_password", "La contraseña actual es incorrecta")
        );
      }

      // Actualizar a la nueva contraseña
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      // Limpiar campos de contraseña
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success(
        t("settings.password_updated", "Contraseña actualizada correctamente")
      );
    } catch (error) {
      console.error("Error actualizando contraseña:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings.update_failed", "Error al actualizar la contraseña")
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) {
    return <div className="container py-8">Cargando...</div>;
  }

  return (
    <div className="container max-w-md py-8">
      <h1 className="text-2xl font-bold mb-6">
        {t("settings.title", "Configuración de Cuenta")}
      </h1>

      {/* Sección de Perfil */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">
          {t("settings.profile", "Perfil")}
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">
              {t("settings.username", "Nombre de usuario")}
            </Label>
            <div className="flex gap-2">
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="flex-1"
              />
              <Button
                onClick={updateUsername}
                disabled={loading || formData.username === profile.username}
              >
                {t("common.update", "Actualizar")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Email */}
      <div className="mb-8 p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">
          {t("settings.email", "Email")}
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              {t("settings.email_address", "Dirección de correo")}
            </Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="flex-1"
              />
              <Button
                onClick={updateEmail}
                disabled={loading || formData.email === user.email}
              >
                {t("common.update", "Actualizar")}
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              {t(
                "settings.email_verification_note",
                "Recibirás un correo de verificación"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Sección de Contraseña */}
      <div className="p-4 border rounded-lg">
        <h2 className="text-xl font-semibold mb-4">
          {t("settings.password", "Contraseña")}
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">
              {t("settings.current_password", "Contraseña actual")}
            </Label>
            <Input
              id="currentPassword"
              type="password"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">
              {t("settings.new_password", "Nueva contraseña")}
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              {t("settings.confirm_password", "Confirmar nueva contraseña")}
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
            />
          </div>

          <Button
            onClick={updatePassword}
            disabled={
              loading ||
              !formData.currentPassword ||
              !formData.newPassword ||
              !formData.confirmPassword
            }
            className="w-full"
          >
            {t("settings.update_password", "Actualizar contraseña")}
          </Button>
        </div>
      </div>
    </div>
  );
}
