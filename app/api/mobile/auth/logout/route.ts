import { jsonOk } from "@/lib/mobile/http"

export async function POST() {
  // Stateless JWT logout: client deletes token.
  return jsonOk({ success: true })
}
