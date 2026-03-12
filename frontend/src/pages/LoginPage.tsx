import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { authApi } from "@/services/api";
import { Sprout, Mail, Lock, User, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  loginSchema, verifyOtpSchema, loginEmailSchema, verifyEmailOtpSchema, registerSchema,
  LoginFormValues, VerifyOtpFormValues, LoginEmailFormValues, VerifyEmailOtpFormValues, RegisterFormValues,
} from "@/lib/validations/auth";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Login mode: "mobile" or "email"
  const [loginMode, setLoginMode] = useState<"mobile" | "email">("mobile");
  const [step, setStep] = useState<1 | 2>(1);
  const [identifierForOtp, setIdentifierForOtp] = useState("");

  // Mobile OTP forms
  const mobileForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { mobile: "" },
  });
  const mobileOtpForm = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { mobile: "", otp: "" },
  });

  // Email OTP forms
  const emailForm = useForm<LoginEmailFormValues>({
    resolver: zodResolver(loginEmailSchema),
    defaultValues: { email: "" },
  });
  const emailOtpForm = useForm<VerifyEmailOtpFormValues>({
    resolver: zodResolver(verifyEmailOtpSchema),
    defaultValues: { email: "", otp: "" },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", mobile: "", location: "Nashik" },
  });

  // --- Mobile OTP handlers ---
  const onRequestMobileOtp = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      await authApi.loginOtp(data.mobile);
      setIdentifierForOtp(data.mobile);
      mobileOtpForm.setValue("mobile", data.mobile);
      setStep(2);
      toast({ title: "OTP Sent", description: "Please check your mobile messages." });
    } catch (error: any) {
      toast({ title: "Failed", description: error.message || "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyMobileOtp = async (data: VerifyOtpFormValues) => {
    setLoading(true);
    try {
      const res = await authApi.verifyLoginOtp(data.mobile, data.otp);
      login(res.token, res.user);
      toast({ title: "Welcome back!", description: `Logged in as ${res.user.role}` });
      navigate(res.user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message || "Invalid OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // --- Email OTP handlers ---
  const onRequestEmailOtp = async (data: LoginEmailFormValues) => {
    setLoading(true);
    try {
      await authApi.loginEmailOtp(data.email);
      setIdentifierForOtp(data.email);
      emailOtpForm.setValue("email", data.email);
      setStep(2);
      toast({ title: "OTP Sent", description: "Please check your email inbox." });
    } catch (error: any) {
      toast({ title: "Failed", description: error.message || "Failed to send OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyEmailOtp = async (data: VerifyEmailOtpFormValues) => {
    setLoading(true);
    try {
      const res = await authApi.verifyLoginEmailOtp(data.email, data.otp);
      login(res.token, res.user);
      toast({ title: "Welcome back!", description: `Logged in as ${res.user.role}` });
      navigate(res.user.role === "admin" ? "/admin/dashboard" : "/dashboard");
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message || "Invalid OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // --- Register ---
  const [registerStep, setRegisterStep] = useState<1 | 2>(1);
  const [registerMobile, setRegisterMobile] = useState("");

  const registerOtpForm = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { mobile: "", otp: "" },
  });

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setLoading(true);
    try {
      const res = await authApi.register({
        name: data.name,
        email: data.email || undefined,
        mobile: data.mobile,
        role: "farmer",
        location: data.location,
      });
      // Backend now returns requiresOtp
      setRegisterMobile(data.mobile);
      registerOtpForm.setValue("mobile", data.mobile);
      setRegisterStep(2);
      toast({ title: "Account Created!", description: "Please verify your mobile with the OTP sent." });
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message || "Could not create account", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const onRegisterVerifyOtp = async (data: VerifyOtpFormValues) => {
    setLoading(true);
    try {
      const res = await authApi.verifyLoginOtp(data.mobile, data.otp);
      login(res.token, res.user);
      toast({ title: "Welcome!", description: "Your account is verified. Welcome to KrishiSmart!" });
      navigate("/dashboard");
    } catch (error: any) {
      toast({ title: "Verification Failed", description: error.message || "Invalid OTP", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const switchLoginMode = (mode: "mobile" | "email") => {
    setLoginMode(mode);
    setStep(1);
    setIdentifierForOtp("");
    mobileForm.reset();
    mobileOtpForm.reset();
    emailForm.reset();
    emailOtpForm.reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1625246333195-bf7f9435b38b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
        <div className="p-8 pb-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 shadow-lg mb-4">
            <Sprout className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">KrishiSmart</h1>
          <p className="text-white/80">Growth through Intelligence</p>
        </div>

        <div className="px-8 pb-8">
          <Tabs defaultValue="login" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 p-1 mb-6">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 text-white">
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-emerald-700 text-white">
                Sign Up
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-0">
              {/* Mobile / Email toggle */}
              <div className="flex gap-2 mb-5">
                <button
                  type="button"
                  onClick={() => switchLoginMode("mobile")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    loginMode === "mobile"
                      ? "bg-emerald-500/30 border border-emerald-400/60 text-white"
                      : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <Phone className="h-4 w-4" /> Mobile OTP
                </button>
                <button
                  type="button"
                  onClick={() => switchLoginMode("email")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    loginMode === "email"
                      ? "bg-emerald-500/30 border border-emerald-400/60 text-white"
                      : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                  }`}
                >
                  <Mail className="h-4 w-4" /> Email OTP
                </button>
              </div>

              {/* ===== MOBILE OTP FLOW ===== */}
              {loginMode === "mobile" && step === 1 && (
                <form onSubmit={mobileForm.handleSubmit(onRequestMobileOtp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-mobile" className="text-white">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                      <Input
                        id="login-mobile"
                        type="tel"
                        placeholder="10-digit mobile number"
                        {...mobileForm.register("mobile")}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 transition-all"
                      />
                    </div>
                    {mobileForm.formState.errors.mobile && (
                      <p className="text-red-400 text-xs mt-1">{mobileForm.formState.errors.mobile.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg mt-4 h-11" disabled={loading}>
                    {loading ? "Sending OTP..." : "Get OTP"}
                  </Button>
                </form>
              )}

              {loginMode === "mobile" && step === 2 && (
                <form onSubmit={mobileOtpForm.handleSubmit(onVerifyMobileOtp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile-otp" className="text-white">Enter OTP sent to {identifierForOtp}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                      <Input
                        id="mobile-otp"
                        type="text"
                        placeholder="6-digit OTP"
                        maxLength={6}
                        {...mobileOtpForm.register("otp")}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 transition-all text-center tracking-widest text-lg"
                      />
                    </div>
                    {mobileOtpForm.formState.errors.otp && (
                      <p className="text-red-400 text-xs mt-1">{mobileOtpForm.formState.errors.otp.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg mt-4 h-11" disabled={loading}>
                    {loading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm text-white/60 hover:text-white mt-2">
                    Change Mobile Number
                  </button>
                </form>
              )}

              {/* ===== EMAIL OTP FLOW ===== */}
              {loginMode === "email" && step === 1 && (
                <form onSubmit={emailForm.handleSubmit(onRequestEmailOtp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@gmail.com"
                        {...emailForm.register("email")}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 transition-all"
                      />
                    </div>
                    {emailForm.formState.errors.email && (
                      <p className="text-red-400 text-xs mt-1">{emailForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg mt-4 h-11" disabled={loading}>
                    {loading ? "Sending OTP..." : "Get OTP"}
                  </Button>
                </form>
              )}

              {loginMode === "email" && step === 2 && (
                <form onSubmit={emailOtpForm.handleSubmit(onVerifyEmailOtp)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email-otp" className="text-white">Enter OTP sent to {identifierForOtp}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                      <Input
                        id="email-otp"
                        type="text"
                        placeholder="6-digit OTP"
                        maxLength={6}
                        {...emailOtpForm.register("otp")}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 transition-all text-center tracking-widest text-lg"
                      />
                    </div>
                    {emailOtpForm.formState.errors.otp && (
                      <p className="text-red-400 text-xs mt-1">{emailOtpForm.formState.errors.otp.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg mt-4 h-11" disabled={loading}>
                    {loading ? "Verifying..." : "Verify & Login"}
                  </Button>
                  <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm text-white/60 hover:text-white mt-2">
                    Change Email
                  </button>
                </form>
              )}
            </TabsContent>

            <TabsContent value="register" className="mt-0">
              {registerStep === 1 ? (
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-white text-xs">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/60" />
                      <Input
                        placeholder="John Doe"
                        {...registerForm.register("name")}
                        className="pl-8 h-9 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20"
                      />
                    </div>
                    {registerForm.formState.errors.name && (
                      <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white text-xs">Mobile Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/60" />
                      <Input
                        placeholder="Mobile"
                        {...registerForm.register("mobile")}
                        className="pl-8 h-9 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20"
                      />
                    </div>
                    {registerForm.formState.errors.mobile && (
                      <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.mobile.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-white text-xs">Email Address (Optional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/60" />
                    <Input
                      type="email"
                      placeholder="you@gmail.com"
                      {...registerForm.register("email")}
                      className="pl-8 h-9 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20"
                    />
                  </div>
                  {registerForm.formState.errors.email && (
                    <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label className="text-white text-xs">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-white/60" />
                    <Input
                      placeholder="City/Village"
                      {...registerForm.register("location")}
                      className="pl-8 h-9 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20"
                    />
                  </div>
                  {registerForm.formState.errors.location && (
                    <p className="text-red-400 text-xs mt-1">{registerForm.formState.errors.location.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg mt-2"
                  disabled={loading}
                >
                  {loading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
              ) : (
              <form onSubmit={registerOtpForm.handleSubmit(onRegisterVerifyOtp)} className="space-y-4">
                <div className="text-center mb-2">
                  <p className="text-white/90 text-sm">We sent a verification OTP to</p>
                  <p className="text-white font-semibold">{registerMobile}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-otp" className="text-white">Enter OTP</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
                    <Input
                      id="register-otp"
                      type="text"
                      placeholder="6-digit OTP"
                      maxLength={6}
                      {...registerOtpForm.register("otp")}
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/20 transition-all text-center tracking-widest text-lg"
                    />
                  </div>
                  {registerOtpForm.formState.errors.otp && (
                    <p className="text-red-400 text-xs mt-1">{registerOtpForm.formState.errors.otp.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg mt-4 h-11" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Continue"}
                </Button>
                <button type="button" onClick={() => setRegisterStep(1)} className="w-full text-center text-sm text-white/60 hover:text-white mt-2">
                  Back to Registration
                </button>
              </form>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
