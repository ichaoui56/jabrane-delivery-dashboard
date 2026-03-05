import { getMerchantProducts, getInventoryStats } from "@/lib/actions/product-transfer-actions"
import { InventoryClient } from "./inventory-client"

export async function InventoryContent() {
  const [productsResult, statsResult] = await Promise.all([getMerchantProducts(), getInventoryStats()])

  const products = productsResult.success ? productsResult.data : []
  const stats = statsResult.success ? statsResult.data : null

  return <InventoryClient initialProducts={products || []} initialStats={stats || null} />
}
