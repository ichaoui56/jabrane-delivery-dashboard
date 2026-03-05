

export type Product = {
  id: number
  name: string
  image: string | null
  sku: string | null
  stockQuantity: number
  deliveredCount: number
  lowStockAlert: number
  merchant: {
    id: number
    companyName: string | null
    user: {
      name: string
      email: string
      phone: string | null
    }
  }
  TransferItem: Array<{
    id: number
    quantity: number
    transfer: {
      id: number
      transferCode: string
      deliveredToWarehouseAt: Date | null
      status: string
    }
  }>
}