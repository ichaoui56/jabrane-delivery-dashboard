import { getMerchantProducts } from "@/lib/actions/order.actions"
import { CreateOrderClient } from "./create-order-client"

export async function CreateOrderContent() {
  const products = await getMerchantProducts()

  return <CreateOrderClient initialProducts={products} />
}
