type RateLimitEntry = {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

export function checkRateLimit(identifier: string, limit = 10, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const windowStart = now - windowMs

  const entry = store.get(identifier) || { timestamps: [] }
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart)

  if (entry.timestamps.length >= limit) {
    store.set(identifier, entry)
    return false
  }

  entry.timestamps.push(now)
  store.set(identifier, entry)
  return true
}
