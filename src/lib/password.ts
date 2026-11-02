export function validResetPassword(password: string, confirmation: string) {
  return password.length >= 8 && password === confirmation;
}