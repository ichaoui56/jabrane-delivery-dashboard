import { NextResponse, type NextRequest } from "next/server"
import { pinata } from "@/lib/utils/pinata"

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    console.log("[v0] Uploading file to Pinata:", file.name, "Size:", (file.size / 1024).toFixed(2), "KB")

    const { cid } = await pinata.upload.public.file(file)
    const url = await pinata.gateways.public.convert(cid)

    console.log("[v0] Upload successful. URL:", url)

    // Return response with caching headers
    return NextResponse.json(url, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (e) {
    console.error("[v0] Upload error:", e)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


