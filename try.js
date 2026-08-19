const { createClient } = require("@supabase/supabase-js");

// 1. Replace with your Supabase credentials (from Settings -> API)
const SUPABASE_URL = "https://ntafrrlwwmpvgqtwfrez.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_tCwHfW73Ajw1BbQSKVDJOA_xAYODK8-";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Replace with a real test email you can open right now
const TEST_EMAIL = "sauvikroy3@gmail.com";
const TEST_PASSWORD = "Password@1234";

// Step A: Trigger Signup and Send OTP Email
async function sendSignupOtp() {
  console.log(`\n1. Attempting to sign up: ${TEST_EMAIL}...`);

  const { data, error } = await supabase.auth.signUp({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (error) {
    console.error("❌ Sign up error:", error.message);
    return;
  }

  console.log("✅ Signup request sent successfully!");
  console.log("📩 Check your inbox/spam folder for the 6-digit OTP.\n");
}

// Step B: Verify the OTP received in the email
async function verifyOtp(otpToken) {
  console.log(`\n2. Verifying OTP: ${otpToken} for ${TEST_EMAIL}...`);

  const { data, error } = await supabase.auth.verifyOtp({
    email: TEST_EMAIL,
    token: otpToken,
    type: "signup",
  });

  if (error) {
    console.error("❌ Verification failed:", error.message);
    return;
  }

  console.log("🎉 Success! Email verified.");
  console.log("Active Session Token:", data.session?.access_token ? "Exists" : "None");
}

// --- RUN SCRIPT ---
// To Send Email: Keep sendSignupOtp() uncommented.
sendSignupOtp();

// Once you get the 6-digit code in your email:
// 1. Comment out sendSignupOtp()
// 2. Uncomment the line below and replace '123456' with your real OTP
// verifyOtp("123456");