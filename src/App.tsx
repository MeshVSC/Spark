import { useState, useEffect } from "react";
import { SignInForm } from "./SignInForm";
import { Toaster } from "sonner";
import { SparkApp } from "./components/SparkApp";
import { onAuthStateChange } from "./lib/auth";
import type { User } from '@supabase/supabase-js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((user) => {
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
    <div className="min-h-screen flex flex-col" style={{ background: '#FAFAFA' }}>
      {user ? (
        <SparkApp />
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">✨ Spark</h1>
                <p className="text-lg text-gray-600">Get organized. Get focused. Get things done.</p>
                <p className="text-sm text-gray-400 mt-2">© Mesh 2025</p>
              </div>
              <SignInForm />
            </div>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}
