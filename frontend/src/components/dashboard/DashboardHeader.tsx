"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Home,
  Gamepad2,
  Users,
  BookOpen,
  Bell,
  ChevronDown,
  User as UserIcon,
  Settings as SettingsIcon,
  LogOut,
  X,
  Menu,
} from "lucide-react";
import { CrownIcon } from "../CrownIcon";
import { MOCK_NOTIFICATIONS, PlayerProfile } from "@/services/dashboard";

interface DashboardHeaderProps {
  activeNav?: "dashboard" | "create" | "join" | "how-to-play";
  profile: PlayerProfile;
  onToggleMobileSidebar?: () => void;
}

export function DashboardHeader({
  activeNav = "dashboard",
  profile,
  onToggleMobileSidebar,
}: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <header className="w-full border-b border-gold-antique/20 bg-[#09060D]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between">
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
            <CrownIcon className="w-5 h-5 text-gold-antique group-hover:scale-105 transition-transform" />
            <span className="font-cinzel text-base sm:text-lg font-bold tracking-[0.16em] text-gold-gradient">
              AI TRAITORS
            </span>
          </div>
          <span className="font-cinzel text-[9px] tracking-[0.3em] text-gold-antique/70 pl-7">
            THE ARCHITECT
          </span>
        </Link>
      </div>

      {/* 2. Center: Top Action Navigation Bar */}
      <nav className="hidden md:flex items-center gap-2 lg:gap-3">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition duration-200 ${
            activeNav === "dashboard"
              ? "bg-[#1A0E1C] border border-gold-antique/40 text-gold-light shadow-[0_0_12px_rgba(212,175,55,0.15)]"
              : "text-text-secondary hover:text-text-main hover:bg-[#120A14]"
          }`}
        >
          <Home className="w-4 h-4 text-gold-antique" />
          <span>Dashboard</span>
        </Link>

        {/* Create Game */}
        <Link
          href="/lobby/create"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition duration-200 ${
            activeNav === "create"
              ? "bg-[#1A0E1C] border border-gold-antique/40 text-gold-light shadow-[0_0_12px_rgba(212,175,55,0.15)]"
              : "text-text-secondary hover:text-text-main hover:bg-[#120A14]"
          }`}
        >
          <Gamepad2 className="w-4 h-4 text-gold-antique" />
          <span>Create Game</span>
        </Link>

        {/* Join Game */}
        <Link
          href="/lobby/join"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition duration-200 ${
            activeNav === "join"
              ? "bg-[#1A0E1C] border border-gold-antique/40 text-gold-light shadow-[0_0_12px_rgba(212,175,55,0.15)]"
              : "text-text-secondary hover:text-text-main hover:bg-[#120A14]"
          }`}
        >
          <Users className="w-4 h-4 text-gold-antique" />
          <span>Join Game</span>
        </Link>

        {/* How to Play */}
        <Link
          href="/#how-to-play"
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition duration-200 ${
            activeNav === "how-to-play"
              ? "bg-[#1A0E1C] border border-gold-antique/40 text-gold-light shadow-[0_0_12px_rgba(212,175,55,0.15)]"
              : "text-text-secondary hover:text-text-main hover:bg-[#120A14]"
          }`}
        >
          <BookOpen className="w-4 h-4 text-gold-antique" />
          <span>How to Play</span>
        </Link>
      </nav>

      {/* 3. Right: Notifications & Profile Avatar */}
      <div className="flex items-center gap-3 sm:gap-4 relative">
        {/* Notification Bell Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="p-2 rounded-xl bg-[#120A14] hover:bg-[#1A0E1C] border border-gold-antique/20 text-text-secondary hover:text-gold-light transition duration-200 relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4 text-gold-antique" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 sm:w-88 rounded-2xl bg-[#120A14]/95 border border-gold-antique/30 backdrop-blur-2xl p-4 shadow-2xl z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-gold-antique/15">
                <span className="font-cinzel text-xs font-bold tracking-wider text-text-main">
                  Council Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] font-sans text-gold-antique hover:text-gold-light"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2.5 py-3 max-h-64 overflow-y-auto">
                {notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-xl border text-xs font-sans transition ${
                      item.read
                        ? "bg-[#170C1B]/40 border-gold-antique/10 text-text-secondary"
                        : "bg-[#1A0E1C] border-gold-antique/30 text-text-main font-medium shadow-sm"
                    }`}
                  >
                    <p>{item.title}</p>
                    <span className="text-[10px] text-text-secondary/70 mt-1 block">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Player Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-[#120A14] transition"
            aria-label="User profile settings"
          >
            <div className="relative w-8 h-8 rounded-full border border-gold-antique/70 overflow-hidden shadow-[0_0_10px_rgba(212,175,55,0.3)]">
              <Image
                src={profile.avatarUrl}
                alt={profile.name}
                fill
                sizes="32px"
                unoptimized
                className="object-cover"
              />
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#120A14]/95 border border-gold-antique/30 backdrop-blur-2xl p-3 shadow-2xl z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-gold-antique/15">
                <p className="font-cinzel text-xs font-bold text-text-main">{profile.name}</p>
                <p className="text-[11px] font-sans text-text-secondary/70">{profile.email}</p>
              </div>

              <div className="flex flex-col gap-1 pt-2">
                <Link
                  href="/dashboard/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-sans text-text-secondary hover:text-gold-light hover:bg-[#1A0E1C] transition"
                >
                  <UserIcon className="w-4 h-4 text-gold-antique" />
                  <span>My Profile</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-sans text-text-secondary hover:text-gold-light hover:bg-[#1A0E1C] transition"
                >
                  <SettingsIcon className="w-4 h-4 text-gold-antique" />
                  <span>Settings</span>
                </Link>
                <Link
                  href="/auth/login"
                  onClick={() => setShowProfileMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-sans text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition border-t border-gold-antique/10 mt-1 pt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
