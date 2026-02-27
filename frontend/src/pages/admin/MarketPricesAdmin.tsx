import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { marketPriceAdminApi, type AdminMarketPrice } from "@/services/api";
import { toast } from "sonner";
import { Loader2, Plus, Pencil, Trash2, Search, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MarketPricesAdmin() {
  const [prices, setPrices] = useState<AdminMarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Edit/Create State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<Partial<AdminMarketPrice>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPrices();
  }, [page, searchTerm]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const response = await marketPriceAdminApi.getAll({
        page,
        limit: 10,
        search: searchTerm,
      });
      setPrices(response.data);
      setTotalPages(response.pagination.pages);
    } catch (error) {
      toast.error("Failed to fetch market prices");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on search
    fetchPrices();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this price entry?")) return;
    try {
      await marketPriceAdminApi.delete(id);
      toast.success("Price entry deleted");
      fetchPrices();
    } catch (error) {
      toast.error("Failed to delete price entry");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing && currentPrice._id) {
        await marketPriceAdminApi.update(currentPrice._id, currentPrice);
        toast.success("Price updated successfully");
      } else {
        await marketPriceAdminApi.create(currentPrice as any);
        toast.success("Price created successfully");
      }
      setIsDialogOpen(false);
      fetchPrices();
    } catch (error) {
        toast.error("Failed to save price entry");
    } finally {
      setSaving(false);
    }
  };

  const openAddDialog = () => {
    setIsEditing(false);
    setCurrentPrice({
        crop: "",
        market: "",
        minPrice: 0,
        maxPrice: 0,
        modalPrice: 0,
        date: new Date().toISOString().split('T')[0], // Today YYYY-MM-DD
        source: "manual"
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (price: AdminMarketPrice) => {
    setIsEditing(true);
    setCurrentPrice({
        ...price,
        date: new Date(price.date).toISOString().split('T')[0]
    });
    setIsDialogOpen(true);
  };

  return (
    <AppLayout>
      <div className="container py-8 animate-fade-in space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Market Prices Management</h1>
            <p className="text-muted-foreground">Manage crop prices for different markets</p>
          </div>
          <Button onClick={openAddDialog} className="bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" /> Add Price
          </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by crop or market..."
                            className="pl-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button type="submit" variant="secondary">Search</Button>
                </form>
            </CardContent>
        </Card>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead>Market</TableHead>
                <TableHead className="text-right">Min Price</TableHead>
                <TableHead className="text-right">Max Price</TableHead>
                <TableHead className="text-right">Modal Price</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : prices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No prices found
                  </TableCell>
                </TableRow>
              ) : (
                prices.map((price) => (
                  <TableRow key={price._id}>
                    <TableCell>{format(new Date(price.date), "dd MMM yyyy")}</TableCell>
                    <TableCell className="font-medium capitalize">{price.crop}</TableCell>
                    <TableCell>{price.market}</TableCell>
                    <TableCell className="text-right">₹{price.minPrice}</TableCell>
                    <TableCell className="text-right">₹{price.maxPrice}</TableCell>
                    <TableCell className="text-right font-bold text-green-600">₹{price.modalPrice}</TableCell>
                    <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${price.source === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {price.source}
                        </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(price)}>
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(price._id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
           <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
           </div>
           <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
           </div>
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Market Price" : "Add Market Price"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="crop">Crop Name</Label>
                  <Input 
                    id="crop" 
                    value={currentPrice.crop} 
                    onChange={(e) => setCurrentPrice({ ...currentPrice, crop: e.target.value })} 
                    placeholder="e.g. Tomato"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="market">Market / Mandi</Label>
                  <Input 
                    id="market" 
                    value={currentPrice.market} 
                    onChange={(e) => setCurrentPrice({ ...currentPrice, market: e.target.value })} 
                    placeholder="e.g. Pune APMC"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPrice">Min Price (₹)</Label>
                  <Input 
                    id="minPrice" 
                    type="number" 
                    value={currentPrice.minPrice} 
                    onChange={(e) => setCurrentPrice({ ...currentPrice, minPrice: Number(e.target.value) })} 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPrice">Max Price (₹)</Label>
                  <Input 
                    id="maxPrice" 
                    type="number" 
                    value={currentPrice.maxPrice} 
                    onChange={(e) => setCurrentPrice({ ...currentPrice, maxPrice: Number(e.target.value) })} 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="modalPrice">Modal Price (₹)</Label>
                  <Input 
                    id="modalPrice" 
                    type="number" 
                    value={currentPrice.modalPrice} 
                    onChange={(e) => setCurrentPrice({ ...currentPrice, modalPrice: Number(e.target.value) })} 
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                        id="date" 
                        type="date" 
                        value={currentPrice.date?.toString().split('T')[0]} 
                        onChange={(e) => setCurrentPrice({ ...currentPrice, date: e.target.value })} 
                        required
                    />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select 
                        value={currentPrice.source} 
                        onValueChange={(val) => setCurrentPrice({ ...currentPrice, source: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="manual">Manual Entry</SelectItem>
                            <SelectItem value="agmarknet">Agmarknet API</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
