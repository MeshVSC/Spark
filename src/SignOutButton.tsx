import { useState, useEffect } from "react";
import { signOut, getCurrentUser } from "./lib/auth";
import type { User } from '@supabase/supabase-js';
import { toast } from "sonner";

export function SignOutButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getCurrentUser().then(setUser);
  }, []);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Could not sign out. Please try again.");
    }
  };

  return (
    <button
      className="px-4 py-2 rounded bg-white text-secondary border border-gray-200 font-semibold hover:bg-gray-50 hover:text-secondary-hover transition-colors shadow-sm hover:shadow"
      onClick={handleSignOut}
    >
      Sign out
    </button>
  );
}
