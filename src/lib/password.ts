export const STRONG_PASSWORD_MESSAGE = "Password must be 8+ chars, include UPPERCASE, lowercase, number & symbol like @ $ !";

export const passwordRequirements = [
  { id: "length", label: "8 characters", test: (password: string) => password.length >= 8 },
  { id: "uppercase", label: "Uppercase letter", test: (password: string) => /[A-Z]/.test(password) },
  { id: "lowercase", label: "Lowercase letter", test: (password: string) => /[a-z]/.test(password) },
  { id: "number", label: "Number", test: (password: string) => /[0-9]/.test(password) },
  { id: "symbol", label: "Symbol (@$!%*?)", test: (password: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
] as const;

export function isStrongPassword(password: string) {
  return passwordRequirements.every((requirement) => requirement.test(password));
}

export function validResetPassword(password: string, confirmation: string) {
  return password.length <= 256 && isStrongPassword(password) && password === confirmation;
}
