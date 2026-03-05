import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


// lib/utils/date-utils.ts

export function getWeekNumber(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  
  // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
  const day = d.getDay();
  
  // Calculate Monday of this week
  const monday = new Date(d);
  const daysFromMonday = day === 0 ? -6 : 1 - day;
  monday.setDate(d.getDate() + daysFromMonday);
  
  // Calculate the first day of the year
  const yearStart = new Date(monday.getFullYear(), 0, 1);
  yearStart.setHours(0, 0, 0, 0);
  
  // Calculate the number of days from year start to Monday
  const diffTime = monday.getTime() - yearStart.getTime();
  const diffDays = Math.floor(diffTime / (24 * 60 * 60 * 1000));
  
  // Calculate week number (add 1 because weeks start from 1)
  const weekNumber = Math.floor(diffDays / 7) + 1;
  
  return `W${weekNumber.toString().padStart(2, '0')}`;
}

export function getWeekDatesFromWeekNumber(weekNumber: string, year: number): Date[] {
  const weekNum = parseInt(weekNumber.replace('W', ''), 10);
  
  // Calculate the first day of the year
  const firstDayOfYear = new Date(year, 0, 1);
  
  // Calculate the first Monday of the year
  const firstDayOfWeek = firstDayOfYear.getDay();
  let daysToFirstMonday;
  
  if (firstDayOfWeek === 0) {
    daysToFirstMonday = 1; // Jan 1 is Sunday, first Monday is Jan 2
  } else if (firstDayOfWeek === 1) {
    daysToFirstMonday = 0; // Jan 1 is Monday
  } else {
    daysToFirstMonday = 8 - firstDayOfWeek; // Jan 1 is Tuesday-Saturday
  }
  
  const firstMonday = new Date(firstDayOfYear);
  firstMonday.setDate(firstDayOfYear.getDate() + daysToFirstMonday);
  
  // Calculate the target Monday for the given week number
  const targetMonday = new Date(firstMonday);
  targetMonday.setDate(firstMonday.getDate() + (weekNum - 1) * 7);
  
  const weekDays = [];
  for (let i = 0; i < 6; i++) {
    const day = new Date(targetMonday);
    day.setDate(targetMonday.getDate() + i);
    weekDays.push(day);
  }

  return weekDays;
}

export function getWeekDatesFromOffset(weekOffset = 0): Date[] {
  const today = new Date();
  const currentDay = today.getDay();

  // Calculate Monday of the current week
  const monday = new Date(today);
  const daysFromMonday = currentDay === 0 ? -6 : 1 - currentDay;
  monday.setDate(today.getDate() + daysFromMonday);
  
  // Apply week offset
  monday.setDate(monday.getDate() + weekOffset * 7);

  const weekDays = [];
  for (let i = 0; i < 6; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    weekDays.push(day);
  }

  return weekDays;
}

// Unified function that can handle both use cases
export function getWeekDates(weekOffsetOrNumber?: number | string, year?: number): Date[] {
  if (typeof weekOffsetOrNumber === 'string' && year !== undefined) {
    // This is for history page: getWeekDates(weekNumber, year)
    return getWeekDatesFromWeekNumber(weekOffsetOrNumber, year);
  } else {
    // This is for marking page: getWeekDates(weekOffset)
    const weekOffset = typeof weekOffsetOrNumber === 'number' ? weekOffsetOrNumber : 0;
    return getWeekDatesFromOffset(weekOffset);
  }
}

// Utility functions for date formatting
export function formatDateForDisplay(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return toLatinNumbers(`${year}/${month}/${day}`)
}

export function formatGregorianDate(date: Date) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return toLatinNumbers(`${year}/${month}/${day}`)
}

export function toLatinNumbers(str: string | number): string {
  const arabicToLatin: Record<string, string> = {
    "٠": "0",
    "١": "1",
    "٢": "2",
    "٣": "3",
    "٤": "4",
    "٥": "5",
    "٦": "6",
    "٧": "7",
    "٨": "8",
    "٩": "9",
  }
  return String(str).replace(/[٠-٩]/g, (d) => arabicToLatin[d] || d)
}

export function getRelativeDayLabel(date: Date): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)

  const diffTime = compareDate.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === -1) return "أمس"
  if (diffDays === 0) return "اليوم"
  if (diffDays === 1) return "غداً"
  return dayNames[compareDate.getDay() === 0 ? 6 : compareDate.getDay() - 1]
}

export const dayNames = ["الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]

export function getArabicMonth(monthIndex: number): string {
  const months = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ]
  return months[monthIndex]
}