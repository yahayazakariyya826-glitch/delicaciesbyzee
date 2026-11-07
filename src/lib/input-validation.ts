import { z } from "zod";
import { isStrongPassword, STRONG_PASSWORD_MESSAGE } from "./password";

// Reject markup rather than storing pre-escaped text. React escapes rendered text.
export const plainText = (max: number) => z.string().trim().max(max).regex(/^[^<>]*$/, "HTML tags are not allowed.");
export const nameSchema = plainText(100).min(1, "Enter a name.");
export const emailSchema = z.string().trim().toLowerCase().max(255).email("Enter a valid email address.");
export const phoneSchema = z.string().trim().transform((v) => v.replace(/[ ()-]/g, "")).pipe(z.string().regex(/^(0[789][01]\d{8}|\+?234[789][01]\d{8})$/, "Enter a valid Nigerian phone number."));
export const newPasswordSchema = z.string().min(8, "Use at least 8 characters.").max(256);
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(256) });
export const checkoutSchema = z.object({
  name: nameSchema, phone: phoneSchema, email: z.union([emailSchema, z.literal("")]),
  address: plainText(500).min(1, "Enter a delivery address."), note: plainText(1000),
});
export const productSchema = z.object({
  name: nameSchema, description: plainText(2000), price: z.number().finite().int().positive("Price must be greater than zero."),
  old_price: z.number().finite().int().positive().nullable(), stock: z.number().int().nonnegative(),
  category: nameSchema, images: z.array(z.string().max(8192).url().refine((v) => v.startsWith("https://"), "Use an HTTPS image URL.")).max(20),
  available: z.boolean(), featured: z.boolean(),
});
export const settingsSchema = z.object({
  store_name: nameSchema, whatsapp: phoneSchema, bank_name: plainText(100), account_name: plainText(100),
  account_number: z.string().trim().regex(/^(\d{10})?$/, "Account number must contain 10 digits."),
  powered_by_url: z.union([z.literal(""), z.string().trim().max(2048).url().refine((v) => v.startsWith("https://"), "Use an HTTPS link.")]),
});
export const adminSchema = z.object({ email: emailSchema, role: z.enum(["Staff", "Super Admin"]) });
export const messageSchema = plainText(2000).min(1, "Enter a message.");
export function validationMessage(error: z.ZodError) { return error.issues[0]?.message ?? "Check your details."; }