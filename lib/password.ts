import bcrypt from "bcryptjs"

const SALT_ROUNDS = 12
const MAX_PASSWORD_LENGTH = 72

export function saltAndHashPassword(password: string): string {
  if (!password || typeof password !== "string") {
    throw new Error("كلمة المرور غير صالحة")
  }

  if (password.length < 8) {
    throw new Error("يجب أن تكون كلمة المرور 8 أحرف على الأقل")
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    throw new Error(`يجب ألا تزيد كلمة المرور عن ${MAX_PASSWORD_LENGTH} حرفًا`)
  }

  const commonPasswords = ["12345678", "password", "qwertyui", "11111111", "admin123"]
  if (commonPasswords.includes(password.toLowerCase())) {
    throw new Error("كلمة المرور ضعيفة جدًا")
  }

  try {
    const salt = bcrypt.genSaltSync(SALT_ROUNDS)
    return bcrypt.hashSync(password, salt)
  } catch (error) {
    console.error("Password hashing error:", error)
    throw new Error("فشل في تشفير كلمة المرور")
  }
}

export function verifyPassword(password: string, hashedPassword: string): boolean {
  if (!password || !hashedPassword || typeof password !== "string" || typeof hashedPassword !== "string") {
    return false
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return false
  }

  try {
    return bcrypt.compareSync(password, hashedPassword)
  } catch (error) {
    console.error("Password verification error")
    return false
  }
}
