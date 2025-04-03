import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface UploadOptions {
  folder?: string;
  contentType?: string;
  cacheControl?: string;
  upsert?: boolean;
}

/**
 * Uploads a file to Supabase storage
 */
export async function uploadFile(
  file: File | Blob,
  options: UploadOptions = {}
): Promise<string | null> {
  const {
    folder = "recipe-images",
    contentType,
    cacheControl = "3600",
    upsert = false,
  } = options;

  try {
    // Generate a unique file name
    const fileName = generateUniqueFileName(
      file instanceof File ? file.name : "blob.png"
    );
    const filePath = `${folder}/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("recipes")
      .upload(filePath, file, {
        contentType:
          contentType || (file instanceof File ? file.type : undefined),
        cacheControl,
        upsert,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw uploadError;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("recipes").getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("File upload error:", error);
    toast.error(
      error instanceof Error ? error.message : "Failed to upload file"
    );
    return null;
  }
}

/**
 * Generates a unique filename with timestamp and random string
 */
export function generateUniqueFileName(originalName: string): string {
  const fileExt = originalName.split(".").pop() || "png";
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);

  return `${timestamp}-${randomString}.${fileExt}`;
}

/**
 * Deletes a file from Supabase storage
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage.from("recipes").remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
}
