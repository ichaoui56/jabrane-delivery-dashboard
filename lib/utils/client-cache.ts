type CacheEntry<T> = {
  data: T
  timestamp: number
}

class ClientCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL = 60000 // 60 seconds

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now() + ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check if expired
    if (Date.now() > entry.timestamp) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (Date.now() > entry.timestamp) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys())
    keys.forEach((key) => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    })
  }
}

export const clientCache = new ClientCache()
