import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { adminApi, type AdminStats } from "@/services/api";
import {
  Users,
  Send,
  Leaf,
  Sprout,
  Tractor,
} from "lucide-react";
import io from 'socket.io-client';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [advisoryTitle, setAdvisoryTitle] = useState("");
  const [advisoryBody, setAdvisoryBody] = useState("");
  const [targetCrop, setTargetCrop] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();

    // Real-time updates
    const socket = io('http://localhost:5000');

    // Listen for any entity change that affects stats
    socket.on('user_added', fetchStats);
    socket.on('user_removed', fetchStats);
    socket.on('fertilizer_added', fetchStats);
    socket.on('fertilizer_removed', fetchStats);

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats", error);
    }
  };

  const handlePushAdvisory = async () => {
    if (!advisoryTitle || !advisoryBody) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    
    try {
        await adminApi.addAdvisory({
            title: advisoryTitle,
            message: advisoryBody,
            targetCrop,
            priority: 'normal'
        });
        toast({
          title: "Advisory Sent! ✅",
          description: `Pushed to ${targetCrop === "all" ? "all farmers" : targetCrop + " farmers"}`,
        });
        setAdvisoryTitle("");
        setAdvisoryBody("");
    } catch (error) {
        toast({ title: "Error", description: "Failed to send advisory", variant: "destructive" });
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="font-display text-2xl font-bold">Admin Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
            <Users className="h-8 w-8 text-primary mb-2" />
            <p className="text-3xl font-bold">{stats?.totalFarmers || 0}</p>
            <p className="text-sm text-muted-foreground">Total Farmers</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
             <Tractor className="h-8 w-8 text-blue-500 mb-2" />
            <p className="text-3xl font-bold">{stats?.activeFarmers || 0}</p>
            <p className="text-sm text-muted-foreground">Active Farmers</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
            <Leaf className="h-8 w-8 text-green-600 mb-2" />
            <p className="text-3xl font-bold">{stats?.totalFertilizers || 0}</p>
            <p className="text-sm text-muted-foreground">Fertilizers</p>
          </div>
           <div className="bg-card rounded-xl p-4 border border-border flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
            <Sprout className="h-8 w-8 text-orange-500 mb-2" />
            <p className="text-3xl font-bold">{stats?.cropDistribution?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Crops Tracked</p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/admin/users" className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow cursor-pointer">
              <Users className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-semibold">Manage Users</h3>
              <p className="text-sm text-muted-foreground">View and manage farmers</p>
            </a>
            <a href="/admin/content" className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow cursor-pointer">
              <Leaf className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold">Content Management</h3>
              <p className="text-sm text-muted-foreground">Manage advisories</p>
            </a>
             <a href="/admin/market-prices" className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow cursor-pointer">
              <Sprout className="h-8 w-8 text-orange-500 mb-2" />
              <h3 className="font-semibold">Market Prices</h3>
              <p className="text-sm text-muted-foreground">Manage crop prices</p>
            </a>
            <a href="/admin/gov-data" className="bg-card rounded-xl p-6 border border-border hover:shadow-md transition-shadow cursor-pointer">
              <Sprout className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold">Government Data</h3>
              <p className="text-sm text-muted-foreground">Monitor jobs and cache</p>
            </a>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
