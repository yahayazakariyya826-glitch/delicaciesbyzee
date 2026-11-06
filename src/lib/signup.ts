import { z } from "zod";
import { emailSchema, nameSchema, newPasswordSchema } from "./input-validation";

export const signupSchema = z.object({
  full_name: nameSchema,
  email: emailSchema,
  phone: z.string().trim().regex(/^0[789][01]\d{8}$/, "Enter an 11-digit Nigerian phone number."),
  password: newPasswordSchema,
  confirmation: z.string().max(256),
}).refine((value) => value.password === value.confirmation, {
  path: ["confirmation"], message: "Passwords must match.",
});