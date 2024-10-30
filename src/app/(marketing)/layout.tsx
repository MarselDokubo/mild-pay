import Link from "next/link";
import { Button } from "~/components/ui/button";
import { BrandLogo } from "~/components/logo";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="selection:bg-[hsl(320,65%,52%,20%)]">
      <Navbar />
      {children}
    </div>
  );
}

export function Navbar() {
  return (
    <header className="flex py-6 shadow-xl sticky top-0 w-full z-10 bg-background/95">
      <nav className="flex items-center gap-10 container font-semibold">
        <Link href="/" className="mr-auto">
          <BrandLogo />
        </Link>
        <Link className="text-lg" href="#">
          Features
        </Link>
        <Link className="text-lg" href="/#pricing">
          Pricing
        </Link>
        <Link className="text-lg" href="#">
          About
        </Link>
        <span className="text-lg">
          <Link href="/dashboard">Dashboard</Link>
          <Button>Login</Button>
        </span>
      </nav>
    </header>
  );
}
