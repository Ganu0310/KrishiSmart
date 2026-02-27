import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BASE_URL } from "@/services/api";
import { Menu, X, LogOut, User, LayoutDashboard, CloudSun, IndianRupee, Droplets, Leaf, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    const [isOpen, setIsOpen] = useState(false);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);

    const handleLogout = () => {
        setShowLogoutDialog(false);
        logout();
        setIsOpen(false);
        navigate("/");
    };

    const navLinks = [
        { name: "Home", path: "/", public: true },
        { name: "Features", path: "/#features", public: true },
        { name: "Dashboard", path: "/dashboard", role: "farmer", icon: LayoutDashboard },
        { name: "Advisory", path: "/advisory", role: "farmer", icon: CloudSun },
        { name: "Market Prices", path: "/prices", role: "farmer", icon: IndianRupee },
        { name: "Fertilizers", path: "/fertilizers", role: "farmer", icon: Leaf },
        { name: "Irrigation", path: "/irrigation", role: "farmer", icon: Droplets },
        { name: "Admin Panel", path: "/admin/dashboard", role: "admin", icon: LayoutDashboard },
    ];

    const filteredLinks = navLinks.filter((link) => {
        if (link.public && !isAuthenticated) return true;
        // Show Home link even if authenticated
        if (link.path === "/" && isAuthenticated) return true;
        if (link.public && isAuthenticated) return false; // Hide other public links (like features) from logged-in view if desired temp
        if (link.role && user?.role === link.role) return true;
        return false;
    });

    // Always show Home for mobile convenience or logo link
    const logoLink = isAuthenticated ? (user?.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/';

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                {/* Logo */}
                <Link to={logoLink} className="flex items-center gap-2 font-display font-bold text-xl hover:opacity-80 transition-opacity">
                    <img src="/favicon.ico" alt="KrishiSmart Logo" className="h-8 w-8" />
                    <span className="hidden sm:inline-block">KrishiSmart</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    {filteredLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname === link.path ? "text-primary" : "text-muted-foreground"
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="gap-2">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                                        {user?.profilePicture ? (
                                            <img src={`${BASE_URL}/${user.profilePicture}`} alt={user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                    <span className="text-sm font-medium">{user?.name}</span>
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div>
                                        <p className="font-medium">{user?.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link to="/profile">
                                    <DropdownMenuItem className="cursor-pointer">
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </DropdownMenuItem>
                                </Link>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setShowLogoutDialog(true)} className="text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link to="/login">
                                <Button variant="ghost" size="sm">Log In</Button>
                            </Link>
                            <Link to="/login">
                                <Button size="sm">Get Started</Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile Nav */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild className="md:hidden">
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                        <div className="flex flex-col gap-6 mt-6">
                            <div className="flex items-center gap-2 font-display font-bold text-xl mb-4">
                                <img src="/favicon.ico" alt="KrishiSmart Logo" className="h-6 w-6" />
                                KrishiSmart
                            </div>

                            <div className="flex flex-col gap-2">
                                {filteredLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${location.pathname === link.path
                                            ? "bg-primary/10 text-primary"
                                            : "hover:bg-muted text-foreground"
                                            }`}
                                    >
                                        {link.icon && <link.icon className="h-4 w-4" />}
                                        {link.name}
                                    </Link>
                                ))}
                            </div>

                            {isAuthenticated ? (
                                <div className="mt-auto border-t pt-6">
                                    <div className="flex items-center gap-3 px-4 mb-4">
                                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                                            <User className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{user?.name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                                        </div>
                                    </div>
                                    <Button variant="destructive" className="w-full gap-2" onClick={() => setShowLogoutDialog(true)}>
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3 mt-auto">
                                    <Link to="/login" onClick={() => setIsOpen(false)}>
                                        <Button variant="outline" className="w-full">Log In</Button>
                                    </Link>
                                    <Link to="/login" onClick={() => setIsOpen(false)}>
                                        <Button className="w-full">Get Started</Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Logout Confirmation Dialog */}
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
