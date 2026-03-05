import { getCities } from "@/lib/actions/admin/city"
import { CitiesClient } from "./cities-client"

// Define the City type here as well
type City = {
  id: number
  name: string
  code: string
  isActive: boolean
  orderCount: number
  createdAt: Date
  _count: {
    orders: number
    deliveryMen: number
  }
}

export async function CitiesContent() {
  const result = await getCities()
  
  // Handle the case where result.data might be undefined
  const cities: City[] = result.success ? result.data || [] : []

  return <CitiesClient initialCities={cities} />
}