import { WorkType } from "@prisma/client"

export function mapWorkTypeToFrontend(workType: WorkType): string {
  switch (workType) {
    case "LAFSOW_MAHDI":
      return "lafso-mahdi"
    case "ALFASALA":
      return "al-fasala"
    default:
      return "lafso-mahdi"
  }
}

export function mapWorkTypeToDatabase(workType: string): WorkType {
  switch (workType) {
    case "lafso-mahdi":
      return "LAFSOW_MAHDI"
    case "al-fasala":
      return "ALFASALA"
    default:
      return "LAFSOW_MAHDI"
  }
}
