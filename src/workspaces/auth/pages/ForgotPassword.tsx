import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { useAuth } from "@/core/auth/useAuth";
import { useToast } from "@/core/hooks/use-toast";

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    const { error } = await sendPasswordReset(email.trim());

    setSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Unable to send reset email",
        description: error,
      });
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <form onSubmit={onSubmit} className="w-full max-w-md border rounded-xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we will send you a password reset link.
        </p>

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />

        <Button className="w-full" type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Reset Link"
          )}
        </Button>

        {submitted && (
          <p className="text-sm text-green-600">
            Reset link sent. Please check your inbox and spam folder.
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          Remembered your password? <Link className="text-primary hover:underline" to="/auth/sign-in">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
