import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { useAuth } from "@/core/auth/useAuth";
import { useToast } from "@/core/hooks/use-toast";
import { supabase } from "@/core/api/client";

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [canReset, setCanReset] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setCanReset(Boolean(session));
      }
    };

    void init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || Boolean(session)) {
        setCanReset(true);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "Password and confirm password must match.",
      });
      return;
    }

    setSubmitting(true);

    const { error } = await updatePassword(password);

    setSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Unable to reset password",
        description: error,
      });
      return;
    }

    setUpdated(true);
  };

  if (updated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md border rounded-xl p-6 space-y-4">
          <h1 className="text-2xl font-semibold">Password updated</h1>
          <p className="text-sm text-muted-foreground">Your password has been reset. You can now sign in.</p>
          <Button asChild>
            <Link to="/auth/sign-in">Go to sign in</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <form onSubmit={onSubmit} className="w-full max-w-md border rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="text-sm text-muted-foreground">Enter a new password for your account.</p>

        {!canReset && (
          <p className="text-sm text-amber-600">
            Open this page from your password reset email link to set a new password.
          </p>
        )}

        <Input
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          minLength={12}
        />
        <Input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          minLength={12}
        />

        <Button className="w-full" type="submit" disabled={submitting || !canReset}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Password"
          )}
        </Button>
      </form>
    </div>
  );
}
