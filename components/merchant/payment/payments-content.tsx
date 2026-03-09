import { getMerchantPaymentData } from "@/lib/actions/payment-actions"
import { PaymentsClient } from "./payments-client"

export async function PaymentsContent() {
  const result = await getMerchantPaymentData()

  if (!result.success || !result.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{result.error || "فشل في تحميل البيانات"}</p>
      </div>
    )
  }

  return <PaymentsClient initialData={result.data} />
}