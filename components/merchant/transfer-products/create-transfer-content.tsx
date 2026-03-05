// content.tsx or create-transfer-content.tsx
import { getMerchantProductsForTransfer } from "@/lib/actions/product-transfer-actions"
import { getAdminCompanyInfo } from "@/lib/actions/admin/settings" // Import the new function
import { CreateTransferClient } from "./create-transfer-client"

export async function CreateTransferContent() {
  // Fetch both products and admin info in parallel
  const [productsResult, adminInfo] = await Promise.all([
    getMerchantProductsForTransfer(),
    getAdminCompanyInfo(),
  ])

  const products = productsResult.success && productsResult.data ? productsResult.data : []
  const companyInfo = adminInfo.success && adminInfo.data ? adminInfo.data : {
    companyName: "Sonixpress",
    email: "deliverysonicdak@gmail.com", 
    phone: "+212601717961",
    address: "الداخلة - المركز - الحي الحسني"
  }

  return <CreateTransferClient initialProducts={products} companyInfo={companyInfo} />
}