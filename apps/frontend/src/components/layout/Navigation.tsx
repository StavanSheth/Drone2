"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Navigation = () => {
  const pathname = usePathname();
  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/missions", label: "Missions" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <nav className="flex items-center gap-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`px-3 py-1.5 rounded text-sm font-medium transition ${
            pathname === l.href ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-white"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
};
