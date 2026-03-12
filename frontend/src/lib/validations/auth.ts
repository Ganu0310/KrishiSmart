import * as z from "zod";

// Mobile OTP login
export const loginSchema = z.object({
  mobile: z.string().regex(/^[0-9]{8,15}$/, "Invalid mobile number format"),
});

export const verifyOtpSchema = z.object({
  mobile: z.string().regex(/^[0-9]{8,15}$/, "Invalid mobile number format"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

// Email OTP login
export const loginEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
});

// Registration
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  mobile: z.string().regex(/^[0-9]{8,15}$/, "Invalid mobile number format"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  location: z.string().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type VerifyOtpFormValues = z.infer<typeof verifyOtpSchema>;
export type LoginEmailFormValues = z.infer<typeof loginEmailSchema>;
export type VerifyEmailOtpFormValues = z.infer<typeof verifyEmailOtpSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

// Admin Login
export const adminLoginSchema = z.object({
  email: z.string().min(1, "Admin ID / Email is required"),
  password: z.string().min(1, "Password is required"),
});

export type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

// Admin User Form (Create/Edit)
export const adminUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  password: z.string().optional(),
  role: z.enum(["farmer", "admin"]),
  mobile: z.string().regex(/^[0-9]{8,15}$/, "Invalid mobile number format").optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  crops: z.string().optional().or(z.literal("")), // Comma-separated string in UI
}).superRefine((data, ctx) => {
  if (!data.email && !data.mobile) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Either mobile or email is required",
      path: ["mobile"],
    });
  }
});

export type AdminUserFormValues = z.infer<typeof adminUserSchema>;
