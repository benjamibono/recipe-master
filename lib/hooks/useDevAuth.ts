import { supabase } from "@/lib/supabase";

const DEV_EMAIL = "dev@example.com";
const DEV_PASSWORD = "devpassword123";

export async function setupDevAccount() {
  try {
    // Check if dev account exists
    const {
      data: { user },
      error: signInError,
    } = await supabase.auth.signInWithPassword({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
    });

    if (signInError) {
      // If account doesn't exist, create it
      const { error: signUpError } = await supabase.auth.signUp({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
      });

      if (signUpError) throw signUpError;

      console.log("Dev account created successfully");
    } else {
      console.log("Dev account accessed successfully");
    }

    // Create or update profile
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user?.id,
        username: "DevUser",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

    if (profileError) throw profileError;
  } catch (error) {
    console.error("Error setting up dev account:", error);
  }
}
