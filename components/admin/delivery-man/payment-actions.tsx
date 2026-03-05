"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  DollarSign, 
  CreditCard, 
  Loader2,
  CheckCircle,
  AlertCircle 
} from 'lucide-react'
import { 
  collectCODFromDeliveryMan, 
  payDeliveryManEarnings 
} from "@/lib/actions/admin/delivery-men"
import { toast } from "sonner"

interface PaymentActionsProps {
  deliveryManId: number
  deliveryManName: string
  pendingEarnings: number
  pendingCOD: number
  onSuccess: (type: 'earnings' | 'cod', amount: number) => void
  children: React.ReactNode
}

export function PaymentActions({ 
  deliveryManId,
  deliveryManName,
  pendingEarnings,
  pendingCOD,
  onSuccess,
  children 
}: PaymentActionsProps) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"earnings" | "cod">("earnings")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const maxAmount = activeTab === "earnings" ? pendingEarnings : pendingCOD

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const numericAmount = parseFloat(amount)
    
    if (numericAmount > maxAmount) {
      toast.error(`المبلغ المدخل أكبر من المبلغ المتاح (${maxAmount.toFixed(2)} د.م)`)
      setIsLoading(false)
      return
    }

    try {
      let result
      if (activeTab === "earnings") {
        result = await payDeliveryManEarnings(deliveryManId, numericAmount)
      } else {
        result = await collectCODFromDeliveryMan(deliveryManId, numericAmount)
      }

      if (result.success) {
        // Call parent success handler
        onSuccess(activeTab, numericAmount)
        
        toast.success(`تم ${activeTab === "earnings" ? "دفع الأرباح" : "تحصيل COD"} بنجاح`)
        
        // Reset and close
        setTimeout(() => {
          setOpen(false)
          resetForm()
        }, 500)
      } else {
        toast.error(result.error || "حدث خطأ")
      }
    } catch (error) {
      toast.error("حدث خطأ غير متوقع")
    }

    setIsLoading(false)
  }

  const resetForm = () => {
    setAmount("")
    setNote("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>المعاملات المالية - {deliveryManName}</DialogTitle>
        </DialogHeader>

        <div className="flex border-b mb-4">
          <Button
            type="button"
            variant="ghost"
            className={`flex-1 rounded-none border-b-2 ${activeTab === "earnings" 
              ? "border-blue-500 text-blue-600" 
              : "border-transparent"}`}
            onClick={() => setActiveTab("earnings")}
          >
            <DollarSign className="w-4 h-4 ml-2" />
            دفع الأرباح
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={`flex-1 rounded-none border-b-2 ${activeTab === "cod" 
              ? "border-green-500 text-green-600" 
              : "border-transparent"}`}
            onClick={() => setActiveTab("cod")}
          >
            <CreditCard className="w-4 h-4 ml-2" />
            تحصيل COD
          </Button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">
              {activeTab === "earnings" ? "الأرباح المعلقة:" : "COD المعلقة:"}
            </span>
            <span className={`font-bold ${activeTab === "earnings" ? "text-orange-600" : "text-red-600"}`}>
              {maxAmount.toFixed(2)} د.م
            </span>
          </div>
          <p className="text-xs text-gray-500">
            {activeTab === "earnings" 
              ? "الأرباح المستحقة للدفع من قبل الشركة" 
              : "أموال COD المجمعة من العملاء والتي يجب تسليمها للإدارة"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">المبلغ (د.م) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              max={maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={isLoading || maxAmount === 0}
              placeholder={`أدخل المبلغ (الحد الأقصى: ${maxAmount.toFixed(2)})`}
            />
            <p className="text-xs text-gray-500 mt-1">
              يمكنك إدخال مبلغ جزئي أو المبلغ الكامل
            </p>
          </div>

          <div>
            <Label htmlFor="note">ملاحظة (اختياري)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isLoading}
              placeholder="أضف ملاحظة حول هذه المعاملة..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              disabled={isLoading || maxAmount === 0}
              className={`flex-1 ${activeTab === "earnings" 
                ? "bg-blue-600 hover:bg-blue-700" 
                : "bg-green-600 hover:bg-green-700"}`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري المعالجة...
                </>
              ) : (
                activeTab === "earnings" ? "دفع الأرباح" : "تأكيد التحصيل"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}