import { useState, useEffect } from "react";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { SparkApp } from "./components/SparkApp";
import { onAuthStateChange } from "./lib/auth";
import { testSupabaseConnection } from "./lib/supabase";
import { SettingsProvider } from "./contexts/SettingsContext";
import { TaskNavigationProvider } from "./hooks/useTaskNavigation";
import type { User } from '@supabase/supabase-js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("🔧 Initializing auth state...");
    console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("Supabase Anon Key exists:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
    
    // Test connection on app load
    testSupabaseConnection();
    
    const { data: { subscription } } = onAuthStateChange((user) => {
      console.log("👤 Auth state changed:", user ? "logged in" : "logged out");
      setUser(user);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAFAFA' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Spark...</p>
        </div>
      </div>
    );
  }

  return (
    <SettingsProvider>
      <TaskNavigationProvider>
      <div className="min-h-screen flex flex-col" style={{ background: '#FAFAFA' }}>
        {user ? (
          <SparkApp />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="w-full max-w-md mx-auto">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Spark</h1>
                  <p className="text-gray-600">Get organized. Get focused. Get things done.</p>
                </div>
                <SignInForm />
                <div className="mt-8 text-center">
                  <p className="text-xs text-gray-400">© Mesh 2025</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <Toaster />
      </div>
      </TaskNavigationProvider>
    </SettingsProvider>
  );
}
