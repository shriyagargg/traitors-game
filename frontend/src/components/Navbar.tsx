"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { CrownIcon } from "./CrownIcon";

interface NavbarProps {
  activeSection?: string;
}

export function Navbar({ activeSection = "home" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-7 pb-4 flex items-center justify-between z-30 relative">
      {/* Brand Logo & Name */}
      <Link href="/" className="flex items-center gap-3 group">
        <CrownIcon className="w-6 h-6 text-gold-antique transition-transform duration-300 group-hover:scale-105" />
        <span className="font-cinzel text-lg sm:text-xl font-bold tracking-[0.2em] text-text-main group-hover:text-gold-light transition-colors">
          AI TRAITORS
        </span>
      </Link>

      {/* Desktop Navigation Links & Action Buttons */}
      <div className="hidden md:flex items-center gap-8 lg:gap-10">
        <div className="flex items-center gap-7 lg:gap-9 text-sm">
          <Link
            href="/"
            className={`transition-colors py-1 ${
              activeSection === "home"
                ? "text-text-main font-medium border-b-2 border-gold-antique"
                : "text-text-secondary hover:text-text-main"
            }`}
          >
            Home
          </Link>
          <a
            href="#how-to-play"
            className="text-text-secondary hover:text-text-main transition-colors py-1"
          >
            How to Play
          </a>
          <a
            href="#the-architect"
            className="text-text-secondary hover:text-text-main transition-colors py-1"
          >
            The Architect
          </a>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3.5 pl-2">
          <Link
            href="/auth/login"
            className="border border-gold-antique/80 hover:border-gold-antique hover:bg-gold-antique/10 text-text-main px-5 py-1.5 rounded-lg text-sm font-medium transition duration-200 backdrop-blur-sm shadow-[0_0_10px_rgba(212,175,55,0.1)]"
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="bg-gold-light hover:bg-gold-antique text-background px-5 py-1.5 rounded-lg text-sm font-semibold transition duration-200 shadow-[0_0_18px_rgba(242,216,154,0.3)] hover:shadow-[0_0_22px_rgba(212,175,55,0.4)]"
          >
            Register
          </Link>
        </div>
      </div>

      {/* Mobile Menu Hamburger Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 text-text-secondary hover:text-gold-light transition"
        aria-label="Toggle navigation menu"
      >
        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-2 bg-bg-secondary/95 border border-purple-muted/40 backdrop-blur-xl rounded-2xl p-6 flex flex-col gap-4 shadow-2xl z-50">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-text-main font-medium py-2 border-b border-burgundy-deep"
          >
            Home
          </Link>
          <a
            href="#how-to-play"
            onClick={() => setMobileMenuOpen(false)}
            className="text-text-secondary hover:text-text-main py-2 border-b border-burgundy-deep"
          >
            How to Play
          </a>
          <a
            href="#the-architect"
            onClick={() => setMobileMenuOpen(false)}
            className="text-text-secondary hover:text-text-main py-2 border-b border-burgundy-deep"
          >
            The Architect
          </a>
          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/auth/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center border border-gold-antique/80 text-text-main py-2.5 rounded-lg text-sm font-medium"
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center bg-gold-light text-background py-2.5 rounded-lg text-sm font-semibold"
            >
              Register
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
