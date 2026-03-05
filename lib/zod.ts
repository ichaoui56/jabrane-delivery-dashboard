import { object, string } from "zod"

function sanitizeString(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
    .trim()
}

const emailValidation = string({ required_error: "البريد الإلكتروني مطلوب" })
  .min(1, "البريد الإلكتروني مطلوب")
  .max(254, "يجب ألا يزيد البريد الإلكتروني عن 254 حرفًا")
  .email("يرجى إدخال بريد إلكتروني صالح")
  .transform((email) => sanitizeString(email.toLowerCase()))

const passwordValidation = string({ required_error: "كلمة المرور مطلوبة" })
  .min(1, "كلمة المرور مطلوبة")
  .max(32, "يجب ألا تزيد كلمة المرور عن 32 حرفًا")
  .transform((pwd) => sanitizeString(pwd))

const mobilePasswordValidation = string({ required_error: "كلمة المرور مطلوبة" })
  .min(8, "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل")
  .max(32, "يجب ألا تزيد كلمة المرور عن 32 حرفًا")
  .transform((pwd) => sanitizeString(pwd))

export const signInSchema = object({
  email: emailValidation,
  password: passwordValidation,
})

export const mobileSignInSchema = object({
  email: emailValidation,
  password: mobilePasswordValidation,
})

export const signInDefaultValues = {
  email: "",
  password: "",
}
