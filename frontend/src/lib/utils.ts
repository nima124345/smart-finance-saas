import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** รวม class names (shadcn convention) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
