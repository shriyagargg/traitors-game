"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPlayerSession, clearPlayerSession } from "@/services/playerSession";
import Link from "next/link";
import {
  Home,
  Gamepad2,
  Users,
  BookOpen,
  ChevronDown,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  Menu,
} from "lucide-react";
import { CrownIcon } from "../CrownIcon";
import { PlayerProfile } from "@/services/dashboard";

interface DashboardHeaderProps {
  activeNav?: "dashboard" | "create" | "join" | "how-to-play";
  profile: PlayerProfile;
  onToggleMobileSidebar?: () => void;
}

export function DashboardHeader({
  activeNav = "dashboard",
  profile: initialProfile,
  onToggleMobileSidebar,
}: DashboardHeaderProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profile, setProfile] = useState<PlayerProfile>(initialProfile || { name: "", email: "", avatarUrl: "" });
  const router = useRouter();

  useEffect(() => {
    try {
      const session = getPlayerSession();
      if (session?.name) {
        setProfile({
          name: session.name,
          email: session.email || "",
          avatarUrl: session.avatarUrl || "",
          roleBadge: initialProfile?.roleBadge || "Council Initiate",
        });
      }
    } catch {}
  }, [initialProfile]);

  return (
    <header className="w-full border-b border-white/10 bg-[#100d13]/95 backdrop-blur sticky top-0 z-40 px-4 sm:px-8 py-3 flex items-center justify-between">
      {/* 1. Left: Brand & Mobile Sidebar Toggle */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-1.5 text-text-secondary hover:text-gold-light transition"
            aria-label="Toggle navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link href="/" className="flex flex-col text-left group">
          <div className="flex items-center gap-2">
            <CrownIcon className="w-5 h-5 text-[#c4a6d2] group-hover:scale-105 transition-transform" />
            <span className="text-sm font-bold tracking-[0.12em] text-white">
              AI TRAITORS
            </span>
          </div>
          <span className="text-[9px] tracking-[0.24em] text-[#a89fac] pl-7">
            THE ARCHITECT
          </span>
        </Link>
      </div>

      {/* 2. Center: Top Action Navigation Bar */}
      <nav className="hidden md:flex items-center gap-2 lg:gap-3">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition duration-200 ${
            activeNav === "dashboard"
              ? "bg-white/10 border border-white/10 text-white"
              : "text-[#b9b0bd] hover:text-white hover:bg-white/5"
          }`}
        >
          <Home className="w-4 h-4 text-[#c4a6d2]" />
          <span>Dashboard</span>
        </Link>

        {/* Create Game */}
        <Link
          href="/lobby/create"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition duration-200 ${
            activeNav === "create"
              ? "bg-white/10 border border-white/10 text-white"
              : "text-[#b9b0bd] hover:text-white hover:bg-white/5"
          }`}
        >
          <Gamepad2 className="w-4 h-4 text-[#c4a6d2]" />
          <span>Create Game</span>
        </Link>

        {/* Join Game */}
        <Link
          href="/lobby/join"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition duration-200 ${
            activeNav === "join"
              ? "bg-white/10 border border-white/10 text-white"
              : "text-[#b9b0bd] hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4 text-[#c4a6d2]" />
          <span>Join Game</span>
        </Link>

        {/* How to Play */}
        <Link
          href="/#how-to-play"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition duration-200 ${
            activeNav === "how-to-play"
              ? "bg-white/10 border border-white/10 text-white"
              : "text-[#b9b0bd] hover:text-white hover:bg-white/5"
          }`}
        >
          <BookOpen className="w-4 h-4 text-[#c4a6d2]" />
          <span>How to Play</span>
        </Link>
      </nav>

      {/* 3. Right: Notifications & Profile Avatar */}
      <div className="flex items-center gap-3 sm:gap-4 relative">
        {/* Player Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
            }}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-[#120A14] transition"
            aria-label="User profile settings"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#28232d] text-xs font-semibold text-white">{profile.name?.slice(0, 1).toUpperCase() || "?"}</div>
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 rounded-lg bg-[#211c25] border border-white/10 p-3 shadow-xl z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-white/10">
                <p className="font-cinzel text-xs font-bold text-text-main">{profile.name}</p>
                <p className="text-[11px] font-sans text-text-secondary/70">{profile.email}</p>
              </div>

              <div className="flex flex-col gap-1 pt-2">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans text-text-secondary hover:text-gold-light hover:bg-[#1A0E1C] transition"
                >
                  <UserIcon className="w-4 h-4 text-[#c4a6d2]" />
                  <span>My Profile</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans text-text-secondary hover:text-gold-light hover:bg-[#1A0E1C] transition"
                >
                  <SettingsIcon className="w-4 h-4 text-[#c4a6d2]" />
                  <span>Settings</span>
                </Link>
                <button
                  type="button"
                  onClick={() => { clearPlayerSession(); setShowProfileMenu(false); router.replace("/auth/login"); }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-sans text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition border-t border-gold-antique/10 mt-1 pt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
