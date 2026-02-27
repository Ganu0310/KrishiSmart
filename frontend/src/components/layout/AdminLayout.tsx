import { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
    LayoutDashboard,
    Users,
    FileText,
    LogOut,
    Menu,
    X,
    Sprout,
    Settings,
    Leaf
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function AdminLayout() {
    const { logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/admin/login");
    };

    const sidebarLinks = [
        { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
        { name: "User Management", path: "/admin/users", icon: Users },
        { name: "Content (CMS)", path: "/admin/content", icon: FileText },
        { name: "Fertilizers", path: "/admin/fertilizers", icon: Leaf },
        // { name: "Settings", path: "/admin/settings", icon: Settings }, // Future
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-slate-900 text-white w-64">
            <div className="p-6 flex items-center gap-2 font-display font-bold text-xl border-b border-slate-700">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                    <Sprout className="h-5 w-5" />
                </div>
                <span>Admin Panel</span>
            </div>

            <div className="flex-1 py-6 px-3 space-y-1">
                {sidebarLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                        <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/20"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                                }`}
                        >
                            <link.icon className="h-5 w-5" />
                            {link.name}
                        </Link>
                    );
                })}
            </div>

            <div className="p-4 border-t border-slate-700">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold">
                        {user?.name?.charAt(0) || "A"}
                    </div>
                    <div>
                        <p className="text-sm font-medium">{user?.name}</p>
                        <p className="text-xs text-slate-400">Administrator</p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    className="w-full justify-start gap-2 bg-red-600 hover:bg-red-700 text-white"
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block sticky top-0 h-screen">
                <SidebarContent />
            </aside>

            {/* Mobile Header & Sidebar */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="md:hidden bg-white border-b p-4 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                        <Sprout className="h-6 w-6 text-emerald-600" />
                        KrishiSmart Admin
                    </div>
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-r-slate-800 bg-slate-900 w-64 text-white">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
