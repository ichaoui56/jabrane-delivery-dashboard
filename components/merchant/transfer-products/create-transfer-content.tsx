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
    companyName: "Jabrane Delivery",
    email: "Ahmedjabran588@gmail.com", 
    phone: "+2120702505050",
    address: "السطات - المركز"
  }

  return <CreateTransferClient initialProducts={products} companyInfo={companyInfo} />
}