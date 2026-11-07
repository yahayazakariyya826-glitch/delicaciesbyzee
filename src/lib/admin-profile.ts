import { isStrongPassword, STRONG_PASSWORD_MESSAGE, validResetPassword } from "./password";

export function passwordChangeError(current: string, password: string, confirmation: string) {
  if (!current) return "Enter your current password.";
  if (!isStrongPassword(password)) return STRONG_PASSWORD_MESSAGE;
  if (!validResetPassword(password, confirmation)) return "New passwords do not match.";
  if (current === password) return "Choose a password different from your current password.";
  return null;
}

export function emailChangeError(currentEmail: string, nextEmail: string, currentPassword: string) {
  if (!currentPassword) return "Enter your current password.";
  const email = nextEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  if (email === currentEmail.toLowerCase()) return "Enter a different email address.";
  return null;
}