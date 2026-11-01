import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  FolderTree,
  LogOut,
  Menu,
  Package,
  PlusCircle,
  Settings,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/store/SiteLayout";
import { adminAuth } from "@/lib/db";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: () => {
    if (!adminAuth.isSignedIn()) throw redirect({ to: "/admin/login" });
  },
  head: () => ({
    meta: [{ title: "Admin | THE VIJAY STORE" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: BarChart3, exact: true },
  { to: "/admin/products", label: "Manage products", icon: Package, exact: true },
  { to: "/admin/products/new", label: "Add product", icon: PlusCircle, exact: true },
  { to: "/admin/categories", label: "Categories", icon: FolderTree, exact: true },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, exact: true },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart, exact: false },
  { to: "/admin/customers", label: "Customers", icon: Users, exact: true },
  { to: "/admin/settings", label: "Settings", icon: Settings, exact: true },
] as const;

function AdminLayout() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const signOut = () => {
    adminAuth.signOut();
    void navigate({ to: "/admin/login" });
  };
  const nav = (
    <nav className="flex flex-col gap-1" onClick={() => setOpen(false)}>
      {NAV.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          activeOptions={{ exact: n.exact }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          }}
        >
          <n.icon className="h-4 w-4" /> {n.label}
        </Link>
      ))}
      <div className="my-3 border-t border-sidebar-border" />
      <Link
        to="/"
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-sidebar-accent"
      >
        <Store className="h-4 w-4" /> View store
      </Link>
      <button
        onClick={signOut}
        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm hover:bg-sidebar-accent"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </nav>
  );

  return (
    <div className="min-h-screen bg-secondary/40 text-foreground md:grid md:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar p-4 md:block">
        <Link to="/admin" className="mb-1 block px-3">
          <Logo className="text-base" />
        </Link>
        <p className="mb-6 px-3 text-[10px] tracking-widest text-gold uppercase">Demo admin</p>
        {nav}
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
          <button aria-label="Open admin menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Logo className="text-base" />
          <span className="w-5" />
        </header>
        <div className="border-b border-gold/40 bg-gold/10 px-4 py-2 text-xs">
          <strong>Local demo admin mode.</strong> Data and the passcode are stored in this browser
          only — this is not production-grade security.
        </div>
        <main className="p-4 md:p-8">
          <Outlet />
        </main>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 bg-sidebar p-4">
          <SheetTitle className="mb-6 px-3">
            <Logo className="text-base" />
          </SheetTitle>
          {nav}
        </SheetContent>
      </Sheet>
    </div>
  );
}
