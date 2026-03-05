export type PaymentData = {
  totalRevenue: number
  currentBalance: number
  totalPaidByAdmin: number
  merchantBaseFee: number
  totalAmountOwedByAdmin: number
  totalAmountOwedToCompany: number
  paymentHistory: Array<{
    id: number
    amount: number
    reference: string | null
    note: string | null
    transferDate: Date
  }>
  deliveredOrders: Array<{
    id: number
    orderCode: string
    customerName: string
    customerPhone: string
    totalPrice: number
    merchantEarning: number
    paymentMethod: "COD" | "PREPAID"
    deliveredAt: Date | null
    orderItems: Array<{
      id: number
      quantity: number
      price: number
      product: {
        id: number
        name: string
        image: string | null
      }
    }>
  }>
}

export type DashboardData = {
  merchant: {
    user: {
      name: string
      email: string
    }
  }
  stats: {
    orders: {
      total: number
      pending: number
      delivered: number
      cancelled: number
    }
    revenue: {
      total: number
      pending: number
    }
    products: {
      total: number
      totalStock: number
      lowStock: number
    }
    payments: {
      currentBalance: number
      totalPaid: number
    }
  }
  last7Days: Array<{
    date: string
    orders: number
    revenue: number
  }>
  bestSellingProducts: Array<{
    product: {
      id: number
      name: string
      image: string | null
    }
    quantity: number
    revenue: number
  }>
  recentOrders: Array<{
    id: number
    orderCode: string
    customerName: string
    totalPrice: number
    status: string
    createdAt: Date
    orderItems: Array<{
      id: number
      product: {
        id: number
        name: string
        image: string | null
      }
    }>
  }>
}


export interface MerchantSettingsData {
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
  }
  merchant: {
    id: number
    companyName: string | null
    rib: string | null
    bankName: string | null
    balance: number
    totalEarned: number
    baseFee: number
  }
}

export type FinancialData = {
  totalRevenue: number
  totalMerchantBalance: number
  totalDeliveryManEarnings: number
  companyProfit: number
  merchantBalances: Array<{
    merchant: {
      user: {
        name: string
      }
      companyName: string | null
    }
    balance: number
  }>
}

export type MerchantDetail = {
  id: number
  companyName: string | null
  balance: number
  totalEarned: number
  rib: string | null
  bankName: string | null
  baseFee: number
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
    createdAt: string
  }
  products: Array<{
    id: number
    name: string
    image: string | null
    stockQuantity: number
    isActive: boolean
    createdAt: string
  }>
  orders: Array<{
    id: number
    orderCode: string
    customerName: string
    totalPrice: number
    merchantEarning: number
    status: string
    city: string
    createdAt: string
  }>
  productTransfers: Array<{
    id: number
    transferCode: string
    quantity: number
    estimatedCost: number
    status: string
    createdAt: string
  }>
  moneyTransfers: Array<{
    id: number
    amount: number
    type: string
    invoiceImage: string | null
    notes: string | null
    createdAt: string
  }>
}


export 
type DeliveryManDetail = {
  id: number
  vehicleType: string | null
  active: boolean
  city: string | null
  cityId: number | null
  totalDeliveries: number
  successfulDeliveries: number
  totalEarned: number
  pendingEarnings: number
  collectedCOD: number
  pendingCOD: number
  baseFee: number
  rating: number | null
  user: {
    id: number
    name: string
    email: string
    phone: string | null
    image: string | null
    createdAt: string
  }
  assignedOrders: Array<{
    id: number
    orderCode: string
    customerName: string
    totalPrice: number
    status: string
    city: string | null
    createdAt: string
    deliveredAt: string | null
    paymentMethod: "COD" | "PREPAID"
    merchant: {
      user: {
        name: string
      }
    }
  }>
  deliveryAttempts: Array<{
    id: number
    attemptedAt: string
    status: string
    wasSuccessful: boolean
    notes: string | null
    order: {
      id: number
      orderCode: string
      customerName: string
      totalPrice: number
      status: string
      city: string | null
      createdAt: string
      deliveredAt: string | null
      paymentMethod: "COD" | "PREPAID"
      merchant: {
        user: {
          name: string
        }
      }
    }
  }>
  moneyTransfers: Array<{
    id: number
    amount: number
    reference: string | null
    note: string | null
    invoiceImage: string | null
    createdAt: string
  }>
  allOrders: Array<{
    id: number
    orderCode: string
    customerName: string
    totalPrice: number
    status: string
    city: string | null
    createdAt: string
    deliveredAt: string | null
    paymentMethod: "COD" | "PREPAID"
    merchant: {
      user: {
        name: string
      }
    }
    deliveryAttempts: Array<{
      attemptedAt: string
      status: string
      notes: string | null
    }>
  }>
}