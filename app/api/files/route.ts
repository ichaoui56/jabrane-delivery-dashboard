import { NextResponse, type NextRequest } from "next/server"
import { pinata } from "@/lib/utils/pinata"

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    

    const { cid } = await pinata.upload.public.file(file)
    const url = await pinata.gateways.public.convert(cid)

    

    // Return response with caching headers
    return NextResponse.json(url, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (e) {
    
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}


