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
  const { data, error } = await supabaseAdmin
    .from("artists")
    .update({ role: "admin", status: "Verified", verified: true })
    .eq("email", email)
    .select();

  if (error) {
    console.error("Failed to update role:", error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error(
      `No artists row found with email "${email}". That user must sign up / be created first (e.g. via the public "Add Artist" registration flow) so a matching row exists.`,
    );
    process.exit(1);
  }

  console.log(`✅ ${email} is now an admin.`);
};

run();
