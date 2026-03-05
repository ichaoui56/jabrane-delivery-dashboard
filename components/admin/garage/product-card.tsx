// components/product-card.tsx
"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Package, Warehouse, Truck, User, AlertTriangle } from "lucide-react"
import { EditProductModal } from "@/components/edit-product-modal"
import type { Product } from "@/types/product"

interface ProductCardProps {
  product: Product
  onEditSuccess?: () => void
  isAdmin?: boolean
}

export function ProductCard({ product, onEditSuccess, isAdmin = false }: ProductCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const lastTransfer = product.TransferItem[0]?.transfer
  const isLowStock = product.stockQuantity <= product.lowStockAlert
  const isOutOfStock = product.stockQuantity === 0

  const getStockStatus = () => {
    if (isOutOfStock) return "out"
    if (isLowStock) return "low"
    return "good"
  }

  const stockStatus = getStockStatus()

  const handleCardClick = () => {
    setIsEditModalOpen(true)
  }

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditModalOpen(true)
  }

  return (
    <>
      <div className="relative group h-full">
        <Card 
          className="relative overflow-hidden gap-0 cursor-pointer h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white"
          onClick={handleCardClick}
        >
          {/* Header with gradient background */}
          <div className="relative bg-gradient-to-br from-gray-50 via-white to-blue-50 p-5 pb-4">
            {/* Edit button - always visible on mobile, hover on desktop */}
            <button
              onClick={handleEditClick}
              className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full p-2.5 shadow-md border border-gray-200/50 transition-all duration-200 hover:shadow-lg hover:scale-110 active:scale-95 sm:opacity-0 sm:group-hover:opacity-100"
              title="تعديل المنتج"
              aria-label="تعديل المنتج"
            >
              <Edit className="w-4 h-4 text-[#048dba]" />
            </button>

            {/* Product image */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-lg bg-white border-4 border-white">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <Package className="h-12 w-12 sm:h-14 sm:w-14 text-gray-400" />
                    </div>
                  )}
                </div>
                
                {/* Stock status badge */}
                <div className={`absolute -bottom-2 -right-2 flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-lg border-2 border-white text-white text-xs font-bold ${
                  stockStatus === "out" ? "bg-red-500" :
                  stockStatus === "low" ? "bg-amber-500" :
                  "bg-emerald-500"
                }`}>
                  {stockStatus === "out" ? "✕" : stockStatus === "low" ? "!" : "✓"}
                  <span className="hidden sm:inline">
                    {stockStatus === "out" ? "نفذ" : stockStatus === "low" ? "منخفض" : "متوفر"}
                  </span>
                </div>
              </div>
            </div>

            {/* Product name and SKU */}
            <div className="text-center">
              <h4 className="font-bold text-base sm:text-lg text-gray-900 line-clamp-2 px-2">
                {product.name}
              </h4>
              {product.sku && (
                <Badge 
                  variant="outline" 
                  className="text-xs font-mono bg-white/80 text-gray-700 border-gray-300 px-3 py-1"
                >
                SKU: {product.sku}
                </Badge>
              )}
            </div>
          </div>

          {/* Stats section */}
          <div className="flex-1 p-5 space-y-3">
            {/* Stock quantity - prominent display */}
            <div className={`relative overflow-hidden rounded-xl p-4 ${
              isOutOfStock ? "bg-gradient-to-br from-red-50 to-red-100/50" :
              isLowStock ? "bg-gradient-to-br from-amber-50 to-amber-100/50" :
              "bg-gradient-to-br from-blue-50 to-blue-100/50"
            }`}>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      isOutOfStock ? "bg-red-500/10" :
                      isLowStock ? "bg-amber-500/10" :
                      "bg-blue-500/10"
                    }`}>
                      <Warehouse className={`w-4 h-4 ${
                        isOutOfStock ? "text-red-600" :
                        isLowStock ? "text-amber-600" :
                        "text-blue-600"
                      }`} />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">المخزون</span>
                  </div>
                  <span className="text-xs text-gray-500">قطعة</span>
                </div>
                <div className={`text-xl sm:text-xl font-black ${
                  isOutOfStock ? "text-red-600" :
                  isLowStock ? "text-amber-600" :
                  "text-blue-600"
                }`}>
                  {product.stockQuantity.toLocaleString("en-US")}
                </div>
              </div>
              {/* Decorative circle */}
              <div className={`absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-10 ${
                isOutOfStock ? "bg-red-500" :
                isLowStock ? "bg-amber-500" :
                "bg-blue-500"
              }`} />
            </div>

            {/* Stock warnings */}
            {isLowStock && !isOutOfStock && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-semibold flex-1">مخزون منخفض!</span>
                <span className="text-sm font-bold whitespace-nowrap">
                  {product.stockQuantity}/{product.lowStockAlert}
                </span>
              </div>
            )}

            {isOutOfStock && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-semibold">المخزون منتهي!</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Edit Modal */}
      <EditProductModal
        product={{
          id: product.id,
          name: product.name,
          description: null,
          image: product.image,
          sku: product.sku,
          stockQuantity: product.stockQuantity,
          lowStockAlert: product.lowStockAlert,
          merchant: product.merchant
        }}
        open={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          if (onEditSuccess) onEditSuccess()
          setIsEditModalOpen(false)
        }}
        isAdmin={isAdmin}
      />
    </>
  )
}