import { getMerchantPaymentData } from "@/lib/actions/payment-actions"
import { PaymentsClient } from "./payments-client"
import { PaymentData } from "@/types/types"

export async function PaymentsContent() {
  const paymentData = await getMerchantPaymentData()

  return <PaymentsClient initialData={paymentData as PaymentData} />
}
