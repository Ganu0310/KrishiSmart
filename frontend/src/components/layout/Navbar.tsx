import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BASE_URL } from "@/services/api";
import { useTranslation } from "react-i18next";
import {
  Menu, LogOut, User, LayoutDashboard, CloudSun, IndianRupee,
  Droplets, Leaf, ShieldAlert, FileText, CloudRain, ChevronDown,
  Microscope, MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageToggle from "@/components/LanguageToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConfirmDialog from "@/components/ui/confirm-dialog";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const isFarmer = isAuthenticated && user?.role === "farmer";
  const isAdmin = isAuthenticated && user?.role === "admin";

  const handleLogout = () => {
    setShowLogoutDialog(false);
    logout();
    setIsOpen(false);
    navigate("/");
  };

  // ── Primary links: always visible in navbar ─────────────
  const primaryLinks = isFarmer
    ? [
        { name: t("nav.dashboard"), path: "/dashboard", icon: LayoutDashboard },
        { name: t("nav.advisory"), path: "/advisory", icon: CloudSun },
        { name: t("nav.market"), path: "/prices", icon: IndianRupee },
        { name: t("nav.disease"), path: "/disease", icon: Microscope },
      ]
    : isAdmin
    ? [{ name: "Admin Panel", path: "/admin/dashboard", icon: LayoutDashboard }]
    : [];

  // ── Secondary links: inside "More" dropdown ─────────────
  const moreLinks = isFarmer
    ? [
        { name: t("nav.forecast"), path: "/forecast", icon: CloudRain },
        { name: t("nav.irrigation"), path: "/irrigation", icon: Droplets },
        { name: t("nav.fertilizers"), path: "/fertilizers", icon: Leaf },
        { name: t("nav.pestRisk"), path: "/pest-risk", icon: ShieldAlert },
        { name: t("nav.schemes"), path: "/schemes", icon: FileText },
      ]
    : [];

  // ── All links merged for mobile sidebar ─────────────────
  const allLinks = [...primaryLinks, ...moreLinks];

  const isActive = (path: string) => location.pathname === path;
  const logoLink = isAdmin ? "/admin/dashboard" : isFarmer ? "/dashboard" : "/";

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to={logoLink} className="flex items-center gap-2 font-display font-bold text-xl hover:opacity-80 transition-opacity">
          <img src="/favicon.ico" alt="KrishiSmart" className="h-8 w-8" />
          <span className="hidden sm:inline-block">KrishiSmart</span>
        </Link>

        {/* ── Desktop Nav ────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-1">
          {/* Primary Links */}
          {primaryLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-md transition-colors ${
                isActive(link.path)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.name}
            </Link>
          ))}

          {/* "More" dropdown for secondary links */}
          {moreLinks.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground ${
                    moreLinks.some((l) => isActive(l.path)) ? "bg-primary/10 text-primary" : ""
                  }`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                  {t("nav.more") || "More"}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-52">
                {moreLinks.map((link) => (
                  <Link key={link.path} to={link.path}>
                    <DropdownMenuItem
                      className={`cursor-pointer gap-2 ${isActive(link.path) ? "bg-primary/10 text-primary" : ""}`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.name}
                    </DropdownMenuItem>
                  </Link>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <div className="w-px h-6 bg-border mx-1" />

          {/* Auth area */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 px-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {user?.profilePicture ? (
                      <img src={`${BASE_URL}/${user.profilePicture}`} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">{user?.name}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link to="/profile">
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    {t("nav.profile") || "Profile"}
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">{t("nav.login")}</Button>
              </Link>
              <Link to="/login">
                <Button size="sm">{t("nav.getStarted")}</Button>
              </Link>
            </div>
          )}

          <LanguageToggle />
        </div>

        {/* ── Mobile Nav ─────────────────────────────────── */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageToggle />
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <div className="flex flex-col gap-4 mt-6">
                {/* Mobile Logo */}
                <div className="flex items-center gap-2 font-display font-bold text-xl mb-2">
                  <img src="/favicon.ico" alt="KrishiSmart" className="h-6 w-6" />
                  KrishiSmart
                </div>

                {/* Mobile Links */}
                <div className="flex flex-col gap-1">
                  {allLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive(link.path)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.name}
                    </Link>
                  ))}
                </div>

                {/* Mobile User Section */}
                {isAuthenticated ? (
                  <div className="mt-auto border-t pt-4">
                    <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {user?.profilePicture ? (
                          <img src={`${BASE_URL}/${user.profilePicture}`} alt={user?.name} className="h-full w-full object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user?.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                      </div>
                    </Link>
                    <Button variant="destructive" className="w-full gap-2 mt-3" onClick={() => setShowLogoutDialog(true)}>
                      <LogOut className="h-4 w-4" />
                      {t("nav.logout")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 mt-auto border-t pt-4">
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">{t("nav.login")}</Button>
                    </Link>
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <Button className="w-full">{t("nav.getStarted")}</Button>
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Logout Confirmation */}
      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="Confirm Logout"
        description="Are you sure you want to logout? You will need to login again to access your account."
        confirmLabel="Logout"
        cancelLabel="Cancel"
        onConfirm={handleLogout}
        variant="destructive"
      />
    </nav>
  );
}
