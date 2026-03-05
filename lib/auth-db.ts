import { prisma } from "@/lib/db"

function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export async function getUserFromDb(email: string) {
  if (!email || typeof email !== "string") {
    console.warn("Invalid email input:", email)
    return null
  }

  const sanitizedEmail = sanitizeEmail(email)

  if (!isValidEmail(sanitizedEmail)) {
    console.warn("Invalid email format:", sanitizedEmail)
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: sanitizedEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  } catch (error) {
    console.error("Database error while fetching user")
    return null
  }
}

export async function getUserById(id: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return user
  } catch (error) {
    console.error("Database error while fetching user by ID")
    return null
  }
}
