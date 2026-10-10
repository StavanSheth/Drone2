"use client";
import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map, ShoppingBag, Image as ImageIcon, Settings,
  MessageSquare, LayoutGrid, Database, Radio, LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mainMenu = [
  { id: "dashboard", label: "Dashboard", icon: Map, href: "/dashboard" },
  { id: "api-marketplace", label: "API Market Place", icon: ShoppingBag, href: "/dashboard?tab=marketplace" },
  { id: "chatbot", label: "Chatbot (RAG)", icon: MessageSquare, href: "/dashboard?tab=chatbot" },
  { id: "mission-images", label: "Mission Images", icon: ImageIcon, href: "/dashboard?tab=images" },
];

const systemMenu = [
  { id: "settings", label: "Hardware & Settings", icon: Settings, href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 88 : 272 }}
      className="h-screen flex flex-col relative z-20 shrink-0 bg-[#101415] transition-all duration-300 ease-in-out border-r border-white/10 font-hanken text-white"
    >
      {/* Brand */}
      <div className="flex items-center px-6 h-24 shrink-0 relative border-b border-white/5">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white/70 hover:bg-white/[0.08] hover:text-white shrink-0 relative z-10 w-9 h-9 rounded-xl transition-all"
        >
          <LayoutGrid className="w-5 h-5 text-[#ff6415]" />
        </Button>
        
        <AnimatePresence>
          {!isCollapsed && (
             <motion.div 
               initial={{ opacity: 0, x: -10 }} 
               animate={{ opacity: 1, x: 0 }} 
               exit={{ opacity: 0, x: -10, transition: { duration: 0.1 } }} 
               className="flex items-center gap-3 ml-3 overflow-hidden whitespace-nowrap"
             >
               <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#ff6415]/15 border border-[#ff6415]/30">
                 <span className="material-symbols-outlined text-[#ff6415] text-[18px]">
                   flight_takeoff
                 </span>
               </div>
               <div>
                 <h1 className="text-[15px] font-bold tracking-tight text-white leading-tight">
                   StatWing Sys
                 </h1>
                 <p className="text-[10px] text-white/50 font-normal leading-none">
                   Tactical Command
                 </p>
               </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 py-6 px-4 space-y-6 overflow-y-auto overflow-x-hidden">
        {/* Main Menu */}
        <div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] font-bold tracking-[0.15em] text-white/40 uppercase mb-3 px-3"
              >
                Main Controls
              </motion.p>
            )}
          </AnimatePresence>

          <nav className="space-y-1.5">
            {mainMenu.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard");
              
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-[16px] text-[13px] font-medium transition-all text-left",
                    isActive
                      ? "bg-[#f45b0b] text-white shadow-[0_7px_18px_rgba(244,91,11,0.22)] font-semibold"
                      : "text-white/65 hover:text-white hover:bg-white/[0.07]"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-white/70")} />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Menu */}
        <div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="text-[10px] font-bold tracking-[0.15em] text-white/40 uppercase mb-3 px-3"
              >
                System & Hardware
              </motion.p>
            )}
          </AnimatePresence>

          <nav className="space-y-1.5">
            {systemMenu.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-[16px] text-[13px] font-medium transition-all text-left",
                    isActive
                      ? "bg-[#f45b0b] text-white shadow-[0_7px_18px_rgba(244,91,11,0.22)] font-semibold"
                      : "text-white/65 hover:text-white hover:bg-white/[0.07]"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-white/70")} />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer / Exit */}
      <div className="p-4 border-t border-white/5 space-y-2">
        <button
          onClick={() => router.push("/")}
          className="w-full flex items-center gap-3 px-3.5 py-2 rounded-[14px] text-[12px] text-white/50 hover:text-[#ff6415] hover:bg-white/[0.05] transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Logout / Access</span>}
        </button>
      </div>
    </motion.aside>
  );
}
