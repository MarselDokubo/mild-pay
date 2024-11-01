import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const compactNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
});

export function formatCompactNumber(number: number) {
  return compactNumberFormatter.format(number);
}

export function removeTrailingSlash(path: string) {
  return path.replace(/\/$/, "");
}
