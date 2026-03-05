/**
 * Utility functions for generating and working with slugs
 */

/**
 * Creates a URL-friendly slug from a string
 */
export function createSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens (double check)
}

/**
 * Creates a slug with ID fallback for uniqueness
 */
export function createSlugWithId(name: string, id: number): string {
  const baseSlug = createSlug(name)
  return `${baseSlug}-${id}`
}

/**
 * Extracts ID from a slug that was created with createSlugWithId
 */
export function extractIdFromSlug(slug: string): number | null {
  const match = slug.match(/-(\d+)$/)
  return match ? parseInt(match[1]) : null
}
