import { supabase } from "./lib/supabaseClient";

async function testSupabase() {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Supabase connection error:", error);
    return;
  }

  console.log("Supabase connected!");
  console.log(data);
}

testSupabase();