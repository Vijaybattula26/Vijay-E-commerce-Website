import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Logo, btnPrimary, inputCls } from "@/components/store/SiteLayout";
import { adminAuth } from "@/lib/db";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Admin sign in | THE VIJAY STORE" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState(false);
  const [code, setCode] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (adminAuth.isSignedIn()) void navigate({ to: "/admin" });
    setSetup(!adminAuth.hasPasscode());
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (setup) {
      if (code.length < 6) {
        toast.error("Use at least 6 characters");
        return;
      }
      if (code !== confirm) {
        toast.error("Passcodes don't match");
        return;
      }
      setBusy(true);
      await adminAuth.create(code);
      toast.success("Demo admin passcode created");
      void navigate({ to: "/admin" });
      return;
    }
    setBusy(true);
    const ok = await adminAuth.signIn(code);
    setBusy(false);
    if (!ok) {
      toast.error("Incorrect passcode");
      return;
    }
    void navigate({ to: "/admin" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/50 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8 shadow-elegant"
      >
        <div className="text-center">
          <Logo className="text-lg" />
          <Lock className="mx-auto mt-6 h-8 w-8 text-gold" />
          <h1 className="mt-3 font-display text-3xl">
            {setup ? "Set up demo admin" : "Admin sign in"}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {setup
              ? "Choose a passcode for this browser. It's stored as a hash on this device only."
              : "Enter the demo admin passcode for this browser."}
          </p>
        </div>
        <input
          type="password"
          autoComplete={setup ? "new-password" : "current-password"}
          aria-label="Passcode"
          placeholder="Passcode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className={inputCls}
        />
        {setup && (
          <input
            type="password"
            autoComplete="new-password"
            aria-label="Confirm passcode"
            placeholder="Confirm passcode"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputCls}
          />
        )}
        <button disabled={busy} className={cn(btnPrimary, "w-full")}>
          {setup ? "Create passcode" : "Sign in"}
        </button>
        <p className="rounded-lg bg-gold/10 p-3 text-[11px] text-muted-foreground">
          Local demo mode: anyone with access to this browser could reset it. Real admin accounts
          need a secure backend before launch.
        </p>
        {!setup && (
          <button
            type="button"
            className="w-full text-xs text-muted-foreground underline"
            onClick={() => {
              if (
                confirm === "RESET" ||
                window.confirm("Forget the demo passcode on this browser? Store data is kept.")
              ) {
                adminAuth.resetPasscode();
                setSetup(true);
              }
            }}
          >
            Forgot passcode? Reset on this device
          </button>
        )}
        <Link to="/" className="block text-center text-xs text-gold underline">
          ← Back to store
        </Link>
      </form>
    </div>
  );
}
