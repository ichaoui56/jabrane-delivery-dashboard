"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Package, Truck, AlertCircle, X, Loader2, ImageIcon } from "lucide-react"
import {
  createProductTransfer,
  createProduct,
  getMerchantProductsForTransfer,
  getMerchantProducts,
  type ProductTransferItem,
} from "@/lib/actions/product-transfer-actions"
import { useRouter } from "next/navigation"
import { OptimizedImage } from "./optimized-image"
import { compressImage } from "@/lib/utils/image-compression"
import { clientCache } from "@/lib/utils/client-cache"
import { useToast } from "@/hooks/use-toast"

type Product = {
  id: number
  name: string
  price: number
  image?: string | null
  stockQuantity: number
}

type TransferItemInput = {
  productId: number | null
  quantity: number
  name: string
  price: number
  image?: string
  newProduct?: {
    name: string
    description: string
    price: number
    sku: string
    image?: string
  }
}

export function CreateTransferForm() {
  const { toast } = useToast()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form state
  const [deliveryCompany, setDeliveryCompany] = useState("الشركة الوطنية للنقل")
  const [trackingNumber, setTrackingNumber] = useState("")
  const [note, setNote] = useState("")
  const [items, setItems] = useState<TransferItemInput[]>([])

  // New product modal state
  const [showNewProductForm, setShowNewProductForm] = useState(false)
  const [newProductName, setNewProductName] = useState("")
  const [newProductDescription, setNewProductDescription] = useState("")
  const [newProductPrice, setNewProductPrice] = useState("")
  const [newProductSku, setNewProductSku] = useState("")
  const [newProductImage, setNewProductImage] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    const cacheKey = "merchant-products"
    const cachedProducts = clientCache.get<Product[]>(cacheKey)

    if (cachedProducts) {
      console.log("[v0] Loading products from cache")
      setProducts(cachedProducts)
      return
    }

    setLoading(true)
    const result = await getMerchantProductsForTransfer()
    if (result.success && result.data) {
      // Map the result to include a default price if missing
      const productsWithPrice = result.data.map(product => ({
        ...product,
        price: 0, // Default price since it's required by the Product type
        stockQuantity: product.stockQuantity || 0
      }))
      setProducts(productsWithPrice)
      // Cache for 2 minutes
      clientCache.set(cacheKey, productsWithPrice, 120000)
    }
    setLoading(false)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingImage(true)
    try {
      console.log("[v0] Original file size:", (file.size / 1024).toFixed(2), "KB")

      const compressedFile = await compressImage(file, 200)
      console.log("[v0] Compressed file size:", (compressedFile.size / 1024).toFixed(2), "KB")

      const formData = new FormData()
      formData.set("file", compressedFile)

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const url = await response.json()
      console.log("[v0] Upload successful, URL:", url)
      setNewProductImage(url)
      toast({
        title: "تم رفع الصورة",
        description: "تم رفع الصورة بنجاح",
        variant: "default",
      })
    } catch (error) {
      console.error("[v0] Image upload error:", error)
      toast({
        title: "خطأ",
        description: "فشل في رفع الصورة",
        variant: "destructive",
      })
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const clearImage = () => {
    setNewProductImage("")
    setImagePreview(null)
  }

  const handleCreateProduct = async () => {
    if (!newProductName || !newProductPrice) {
      toast({
        title: "بيانات ناقصة",
        description: "الرجاء ملء الحقول المطلوبة",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    const result = await createProduct({
      name: newProductName,
      description: newProductDescription,
      sku: newProductSku,
      image: newProductImage,
      stockQuantity: 0,
    })

    if (result.success && result.data) {
      clientCache.clear("merchant-products")
      await loadProducts()
      // Reset form
      setNewProductName("")
      setNewProductDescription("")
      setNewProductPrice("")
      setNewProductSku("")
      setNewProductImage("")
      setImagePreview(null)
      setShowNewProductForm(false)
      toast({
        title: "نجح",
        description: "تم إنشاء المنتج بنجاح",
        variant: "default",
      })
    } else {
      toast({
        title: "خطأ",
        description: result.error || "فشل في إنشاء المنتج",
        variant: "destructive",
      })
    }
    setSubmitting(false)
  }

  const addItem = () => {
    setItems([...items, { productId: null, quantity: 1, name: "", price: 0, image: "" }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items]
    if (field === "productId") {
      const product = products.find((p) => p.id === Number.parseInt(value))
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image || undefined,
        }
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value }
    }
    setItems(newItems)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast({
        title: "لا توجد منتجات",
        description: "الرجاء إضافة منتج واحد على الأقل",
        variant: "destructive",
      })
      return
    }

    const invalidItems = items.filter((item) => !item.productId || item.quantity <= 0)
    if (invalidItems.length > 0) {
      toast({
        title: "بيانات غير صحيحة",
        description: "الرجاء ملء جميع بيانات المنتجات",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    const transferItems: ProductTransferItem[] = items.map((item) => ({
      productId: item.productId!,
      quantity: item.quantity,
      name: item.name,
      price: item.price,
      image: item.image,
    }))

    const result = await createProductTransfer({
      deliveryCompany,
      trackingNumber: trackingNumber || undefined,
      note: note || undefined,
      items: transferItems,
    })

    if (result.success) {
      clientCache.invalidate("merchant")
      toast({
        title: "تم إنشاء الشحنة",
        description: result.message || "تم إنشاء الشحنة بنجاح",
        variant: "default",
      })
      router.push("/merchant/track-shipments")
    } else {
      toast({
        title: "فشل في الإنشاء",
        description: result.error || "فشل في إنشاء الشحنة",
        variant: "destructive",
      })
    }

    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
      {/* Transfer Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Truck className="w-5 h-5" />
            معلومات الشحنة
          </CardTitle>
          <CardDescription className="text-sm">أدخل تفاصيل شركة النقل والتتبع</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deliveryCompany">شركة النقل *</Label>
              <Input
                id="deliveryCompany"
                value={deliveryCompany}
                onChange={(e) => setDeliveryCompany(e.target.value)}
                placeholder="اسم شركة النقل"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trackingNumber">رقم التتبع</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="رقم التتبع (اختياري)"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">ملاحظات</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="أضف أي ملاحظات إضافية..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                <Package className="w-5 h-5" />
                المنتجات
              </CardTitle>
              <CardDescription className="text-sm">أضف المنتجات التي تريد نقلها</CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewProductForm(!showNewProductForm)}
              className="bg-[#048dba] text-white hover:bg-[#037a9f] w-full sm:w-auto"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              منتج جديد
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          {/* New Product Form */}
          {showNewProductForm && (
            <Card className="border-2 border-[#048dba]">
              <CardHeader>
                <CardTitle className="text-base md:text-lg">إضافة منتج جديد</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>اسم المنتج *</Label>
                    <Input
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="اسم المنتج"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>السعر *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رمز المنتج (SKU)</Label>
                    <Input
                      value={newProductSku}
                      onChange={(e) => setNewProductSku(e.target.value)}
                      placeholder="SKU-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>صورة المنتج</Label>
                    {!imagePreview && !newProductImage ? (
                      <div className="relative">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="hidden"
                          id="product-image-upload"
                        />
                        <Label
                          htmlFor="product-image-upload"
                          className="flex items-center justify-center gap-2 h-10 px-4 border border-input rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground"
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span className="text-sm">جاري الرفع...</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-4 h-4" />
                              <span className="text-sm">اختر صورة</span>
                            </>
                          )}
                        </Label>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea
                    value={newProductDescription}
                    onChange={(e) => setNewProductDescription(e.target.value)}
                    placeholder="وصف المنتج"
                    rows={2}
                  />
                </div>
                {(imagePreview || newProductImage) && (
                  <div className="w-full max-w-xs mx-auto">
                    <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-[#048dba]">
                      <OptimizedImage
                        src={newProductImage || imagePreview || ""}
                        alt="صورة المنتج"
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={clearImage}
                        className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500/90 hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-center text-gray-500 mt-2">
                      {uploadingImage ? "جاري الرفع..." : "تم الرفع بنجاح"}
                    </p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    onClick={handleCreateProduct}
                    disabled={submitting || uploadingImage}
                    className="bg-[#048dba] text-white hover:bg-[#037a9f] flex-1"
                  >
                    {submitting ? "جاري الحفظ..." : "حفظ المنتج"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewProductForm(false)
                      clearImage()
                    }}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Transfer Items */}
          {items.length === 0 ? (
            <div className="text-center py-8 md:py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Package className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500 mb-4 text-sm md:text-base">لم تتم إضافة أي منتجات بعد</p>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                إضافة منتج
              </Button>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {items.map((item, index) => (
                <Card key={index} className="border-gray-200">
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                      {item.image && (
                        <div className="relative w-full sm:w-16 md:w-20 h-40 sm:h-16 md:h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <OptimizedImage src={item.image} alt={item.name} fill className="object-cover" />
                        </div>
                      )}
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm">المنتج *</Label>
                            <select
                              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                              value={item.productId || ""}
                              onChange={(e) => updateItem(index, "productId", e.target.value)}
                              required
                            >
                              <option value="">اختر منتج</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name} - {product.price} درهم
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-sm">الكمية *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, "quantity", Number.parseInt(e.target.value))}
                                required
                                className="text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm">الإجمالي</Label>
                              <div className="h-10 px-3 rounded-md border border-input bg-gray-50 flex items-center font-semibold text-sm">
                                {(item.price * item.quantity).toFixed(2)} درهم
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(index)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 self-start"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Button type="button" onClick={addItem} variant="outline" className="w-full bg-transparent" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                إضافة منتج آخر
              </Button>
            </div>
          )}

          {/* Summary */}
          {items.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>عدد المنتجات:</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>إجمالي الكميات:</span>
                <span className="font-semibold">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="flex justify-between text-base md:text-lg font-bold border-t pt-2">
                <span>القيمة الإجمالية:</span>
                <span className="text-[#048dba]">
                  {items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} درهم
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <Button
          type="submit"
          disabled={submitting || items.length === 0}
          className="flex-1 bg-[#048dba] text-white hover:bg-[#037a9f] h-11 md:h-12 text-base md:text-lg"
        >
          {submitting ? "جاري الإنشاء..." : "إنشاء الشحنة"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} className="h-11 md:h-12 w-full sm:w-auto">
          إلغاء
        </Button>
      </div>

      {/* Info Alert */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-3 md:p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-blue-800">
            <p className="font-semibold mb-1">ملاحظة هامة:</p>
            <p>
              سيتم تحديث مخزونك تلقائياً عند وصول الشحنة إلى مستودع الشركة بالداخلة. يمكنك تتبع حالة شحنتك من صفحة "تتبع
              الشحنات".
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}
