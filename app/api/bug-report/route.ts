import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const description = formData.get("description") as string;
    const userEmail = formData.get("userEmail") as string;
    const userId = formData.get("userId") as string;
    const username = formData.get("username") as string;

    if (!description) {
      return NextResponse.json(
        { error: "La descripción es obligatoria" },
        { status: 400 }
      );
    }

    // Configurar transporte de correo
    // IMPORTANTE: Reemplazar con tus propias credenciales SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587, //465 
      secure: process.env.SMTP_SECURE === "false",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Procesar imágenes adjuntas
    const screenshots: Express.Multer.File[] = [];
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
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER, // Email destino
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

    // Guardar el reporte en la base de datos (opcional)
    if (userId) {
      await supabase.from("bug_reports").insert({
        user_id: userId,
        description,
        created_at: new Date().toISOString(),
      });
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
