"use client";

import React from "react";
import Link from "next/link";
import {
  Home,
  User,
  History,
  BarChart2,
  Settings,
  X,
} from "lucide-react";

export type SidebarTab =
  | "dashboard"
  | "profile"
  | "history"
  | "statistics"
  | "settings";

interface DashboardSidebarProps {
  activeTab?: SidebarTab;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export function DashboardSidebar({
  activeTab = "dashboard",
  isOpenMobile = false,
  onCloseMobile,
}: DashboardSidebarProps) {
  const navItems = [
    {
      id: "dashboard" as SidebarTab,
      label: "Dashboard",
      icon: Home,
      href: "/dashboard",
    },
    {
      id: "profile" as SidebarTab,
      label: "My Profile",
      icon: User,
      href: "/dashboard/profile",
    },
    {
      id: "history" as SidebarTab,
      label: "Match History",
      icon: History,
      href: "/dashboard/history",
    },
    {
      id: "statistics" as SidebarTab,
      label: "Statistics",
      icon: BarChart2,
      href: "/dashboard/statistics",
    },
    {
      id: "settings" as SidebarTab,
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[65px] left-0 h-full lg:h-[calc(100vh-65px)] w-56 shrink-0 bg-[#09060D]/95 lg:bg-transparent border-r border-gold-antique/15 p-4 z-50 transition-transform duration-300 lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile Header with Close button */}
        <div className="lg:hidden flex items-center justify-between pb-4 mb-4 border-b border-gold-antique/15">
          <span className="font-cinzel text-xs font-bold text-gold-gradient tracking-wider">
            COUNCIL NAVIGATION
          </span>
          <button
            onClick={onCloseMobile}
            className="p-1 text-text-secondary hover:text-gold-light"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex flex-col gap-2 pt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onCloseMobile}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-sans transition-all duration-200 ${
                  isActive
                    ? "bg-[#281023] border border-gold-antique/35 text-gold-light font-medium shadow-[0_0_15px_rgba(212,175,55,0.12)]"
                    : "text-text-secondary hover:text-text-main hover:bg-[#170C1B]/70"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? "text-gold-antique" : "text-text-secondary"
                  }`}
                />
                <span className="tracking-wide">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
