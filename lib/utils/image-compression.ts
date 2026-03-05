export async function compressImage(file: File, targetSizeKB = 200): Promise<File> {
  console.log("[v0] Starting compression for file:", file.name, "Size:", (file.size / 1024).toFixed(2), "KB")

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string

      img.onload = async () => {
        const canvas = document.createElement("canvas")

        // Start with moderate dimensions
        const maxWidth = 1200
        let quality = 0.85

        // Calculate initial dimensions
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        // Iteratively compress until target size is reached
        let compressedFile: File | null = null
        let attempts = 0
        const maxAttempts = 5

        while (attempts < maxAttempts) {
          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext("2d")
          if (!ctx) {
            reject(new Error("Failed to get canvas context"))
            return
          }

          // Use higher quality rendering
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = "high"
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to blob with current quality
          const blob = await new Promise<Blob | null>((resolve) => {
            canvas.toBlob(resolve, "image/jpeg", quality)
          })

          if (!blob) {
            reject(new Error("Canvas to Blob conversion failed"))
            return
          }

          const sizeKB = blob.size / 1024
          console.log(
            "[v0] Attempt",
            attempts + 1,
            "- Size:",
            sizeKB.toFixed(2),
            "KB, Quality:",
            quality,
            "Dimensions:",
            width,
            "x",
            height,
          )

          if (sizeKB <= targetSizeKB || attempts === maxAttempts - 1) {
            // Target reached or last attempt
            compressedFile = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
              type: "image/jpeg",
              lastModified: Date.now(),
            })
            break
          }

          // Adjust parameters for next attempt
          if (sizeKB > targetSizeKB * 2) {
            // Much larger - reduce dimensions significantly
            width = Math.floor(width * 0.7)
            height = Math.floor(height * 0.7)
            quality = Math.max(0.6, quality - 0.1)
          } else if (sizeKB > targetSizeKB * 1.5) {
            // Moderately larger - reduce dimensions and quality
            width = Math.floor(width * 0.85)
            height = Math.floor(height * 0.85)
            quality = Math.max(0.65, quality - 0.08)
          } else {
            // Close to target - fine tune quality
            quality = Math.max(0.7, quality - 0.05)
          }

          attempts++
        }

        if (!compressedFile) {
          reject(new Error("Failed to compress image"))
          return
        }

        console.log("[v0] Compression complete. Final size:", (compressedFile.size / 1024).toFixed(2), "KB")
        console.log("[v0] Reduction:", ((1 - compressedFile.size / file.size) * 100).toFixed(1), "%")
        resolve(compressedFile)
      }

      img.onerror = () => reject(new Error("Failed to load image"))
    }

    reader.onerror = () => reject(new Error("Failed to read file"))
  })
}
