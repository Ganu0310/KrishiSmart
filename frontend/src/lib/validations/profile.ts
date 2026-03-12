import * as z from "zod";

export const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  mobile: z.string().regex(/^[0-9]{10}$/, "Please enter a valid 10-digit mobile number").optional().or(z.literal("")),
  location: z.string().max(100).optional(),
  farmSize: z.string().optional(), // Store as string for input, convert to number on submit
  address: z.string().max(500, "Address cannot exceed 500 characters").optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
