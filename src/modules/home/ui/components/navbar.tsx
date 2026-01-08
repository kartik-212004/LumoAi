"use client";
import Link from "next/link";
import Image from "next/image";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import UserControl from "@/components/user-control";
import { useScroll } from "@/hooks/use-scroll";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "@/components/theme-switcher";
export default function Navbar() {
  const isScrolled = useScroll();
  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b border-transparent p-4 transition-all duration-200",
        isScrolled
          ? "border-border/60 bg-background/90 backdrop-blur"
          : "bg-transparent"
      )}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-black to-neutral-800 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)]">
            <Image src="/logo.svg" alt="lumo" width={22} height={22} />
          </div>
          <span className="text-lg font-semibold">Lumo</span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <SignedOut>
            <div className="flex gap-2">
              <SignUpButton>
                <Button variant="outline" size="sm" className="rounded-full border-border/70 bg-white/70 text-foreground hover:bg-white dark:bg-white/10">
                  Sign Up
                </Button>
              </SignUpButton>
              <SignInButton>
                <Button size="sm" className="rounded-full bg-gradient-to-r from-black to-neutral-800 text-white shadow-[0_10px_30px_-12px_rgba(0,0,0,0.55)] hover:opacity-90">
                  Sign In
                </Button>
              </SignInButton>
            </div>
          </SignedOut>
          <SignedIn>
            <UserControl showName />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
