import { useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900 bg-[url('https://images.unsplash.com/photo-1625246333195-bf7f9435b38b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 animate-fade-in text-center">
        <button 
          onClick={() => navigate('/login')} 
          className="absolute top-4 left-4 text-white/70 hover:text-white flex items-center gap-1 text-sm transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Login
        </button>

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg mb-6 mt-4">
          <KeyRound className="h-8 w-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-2">Passwordless Login</h1>
        <p className="text-white/80 mb-8 max-w-sm mx-auto">
          We have upgraded to a secure, password-free login system. Your mobile number and OTP is all you need to access your account securely.
        </p>

        <Button 
          onClick={() => navigate('/login')}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg h-11"
        >
          Go to Login
        </Button>
      </div>
    </div>
  );
}
