"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OptimizedImage } from "./optimized-image"
import { useToast } from "@/hooks/use-toast"
import { updateProductInfo } from "@/lib/actions/product-transfer-actions"
import { compressImage } from "@/lib/utils/image-compression"
import { Loader2, Upload, X, Building2, User, Package, AlertCircle } from 'lucide-react'

type Product = {
  id: number
  name: string
  description: string | null
  image: string | null
  sku: string | null
  stockQuantity: number
  lowStockAlert: number
  merchant?: {
    id: number
    companyName: string | null
    user: {
      name: string
      email: string
      phone: string | null
    }
  }
}

type EditProductModalProps = {
  product: Product | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
  isAdmin?: boolean
}

export function EditProductModal({ product, open, onClose, onSuccess, isAdmin = false }: EditProductModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    stockQuantity: 0,
    lowStockAlert: 3,
  })

  useEffect(() => {
    if (product && open) {
      console.log("[EditProductModal] Product data received:", product)
      
      const lowStockValue = product.lowStockAlert ?? 3
      const stockQuantityValue = product.stockQuantity ?? 0
      
      setFormData({
        name: product.name,
        sku: product.sku || "",
        stockQuantity: stockQuantityValue,
        lowStockAlert: lowStockValue,
      })
      setImagePreview(product.image)
      setImageFile(null)
    }
  }, [product, open])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setLoading(true)
      const compressed = await compressImage(file)
      setImageFile(compressed)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(compressed)
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في معالجة الصورة",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return

    try {
      setLoading(true)

      let imageUrl = product.image

      if (imageFile) {
        const formDataUpload = new FormData()
        formDataUpload.append("file", imageFile)

        const response = await fetch("/api/files", {
          method: "POST",
          body: formDataUpload,
        })

        if (response.ok) {
          imageUrl = await response.json()
        }
      }

      const result = await updateProductInfo(product.id, {
        name: formData.name,
        sku: formData.sku || undefined,
        stockQuantity: Number(formData.stockQuantity),
        lowStockAlert: Number(formData.lowStockAlert),
        image: imageUrl || undefined,
      })

      if (result.success) {
        toast({
          title: "نجح",
          description: result.message || "تم تحديث المنتج بنجاح",
        })
        onSuccess()
        onClose()
      } else {
        toast({
          title: "خطأ",
          description: result.error || "فشل في تحديث المنتج",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[EditProductModal] Error:", error)
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث المنتج",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-[#048dba]" />
            {isAdmin ? "تحديث المنتج (المشرف)" : "تعديل المنتج"}
          </DialogTitle>
          <p className="text-sm text-gray-500">
            {isAdmin 
              ? "تحديث معلومات المنتج من قبل المشرف"
              : "تعديل معلومات المنتج الخاص بك"}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Summary */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              {imagePreview ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300">
                  <img
                    src={imagePreview}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                {product.sku && (
                  <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                )}
                <div className="flex items-center gap-4 mt-1">
                  <div className="text-sm">
                    <span className="text-gray-500">المخزون:</span>
                    <span className="font-bold text-[#048dba] mr-2">
                      {product.stockQuantity}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">تنبيه:</span>
                    <span className="font-bold text-amber-600 mr-2">
                      {product.lowStockAlert}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Image Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              صورة المنتج
            </Label>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {imagePreview && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border-2 border-gray-300">
                  <OptimizedImage
                    src={imagePreview}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null)
                      setImageFile(null)
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex-1">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#048dba] transition-colors hover:bg-gray-50">
                  <div className="text-center p-4">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">انقر لتحميل صورة جديدة</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG أو WEBP (حد أقصى 5MB)</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageChange}
                    disabled={loading}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Product Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              اسم المنتج <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="أدخل اسم المنتج"
              required
              disabled={loading}
              className="text-base"
            />
          </div>

          {/* SKU */}
          <div className="space-y-2">
            <Label htmlFor="sku" className="flex items-center gap-2">
              رمز المنتج (SKU)
            </Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="مثال: ABC-123"
              disabled={loading}
              className="font-mono"
            />
          </div>

          {/* Stock Management */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stockQuantity" className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                الكمية في المخزون <span className="text-red-500">*</span>
              </Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                placeholder="0"
                required
                disabled={loading}
                className="text-lg font-bold"
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span>الكمية الحالية:</span>
                <span className="font-bold text-gray-700">{product.stockQuantity}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockAlert" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                تنبيه المخزون المنخفض <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lowStockAlert"
                type="number"
                min="1"
                value={formData.lowStockAlert}
                onChange={(e) => setFormData({ ...formData, lowStockAlert: parseInt(e.target.value) || 1 })}
                placeholder="3"
                required
                disabled={loading}
                className="text-lg font-bold"
              />
              <p className="text-xs text-gray-500">
                سيتم التنبيه عندما يكون المخزون أقل من أو يساوي هذا الرقم
              </p>
            </div>
          </div>

          {/* Info Note */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <span className="font-bold">ملاحظة:</span> يتم تحديث الكمية يدوياً من قبل المشرف. تأكد من صحة الأرقام قبل الحفظ.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="min-w-24"
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="bg-[#048dba] hover:bg-[#037099] min-w-24 shadow-sm"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isAdmin ? "حفظ كمسؤول" : "حفظ التغييرات"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}