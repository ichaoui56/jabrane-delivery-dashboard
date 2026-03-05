import { getFinancialData } from "@/lib/actions/admin/finances"
import { FinancesClient } from "./finances-client"

export async function FinancesContent() {
  const result = await getFinancialData()
  const data = result.success ? result.data : null

  return <FinancesClient initialData={data || null} />
}
