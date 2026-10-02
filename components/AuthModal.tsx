"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/client";
import { useRouter } from "next/navigation";
import { playMechanicalClick, playStampSound } from "@/lib/sounds";

type Step = "EMAIL" | "OTP" | "SUCCESS";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

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
            "h-12 w-12 rounded-none border-2 border-border bg-card text-center font-mono text-lg font-bold text-foreground outline-none transition-all shadow-[2px_2px_0_0_var(--border)]",
            "focus:bg-muted focus:ring-0 focus:border-border focus:shadow-[1px_1px_0_0_var(--border)]",
            hasError && "border-destructive bg-destructive/10 text-destructive focus:border-destructive shadow-[2px_2px_0_0_var(--destructive)]"
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
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [timer, setTimer] = React.useState(60);
  const lastAttemptedCode = React.useRef<string>("");

  const otpCode = otp.join("");
  const supabase = createClient();
  const router = useRouter();

  // Reset inputs when closed
  React.useEffect(() => {
    if (!isOpen) {
      const resetTimeout = setTimeout(() => {
        setStep("EMAIL");
        setEmail("");
        setOtp(["", "", "", "", "", ""]);
        setError("");
        setTimer(60);
        lastAttemptedCode.current = "";
      }, 200);
      return () => clearTimeout(resetTimeout);
    }
  }, [isOpen]);

  // Resend countdown timer
  React.useEffect(() => {
    if (step !== "OTP" || timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  const goTo = React.useCallback((next: Step, dir: number) => {
    setError("");
    setDirection(dir);
    setStep(next);
  }, []);

  const sendOtp = React.useCallback(async (targetEmail: string) => {
    const otpRes = await fetch("/api/auth/sendOTP", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: targetEmail }),
    });
    const otpData = await otpRes.json();
    if (!otpRes.ok || !otpData.success) {
      throw new Error(otpData.message || "Failed to send verification code.");
    }
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      return setError("Please enter a valid email address.");
    }

    playMechanicalClick();
    setError("");
    setLoading(true);
    try {
      await sendOtp(email.trim().toLowerCase());
      goTo("OTP", 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = React.useCallback(async (code: string) => {
    if (code.length < 6) return setError("Please enter the complete 6-digit code.");

    lastAttemptedCode.current = code;
    setError("");
    setLoading(true);
    try {
      const verifyRes = await fetch("/api/auth/createUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          token: code.trim(),
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.message || "Invalid or expired verification code.");
        return;
      }

      if (verifyData.session?.access_token && verifyData.session?.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: verifyData.session.access_token,
          refresh_token: verifyData.session.refresh_token,
        });
        if (sessionError) {
          console.error("Failed to hydrate client session:", sessionError.message);
        }
      } else {
        console.error("Server response missing session tokens — check /api/auth/createUser.");
      }

      playStampSound();
      onSuccess?.(email);
      goTo("SUCCESS", 1);
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1200);
    } catch {
      setError("Something went wrong during verification. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [email, onSuccess, goTo, onClose, supabase, router]);

  // Keep a stable ref to handleVerifyOtp to avoid re-running the effect on callback recreation
  const verifyRef = React.useRef(handleVerifyOtp);
  React.useEffect(() => {
    verifyRef.current = handleVerifyOtp;
  }, [handleVerifyOtp]);

  // Auto-trigger when 6 digits are typed, only if this exact code hasn't failed already
  React.useEffect(() => {
    if (otpCode.length === 6 && step === "OTP" && !loading) {
      if (otpCode !== lastAttemptedCode.current) {
        verifyRef.current(otpCode);
      }
    }
  }, [otpCode, step, loading]);

  const handleOtpChange = (newOtp: string[]) => {
    setOtp(newOtp);
    setError("");
    const newCode = newOtp.join("");
    // If the user modified the code from the failed attempt, reset the lock
    if (newCode !== lastAttemptedCode.current) {
      lastAttemptedCode.current = "";
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && step === "OTP") return;
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-[410px] rounded-none border-2 border-border bg-card p-7 sm:p-8 shadow-[6px_6px_0_0_var(--border)] text-foreground">
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
                <h2 className="text-[22px] font-black tracking-tight text-foreground">
                  Sign in or create account
                </h2>
                <p className="text-[13px] text-muted-foreground">
                  Join Postercult to save your custom prints.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  playMechanicalClick();
                  onSuccess?.("google-user@example.com");
                }}
                className={cn(
                  FOCUS,
                  "h-11 w-full gap-2.5 rounded-none border-2 border-border bg-card text-[13px] font-bold text-foreground shadow-[3px_3px_0_0_var(--border)] transition-[transform,box-shadow] duration-100 hover:bg-muted active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                )}
              >
                <GoogleIcon />
                Continue with Google
              </Button>

              <div className="relative my-2 flex items-center justify-center">
                <span className="w-full border-t-2 border-border" />
                <span className="absolute bg-card px-3 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  or continue with email
                </span>
              </div>

              <form onSubmit={handleEmailSubmit} noValidate className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-foreground">
                    Email address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="you@example.com"
                    className={cn(
                      FOCUS,
                      "h-11 rounded-none border-2 border-border bg-card px-3.5 text-sm text-foreground shadow-[3px_3px_0_0_var(--border)] placeholder:text-muted-foreground transition-all focus-visible:bg-card focus-visible:ring-0 focus-visible:border-border",
                      error && "border-destructive bg-destructive/10 text-destructive shadow-[3px_3px_0_0_var(--destructive)] focus-visible:border-destructive"
                    )}
                    autoFocus
                  />
                  {error && <p className="pt-0.5 text-xs font-bold text-destructive">{error}</p>}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className={cn(
                    FOCUS,
                    "h-11 w-full cursor-pointer rounded-none border-2 border-border bg-primary text-sm font-bold text-primary-foreground shadow-[4px_4px_0_0_var(--border)] transition-[transform,box-shadow] duration-100 hover:bg-primary active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--border)] disabled:cursor-not-allowed disabled:opacity-50"
                  )}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : "Continue"}
                </Button>
              </form>

              <p className="pt-1 text-center text-[11px] leading-relaxed text-muted-foreground">
                By continuing, you agree to Postercult&apos;s Terms and Privacy Policy.
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
                  className={cn(
                    FOCUS,
                    "mb-3 inline-flex cursor-pointer items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                  )}
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <h2 className="text-[22px] font-black tracking-tight text-foreground">
                  Check your inbox
                </h2>
                <p className="mt-1 text-[13px] leading-normal text-muted-foreground">
                  Enter the 6-digit code sent to{" "}
                  <span className="font-bold text-foreground">{email}</span>.{" "}
                  <button
                    type="button"
                    onClick={() => {
                      goTo("EMAIL", -1);
                      setOtp(["", "", "", "", "", ""]);
                      setError("");
                      lastAttemptedCode.current = "";
                    }}
                    className="border-b-2 border-foreground font-bold text-foreground hover:opacity-75"
                  >
                    Edit
                  </button>
                </p>
              </div>

              <div className="space-y-2">
                <OtpInput value={otp} onChange={handleOtpChange} hasError={!!error} />
                {error && <p className="pt-1 text-center text-xs font-bold text-destructive">{error}</p>}
              </div>

              <Button
                type="button"
                onClick={() => {
                  playMechanicalClick();
                  handleVerifyOtp(otpCode);
                }}
                disabled={otpCode.length < 6 || loading}
                className={cn(
                  FOCUS,
                  "h-11 w-full cursor-pointer rounded-none border-2 border-border bg-primary text-sm font-bold text-primary-foreground shadow-[4px_4px_0_0_var(--border)] transition-[transform,box-shadow] duration-100 hover:bg-primary active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_var(--border)] disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin text-current" /> : "Verify code"}
              </Button>

              <div className="text-center font-mono text-xs text-muted-foreground">
                {timer > 0 ? (
                  <span>Resend code in {timer}s</span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      setOtp(["", "", "", "", "", ""]);
                      setError("");
                      setTimer(60);
                      lastAttemptedCode.current = "";
                      try {
                        await sendOtp(email.trim().toLowerCase());
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Failed to resend code.");
                      }
                    }}
                    className="border-b-2 border-foreground font-bold text-foreground transition-opacity hover:opacity-75"
                  >
                    Resend code
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === "SUCCESS" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="flex flex-col items-center space-y-3 py-6 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center border-2 border-border bg-muted text-foreground shadow-[3px_3px_0_0_var(--border)]">
                <CheckCircle2 className="h-8 w-8 text-foreground" strokeWidth={2.5} />
              </div>
              <h2 className="text-[20px] font-black tracking-tight text-foreground">
                You&apos;re all set
              </h2>
              <p className="text-xs text-muted-foreground">Welcome to Postercult.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;
