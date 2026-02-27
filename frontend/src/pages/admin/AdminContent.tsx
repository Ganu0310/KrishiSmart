import { useState } from "react";
import { adminApi } from "@/services/api";
import { toast } from "sonner"; // Assuming sonner is installed
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // Assuming Shadcn textarea
import { Plus, TrendingUp, CloudSun } from "lucide-react";

export default function AdminContent() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-display font-bold text-gray-900">Content Management</h1>
                <p className="text-muted-foreground mt-1">Update agricultural data and advisories.</p>
            </div>

            <Tabs defaultValue="prices" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="prices">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Market Prices
                    </TabsTrigger>
                    <TabsTrigger value="advisory">
                        <CloudSun className="h-4 w-4 mr-2" />
                        Crop Advisories
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="prices" className="mt-6">
                    <MarketPriceForm />
                </TabsContent>

                <TabsContent value="advisory" className="mt-6">
                    <AdvisoryForm />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function MarketPriceForm() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        crop: "onion", // default from valid enums
        mandi: "",
        price: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminApi.addMarketPrice({
                ...formData,
                price: Number(formData.price)
            });
            toast.success("Market price added successfully");
            setFormData({ ...formData, mandi: "", price: "" }); // Reset fields
        } catch (error) {
            toast.error("Failed to add price");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Update Market Prices</CardTitle>
                <CardDescription>Add the latest mandi rates for crops.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                    <div className="space-y-2">
                        <Label>Select Crop</Label>
                        <Select
                            value={formData.crop}
                            onValueChange={(val) => setFormData({ ...formData, crop: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select crop" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="onion">Onion 🧅</SelectItem>
                                <SelectItem value="tomato">Tomato 🍅</SelectItem>
                                <SelectItem value="grapes">Grapes 🍇</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Mandi / Market Name</Label>
                        <Input
                            placeholder="e.g. Pimpalgaon Baswant"
                            value={formData.mandi}
                            onChange={(e) => setFormData({ ...formData, mandi: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Price (₹/kg)</Label>
                        <Input
                            type="number"
                            placeholder="e.g. 25"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            required
                            min="0"
                        />
                    </div>

                    <Button type="submit" disabled={loading}>
                        {loading ? "Adding..." : "Add Price Update"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function AdvisoryForm() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        crop: "onion",
        stage: "vegetative",
        irrigationAdvice: "",
        fertilizerAdvice: "",
        harvestAdvice: "",
        riskAlerts: "", // comma separated
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await adminApi.addAdvisory({
                ...formData,
                riskAlerts: formData.riskAlerts.split(',').map(s => s.trim()).filter(Boolean),
                // Mock weather snapshot for now as per schema requirement
                weatherSnapshot: {
                    temperature: 28,
                    humidity: 60,
                    rainfallProbability: 10,
                    weatherDescription: "Sunny",
                    heavyRainfallPredicted: false,
                    windSpeed: 5
                }
            });
            toast.success("Advisory published!");
            // Reset complex fields
            setFormData(prev => ({
                ...prev,
                irrigationAdvice: "",
                fertilizerAdvice: "",
                harvestAdvice: "",
                riskAlerts: ""
            }));
        } catch (error) {
            toast.error("Failed to publish advisory");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Create Crop Advisory</CardTitle>
                <CardDescription>Publish expert advice for specific crop stages.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Crop</Label>
                            <Select
                                value={formData.crop}
                                onValueChange={(val) => setFormData({ ...formData, crop: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="onion">Onion 🧅</SelectItem>
                                    <SelectItem value="tomato">Tomato 🍅</SelectItem>
                                    <SelectItem value="grapes">Grapes 🍇</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Growth Stage</Label>
                            <Select
                                value={formData.stage}
                                onValueChange={(val) => setFormData({ ...formData, stage: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="vegetative">Vegetative</SelectItem>
                                    <SelectItem value="flowering">Flowering</SelectItem>
                                    <SelectItem value="fruiting">Fruiting</SelectItem>
                                    <SelectItem value="harvest">Harvest</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Irrigation Advice</Label>
                        <Textarea
                            placeholder="e.g. Irrigate every 4 days due to high temp..."
                            value={formData.irrigationAdvice}
                            onChange={(e) => setFormData({ ...formData, irrigationAdvice: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Fertilizer Advice</Label>
                        <Textarea
                            placeholder="e.g. Apply NPK 10:26:26..."
                            value={formData.fertilizerAdvice}
                            onChange={(e) => setFormData({ ...formData, fertilizerAdvice: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Harvest/General Tip</Label>
                        <Textarea
                            placeholder="General care or harvesting tip..."
                            value={formData.harvestAdvice}
                            onChange={(e) => setFormData({ ...formData, harvestAdvice: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Risk Alerts (Comma separated)</Label>
                        <Input
                            placeholder="e.g. Pest attack likely, Heat wave warning"
                            value={formData.riskAlerts}
                            onChange={(e) => setFormData({ ...formData, riskAlerts: e.target.value })}
                        />
                    </div>

                    <Button type="submit" disabled={loading} className="w-full">
                        {loading ? "Publishing..." : "Publish Advisory"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
