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
      console.error("Auth error:", error);
      console.error("Error message:", error.message);
      console.error("Error details:", error);
      
      let toastTitle = "";
      if (error.message.includes("Invalid login credentials")) {
        toastTitle = "Invalid email or password. Please try again.";
      } else if (error.message.includes("User already registered")) {
        toastTitle = "Account already exists. Did you mean to sign in?";
      } else if (error.message.includes("Email not confirmed")) {
        toastTitle = "Please check your email and click the confirmation link before signing in.";
      } else if (error.message.includes("Password should be at least")) {
        toastTitle = "Password must be at least 6 characters long.";
      } else if (error.message.includes("Invalid email")) {
        toastTitle = "Please enter a valid email address.";
      } else {
        toastTitle = flow === "signIn" 
          ? `Could not sign in: ${error.message}` 
          : `Could not sign up: ${error.message}`;
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
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              type="email"
              name="email"
              placeholder="Email address"
              required
            />
          </div>
          <div>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              type="password"
              name="password"
              placeholder="Password"
              required
            />
          </div>
        </div>
        
        <button 
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2" 
          type="submit" 
          disabled={submitting}
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Please wait...</span>
            </>
          ) : (
            <span>{flow === "signIn" ? "Sign in" : "Create account"}</span>
          )}
        </button>
        
        <div className="text-center">
          <span className="text-gray-600 text-sm">
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors duration-200"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up" : "Sign in"}
          </button>
        </div>
      </form>
      
      <div className="flex items-center my-6">
        <div className="flex-1 h-px bg-gray-300"></div>
        <span className="px-4 text-gray-500 text-sm">or</span>
        <div className="flex-1 h-px bg-gray-300"></div>
      </div>
      
      <button 
        className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center" 
        onClick={handleAnonymousSignIn}
      >
        Continue as Guest
      </button>
    </div>
  );
}
