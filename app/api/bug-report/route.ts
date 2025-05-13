import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const description = formData.get("description") as string;
    const userEmail = formData.get("userEmail") as string;
    const userId = formData.get("userId") as string;
    const username = formData.get("username") as string;

    // Log para verificar los datos recibidos
    console.log("Datos recibidos:", {
      description,
      userEmail,
      userId,
      username,
    });

    if (!description) {
      return NextResponse.json(
        { error: "La descripción es obligatoria" },
        { status: 400 }
      );
    }

    // Configurar transporte de correo
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Procesar imágenes adjuntas
    const attachments = [];

    // Buscar todas las imágenes adjuntas (pueden ser múltiples)
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("screenshot") && value instanceof Blob) {
        const buffer = Buffer.from(await value.arrayBuffer());
        const filename = `screenshot-${key.replace("screenshot", "")}.jpg`;

        attachments.push({
          filename,
          content: buffer,
        });
      }
    }

    // Contenido del correo
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: "Reporte de Bug - Recipe Master",
      text: `
        Reporte de Bug
        --------------
        Usuario: ${username || "No disponible"} (ID: ${
        userId || "No disponible"
      })
        Email: ${userEmail || "No disponible"}
        Descripción: ${description}
      `,
      html: `
        <h2>Reporte de Bug - Recipe Master</h2>
        <h3>Detalles:</h3>
        <ul>
          <li><strong>Usuario:</strong> ${username || "No disponible"} (ID: ${
        userId || "No disponible"
      })</li>
          <li><strong>Email:</strong> ${userEmail || "No disponible"}</li>
        </ul>
        <h3>Descripción:</h3>
        <p>${description.replace(/\n/g, "<br/>")}</p>
      `,
      attachments,
    };

    // Enviar correo
    await transporter.sendMail(mailOptions);

    // Guardar el reporte en la base de datos
    if (userId) {
      try {
        console.log(
          "Intentando guardar en la base de datos con userId:",
          userId
        );

        // Obtener el token de los headers
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          console.error("Token no proporcionado o inválido");
          // Continuamos con el envío del correo
          return NextResponse.json({ success: true });
        }
        const token = authHeader.split(" ")[1];

        if (!token) {
          console.error("Token vacío");
          return NextResponse.json({ success: true });
        }

        try {
          // Crear cliente de Supabase con el token
          const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              global: {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            }
          );

          // Usar el cliente autenticado para la inserción
          const { data, error } = await supabase
            .from("bug_reports")
            .insert({
              user_id: userId,
              description,
              created_at: new Date().toISOString(),
            })
            .select();

          if (error) {
            console.error("Error al guardar en la base de datos:", error);
            // No lanzamos el error para permitir el éxito del envío del correo
          } else {
            console.log(
              "Reporte guardado exitosamente en la base de datos:",
              data
            );
          }
        } catch (supabaseError) {
          console.error("Error al crear cliente de Supabase:", supabaseError);
          // No lanzamos el error para permitir el éxito del envío del correo
        }
      } catch (dbError) {
        console.error("Error al guardar en la base de datos:", dbError);
        // No lanzamos el error para no interrumpir el envío del correo
      }
    } else {
      console.warn(
        "No se pudo guardar el reporte en la base de datos: userId no proporcionado"
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error al enviar reporte de bug:", error);
    return NextResponse.json(
      { error: "Error al enviar el reporte de bug" },
      { status: 500 }
    );
  }
}
