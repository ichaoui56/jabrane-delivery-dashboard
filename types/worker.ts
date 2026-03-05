import { Worker, WeeklyAttendance, Payment } from "@prisma/client"
import { mapWorkTypeToFrontend } from "@/lib/utils/worker-utils"

export type WorkerWithRelations = Worker & {
  attendances: WeeklyAttendance[]
  payments: Payment[]
}

export type FrontendWorker = {
  id: string
  name: string
  weeklySalary: number
  weeklyPayment: number
  status: string
  workType: string
  active: boolean
  phoneNumber?: string
}

export function convertWorkerToFrontend(worker: Worker): FrontendWorker {
  return {
    id: worker.id,
    name: worker.fullName,
    weeklySalary: worker.weeklyPayment,
    weeklyPayment: worker.weeklyPayment,
    status: worker.isActive ? "active" : "inactive",
    workType: mapWorkTypeToFrontend(worker.workType),
    active: worker.isActive,
    phoneNumber: worker.phoneNumber,
  }
}

// Using mapWorkTypeToFrontend from worker-utils