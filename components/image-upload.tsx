"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, X, ImageIcon } from "lucide-react"
import { OptimizedImage } from "@/components/optimized-image"
import { compressImage } from "@/lib/utils/image-compression"

interface ImageUploadProps {
  colorId: string
  colorName: string
  existingImages?: string[]
  onImagesChange: (colorId: string, images: string[]) => void
  maxImages?: number
}

export function ImageUpload({
  colorId,
  colorName,
  existingImages = [],
  onImagesChange,
  maxImages = 5,
}: ImageUploadProps) {
  const [images, setImages] = useState<string[]>(existingImages)
  const [uploading, setUploading] = useState(false)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const uploadToServer = async (file: File): Promise<string> => {
    const compressedFile = await compressImage(file, 1200)

    const formData = new FormData()
    formData.set("file", compressedFile)

    const response = await fetch("/api/files", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to upload file")
    }

    const url = await response.json()
    return url
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    if (files.length === 0) return

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      alert(`You can only upload up to ${maxImages} images per color`)
      return
    }

    setUploading(true)
    const newImageUrls: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadingIndex(images.length + i)

        // Validate file type
        if (!file.type.startsWith("image/")) {
          alert(`File ${file.name} is not an image`)
          continue
        }

        if (file.size > 3 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 3MB (will be compressed)`)
          continue
        }

        const url = await uploadToServer(file)
        newImageUrls.push(url)
      }

      const updatedImages = [...images, ...newImageUrls]
      setImages(updatedImages)
      onImagesChange(colorId, updatedImages)
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload one or more images")
    } finally {
      setUploading(false)
      setUploadingIndex(null)
      // Clear the input
      e.target.value = ""
    }
  }

  const removeImage = (indexToRemove: number) => {
    const updatedImages = images.filter((_, index) => index !== indexToRemove)
    setImages(updatedImages)
    onImagesChange(colorId, updatedImages)
  }

  const canUploadMore = images.length < maxImages

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-700">Product Images for {colorName}</label>
        <span className="text-xs text-gray-500">
          {images.length}/{maxImages} images
        </span>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Existing Images */}
        {images.map((imageUrl, index) => (
          <Card key={index} className="relative group overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-square">
                <OptimizedImage
                  src={imageUrl}
                  alt={`${colorName} image ${index + 1}`}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  quality={75}
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeImage(index)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {/* Image number indicator */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Upload placeholder when uploading */}
        {uploading && uploadingIndex !== null && (
          <Card className="relative overflow-hidden border-dashed border-2 border-blue-300">
            <CardContent className="p-0">
              <div className="aspect-square flex items-center justify-center bg-blue-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <span className="text-xs text-blue-600">Uploading...</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        {canUploadMore && !uploading && (
          <Card className="border-dashed border-2 border-gray-300 hover:border-[#e94491] transition-colors cursor-pointer group">
            <CardContent className="p-0">
              <label htmlFor={`upload-${colorId}`} className="cursor-pointer">
                <div className="aspect-square flex flex-col items-center justify-center text-gray-500 group-hover:text-[#e94491] transition-colors">
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-xs text-center px-2">Add Image</span>
                </div>
              </label>
              <input
                id={`upload-${colorId}`}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upload Info */}
      <div className="flex flex-col sm:flex-row gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          <span>Supported: JPG, PNG, GIF, WebP</span>
        </div>
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          <span>Max size: 5MB per image</span>
        </div>
      </div>

      {/* Bulk Upload Button for remaining slots */}
      {canUploadMore && !uploading && images.length > 0 && (
        <div className="pt-2">
          <label htmlFor={`bulk-upload-${colorId}`}>
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-dashed border-[#e94491] text-[#e94491] hover:bg-[#e94491]/10 bg-transparent"
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-2" />
                Add More Images ({maxImages - images.length} remaining)
              </span>
            </Button>
          </label>
          <input
            id={`bulk-upload-${colorId}`}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
        </div>
      )}
    </div>
  )
}
