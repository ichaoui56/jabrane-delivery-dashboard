import { getGarageInventory } from "@/lib/actions/admin/transfers"
import { GarageClient } from "./garage-client"

export async function GarageContent() {
  const result = await getGarageInventory()

  if (!result.success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{result.error}</p>
      </div>
    )
  }

  return <GarageClient initialProducts={result.data || []} />
}
