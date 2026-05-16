import { Link, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Briefcase, CheckSquare, LogOut, Menu, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/projects", label: "Projects", icon: Briefcase },
    { href: "/my-tasks", label: "My Tasks", icon: CheckSquare },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col sidebar-bg">
      {/* Logo */}
      <div className="flex h-14 items-center px-5 gap-2.5 border-b border-sidebar-border">
        <div className="h-7 w-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center animate-border-glow flex-shrink-0">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
        </div>
        <span className="font-bold text-base tracking-tight text-sidebar-foreground">
          Task<span className="text-primary">Cockpit</span>
        </span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-auto py-5 px-3">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
          Navigation
        </p>
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = location === item.href || location.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium cursor-pointer transition-all duration-200 ${
                    isActive
                      ? "nav-item-active text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-sidebar-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                  {item.label}
                  {isActive && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors duration-200 group">
          <Avatar className="h-8 w-8 border border-primary/20 flex-shrink-0">
            <AvatarFallback className="bg-primary/15 text-primary text-xs font-bold">
              {user?.name ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 overflow-hidden min-w-0">
            <span className="text-sm font-semibold text-sidebar-foreground truncate">{user?.name}</span>
            <span className="text-xs text-muted-foreground capitalize">{user?.role}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-200 flex-shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden w-[220px] flex-col border-r border-sidebar-border md:flex flex-shrink-0">
        <SidebarContent />
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-md px-4 md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[220px] p-0 border-sidebar-border">
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 font-bold text-base">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Task<span className="text-primary">Cockpit</span></span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="h-full px-5 py-6 md:px-8 md:py-8 animate-in-hero">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
