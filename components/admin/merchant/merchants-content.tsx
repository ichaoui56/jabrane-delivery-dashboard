import { getMerchants } from "@/lib/actions/admin/merchant"
import { MerchantsClient } from "./merchants-client"

export async function MerchantsContent() {
  const result = await getMerchants()
  const merchants = result.success ? result.data : []

  return <MerchantsClient initialMerchants={merchants || []} />
}
