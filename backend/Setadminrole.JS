require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const email = process.argv[2];

if (!email) {
  console.error("Usage: node setAdminRole.js <email>");
  process.exit(1);
}

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const run = async () => {
  // ── Step 1: mark the artist record as verified (artist-specific fields,
  // not related to role — stays in "artists" table) ──
  const { data: artistData, error: artistError } = await supabaseAdmin
    .from("artists")
    .update({ status: "Verified", verified: true })
    .eq("email", email)
    .select();

  if (artistError) {
    console.error("Failed to update artist status:", artistError.message);
    process.exit(1);
  }

  if (!artistData || artistData.length === 0) {
    console.error(
      `No artists row found with email "${email}". That user must sign up / be created first (e.g. via the public "Add Artist" registration flow) so a matching row exists.`,
    );
    process.exit(1);
  }

  // ── Step 2: set role in "users" table (single source of truth for role) ──
  // ✅ FIX: role ab "artists" table ke bajaye "users" table me set hota hai
  const { data: userData, error: userError } = await supabaseAdmin
    .from("users")
    .update({ role: "admin" })
    .eq("email", email)
    .select();

  if (userError) {
    console.error("Failed to update role:", userError.message);
    process.exit(1);
  }

  if (!userData || userData.length === 0) {
    console.error(
      `No users row found with email "${email}". Make sure this user has logged in at least once so a matching row exists in the "users" table.`,
    );
    process.exit(1);
  }

  console.log(`✅ ${email} is now an admin.`);
};

run();
