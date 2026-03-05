"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createOrder } from "@/lib/actions/order.actions"
import { getAvailableCitiesForMerchant } from "@/lib/actions/order.actions"
import { toast } from "sonner"
import { OptimizedImage } from "./optimized-image"
import { ShoppingCart, User, CreditCard, CheckCircle2, ArrowRight, ArrowLeft, Trash2, Plus, Minus, Loader2 } from "lucide-react"

type Product = {
  id: number
  name: string
  image: string | null
  sku: string | null
  stockQuantity: number
}

type SelectedProduct = {
  productId: number
  quantity: number
  name: string
  image: string | null
}

type CityOption = {
  id: number
  name: string
  code: string
}

export function CreateOrderForm({ products }: { products: Product[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [cities, setCities] = useState<CityOption[]>([])

  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [totalPrice, setTotalPrice] = useState("")

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    address: "",
    cityId: "", // Changed from city to cityId
    note: "",
    paymentMethod: "COD" as "COD" | "PREPAID",
  })

  // Load cities on component mount
  useEffect(() => {
    async function loadCities() {
      setLoadingCities(true)
      try {
        const citiesData = await getAvailableCitiesForMerchant()
        setCities(citiesData)
        
        // Auto-select first city if available
        if (citiesData.length > 0 && !formData.cityId) {
          setFormData(prev => ({
            ...prev,
            cityId: citiesData[0].id.toString()
          }))
        }
      } catch (error) {
        console.error("Error loading cities:", error)
        toast.error("فشل في تحميل قائمة المدن")
      } finally {
        setLoadingCities(false)
      }
    }
    
    loadCities()
  }, [])

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const addProduct = (product: Product) => {
    const existing = selectedProducts.find((p) => p.productId === product.id)
    if (existing) {
      setSelectedProducts(
        selectedProducts.map((p) =>
          p.productId === product.id ? { ...p, quantity: Math.min(p.quantity + 1, product.stockQuantity) } : p,
        ),
      )
    } else {
      setSelectedProducts([
        ...selectedProducts,
        {
          productId: product.id,
          quantity: 1,
          name: product.name,
          image: product.image,
        },
      ])
    }
    toast.success(`تمت إضافة ${product.name}`)
  }

  const updateQuantity = (productId: number, newQuantity: number) => {
    const product = products.find((p) => p.id === productId)
    if (!product) return

    if (newQuantity <= 0) {
      removeProduct(productId)
      return
    }

    if (newQuantity > product.stockQuantity) {
      toast.error(`الكمية المتاحة: ${product.stockQuantity}`)
      return
    }

    setSelectedProducts(selectedProducts.map((p) => (p.productId === productId ? { ...p, quantity: newQuantity } : p)))
  }

  const removeProduct = (productId: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.productId !== productId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedProducts.length === 0) {
      toast.error("يرجى اختيار منتج واحد على الأقل")
      return
    }

    if (!formData.customerName || !formData.customerPhone || !formData.address || !formData.cityId) {
      toast.error("يرجى ملء جميع الحقول المطلوبة")
      return
    }

    if (!totalPrice || Number.parseFloat(totalPrice) <= 0) {
      toast.error("يرجى إدخال السعر الإجمالي للطلب")
      return
    }

    setLoading(true)
    try {
      const result = await createOrder({
        ...formData,
        cityId: Number.parseInt(formData.cityId), // Convert to number
        items: selectedProducts.map((p) => ({
          productId: p.productId,
          quantity: p.quantity,
        })),
        totalPrice: Number.parseFloat(totalPrice),
      })

      if (result.success) {
        toast.success(result.message)
        router.push("/merchant/orders")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("[v0] Error submitting order:", error)
      toast.error("حدث خطأ أثناء إنشاء الطلب")
    } finally {
      setLoading(false)
    }
  }

  const canProceedToStep2 = selectedProducts.length > 0
  const canProceedToStep3 = formData.customerName && formData.customerPhone && formData.address && formData.cityId

  const steps = [
    { number: 1, title: "اختيار المنتجات", icon: ShoppingCart },
    { number: 2, title: "معلومات العميل", icon: User },
    { number: 3, title: "المراجعة والتأكيد", icon: CheckCircle2 },
  ]

  const selectedCity = cities.find(city => city.id.toString() === formData.cityId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                  currentStep === step.number
                    ? "bg-[#048dba] text-white scale-110"
                    : currentStep > step.number
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                <step.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p
                className={`text-xs sm:text-sm mt-2 font-medium ${
                  currentStep === step.number ? "text-[#048dba]" : "text-gray-500"
                }`}
              >
                {step.title}
              </p>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 transition-all ${
                  currentStep > step.number ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {currentStep === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                اختيار المنتجات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <Input
                  type="search"
                  placeholder="ابحث عن منتج..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto">
                {filteredProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => addProduct(product)}
                  >
                    <CardContent className="p-3">
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                        {product.image ? (
                          <OptimizedImage
                            src={product.image}
                            alt={product.name}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingCart className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-sm mb-1 line-clamp-2">{product.name}</p>
                      <p className="text-xs text-gray-500">متوفر: {product.stockQuantity}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>لا توجد منتجات متاحة</p>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedProducts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>المنتجات المختارة ({selectedProducts.length})</span>
                  <span className="text-sm font-normal text-gray-500">
                    إجمالي القطع: {selectedProducts.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* For very small screens (under 320px) */}
                <div className="block sm:hidden space-y-3">
                  {selectedProducts.map((item) => (
                    <div
                      key={item.productId}
                      className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50/50"
                    >
                      <div className="flex items-start gap-2">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {item.image ? (
                            <OptimizedImage
                              src={item.image}
                              alt={item.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingCart className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(item.productId)}
                          className="h-7 w-7 text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="h-7 w-7"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="h-7 w-7"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-medium px-2">
                          الكمية: {item.quantity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* For small screens (320px - 639px) */}
                <div className="hidden sm:block md:hidden space-y-2">
                  {selectedProducts.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50/50"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.image ? (
                          <OptimizedImage
                            src={item.image}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingCart className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm line-clamp-2">{item.name}</p>
                        <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="h-8 w-8"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </Button>
                          <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="h-8 w-8"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(item.productId)}
                          className="text-red-500 hover:text-red-700 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* For medium and larger screens (640px and up) */}
                <div className="hidden md:block space-y-2">
                  {selectedProducts.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center gap-4 p-3 border rounded-lg bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.image ? (
                          <OptimizedImage
                            src={item.image}
                            alt={item.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <ShoppingCart className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm md:text-base line-clamp-2">{item.name}</p>
                        <p className="text-xs text-gray-500 hidden sm:block">المنتج #{item.productId}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="h-9 w-9"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <div className="w-14 text-center">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value) || 1)}
                              className="text-center h-9"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="h-9 w-9"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeProduct(item.productId)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
              className="bg-[#048dba] hover:bg-[#037ba0] min-h-[44px] px-6 text-sm sm:text-base"
            >
              <span className="hidden xs:inline">التالي</span>
              <ArrowRight className="w-4 h-4 xs:mr-2" /> التالي 
            </Button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerName">اسم العميل *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="أدخل اسم العميل"
                    required
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">رقم الهاتف *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    placeholder="مثال: 0612345678"
                    required
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cityId">المدينة *</Label>
                  <Select 
                    value={formData.cityId} 
                    onValueChange={(value) => setFormData({ ...formData, cityId: value })}
                    disabled={loadingCities || cities.length === 0}
                  >
                    <SelectTrigger className="min-h-[44px]">
                      <SelectValue placeholder={loadingCities ? "جاري تحميل المدن..." : "اختر المدينة"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCities ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          <span>جاري التحميل...</span>
                        </div>
                      ) : cities.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          لا توجد مدن متاحة
                        </div>
                      ) : (
                        cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {loadingCities && (
                    <p className="text-xs text-gray-500 mt-1">جاري تحميل قائمة المدن...</p>
                  )}
                  {!loadingCities && cities.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">لا توجد مدن متاحة. يرجى التواصل مع الإدارة.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">العنوان الكامل *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="أدخل العنوان الكامل"
                    required
                    className="min-h-[44px]"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="note">ملاحظات (اختياري)</Label>
                  <Textarea
                    id="note"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="أضف أي ملاحظات خاصة بالطلب"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                طريقة الدفع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData({ ...formData, paymentMethod: value as "COD" | "PREPAID" })}
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="cod"
                  className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.paymentMethod === "COD" ? "border-[#048dba] bg-[#048dba]/5" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="COD" id="cod" />
                    <div>
                      <p className="font-medium">الدفع عند الاستلام</p>
                      <p className="text-sm text-gray-500">COD</p>
                    </div>
                  </div>
                </Label>
                <Label
                  htmlFor="prepaid"
                  className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.paymentMethod === "PREPAID" ? "border-[#048dba] bg-[#048dba]/5" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="PREPAID" id="prepaid" />
                    <div>
                      <p className="font-medium">الدفع المسبق</p>
                      <p className="text-sm text-gray-500">PREPAID</p>
                    </div>
                  </div>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>

          <div className="flex flex-col xs:flex-row gap-3">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1 min-h-[44px]">
              <ArrowLeft className="w-4 h-4 xs:ml-2" /> سابق  
              <span className="hidden xs:inline">السابق</span>
            </Button>
            <Button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={!canProceedToStep3 || loadingCities || cities.length === 0}
              className="flex-1 min-h-[44px] bg-[#048dba] hover:bg-[#037ba0]"
            >
              <span className="hidden xs:inline">التالي</span>
              <ArrowRight className="w-4 h-4 xs:mr-2" /> التالي 
            </Button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ملخص الطلب :</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">المنتجات:</h3>
                <div className="space-y-2">
                  {selectedProducts.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm">
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">معلومات العميل:</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">الاسم:</span> {formData.customerName}
                  </p>
                  <p>
                    <span className="font-medium">الهاتف:</span> {formData.customerPhone}
                  </p>
                  <p>
                    <span className="font-medium">المدينة:</span> {selectedCity?.name || "غير محدد"}
                  </p>
                  <p>
                    <span className="font-medium">العنوان:</span> {formData.address}
                  </p>
                  {formData.note && (
                    <p>
                      <span className="font-medium">ملاحظات:</span> {formData.note}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">طريقة الدفع:</span>{" "}
                    {formData.paymentMethod === "COD" ? "الدفع عند الاستلام" : "الدفع المسبق"}
                  </p>
                </div>
              </div>
              <div className="border-t pt-4">
                <Label htmlFor="totalPrice" className="text-base font-semibold mb-2 block">
                  السعر الإجمالي للطلب *
                </Label>
                <Input
                  id="totalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={totalPrice}
                  onChange={(e) => setTotalPrice(e.target.value)}
                  placeholder="أدخل السعر الإجمالي (درهم)"
                  required
                  className="min-h-[44px] text-lg font-bold"
                />
                <p className="text-sm text-gray-500 mt-1">أدخل السعر الإجمالي للطلب بعد احتساب كل التكاليف</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col xs:flex-row gap-3">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1 min-h-[44px]">
              <ArrowLeft className="w-4 h-4 xs:ml-2" /> سابق 
              <span className="hidden xs:inline">السابق</span>
            </Button>
            <Button
              type="submit"
              disabled={loading || !totalPrice || Number.parseFloat(totalPrice) <= 0 || cities.length === 0}
              className="flex-1 min-h-[44px] bg-green-500 hover:bg-green-600"
            >
              {loading ? "جاري الإنشاء..." : "تأكيد الطلب"}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}