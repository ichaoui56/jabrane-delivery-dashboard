"use client"

import Image from "next/image"
import { useState } from "react"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  quality?: number
  onError?: (e: any) => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = "",
  fill = false,
  sizes,
  priority = false,
  quality = 75,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
  }

  const handleError = (e: any) => {
    console.error("[v0] Image failed to load:", src, e)
    setIsLoading(false)
    setHasError(true)
    onError?.(e)
  }

  // Check if src is valid
  if (!src || src.trim() === "" || src === "undefined" || src === "null") {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-xs">لا توجد صورة</span>
        </div>
      </div>
    )
  }

  if (hasError) {
    return (
      <div className={`bg-red-50 flex items-center justify-center ${className}`}>
        <div className="text-center text-red-400">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <span className="text-xs">فشل التحميل</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
        sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        priority={priority}
        quality={quality}
        onLoad={handleLoad}
        onError={handleError}
        unoptimized={src.includes("gateway.pinata.cloud") || src.includes("ipfs")}
        {...props}
      />

      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
        </div>
      )}
    </>
  )
}
