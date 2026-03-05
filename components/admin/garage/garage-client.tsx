// components/garage-client.tsx
"use client"
import { useState, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Package, Search, Filter, Warehouse, Users, TrendingUp } from "lucide-react"
import { EditProductModal } from "@/components/edit-product-modal"
import { Product } from "@/types/product"
import { ProductCard } from "./product-card"

export function GarageClient({ initialProducts }: { initialProducts: Product[] }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [merchantFilter, setMerchantFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("merchant")
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  const uniqueMerchants = useMemo(() => {
    const merchantsMap = new Map()
    initialProducts.forEach((p) => {
      if (!merchantsMap.has(p.merchant.id)) {
        merchantsMap.set(p.merchant.id, p.merchant)
      }
    })
    return Array.from(merchantsMap.values())
  }, [initialProducts])

  const filteredAndSortedProducts = useMemo(() => {
    const filtered = initialProducts.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.merchant.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.merchant.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMerchant = merchantFilter === "all" || product.merchant.id.toString() === merchantFilter
      return matchesSearch && matchesMerchant
    })

    filtered.sort((a, b) => {
      if (sortBy === "merchant") {
        const merchantA = a.merchant.companyName || a.merchant.user.name
        const merchantB = b.merchant.companyName || b.merchant.user.name
        return merchantA.localeCompare(merchantB, "ar")
      } else if (sortBy === "stock") {
        return b.stockQuantity - a.stockQuantity
      } else if (sortBy === "name") {
        return a.name.localeCompare(b.name, "ar")
      }
      return 0
    })
    return filtered
  }, [initialProducts, searchQuery, merchantFilter, sortBy])

  const stats = useMemo(() => {
    const totalStock = initialProducts.reduce((sum, p) => sum + p.stockQuantity, 0)
    const lowStockProducts = initialProducts.filter(p => p.stockQuantity <= p.lowStockAlert && p.stockQuantity > 0).length
    const outOfStockProducts = initialProducts.filter(p => p.stockQuantity === 0).length
    
    return {
      totalProducts: initialProducts.length,
      totalStock,
      uniqueMerchants: uniqueMerchants.length,
      lowStockProducts,
      outOfStockProducts,
      averageStock: Math.round(totalStock / initialProducts.length) || 0
    }
  }, [initialProducts, uniqueMerchants])

  const groupedByMerchant = useMemo(() => {
    const groups = new Map<number, Product[]>()
    filteredAndSortedProducts.forEach((product) => {
      if (!groups.has(product.merchant.id)) {
        groups.set(product.merchant.id, [])
      }
      groups.get(product.merchant.id)!.push(product)
    })
    return groups
  }, [filteredAndSortedProducts])

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setIsEditModalOpen(true)
  }

  const handleEditSuccess = () => {
    // Refresh the page to get updated data
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">مخزون المستودع</h1>
            <p className="text-sm text-gray-600">إدارة وعرض جميع المنتجات المخزنة</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Card className="p-4 border-l-4 border-l-[#048dba] hover:shadow-md transition-shadow bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">إجمالي المنتجات</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts.toLocaleString("en-US")}</p>
              </div>
              <div className="p-2 bg-[#048dba]/10 rounded-lg">
                <Package className="h-5 w-5 text-[#048dba]" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-500 hover:shadow-md transition-shadow bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">المخزون الكلي</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStock.toLocaleString("en-US")}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">عدد التجار</p>
                <p className="text-2xl font-bold text-gray-900">{stats.uniqueMerchants.toLocaleString("en-US")}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-amber-500 hover:shadow-md transition-shadow bg-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 mb-1">منخفض المخزون</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts}</p>
              </div>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Warehouse className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="p-4 sm:p-6 mb-6 border-gray-200 shadow-sm bg-white">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <Filter className="h-5 w-5 text-[#048dba]" />
            تصفية وترتيب المنتجات
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="ابحث عن منتج، SKU، أو تاجر..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 h-11"
              />
            </div>
            
            <Select value={merchantFilter} onValueChange={setMerchantFilter}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="اختر التاجر" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التجار</SelectItem>
                {uniqueMerchants.map((merchant) => (
                  <SelectItem key={merchant.id} value={merchant.id.toString()}>
                    {merchant.companyName || merchant.user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="ترتيب حسب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="merchant">التاجر</SelectItem>
                <SelectItem value="name">اسم المنتج</SelectItem>
                <SelectItem value="stock">الكمية (الأكثر)</SelectItem>
                <SelectItem value="low">المخزون المنخفض أولاً</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {(searchQuery || merchantFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
              <span className="text-sm text-gray-600">الفلاتر النشطة:</span>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  🔍 {searchQuery}
                </Badge>
              )}
              {merchantFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  👤 تاجر محدد
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setMerchantFilter("all")
                }}
                className="h-7 text-xs text-[#048dba] hover:text-[#037299]"
              >
                مسح الكل
              </Button>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              عرض <span className="font-bold text-[#048dba]">{filteredAndSortedProducts.length}</span> من أصل{" "}
              <span className="font-bold">{stats.totalProducts}</span> منتج
            </p>
            <div className="text-xs text-gray-500">
              متوسط المخزون: <span className="font-bold">{stats.averageStock}</span> قطعة/منتج
            </div>
          </div>
        </div>
      </Card>

      {/* Products Grid */}
      <div className="space-y-6 sm:space-y-8">
        {Array.from(groupedByMerchant.entries()).map(([merchantId, products]) => {
          const merchant = products[0].merchant
          const merchantTotalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0)
          const merchantLowStock = products.filter(p => p.stockQuantity <= p.lowStockAlert && p.stockQuantity > 0).length
          const merchantOutOfStock = products.filter(p => p.stockQuantity === 0).length

          return (
            <Card key={merchantId} className="overflow-hidden border border-gray-200 shadow-sm">
              {/* Merchant Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white p-4 sm:p-6 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-[#048dba]/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-[#048dba]" />
                      </div>
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                          {merchant.companyName || merchant.user.name}
                        </h3>
                        <p className="text-sm text-gray-600">{merchant.user.email}</p>
                      </div>
                    </div>
                    {merchant.user.phone && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">الهاتف:</span> {merchant.user.phone}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-white">
                      {products.length} منتج
                    </Badge>
                    <Badge className="bg-[#048dba]/10 text-[#048dba] border-[#048dba]/20">
                      {merchantTotalStock.toLocaleString("en-US")} قطعة
                    </Badge>
                    {merchantLowStock > 0 && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        ⚠️ {merchantLowStock} منخفض
                      </Badge>
                    )}
                    {merchantOutOfStock > 0 && (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        ❌ {merchantOutOfStock} منتهي
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="p-4 sm:p-6 bg-gradient-to-b from-white to-gray-50/50">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onEditSuccess={handleEditSuccess}
                      isAdmin={true}
                    />
                  ))}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Edit Modal */}
      {selectedProduct && (
        <EditProductModal
          product={{
            id: selectedProduct.id,
            name: selectedProduct.name,
            description: null,
            image: selectedProduct.image,
            sku: selectedProduct.sku,
            stockQuantity: selectedProduct.stockQuantity,
            lowStockAlert: selectedProduct.lowStockAlert,
            merchant: selectedProduct.merchant
          }}
          open={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedProduct(null)
          }}
          onSuccess={handleEditSuccess}
          isAdmin={true}
        />
      )}

      {/* Empty State */}
      {filteredAndSortedProducts.length === 0 && (
        <Card className="p-8 sm:p-12 text-center bg-gradient-to-b from-white to-gray-50 border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <Warehouse className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">لا توجد منتجات</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            لم يتم العثور على منتجات مطابقة للفلاتر المحددة. حاول تغيير كلمات البحث أو إزالة بعض الفلاتر.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("")
              setMerchantFilter("all")
            }}
            className="border-[#048dba] text-[#048dba] hover:bg-[#048dba] hover:text-white"
          >
            عرض جميع المنتجات
          </Button>
        </Card>
      )}
    </div>
  )
}