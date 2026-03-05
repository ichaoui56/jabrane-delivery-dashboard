import { getMerchantTransfers } from "@/lib/actions/product-transfer-actions"
import { TrackShipmentsClient } from "./track-shipments-client"

export async function TrackShipmentsContent() {
  const result = await getMerchantTransfers()
  const transfers = result.success ? result.data : []

  return <TrackShipmentsClient initialTransfers={transfers || []} />
}
