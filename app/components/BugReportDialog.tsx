"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ImageUpload";
import { Bug } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { useAuthContext } from "@/app/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export function BugReportDialog() {
  const { t } = useLanguage();
  const { user, profile } = useAuthContext();

  // Log para verificar el estado del usuario
  console.log("Estado del usuario:", {
    userId: user?.id,
    email: user?.email,
    isAuthenticated: !!user,
    profile: profile,
  });

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState("");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const maxScreenshots = 3;

  const handleImageSelect = (file: File) => {
    if (screenshots.length >= maxScreenshots) {
      toast.error(t("bug_report.max_screenshots", { maxScreenshots }));
      return;
    }
    setScreenshots((prev) => [...prev, file]);
  };

  const handleRemoveImage = (index: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error(t("bug_report.description_required"));
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("description", description);
      formData.append("userEmail", user?.email || "");
      formData.append("userId", user?.id || "");
      formData.append("username", profile?.username || "");

      // Añadir las capturas de pantalla si existen
      screenshots.forEach((file, index) => {
        formData.append(`screenshot${index}`, file);
      });

      // Obtener el token de la sesión actual
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const response = await fetch("/api/bug-report", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || t("bug_report.error"));
      }

      toast.success(t("bug_report.success"));

      // Resetear el formulario
      setDescription("");
      setScreenshots([]);
      setOpen(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error(
        error instanceof Error ? error.message : t("bug_report.error")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Bug className="h-4 w-4" />
          {t("bug_report.report_bug")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("bug_report.title")}</DialogTitle>
          <DialogDescription>{t("bug_report.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Textarea
            placeholder={t("bug_report.placeholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full"
          />

          {/* Sección de capturas de pantalla */}
          <div className="space-y-2">
            <p className="text-sm font-medium">{t("bug_report.screenshots")}</p>
            <p className="text-xs text-gray-500">
              {t("bug_report.screenshots_help")}
            </p>

            {/* Mostrar imágenes seleccionadas */}
            {screenshots.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {screenshots.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Screenshot ${index + 1}`}
                      className="h-16 w-16 object-cover rounded-md"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                      onClick={() => handleRemoveImage(index)}
                    >
                      <span className="sr-only">Remove image</span>×
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Botón para añadir imagen */}
            {screenshots.length < maxScreenshots && (
              <ImageUpload onImageSelect={handleImageSelect} />
            )}
          </div>
        </div>
        <DialogFooter className="flex space-x-2 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? t("bug_report.sending") : t("bug_report.send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
