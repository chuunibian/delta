import { clsx, type ClassValue } from "clsx"
import { filesize } from "filesize";
import { twMerge } from "tailwind-merge"
import { sep } from '@tauri-apps/api/path';

// const windowsPathSeparator = '\\';
const pathSeparator = sep(); // get the path sep dyn for win or linux

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDateTime = (dateStr: String) => {
  return new Date(dateStr.replace(' ', 'T')).toLocaleString('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  }); 
}

export const formatBytes = (bytes: any) => {
  if (!bytes) return "0 B";
  return filesize(Number(bytes), { base: 2, standard: "jedec" }) as string;
}

// Only really for on windows the root dir since root dir has the / appended to it
export function appendPaths (prevPath: string, currentPath: string) {
  if (!prevPath) {
    return currentPath;
  }

  if (prevPath.endsWith(pathSeparator)) {
    return `${prevPath}${currentPath}`
  }

  return `${prevPath}${pathSeparator}${currentPath}`
}