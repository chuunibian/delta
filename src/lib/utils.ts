import { clsx, type ClassValue } from "clsx"
import { filesize } from "filesize";
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatBytes = (bytes: any) => {
  if (!bytes) return "0 B";
  return filesize(Number(bytes), { base: 2, standard: "jedec" }) as string;
}