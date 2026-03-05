import { getMerchantSettings } from "@/lib/actions/settings.actions"
import { SettingsClient } from "./settings-client"
import { MerchantSettingsData } from "@/types/types"

export async function SettingsContent() {
  const result = await getMerchantSettings()
  
  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{result.error}</p>
      </div>
    )
  }

  return <SettingsClient initialData={result.data as MerchantSettingsData} />
}
