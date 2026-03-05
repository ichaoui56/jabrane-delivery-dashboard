import { getMerchantDetail } from "@/lib/actions/admin/merchant"
import { MerchantDetailClient } from "./merchant-detail-client"
import { MerchantDetail } from "@/types/types"

export async function MerchantDetailContent({ merchantId }: { merchantId: string }) {
  const result = await getMerchantDetail(parseInt(merchantId))
  
  if (!result.success || !result.data) {
    return <div className="p-8 text-center">لم يتم العثور على التاجر</div>
  }

  return <MerchantDetailClient initialMerchant={result.data as unknown as MerchantDetail} />
}
