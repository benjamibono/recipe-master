import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export type Recipe = {
  id: string;
  user_id: string;
  name: string;
  time: number;
  servings: number;
  ingredients: {
    name: string;
    amount: number;
    unit: string;
  }[];
  instructions: string[];
  type: "cooking" | "cleaning" | "shopping";
  image_url?: string;
  created_at: string;
  updated_at: string;
  creator_name?: string;
  macros_data?: string;
  original_language?: "en" | "es";
};

export type Profile = {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
};
