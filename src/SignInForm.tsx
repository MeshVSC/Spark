import { useState } from "react";
import { toast } from "sonner";
import { signIn, signUp, signInAnonymously } from "./lib/auth";

export function SignInForm() {
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      if (flow === "signIn") {
        await signIn(email, password);
        toast.success("Welcome back!");
      } else {
        await signUp(email, password);
        toast.success("Account created! Please check your email to verify your account.");
      }
    } catch (error: any) {
      let toastTitle = "";
      if (error.message.includes("Invalid login credentials")) {
        toastTitle = "Invalid email or password. Please try again.";
      } else if (error.message.includes("User already registered")) {
        toastTitle = "Account already exists. Did you mean to sign in?";
      } else {
        toastTitle = flow === "signIn" 
          ? "Could not sign in. Please try again." 
          : "Could not sign up. Please try again.";
      }
      toast.error(toastTitle);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      await signInAnonymously();
      toast.success("Signed in anonymously!");
    } catch (error: any) {
      toast.error("Could not sign in anonymously. Please try again.");
    }
  };

  return (
    <div className="w-full">
      <form className="flex flex-col gap-form-field" onSubmit={handleSubmit}>
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">or</span>
        <hr className="my-4 grow border-gray-200" />
      </div>
      <button className="auth-button" onClick={handleAnonymousSignIn}>
        Continue as Guest
      </button>
    </div>
  );
}
