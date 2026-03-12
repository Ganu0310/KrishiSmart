import * as z from "zod";

export const adminFertilizerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200, "Name cannot exceed 200 characters"),
  brand: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description cannot exceed 1000 characters"),
  nitrogen: z.coerce.number().min(0).max(100).optional().default(0),
  phosphorus: z.coerce.number().min(0).max(100).optional().default(0),
  potassium: z.coerce.number().min(0).max(100).optional().default(0),
  micronutrients: z.string().optional(),
  pricePerKg: z.coerce.number().min(0, "Price must be a positive number"),
  suitableCrops: z.array(z.string()).min(1, "Select at least one suitable crop"),
  applicationMethod: z.enum(["soil", "foliar", "drip", "broadcast", "mixed"]),
  dosageGuide: z.string().optional().refine((val) => {
    if (!val) return true;
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "Must be a valid JSON format if provided" }),
  precautions: z.string().optional(),
  organic: z.boolean().default(false),
});

export type AdminFertilizerFormValues = z.infer<typeof adminFertilizerSchema>;
