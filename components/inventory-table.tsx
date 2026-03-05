"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "./optimized-image"
import { EditProductModal } from "./edit-product-modal"
import { Package, Search, Filter, X, ChevronDown, Edit2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

type Product = {
  id: number
  name: string
  description: string | null
  image: string | null
  sku: string | null
  stockQuantity: number
  deliveredCount: number
  lowStockAlert: number
  isActive: boolean
  createdAt: Date
}

export function InventoryTable({ products }: { products: Product[] }) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [stockFilter, setStockFilter] = useState<string>("ALL")
  const [sortBy, setSortBy] = useState<string>("name")
  const [showFilters, setShowFilters] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesSearch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())

      let matchesStock = true
      switch (stockFilter) {
        case "IN_STOCK":
          matchesStock = product.stockQuantity > product.lowStockAlert
          break
        case "LOW_STOCK":
          matchesStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockAlert
          break
        case "OUT_OF_STOCK":
          matchesStock = product.stockQuantity === 0
          break
        case "ACTIVE":
          matchesStock = product.isActive
          break
        case "INACTIVE":
          matchesStock = !product.isActive
          break
      }

      return matchesSearch && matchesStock
    })

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "ar")
        case "stock_high":
          return b.stockQuantity - a.stockQuantity
        case "stock_low":
          return a.stockQuantity - b.stockQuantity
        case "value_high":
          return b.stockQuantity - a.stockQuantity
        case "delivered_high":
          return b.deliveredCount - a.deliveredCount
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [products, searchTerm, stockFilter, sortBy])

  const stats = useMemo(() => {
    const totalStock = products.reduce((sum, product) => sum + product.stockQuantity, 0)
    const lowStockItems = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockAlert).length
    const outOfStock = products.filter((p) => p.stockQuantity === 0).length

    return {
      total: products.length,
      totalStock,
      lowStockItems,
      outOfStock,
    }
  }, [products])

  const clearFilters = () => {
    setSearchTerm("")
    setStockFilter("ALL")
    setSortBy("name")
  }

  const hasActiveFilters = searchTerm !== "" || stockFilter !== "ALL" || sortBy !== "name"

  const handleEditProduct = (product: Product) => {
    console.log("[v0] Opening edit modal for product:", product)
    console.log("[v0] Product lowStockAlert:", product.lowStockAlert)
    setEditingProduct(product)
    setIsEditModalOpen(true)
  }

  const handleUpdateSuccess = () => {
    router.refresh()
    setEditingProduct(null)
    setIsEditModalOpen(false)
  }

  return (
    <div className="space-y-4">
      <Card className="border-[#048dba]/20 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="ابحث عن منتج بالاسم، الوصف أو SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-10 text-sm border-gray-200 focus:border-[#048dba]"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full h-9 text-sm border-gray-200 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 ml-2" />
              خيارات الفلترة والترتيب
              <ChevronDown className={`w-4 h-4 mr-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
            </Button>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">حالة المخزون</label>
                  <select
                    value={stockFilter}
                    onChange={(e) => setStockFilter(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:border-[#048dba] focus:ring-1 focus:ring-[#048dba]"
                  >
                    <option value="ALL">جميع المنتجات</option>
                    <option value="IN_STOCK">متوفر في المخزون</option>
                    <option value="LOW_STOCK">مخزون منخفض</option>
                    <option value="OUT_OF_STOCK">نفذ من المخزون</option>
                    <option value="ACTIVE">نشط</option>
                    <option value="INACTIVE">غير نشط</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700">ترتيب حسب</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm focus:border-[#048dba] focus:ring-1 focus:ring-[#048dba]"
                  >
                    <option value="name">الاسم (أ-ي)</option>
                    <option value="stock_high">الكمية (الأعلى أولاً)</option>
                    <option value="stock_low">الكمية (الأقل أولاً)</option>
                    <option value="value_high">القيمة (الأعلى أولاً)</option>
                    <option value="delivered_high">الأكثر توصيلاً</option>
                    <option value="newest">الأحدث</option>
                  </select>
                </div>
              </div>
            )}

            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">الفلاتر النشطة:</span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1.5 text-xs h-7">
                    {searchTerm.substring(0, 15)}...
                    <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setSearchTerm("")} />
                  </Badge>
                )}
                {stockFilter !== "ALL" && (
                  <Badge variant="secondary" className="gap-1.5 text-xs h-7">
                    {stockFilter}
                    <X className="w-3 h-3 cursor-pointer hover:text-red-600" onClick={() => setStockFilter("ALL")} />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-7 text-xs px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  مسح الكل
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between px-1">
        <p className="text-xs sm:text-sm text-gray-600">
          عرض <span className="font-bold text-[#048dba]">{filteredAndSortedProducts.length}</span> من{" "}
          <span className="font-bold">{products.length}</span> منتج
        </p>
      </div>

      {filteredAndSortedProducts.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-600 mb-1">لا توجد منتجات</p>
            <p className="text-xs text-gray-400 mb-4">جرب تغيير معايير البحث أو الفلاتر</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} size="sm">
                مسح الفلاتر
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 overflow-hidden rounded-2xl">
          {filteredAndSortedProducts.map((product) => {
            const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockAlert
            const isOutOfStock = product.stockQuantity === 0

            return (
              <Card
                key={product.id}
                className="group overflow-hidden py-0 hover:shadow-xl transition-all duration-300 border-gray-200 hover:border-[#048dba]/50"
              >
                <div className="relative w-full h-[300px] aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  {product.image ? (
                    <OptimizedImage
                      src={product.image}
                      alt={product.name}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 sm:w-16 text-gray-300" />
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {isOutOfStock && (
                      <Badge className="bg-red-500 text-white text-[10px] sm:text-xs shadow-md">نفذ</Badge>
                    )}
                    {isLowStock && (
                      <Badge className="bg-yellow-500 text-white text-[10px] sm:text-xs shadow-md">منخفض</Badge>
                    )}
                  </div>

                  {/* <Button
                    size="sm"
                    onClick={() => handleEditProduct(product)}
                    className="absolute top-2 left-2 h-8 px-2 sm:px-3 bg-white/95 hover:bg-white text-gray-700 shadow-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity"
                  >
                    <Edit2 className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                    <span className="text-xs">تعديل</span>
                  </Button> */}
                </div>

                <CardContent className="p-3 sm:px-5 pt-0 space-y-3">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                    {product.sku && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 rounded-lg">
                        <span className="text-xs text-gray-500 font-medium">SKU:</span>
                        <span className="text-xs font-mono font-bold text-gray-700">{product.sku}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div
                      className={`p-2 sm:p-2.5 rounded-lg border-2 ${
                        isOutOfStock
                          ? "bg-red-50 border-red-200"
                          : isLowStock
                            ? "bg-yellow-50 border-yellow-200"
                            : "bg-teal-50 border-teal-200"
                      }`}
                    >
                      <p className="text-[10px] sm:text-xs text-gray-600 mb-0.5">المخزون</p>
                      <p
                        className={`text-lg sm:text-xl font-bold leading-none ${
                          isOutOfStock ? "text-red-600" : isLowStock ? "text-yellow-600" : "text-teal-600"
                        }`}
                      >
                        {product.stockQuantity}
                      </p>
                    </div>
                  </div>

                  {isLowStock && (
                    <div className="flex items-start gap-1.5 p-2 bg-yellow-50 border border-yellow-200 rounded text-[10px] sm:text-xs">
                      <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <span className="text-yellow-800 leading-tight">
                        المخزون أقل من {product.lowStockAlert ?? 3} قطعة
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-[#048dba]/30">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#048dba] rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm sm:text-base text-[#048dba] mb-1">نصائح إدارة المخزون</p>
              <ul className="space-y-1 text-[10px] sm:text-xs text-gray-700 leading-relaxed">
                <li>• انقر على "تعديل" لتحديث معلومات المنتج (الاسم، الصورة، حد التنبيه)</li>
                <li>• يتم تحديث المخزون تلقائياً عند وصول الشحنات</li>
                <li>• لا يمكن التعديل اليدوي للكميات لضمان دقة المخزون</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditProductModal
        product={editingProduct}
        open={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditingProduct(null)
        }}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  )
}
  