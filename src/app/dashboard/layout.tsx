import { ReactNode } from "react";
import { BrandLogo } from "~/components/logo";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-accent/5 min-h-screen">
      <NavBar />
      <div className="container py-6">{children}</div>
    </div>
  );
}

export function NavBar() {
  return (
    <header className="flex py-4 shadow bg-background">
      <nav className="flex items-center gap-10 container">
        <Link className="mr-auto" href="/dashboard">
          <BrandLogo />
        </Link>
        <Link href="/dashboard/products">Products</Link>
        <Link href="/dashboard/analytics">Analytics</Link>
        <Link href="/dashboard/subscription">Subscription</Link>
        <UserButton />
      </nav>
    </header>
  );
}
