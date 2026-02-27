import { useState, useEffect } from "react";
import { fertilizerApi, adminApi, type Fertilizer } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Upload, Leaf, Pencil } from "lucide-react";
import { toast } from "sonner";
import { BASE_URL } from "@/services/api";
import { useSocket } from "@/context/SocketContext";

export default function AdminFertilizers() {
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const socket = useSocket();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    description: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    micronutrients: "",
    pricePerKg: "",
    suitableCrops: [] as string[],
    applicationMethod: "soil",
    dosageGuide: "",
    precautions: "",
    organic: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const crops = ["grape", "onion", "tomato", "wheat", "rice", "cotton", "sugarcane", "all"];

  useEffect(() => {
    fetchFertilizers();

    // Listen for real-time updates
    if (socket) {
      socket.on("fertilizer_added", () => {
        fetchFertilizers();
        toast.success("New fertilizer added!");
      });

      socket.on("fertilizer_updated", () => {
        fetchFertilizers();
        toast.info("Fertilizer updated!");
      });

      socket.on("fertilizer_removed", () => {
        fetchFertilizers();
        toast.info("Fertilizer removed!");
      });
    }

    return () => {
      if (socket) {
        socket.off("fertilizer_added");
        socket.off("fertilizer_updated");
        socket.off("fertilizer_removed");
      }
    };
  }, [socket]);

  const fetchFertilizers = async () => {
    try {
      setLoading(true);
      const data = await fertilizerApi.getAllAdmin();
      setFertilizers(data.fertilizers);
    } catch (error: any) {
      toast.error(error.message || "Failed to load fertilizers");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropToggle = (crop: string) => {
    setFormData((prev) => ({
      ...prev,
      suitableCrops: prev.suitableCrops.includes(crop)
        ? prev.suitableCrops.filter((c) => c !== crop)
        : [...prev.suitableCrops, crop],
    }));
  };

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (fertilizer: Fertilizer) => {
    console.log("Editing fertilizer:", fertilizer);
    setEditingId(fertilizer._id);
    setFormData({
      name: fertilizer.name,
      brand: fertilizer.brand || "",
      description: fertilizer.description,
      nitrogen: fertilizer.nutrients?.nitrogen?.toString() || "0",
      phosphorus: fertilizer.nutrients?.phosphorus?.toString() || "0",
      potassium: fertilizer.nutrients?.potassium?.toString() || "0",
      micronutrients: fertilizer.nutrients?.micronutrients?.join(", ") || "",
      pricePerKg: fertilizer.pricePerKg?.toString() || "0",
      suitableCrops: fertilizer.suitableCrops || [],
      applicationMethod: fertilizer.applicationMethod || "soil",
      dosageGuide: fertilizer.dosageGuide ? JSON.stringify(fertilizer.dosageGuide) : "",
      precautions: fertilizer.precautions || "",
      organic: fertilizer.organic || false,
    });
    
    const img = (fertilizer.image || "").trim();
    if (img.startsWith("http")) {
        setImagePreview(img);
    } else {
        setImagePreview(`${BASE_URL}/uploads/fertilizers/${img}`);
    }
    
    setIsDialogOpen(true);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
        await adminApi.toggleFertilizerStatus(id);
        toast.success(`Fertilizer ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        fetchFertilizers();
    } catch (error: any) {
        toast.error(error.message || "Failed to update status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description || !formData.pricePerKg) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.suitableCrops.length === 0) {
      toast.error("Please select at least one suitable crop");
      return;
    }

    try {
      const submitData = new FormData();
      submitData.append("name", formData.name);
      submitData.append("brand", formData.brand);
      submitData.append("description", formData.description);
      submitData.append("pricePerKg", formData.pricePerKg);
      submitData.append("applicationMethod", formData.applicationMethod);
      submitData.append("precautions", formData.precautions);
      submitData.append("organic", formData.organic.toString());

      // Nutrients
      const nutrients = {
        nitrogen: Number(formData.nitrogen) || 0,
        phosphorus: Number(formData.phosphorus) || 0,
        potassium: Number(formData.potassium) || 0,
        micronutrients: formData.micronutrients
          ? formData.micronutrients.split(",").map((m) => m.trim())
          : [],
      };
      submitData.append("nutrients", JSON.stringify(nutrients));

      // Suitable crops
      submitData.append("suitableCrops", JSON.stringify(formData.suitableCrops));

      // Growth stage (default all true for now)
      submitData.append(
        "growthStageRecommendation",
        JSON.stringify({
          vegetative: true,
          flowering: true,
          fruiting: true,
          harvest: true,
        })
      );

      // Dosage guide
      if (formData.dosageGuide) {
        try {
          const dosageObj = JSON.parse(formData.dosageGuide);
          submitData.append("dosageGuide", JSON.stringify(dosageObj));
        } catch {
          toast.error("Invalid dosage guide format. Use JSON format.");
          return;
        }
      }

      // Image
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      if (editingId) {
          // Update existing
          // Note: create a separate method in api.ts or use the existing one if it handles FormData
          // Ideally adminApi.updateFertilizer handles JSON, but for file upload we need FormData
          // Let's assume for now we use the same endpoint structure but PUT
           await adminApi.updateFertilizer(editingId, submitData); // adminApi.updateFertilizer needs to support FormData or we need a specific method
           toast.success("Fertilizer updated successfully!");
      } else {
           await fertilizerApi.add(submitData);
           toast.success("Fertilizer added successfully!");
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchFertilizers();
    } catch (error: any) {
      toast.error(error.message || "Failed to save fertilizer");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      brand: "",
      description: "",
      nitrogen: "",
      phosphorus: "",
      potassium: "",
      micronutrients: "",
      pricePerKg: "",
      suitableCrops: [],
      applicationMethod: "soil",
      dosageGuide: "",
      precautions: "",
      organic: false,
    });
    setImageFile(null);
    setImagePreview("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            Fertilizer Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage fertilizer products and information
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Fertilizer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Fertilizer" : "Add New Fertilizer"}</DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update the fertilizer details below."
                  : "Fill in the details to add a new fertilizer."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image Upload */}
              <div>
                <Label>Product Image</Label>
                <div className="mt-2">
                  {imagePreview ? (
                    <div className="relative w-full h-48 border-2 border-dashed rounded-lg overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview("");
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                      <Upload className="w-12 h-12 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  rows={3}
                />
              </div>

              {/* NPK */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="nitrogen">Nitrogen (N) %</Label>
                  <Input
                    id="nitrogen"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.nitrogen}
                    onChange={(e) =>
                      setFormData({ ...formData, nitrogen: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="phosphorus">Phosphorus (P) %</Label>
                  <Input
                    id="phosphorus"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.phosphorus}
                    onChange={(e) =>
                      setFormData({ ...formData, phosphorus: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="potassium">Potassium (K) %</Label>
                  <Input
                    id="potassium"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.potassium}
                    onChange={(e) =>
                      setFormData({ ...formData, potassium: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="micronutrients">
                  Micronutrients (comma-separated)
                </Label>
                <Input
                  id="micronutrients"
                  value={formData.micronutrients}
                  onChange={(e) =>
                    setFormData({ ...formData, micronutrients: e.target.value })
                  }
                  placeholder="e.g., Zinc, Iron, Manganese"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price per Kg (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    value={formData.pricePerKg}
                    onChange={(e) =>
                      setFormData({ ...formData, pricePerKg: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="method">Application Method</Label>
                  <select
                    id="method"
                    value={formData.applicationMethod}
                    onChange={(e) =>
                      setFormData({ ...formData, applicationMethod: e.target.value })
                    }
                    className="w-full h-10 px-3 border rounded-md"
                  >
                    <option value="soil">Soil</option>
                    <option value="foliar">Foliar</option>
                    <option value="drip">Drip</option>
                    <option value="broadcast">Broadcast</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>

              {/* Suitable Crops */}
              <div>
                <Label>Suitable Crops *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {crops.map((crop) => (
                    <div key={crop} className="flex items-center gap-2">
                      <Checkbox
                        id={`crop-${crop}`}
                        checked={formData.suitableCrops.includes(crop)}
                        onCheckedChange={() => handleCropToggle(crop)}
                      />
                      <label
                        htmlFor={`crop-${crop}`}
                        className="text-sm capitalize cursor-pointer"
                      >
                        {crop}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="dosage">
                  Dosage Guide (JSON format, optional)
                </Label>
                <Textarea
                  id="dosage"
                  value={formData.dosageGuide}
                  onChange={(e) =>
                    setFormData({ ...formData, dosageGuide: e.target.value })
                  }
                  placeholder='{"grape": "50-75 kg/acre", "onion": "40-60 kg/acre"}'
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="precautions">Precautions</Label>
                <Textarea
                  id="precautions"
                  value={formData.precautions}
                  onChange={(e) =>
                    setFormData({ ...formData, precautions: e.target.value })
                  }
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="organic"
                  checked={formData.organic}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, organic: checked as boolean })
                  }
                />
                <label htmlFor="organic" className="text-sm cursor-pointer">
                  Organic Product
                </label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">{editingId ? "Update Fertilizer" : "Add Fertilizer"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fertilizers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Fertilizers ({fertilizers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : fertilizers.length === 0 ? (
            <div className="text-center py-12">
              <Leaf className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No fertilizers added yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>NPK</TableHead>
                  <TableHead>Price/kg</TableHead>
                  <TableHead>Crops</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fertilizers.map((fertilizer) => (
                  <TableRow key={fertilizer._id}>
                    <TableCell>
                      <img
                        src={
                          fertilizer.image?.trim().startsWith("http")
                            ? fertilizer.image.trim()
                            : `${BASE_URL}/uploads/fertilizers/${fertilizer.image}`
                        }
                        alt={fertilizer.name}
                        className="w-16 h-16 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.src =
                            "https://via.placeholder.com/100?text=No+Image";
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{fertilizer.name}</TableCell>
                    <TableCell>{fertilizer.brand || "-"}</TableCell>
                    <TableCell>
                      {fertilizer.nutrients.nitrogen}-
                      {fertilizer.nutrients.phosphorus}-
                      {fertilizer.nutrients.potassium}
                    </TableCell>
                    <TableCell>₹{fertilizer.pricePerKg}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {fertilizer.suitableCrops.slice(0, 2).map((crop) => (
                          <Badge key={crop} variant="outline" className="text-xs">
                            {crop}
                          </Badge>
                        ))}
                        {fertilizer.suitableCrops.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{fertilizer.suitableCrops.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={fertilizer.isActive ? "default" : "secondary"}>
                        {fertilizer.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(fertilizer)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant={fertilizer.isActive ? "destructive" : "default"}
                          size="sm"
                          onClick={() =>
                            handleToggleStatus(fertilizer._id, fertilizer.isActive!)
                          }
                          className={!fertilizer.isActive ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                           {fertilizer.isActive ? <Trash2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
