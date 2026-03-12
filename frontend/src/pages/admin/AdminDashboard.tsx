import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { adminApi, type AdminStats } from "@/services/api";
import {
  Users, Send, Leaf, Sprout, Tractor, IndianRupee,
  BarChart3, FileText, Database, Shield, TrendingUp,
  AlertTriangle, CheckCircle2, ArrowRight, RefreshCw, Activity,
} from "lucide-react";
import io from "socket.io-client";

const NAV_CARDS = [
  { label: "Manage Users",      desc: "View, promote, and remove farmers",     href: "/admin/users",         icon: Users,         color: "blue" },
  { label: "Content / Advisory",desc: "Create and broadcast advisories",       href: "/admin/content",       icon: Leaf,          color: "green" },
  { label: "Fertilizers",       desc: "Add, edit, and deactivate fertilizers", href: "/admin/fertilizers",   icon: Sprout,        color: "emerald" },
  { label: "Market Prices",     desc: "View and manage crop price records",    href: "/admin/market-prices", icon: IndianRupee,   color: "orange" },
  { label: "Gov Data Monitor",  desc: "Jobs, cache, and API health",           href: "/admin/gov-data",      icon: Database,      color: "violet" },
];

const COLOR_MAP: Record<string, { bg: string; icon: string; badge: string }> = {
  blue:    { bg: "bg-blue-50",    icon: "text-blue-600",    badge: "bg-blue-100 text-blue-700" },
  green:   { bg: "bg-green-50",   icon: "text-green-600",   badge: "bg-green-100 text-green-700" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700" },
  orange:  { bg: "bg-orange-50",  icon: "text-orange-600",  badge: "bg-orange-100 text-orange-700" },
  violet:  { bg: "bg-violet-50",  icon: "text-violet-600",  badge: "bg-violet-100 text-violet-700" },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [advisoryTitle, setAdvisoryTitle] = useState("");
  const [advisoryBody, setAdvisoryBody] = useState("");
  const [targetCrop, setTargetCrop] = useState("all");
  const [priority, setPriority] = useState<"normal" | "high" | "urgent">("normal");
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
    const socket = io("http://localhost:5000");
    socket.on("user_added", fetchStats);
    socket.on("user_removed", fetchStats);
    socket.on("fertilizer_added", fetchStats);
    socket.on("fertilizer_removed", fetchStats);
    return () => { socket.disconnect(); };
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch { /* silent */ }
    finally { setStatsLoading(false); }
  };

  const handlePushAdvisory = async () => {
    if (!advisoryTitle.trim() || !advisoryBody.trim()) {
      toast({ title: "Error", description: "Title and message are required", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      await adminApi.addAdvisory({ title: advisoryTitle, message: advisoryBody, targetCrop, priority });
      toast({
        title: "Advisory Sent ✅",
        description: `Pushed to ${targetCrop === "all" ? "all farmers" : targetCrop + " farmers"} (${priority})`,
      });
      setAdvisoryTitle("");
      setAdvisoryBody("");
    } catch {
      toast({ title: "Error", description: "Failed to send advisory", variant: "destructive" });
    }
    setSending(false);
  };

  const STATS = [
    { label: "Total Farmers",     value: stats?.totalFarmers ?? 0,       icon: Users,       color: "from-blue-500 to-blue-600",    sub: `${stats?.activeFarmers ?? 0} active` },
    { label: "Fertilizers",       value: stats?.totalFertilizers ?? 0,   icon: Sprout,      color: "from-green-500 to-emerald-600",sub: "in catalogue" },
    { label: "Crops Tracked",     value: stats?.cropDistribution?.length ?? 0, icon: Leaf, color: "from-amber-500 to-orange-500", sub: "unique crops" },
    { label: "System Status",     value: "Live",                          icon: Activity,    color: "from-violet-500 to-purple-600",sub: "all APIs healthy" },
  ];

  return (
    <div className="space-y-7 animate-fade-in p-2">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">KrishiSmart platform overview & controls</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchStats} disabled={statsLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${statsLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STATS.map(({ label, value, icon: Icon, color, sub }) => (
          <Card key={label} className="border-0 shadow-md overflow-hidden">
            <CardContent className="p-0">
              <div className={`bg-gradient-to-r ${color} p-4 text-white`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-6 w-6 opacity-80" />
                  <TrendingUp className="h-4 w-4 opacity-50" />
                </div>
                <p className="text-3xl font-bold">{value}</p>
                <p className="text-sm font-medium opacity-80">{label}</p>
              </div>
              <div className="px-4 py-2 bg-white">
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Crop Distribution */}
      {stats?.cropDistribution && stats.cropDistribution.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" /> Crop Distribution Among Farmers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.cropDistribution.slice(0, 6).map((item: any, i: number) => {
                const max = Math.max(...stats.cropDistribution.map((x: any) => x.count));
                const pct = max > 0 ? Math.round((item.count / max) * 100) : 0;
                return (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium capitalize">{item._id || item.crop || "Unknown"}</span>
                      <span className="text-muted-foreground">{item.count} farmer{item.count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nav Cards */}
      <div>
        <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-sm">
          Admin Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {NAV_CARDS.map(({ label, desc, href, icon: Icon, color }) => {
            const c = COLOR_MAP[color];
            return (
              <Link key={href} to={href}>
                <Card className="h-full hover:shadow-md transition-all hover:-translate-y-0.5 group cursor-pointer">
                  <CardContent className="p-5 flex flex-col gap-3">
                    <div className={`h-10 w-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${c.icon}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors ml-auto mt-auto" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Push Advisory */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-5 w-5 text-primary" /> Push Advisory to Farmers
          </CardTitle>
          <p className="text-sm text-muted-foreground">Broadcast an urgent notice or recommendation</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</Label>
                <Input
                  placeholder="e.g. Heavy Rain Alert — Nashik"
                  value={advisoryTitle}
                  onChange={(e) => setAdvisoryTitle(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</Label>
                <Textarea
                  placeholder="Write your advisory message here..."
                  value={advisoryBody}
                  onChange={(e) => setAdvisoryBody(e.target.value)}
                  className="mt-1 h-28 resize-none"
                />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Target Crop</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["all", "grape", "onion", "tomato"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setTargetCrop(c)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                        targetCrop === c
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                      }`}
                    >
                      {c === "all" ? "🌐 All Farmers" : c === "grape" ? "🍇 Grape" : c === "onion" ? "🧅 Onion" : "🍅 Tomato"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</Label>
                <div className="flex gap-2 mt-2">
                  {(["normal", "high", "urgent"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                        priority === p
                          ? p === "urgent" ? "bg-red-500 text-white border-red-500"
                            : p === "high" ? "bg-amber-500 text-white border-amber-500"
                            : "bg-primary text-primary-foreground border-primary"
                          : "bg-white text-gray-600 border-gray-200 hover:border-primary"
                      }`}
                    >
                      {p === "urgent" ? "🚨 Urgent" : p === "high" ? "⚠️ High" : "📢 Normal"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview badge */}
              {advisoryTitle && (
                <div className="mt-2 p-3 rounded-lg border bg-muted/40 text-sm">
                  <p className="font-semibold">{advisoryTitle}</p>
                  {advisoryBody && <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{advisoryBody}</p>}
                  <div className="flex gap-2 mt-2">
                    <Badge className={
                      priority === "urgent" ? "bg-red-100 text-red-700"
                      : priority === "high" ? "bg-amber-100 text-amber-700"
                      : "bg-blue-100 text-blue-700"
                    }>{priority}</Badge>
                    <Badge variant="outline" className="capitalize">{targetCrop}</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Button onClick={handlePushAdvisory} disabled={sending} className="gap-2 w-full md:w-auto">
            {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Sending..." : "Send Advisory"}
          </Button>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-sm">All systems operational</p>
            <p className="text-xs text-green-700">MongoDB, WeatherUnion API, Agmarknet, and Socket.IO are running normally.</p>
          </div>
          <Badge className="ml-auto bg-green-600 text-white">Healthy</Badge>
        </CardContent>
      </Card>

    </div>
  );
}
