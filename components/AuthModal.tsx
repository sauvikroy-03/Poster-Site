"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Eye, EyeOff, CheckCircle2, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { json } from "stream/consumers";
import { s } from "framer-motion/client";


type Step = "EMAIL" | "OTP" | "PASSWORD" | "SUCCESS";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (userEmail: string) => void;
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 18 : -18, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -18 : 18, opacity: 0 }),
};

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3C13.8 15.6 18.5 12.4 24 12.4c3.1 0 5.9 1.2 8 3.1l5.1-5.1C34.5 7.1 29.5 5 24 5c-7.4 0-13.8 4.1-17.1 10.1l-.6-.4z" />
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 14-5.4l-5.6-4.7c-2.1 1.5-4.9 2.4-8.4 2.4-5.3 0-9.7-3.3-11.3-7.9l-5.9 4.5C10.1 39.7 16.5 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.2-2.2 4-4 5.4l5.6 4.7C40.5 34.9 44 30 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function OtpInput({
  value,
  onChange,
  hasError,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  hasError: boolean;
}) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);

  const handleChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);
    if (digit && index < 5) refs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !value[index] && index > 0) refs.current[index - 1]?.focus();
    if (e.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) refs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const next = ["", "", "", "", "", ""];
    pasted.split("").forEach((d, i) => (next[i] = d));
    onChange(next);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2">
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
          className={cn(
            "h-12 w-12 rounded-lg border text-center text-lg font-mono font-medium text-[#121212] bg-[#FAF9F6] outline-none transition-all",
            "focus:bg-white focus:ring-1 focus:ring-[#121212] focus:border-[#121212]",
            hasError
              ? "border-[#B3261E] bg-[#FFF8F7] focus:ring-[#B3261E]/30 focus:border-[#B3261E]"
              : "border-[#E8E6DF]"
          )}
        />
      ))}
    </div>
  );
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = React.useState<Step>("EMAIL");
  const [direction, setDirection] = React.useState(1);
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState<string[]>(["", "", "", "", "", ""]);
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [timer, setTimer] = React.useState(60);

  const otpCode = otp.join("");

  React.useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("EMAIL");
        setEmail("");
        setOtp(["", "", "", "", "", ""]);
        setPassword("");
        setConfirmPassword("");
        setError("");
        setTimer(60);
      }, 200);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (step !== "OTP" || timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  const goTo = (next: Step, dir: number) => {
    setError("");
    setDirection(dir);
    setStep(next);
  };

  ////////////////////////



// 1. Email Step: Validate & proceed to Password step
const handleEmailSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim() || !emailRegex.test(email)) {
    return setError("Please enter a valid email address.");
  }
  setError("");
  setLoading(true);
  try{
    const response=await fetch("/api/auth/checkExistingUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
  })
  const data=await response.json()
  if(data.success){
goTo("PASSWORD", 1);
}
else{
setError(data.message || "User already exists. Please login.");

}

}
  catch(err){
setError("Network error. Please check your connection.");
  }
  finally{
    setLoading(false);
  }
};

// 2. Password Step: Validate passwords, trigger sendOTP, and move to OTP step
const handlePasswordSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (password !== confirmPassword) {
    return setError("Passwords don't match.");
  }
  else if (password.length < 8) {
    return setError("Password must be at least 8 characters long.");
  }
  else if (!/[A-Z]/.test(password)) {
    return setError("Password must contain at least one uppercase letter.");
  }
  else if (!/[a-z]/.test(password)) {
    return setError("Password must contain at least one lowercase letter.");
  }
  else if (!/[0-9]/.test(password)) {
    return setError("Password must contain at least one number.");
  }
  else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return setError("Password must contain at least one special character (!@#$%^&* etc.).");
  }
  setError("");
  setLoading(true);
  try {
    // 2. Password is valid -> Trigger OTP dispatch
    const otpRes = await fetch("/api/auth/sendOTP", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(),password:password.trim()}),
    });

    const otpData = await otpRes.json();

    if (!otpRes.ok || !otpData.success) {
      setError(otpData.message || "Failed to send verification code.");
      return;
    }

    // Both succeeded -> Navigate to OTP entry
    goTo("OTP", 1);
  } catch (err) {
    setError("Network error. Please check your connection.");
  } finally {
    setLoading(false);
  }
};

// 3. OTP Step: Verify code and then attach password
const handleVerifyOtp = async (code: string) => {
  if (code.length < 6) return setError("Please enter the complete 6-digit code.");

  setError("");
  setLoading(true);
  try {
    // 1. Verify OTP & establish session cookie
    const verifyRes = await fetch("/api/auth/createUser", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        password: password.trim(),
      }),
    });

    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData.success) {
      setError(verifyData.message || "Invalid or expired verification code.");
      return;
    }

    // 2. Set the password on the newly authenticated session
    // Both succeeded
    onSuccess?.(email);
    goTo("SUCCESS", 1);
    setTimeout(() => {
      onClose();
    }, 1200);
  } catch (err) {
    setError("Something went wrong during verification. Please try again.");
  } finally {
    setLoading(false);
  }
};

// Auto-trigger when 6 digits are typed
React.useEffect(() => {
  if (otpCode.length === 6 && step === "OTP" && !loading) {
    handleVerifyOtp(otpCode);
  }
}, [otpCode, step]);





  ////////////////////////////

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && (step === "OTP" || step === "PASSWORD")) return;
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[410px] border-[#E8E6DF] bg-white p-7 sm:p-8 rounded-2xl shadow-xl">
        <DialogTitle className="sr-only">Account Authentication</DialogTitle>

        <AnimatePresence mode="wait" custom={direction} initial={false}>
          {step === "EMAIL" && (
            <motion.div
              key="email"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="space-y-5"
            >
              <div className="space-y-1">
                <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-[#121212]">
                  Sign in or create account
                </h2>
                <p className="text-[13px] text-[#71717A] tracking-[-0.01em]">
                  Join Postercult to save your custom prints.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => onSuccess?.("google-user@example.com")}
                className="h-11 w-full gap-2.5 rounded-lg border-[#E8E6DF] bg-[#FAF9F6] text-[13px] font-medium text-[#121212] transition-colors hover:bg-[#F4F2EC] hover:border-[#DCD9D0]"
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <div className="relative flex items-center justify-center my-2">
                <span className="w-full border-t border-[#E8E6DF]" />
                <span className="absolute bg-white px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[#A1A1AA]">
                  or continue with email
                </span>
              </div>

              <form onSubmit={handleEmailSubmit} noValidate className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#121212]">
                    Email address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@example.com"
                    className={cn(
                      "h-11 rounded-lg border-[#E8E6DF] bg-[#FAF9F6] px-3.5 text-sm text-[#121212] placeholder:text-[#A1A1AA] transition-all focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#121212] focus-visible:border-[#121212]",
                      error && "border-[#B3261E] bg-[#FFF8F7]"
                    )}
                    autoFocus
                  />
                  {error && <p className="text-xs text-[#B3261E] pt-0.5">{error}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-lg bg-[#121212] text-sm font-medium text-[#FAF9F6] shadow-sm transition-all hover:bg-[#262626] active:scale-[0.99] cursor-pointer"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
                </Button>
              </form>

              <p className="text-center text-[11px] leading-relaxed text-[#A1A1AA] pt-1">
                By continuing, you agree to Postercult's Terms and Privacy Policy.
              </p>
            </motion.div>
          )}

          {step === "OTP" && (
            <motion.div
              key="otp"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="space-y-5"
            >
              <div>
                <button
                  type="button"
                  onClick={() => goTo("EMAIL", -1)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#121212] transition-colors mb-3"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-[#121212]">
                  Check your inbox
                </h2>
                <p className="text-[13px] text-[#71717A] mt-1 leading-normal">
                  Enter the 6-digit code sent to{" "}
                  <span className="text-[#121212] font-medium">{email}</span>.{" "}
                  <button
                    type="button"
                    onClick={() =>{ goTo("EMAIL", -1),setPassword(""); setConfirmPassword(""); setOtp(["", "", "", "", "", ""]); setError(""); }}
                    className="underline underline-offset-2 text-[#121212] hover:opacity-75"
                  >
                    Edit
                  </button>
                </p>
              </div>

              <div className="space-y-2">
                <OtpInput value={otp} onChange={setOtp} hasError={!!error} />
                {error && <p className="text-xs text-[#B3261E] text-center pt-1">{error}</p>}
              </div>

              <Button
                type="button"
                onClick={() => handleVerifyOtp(otpCode)}
                disabled={otpCode.length < 6 || loading}
                className="h-11 w-full rounded-lg bg-[#121212] text-sm font-medium text-[#FAF9F6] shadow-sm transition-all hover:bg-[#262626] active:scale-[0.99]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify code"}
              </Button>

              <div className="text-center text-xs text-[#71717A]">
                {timer > 0 ? (
                  <span className="text-[#A1A1AA]">Resend code in {timer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setOtp(["", "", "", "", "", ""]); setTimer(60); }}
                    className="underline underline-offset-2 text-[#121212] font-medium"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === "PASSWORD" && (
            <motion.div
              key="password"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="space-y-5"
            >
              <div>
                <ArrowLeft className="hover:cursor-pointer" onClick={() => goTo("EMAIL",-1)} />
              </div>
              <div className="space-y-1">
                <h2 className="text-[22px] font-semibold tracking-[-0.025em] text-[#121212]">
                  Set your password
                </h2>
                <p className="text-[13px] text-[#71717A]">
                  Choose a secure password to finish setting up your account.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} noValidate className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#121212]">
                    Create password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="At least 6 characters"
                      className="h-11 rounded-lg border-[#E8E6DF] bg-[#FAF9F6] px-3.5 pr-10 text-sm text-[#121212] placeholder:text-[#A1A1AA] transition-all focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#121212] focus-visible:border-[#121212]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#121212] transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium uppercase tracking-[0.05em] text-[#121212]">
                    Confirm password
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      placeholder="Re-enter password"
                      className="h-11 rounded-lg border-[#E8E6DF] bg-[#FAF9F6] px-3.5 pr-10 text-sm text-[#121212] placeholder:text-[#A1A1AA] transition-all focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#121212] focus-visible:border-[#121212]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#121212] transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-[#B3261E]">{error}</p>}

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full rounded-lg bg-[#121212] text-sm font-medium text-[#FAF9F6] shadow-sm transition-all hover:bg-[#262626] active:scale-[0.99] cursor-pointer"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
                </Button>
              </form>
            </motion.div>
          )}

          {step === "SUCCESS" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex flex-col items-center py-6 text-center space-y-2"
            >
              <CheckCircle2 className="h-10 w-10 text-[#121212]" />
              <h2 className="text-[20px] font-semibold tracking-[-0.02em] text-[#121212]">
                You're all set
              </h2>
              <p className="text-xs text-[#71717A]">Welcome to Postercult.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;