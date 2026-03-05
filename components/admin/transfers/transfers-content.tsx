import { getAllProductTransfers } from "@/lib/actions/admin/transfers"
import { TransfersClient } from "./transfers-client"

export async function TransfersContent() {
  const result = await getAllProductTransfers()

  if (!result.success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{result.error}</p>
      </div>
    )
  }

  // Transform the data to match the expected Transfer type
  const transformedTransfers = result.data?.map(transfer => ({
    ...transfer,
    transferItems: transfer.transferItems.map(item => ({
      ...item,
      product: {
        ...item.product,
        price: 0 // Add default price since it's required but not in the API response
      }
    }))
  })) || []

  return <TransfersClient initialTransfers={transformedTransfers} />
}
