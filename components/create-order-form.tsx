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
import { createOrderWithProducts, getMerchantBaseFee } from "@/lib/actions/order.actions"
import { getAvailableCitiesForMerchant } from "@/lib/actions/order.actions"
import { toast } from "sonner"
import { OptimizedImage } from "@/components/optimized-image"
import { 
  ShoppingCart, 
  User, 
  CreditCard, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Trash2, 
  Plus, 
  Minus, 
  Loader2,
  Package,
  Phone,
  MapPin,
  Building2,
  DollarSign,
  Receipt,
  Info,
  AlertCircle,
  ImageIcon,
  X,
  Tag,
  Hash,
  FileText,
  Save,
  Calculator,
  Percent
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { compressImage } from "@/lib/utils/image-compression"

type Product = {
  id: string // temporary id for UI
  name: string
  description?: string
  quantity: number
  image?: string | null
  sku?: string | null
}

type CityOption = {
  id: number
  name: string
  code: string
}

export function CreateOrderForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [loadingBaseFee, setLoadingBaseFee] = useState(true)
  const [currentStep, setCurrentStep] = useState(1)
  const [cities, setCities] = useState<CityOption[]>([])
  const [baseFee, setBaseFee] = useState(0)

  // Products in the current order
  const [products, setProducts] = useState<Product[]>([])
  
  // New product form
  const [showNewProductForm, setShowNewProductForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    quantity: "1",
    sku: "",
    image: null as string | null,
  })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Customer information
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    address: "",
    cityId: "",
    notes: "",
  })

  // Payment information
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "PREPAID">("COD")
  
  // Order price (set in step 3)
  const [orderPrice, setOrderPrice] = useState<string>("")
  const [calculatedEarning, setCalculatedEarning] = useState(0)

  // Load base fee on mount
  useEffect(() => {
    const fetchBaseFee = async () => {
      setLoadingBaseFee(true)
      try {
        const result = await getMerchantBaseFee()
        if (result.success) {
          setBaseFee(result.baseFee)
        }
      } catch (error) {
        console.error("Error fetching base fee:", error)
      } finally {
        setLoadingBaseFee(false)
      }
    }
    fetchBaseFee()
  }, [])

  // Calculate merchant earning when total price changes
  useEffect(() => {
    if (orderPrice && !isNaN(parseFloat(orderPrice))) {
      const price = parseFloat(orderPrice)
      setCalculatedEarning(Math.max(0, price - baseFee))
    } else {
      setCalculatedEarning(0)
    }
  }, [orderPrice, baseFee])

  // Load cities on component mount
  useEffect(() => {
    async function loadCities() {
      setLoadingCities(true)
      try {
        const citiesData = await getAvailableCitiesForMerchant()
        setCities(citiesData)
        
        // Auto-select first city if available
        if (citiesData.length > 0 && !customerInfo.cityId) {
          setCustomerInfo(prev => ({
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

  // Handle image upload for new product
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploadingImage(true)
    try {
      const compressedFile = await compressImage(file, 200)
      const formData = new FormData()
      formData.set("file", compressedFile)

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const url = await response.json()
      setNewProduct(prev => ({ ...prev, image: url }))
      toast.success("تم رفع الصورة بنجاح")
    } catch (error) {
      console.error("Error uploading image:", error)
      toast.error("فشل في رفع الصورة")
      setImagePreview(null)
    } finally {
      setUploadingImage(false)
    }
  }

  const clearImage = () => {
    setNewProduct(prev => ({ ...prev, image: null }))
    setImagePreview(null)
  }

  // Add new product to order
  const addProduct = () => {
    if (!newProduct.name) {
      toast.error("يرجى إدخال اسم المنتج")
      return
    }

    const quantity = parseInt(newProduct.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      toast.error("يرجى إدخال كمية صحيحة")
      return
    }

    const product: Product = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: newProduct.name,
      description: newProduct.description,
      quantity: quantity,
      image: newProduct.image,
      sku: newProduct.sku || undefined,
    }

    setProducts([...products, product])
    
    // Reset new product form
    setNewProduct({
      name: "",
      description: "",
      quantity: "1",
      sku: "",
      image: null,
    })
    setImagePreview(null)
    setShowNewProductForm(false)
    
    toast.success(`تمت إضافة ${product.name}`)
  }

  // Update product quantity
  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeProduct(productId)
      return
    }

    setProducts(products.map(p => 
      p.id === productId ? { ...p, quantity: newQuantity } : p
    ))
  }

  // Remove product from order
  const removeProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId))
  }

  // Calculate total items
  const totalItems = products.reduce((sum, p) => sum + p.quantity, 0)

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (products.length === 0) {
      toast.error("يرجى إضافة منتج واحد على الأقل")
      return
    }

    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address || !customerInfo.cityId) {
      toast.error("يرجى ملء جميع معلومات العميل")
      return
    }

    if (!orderPrice || parseFloat(orderPrice) <= 0) {
      toast.error("يرجى إدخال السعر الإجمالي للطلب")
      return
    }

    setLoading(true)
    try {
      const result = await createOrderWithProducts({
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        address: customerInfo.address,
        cityId: parseInt(customerInfo.cityId),
        note: customerInfo.notes,
        paymentMethod: paymentMethod,
        totalPrice: parseFloat(orderPrice),
        products: products.map(p => ({
          name: p.name,
          description: p.description,
          quantity: p.quantity,
          image: p.image,
          sku: p.sku,
        })),
      })

      if (result.success) {
        toast.success(result.message)
        router.push("/merchant/orders")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Error creating order:", error)
      toast.error("حدث خطأ أثناء إنشاء الطلب")
    } finally {
      setLoading(false)
    }
  }

  // Validation for each step
  const canProceedToStep2 = products.length > 0
  const canProceedToStep3 = customerInfo.name && customerInfo.phone && customerInfo.address && customerInfo.cityId

  const steps = [
    { number: 1, title: "إضافة المنتجات", icon: Package, description: "أضف المنتجات المطلوبة" },
    { number: 2, title: "معلومات العميل", icon: User, description: "بيانات العميل وطريقة الدفع" },
    { number: 3, title: "تحديد السعر والتأكيد", icon: Calculator, description: "حدد السعر الإجمالي وأكد الطلب" },
  ]

  const selectedCity = cities.find(city => city.id.toString() === customerInfo.cityId)

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Progress Steps */}
      <div className="relative">
        <div className="absolute top-5 w-full h-1 bg-gray-200 rounded" />
        <div className="relative flex justify-between">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 border-2 bg-white",
                  currentStep === step.number
                    ? "border-[#048dba] text-[#048dba] scale-110 shadow-lg"
                    : currentStep > step.number
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-gray-300 text-gray-400"
                )}
              >
                {currentStep > step.number ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <p className={cn(
                "text-sm font-medium mt-2",
                currentStep === step.number ? "text-[#048dba]" : "text-gray-500"
              )}>
                {step.title}
              </p>
              <p className="text-xs text-gray-400 hidden sm:block">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Product Creation */}
      {currentStep === 1 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-5 duration-500">
          <Card className="border-2 border-[#048dba]/20 shadow-lg">
            <CardHeader className="bg-gradient-to-l from-[#048dba]/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Package className="w-6 h-6 text-[#048dba]" />
                إضافة منتجات للطلب
              </CardTitle>
              <p className="text-sm text-gray-500">أضف المنتجات المطلوبة مع تفاصيلها (بدون تحديد السعر)</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Add Product Button */}
              {!showNewProductForm && (
                <Button
                  type="button"
                  onClick={() => setShowNewProductForm(true)}
                  className="w-full h-14 border-2 border-dashed border-[#048dba] bg-[#048dba]/5 hover:bg-[#048dba]/10 text-[#048dba] gap-2 text-base"
                >
                  <Plus className="w-5 h-5" />
                  إضافة منتج جديد
                </Button>
              )}

              {/* New Product Form */}
              {showNewProductForm && (
                <Card className="border-2 border-[#048dba] bg-[#048dba]/5">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Tag className="w-5 h-5" />
                      تفاصيل المنتج
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Product Image */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">صورة المنتج</Label>
                      {!imagePreview && !newProduct.image ? (
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
                            className="flex items-center justify-center gap-2 h-12 px-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#048dba] hover:bg-[#048dba]/5 transition-colors"
                          >
                            {uploadingImage ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>جاري الرفع...</span>
                              </>
                            ) : (
                              <>
                                <ImageIcon className="w-4 h-4" />
                                <span>اختر صورة للمنتج</span>
                              </>
                            )}
                          </Label>
                        </div>
                      ) : (
                        <div className="relative w-32 h-32 mx-auto">
                          <div className="relative w-full h-full rounded-lg overflow-hidden border-2 border-[#048dba]">
                            <OptimizedImage
                              src={newProduct.image || imagePreview || ""}
                              alt="Product preview"
                              width={128}
                              height={128}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={clearImage}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Product Name */}
                    <div className="space-y-2">
                      <Label htmlFor="product-name" className="text-sm font-medium">
                        اسم المنتج <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="product-name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        placeholder="مثال: تيشرت قطن, هاتف سامسونج..."
                        className="h-11 text-base"
                      />
                    </div>

                    {/* Product Description */}
                    <div className="space-y-2">
                      <Label htmlFor="product-description" className="text-sm font-medium">
                        وصف المنتج
                      </Label>
                      <Textarea
                        id="product-description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        placeholder="مواصفات المنتج، اللون، المقاس، الموديل..."
                        rows={2}
                      />
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                      <Label htmlFor="product-quantity" className="text-sm font-medium">
                        الكمية <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="product-quantity"
                        type="number"
                        min="1"
                        value={newProduct.quantity}
                        onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
                        className="h-11 text-base"
                      />
                    </div>

                    {/* SKU */}
                    <div className="space-y-2">
                      <Label htmlFor="product-sku" className="text-sm font-medium flex items-center gap-1">
                        <Hash className="w-4 h-4" />
                        رمز المنتج (SKU)
                      </Label>
                      <Input
                        id="product-sku"
                        value={newProduct.sku}
                        onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                        placeholder="اختياري - مثال: TSH-001"
                        className="h-11 text-base"
                      />
                    </div>

                    {/* Note about price */}
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <p className="text-xs text-blue-700 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        <span>سيتم تحديد سعر الطلب الإجمالي في الخطوة الأخيرة</span>
                      </p>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowNewProductForm(false)
                          setNewProduct({
                            name: "",
                            description: "",
                            quantity: "1",
                            sku: "",
                            image: null,
                          })
                          setImagePreview(null)
                        }}
                        className="flex-1 h-11"
                      >
                        إلغاء
                      </Button>
                      <Button
                        type="button"
                        onClick={addProduct}
                        disabled={!newProduct.name || uploadingImage}
                        className="flex-1 h-11 bg-[#048dba] hover:bg-[#037ba0] gap-2"
                      >
                        <Save className="w-4 h-4" />
                        إضافة للطلب
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Products List */}
              {products.length > 0 && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-[#048dba]" />
                      منتجات الطلب ({products.length})
                    </h3>
                    <Badge className="bg-[#048dba] text-white px-3 py-1">
                      إجمالي القطع: {totalItems}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-4 p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-[#048dba]/50 transition-all"
                      >
                        {/* Product Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.image ? (
                            <OptimizedImage
                              src={product.image}
                              alt={product.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 truncate">{product.name}</h4>
                            {product.sku && (
                              <Badge variant="outline" className="text-xs">
                                SKU: {product.sku}
                              </Badge>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-sm text-gray-600 line-clamp-1">{product.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm text-gray-500">
                              الكمية: <span className="font-bold text-gray-900">{product.quantity}</span>
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, product.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-10 text-center font-bold">{product.quantity}</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(product.id, product.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => removeProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!canProceedToStep2}
              size="lg"
              className="bg-[#048dba] hover:bg-[#037ba0] min-w-[150px] h-12 text-base gap-2"
            >
              التالي: معلومات العميل
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Customer Information */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
          <Card className="border-2 border-[#048dba]/20 shadow-lg">
            <CardHeader className="bg-gradient-to-l from-[#048dba]/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="w-6 h-6 text-[#048dba]" />
                معلومات العميل
              </CardTitle>
              <p className="text-sm text-gray-500">أدخل بيانات العميل بالكامل</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Name */}
                <div className="space-y-2">
                  <Label htmlFor="customer-name" className="text-base font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-[#048dba]" />
                    اسم العميل
                    <span className="text-red-500 text-sm">*</span>
                  </Label>
                  <Input
                    id="customer-name"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    placeholder="أدخل اسم العميل الكامل"
                    className="h-12 text-base border-2 focus:border-[#048dba] rounded-xl"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="customer-phone" className="text-base font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#048dba]" />
                    رقم الهاتف
                    <span className="text-red-500 text-sm">*</span>
                  </Label>
                  <Input
                    id="customer-phone"
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    placeholder="مثال: 0612345678"
                    className="h-12 text-base border-2 focus:border-[#048dba] rounded-xl"
                  />
                </div>

                {/* City Selection */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-base font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#048dba]" />
                    المدينة
                    <span className="text-red-500 text-sm">*</span>
                  </Label>
                  <Select 
                    value={customerInfo.cityId} 
                    onValueChange={(value) => setCustomerInfo({ ...customerInfo, cityId: value })}
                    disabled={loadingCities || cities.length === 0}
                  >
                    <SelectTrigger className="h-12 text-base border-2 rounded-xl">
                      <SelectValue placeholder={loadingCities ? "جاري التحميل..." : "اختر المدينة"} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingCities ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin ml-2" />
                          <span>جاري التحميل...</span>
                        </div>
                      ) : cities.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">لا توجد مدن متاحة</div>
                      ) : (
                        cities.map((city) => (
                          <SelectItem key={city.id} value={city.id.toString()}>
                            {city.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Full Address */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address" className="text-base font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#048dba]" />
                    العنوان الكامل
                    <span className="text-red-500 text-sm">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    placeholder="أدخل العنوان بالتفصيل (الحي، الشارع، رقم البناية، الطابق...)"
                    rows={3}
                    className="text-base border-2 focus:border-[#048dba] rounded-xl"
                  />
                </div>

                {/* Additional Notes */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes" className="text-base font-semibold flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-500" />
                    ملاحظات إضافية
                  </Label>
                  <Textarea
                    id="notes"
                    value={customerInfo.notes}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                    placeholder="أضف أي ملاحظات خاصة بالتوصيل..."
                    rows={2}
                    className="text-base border-2 focus:border-[#048dba] rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card className="border-2 border-[#048dba]/20 shadow-lg">
            <CardHeader className="bg-gradient-to-l from-[#048dba]/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-xl">
                <CreditCard className="w-6 h-6 text-[#048dba]" />
                طريقة الدفع
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <RadioGroup
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as "COD" | "PREPAID")}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="cod"
                  className={cn(
                    "flex items-center gap-4 p-6 border-2 rounded-xl cursor-pointer transition-all",
                    paymentMethod === "COD" 
                      ? "border-[#048dba] bg-[#048dba]/5 shadow-md" 
                      : "border-gray-200 hover:border-[#048dba]/50"
                  )}
                >
                  <RadioGroupItem value="COD" id="cod" />
                  <div>
                    <p className="font-bold text-lg">الدفع عند الاستلام</p>
                    <p className="text-sm text-gray-500">يدفع العميل ثمن الطلب عند استلامه</p>
                  </div>
                </Label>
                <Label
                  htmlFor="prepaid"
                  className={cn(
                    "flex items-center gap-4 p-6 border-2 rounded-xl cursor-pointer transition-all",
                    paymentMethod === "PREPAID" 
                      ? "border-[#048dba] bg-[#048dba]/5 shadow-md" 
                      : "border-gray-200 hover:border-[#048dba]/50"
                  )}
                >
                  <RadioGroupItem value="PREPAID" id="prepaid" />
                  <div>
                    <p className="font-bold text-lg">الدفع المسبق</p>
                    <p className="text-sm text-gray-500">تم دفع ثمن الطلب مسبقاً</p>
                  </div>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(1)}
              size="lg"
              className="flex-1 h-12 text-base gap-2 border-2"
            >
              <ArrowRight className="w-4 h-4" />
              السابق: المنتجات
            </Button>
            <Button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={!canProceedToStep3}
              size="lg"
              className="flex-1 h-12 text-base gap-2 bg-[#048dba] hover:bg-[#037ba0]"
            >
              التالي: تحديد السعر
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Set Price & Confirm */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-5 duration-500">
          <Card className="border-2 border-[#048dba]/20 shadow-lg">
            <CardHeader className="bg-gradient-to-l from-[#048dba]/5 to-transparent">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calculator className="w-6 h-6 text-[#048dba]" />
                تحديد السعر والتأكيد
              </CardTitle>
              <p className="text-sm text-gray-500">حدد السعر الإجمالي للطلب وراجع جميع البيانات</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Price Input Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border-2 border-blue-200">
                <Label htmlFor="order-price" className="text-lg font-bold flex items-center gap-2 mb-4">
                  <DollarSign className="w-5 h-5 text-[#048dba]" />
                  السعر الإجمالي للطلب
                  <span className="text-red-500 text-sm">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="order-price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={orderPrice}
                    onChange={(e) => setOrderPrice(e.target.value)}
                    placeholder="0.00"
                    required
                    className="h-16 text-3xl font-bold text-center border-2 border-[#048dba] focus:ring-2 focus:ring-[#048dba] rounded-xl"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-lg">د.م</span>
                </div>
                
                {/* Price Breakdown */}
                {orderPrice && !isNaN(parseFloat(orderPrice)) && (
                  <div className="mt-4 bg-white p-4 rounded-lg border border-blue-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">السعر الإجمالي:</span>
                      <span className="font-bold text-xl text-[#048dba]">
                        {parseFloat(orderPrice).toFixed(2)} د.م
                      </span>
                    </div>
                    <div className="flex justify-between items-center mb-2 text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Percent className="w-4 h-4 text-orange-500" />
                        رسوم المنصة:
                      </span>
                      <span className="font-semibold text-orange-600">{baseFee.toFixed(2)} د.م</span>
                    </div>
                    <Separator className="my-2" />
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700">صافي ربحك:</span>
                      <span className="font-bold text-2xl text-green-600">
                        {calculatedEarning.toFixed(2)} د.م
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      سيتم إضافة هذا المبلغ إلى رصيدك بعد تسليم الطلب
                    </p>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#048dba]" />
                  ملخص الطلب
                </h3>

                {/* Products Summary with Images */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="font-medium mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#048dba]" />
                    المنتجات ({totalItems} قطعة):
                  </p>
                  <div className="space-y-3">
                    {products.map((product) => (
                      <div key={product.id} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
                        {/* Product Image */}
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.image ? (
                            <OptimizedImage
                              src={product.image}
                              alt={product.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.sku && (
                              <span className="text-xs text-gray-500">({product.sku})</span>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                          )}
                        </div>
                        
                        {/* Quantity */}
                        <Badge variant="outline" className="bg-[#048dba]/10 text-[#048dba]">
                          {product.quantity} قطعة
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Summary */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#048dba]" />
                    معلومات العميل:
                  </p>
                  <div className="space-y-2 mr-6">
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-gray-500 min-w-[60px]">الاسم:</span>
                      <span className="text-sm font-medium">{customerInfo.name}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-gray-500 min-w-[60px]">الهاتف:</span>
                      <span className="text-sm font-medium">{customerInfo.phone}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-gray-500 min-w-[60px]">المدينة:</span>
                      <span className="text-sm font-medium">{selectedCity?.name || "غير محدد"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm text-gray-500 min-w-[60px]">العنوان:</span>
                      <span className="text-sm font-medium">{customerInfo.address}</span>
                    </div>
                    {customerInfo.notes && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm text-gray-500 min-w-[60px]">ملاحظات:</span>
                        <span className="text-sm font-medium">{customerInfo.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="font-medium mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#048dba]" />
                    طريقة الدفع:
                  </p>
                  <div className="mr-6">
                    <Badge className={cn(
                      "text-base px-4 py-1",
                      paymentMethod === "COD" 
                        ? "bg-orange-100 text-orange-800" 
                        : "bg-green-100 text-green-800"
                    )}>
                      {paymentMethod === "COD" ? "الدفع عند الاستلام" : "مدفوع مسبقاً"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(2)}
              size="lg"
              className="flex-1 h-12 text-base gap-2 border-2"
            >
              <ArrowRight className="w-4 h-4" />
              تعديل البيانات
            </Button>
            <Button
              type="submit"
              disabled={loading || !orderPrice || parseFloat(orderPrice) <= 0}
              size="lg"
              className="flex-1 h-12 text-base gap-2 bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جاري إنشاء الطلب...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  تأكيد وإنشاء الطلب
                </>
              )}
            </Button>
          </div>

          {/* Warning if no price */}
          {(!orderPrice || parseFloat(orderPrice) <= 0) && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">يرجى إدخال السعر الإجمالي للطلب قبل التأكيد</p>
            </div>
          )}
        </div>
      )}
    </form>
  )
}