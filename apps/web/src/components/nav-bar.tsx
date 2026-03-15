"use client";

import {
    FolderOpenIcon,
    NetworkIcon,
    SearchIcon,
    ShieldIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/", label: "Dashboard", icon: ShieldIcon },
    { href: "/search", label: "Search", icon: SearchIcon },
    { href: "/investigations", label: "Investigations", icon: FolderOpenIcon },
    { href: "/graph", label: "Graph", icon: NetworkIcon },
];

export function NavBar() {
    const pathname = usePathname();

    return (
        <nav className="border-b border-primary/20 bg-background/80 backdrop-blur-md">
            <div className="flex h-12 items-center gap-6 px-6">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-primary animate-pulse-glow" />
                    <span className="font-display text-base font-bold uppercase tracking-widest text-primary text-glow-cyan">
                        ARGUS
                    </span>
                </Link>

                {/* Nav items */}
                <div className="flex items-center gap-1">
                    {navItems.map(({ href, label, icon: Icon }) => {
                        const isActive =
                            href === "/"
                                ? pathname === "/"
                                : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-colors relative",
                                    isActive
                                        ? "text-primary glow-subtle after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-primary after:content-['']"
                                        : "text-muted-foreground hover:text-foreground",
                                )}
                            >
                                <Icon className="size-3.5" />
                                {label}
                            </Link>
                        );
                    })}
                </div>

                {/* Status indicator */}
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground animate-flicker">
                        SYS ONLINE
                    </span>
                    <span className="size-2 rounded-full bg-neon-green animate-pulse-glow" />
                </div>
            </div>
        </nav>
    );
}
