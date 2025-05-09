import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Obtener el usuario ID del body de la solicitud
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "ID de usuario requerido" },
        { status: 400 }
      );
    }

    // Crear un cliente admin con SUPABASE_SERVICE_ROLE_KEY
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verificar si el usuario existe antes de eliminar
    const { data: userData, error: getUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (getUserError || !userData.user) {
      return NextResponse.json(
        {
          error: "Usuario no encontrado",
          details: getUserError?.message,
        },
        { status: 404 }
      );
    }

    // Eliminar el usuario utilizando el método admin
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al eliminar cuenta:", error);
    return NextResponse.json(
      {
        error: "Error al eliminar la cuenta",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
