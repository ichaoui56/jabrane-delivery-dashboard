import { AttendanceType } from "@prisma/client"

// Calculate daily rate from weekly payment
export function calculateDailyRate(weeklyPayment: number): number {
  return weeklyPayment / 6 // 6 working days per week
}

// Calculate payment based on attendance type
// In your utility functions, update calculatePayment:

export function calculatePayment(dailyRate: number, type: AttendanceType | "notRecorded" | null): number {
  // Handle null values as not recorded
  if (type === null || type === "notRecorded") {
    return 0
  }
  
  switch (type) {
    case 'FULL_DAY':
      return dailyRate
    case 'HALF_DAY':
      return dailyRate * 0.5
    case 'DAY_AND_NIGHT':
      return dailyRate * 1.5
    case 'ABSENCE':
      return 0
    default:
      return 0
  }
}


