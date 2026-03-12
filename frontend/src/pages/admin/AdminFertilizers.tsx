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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { adminFertilizerSchema, type AdminFertilizerFormValues } from "@/lib/validations/fertilizer";

export default function AdminFertilizers() {
  const [fertilizers, setFertilizers] = useState<Fertilizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const socket = useSocket();

  const form = useForm<AdminFertilizerFormValues>({
    resolver: zodResolver(adminFertilizerSchema),
    defaultValues: {
      name: "",
      brand: "",
      description: "",
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0,
      micronutrients: "",
      pricePerKg: 0,
      suitableCrops: [],
      applicationMethod: "soil",
      dosageGuide: "",
      precautions: "",
      organic: false,
    },
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



  const [editingId, setEditingId] = useState<string | null>(null);

  const handleEdit = (fertilizer: Fertilizer) => {
    console.log("Editing fertilizer:", fertilizer);
    setEditingId(fertilizer._id);
    form.reset({
      name: fertilizer.name,
      brand: fertilizer.brand || "",
      description: fertilizer.description,
      nitrogen: fertilizer.nutrients?.nitrogen || 0,
      phosphorus: fertilizer.nutrients?.phosphorus || 0,
      potassium: fertilizer.nutrients?.potassium || 0,
      micronutrients: fertilizer.nutrients?.micronutrients?.join(", ") || "",
      pricePerKg: fertilizer.pricePerKg || 0,
      suitableCrops: fertilizer.suitableCrops || [],
      applicationMethod: (fertilizer.applicationMethod as any) || "soil",
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

  const onSubmit = async (values: AdminFertilizerFormValues) => {
    try {
      const submitData = new FormData();
      submitData.append("name", values.name);
      submitData.append("brand", values.brand || "");
      submitData.append("description", values.description);
      submitData.append("pricePerKg", values.pricePerKg.toString());
      submitData.append("applicationMethod", values.applicationMethod);
      submitData.append("precautions", values.precautions || "");
      submitData.append("organic", values.organic.toString());

      // Nutrients
      const nutrients = {
        nitrogen: values.nitrogen,
        phosphorus: values.phosphorus,
        potassium: values.potassium,
        micronutrients: values.micronutrients
          ? values.micronutrients.split(",").map((m) => m.trim())
          : [],
      };
      submitData.append("nutrients", JSON.stringify(nutrients));

      // Suitable crops
      submitData.append("suitableCrops", JSON.stringify(values.suitableCrops));

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
      if (values.dosageGuide) {
        try {
          const dosageObj = JSON.parse(values.dosageGuide);
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
    form.reset({
      name: "",
      brand: "",
      description: "",
      nitrogen: 0,
      phosphorus: 0,
      potassium: 0,
      micronutrients: "",
      pricePerKg: 0,
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="name" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="brand" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl><Textarea rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-3 gap-4">
                  <FormField control={form.control} name="nitrogen" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nitrogen (N) %</FormLabel>
                      <FormControl><Input type="number" min="0" max="100" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="phosphorus" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phosphorus (P) %</FormLabel>
                      <FormControl><Input type="number" min="0" max="100" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="potassium" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Potassium (K) %</FormLabel>
                      <FormControl><Input type="number" min="0" max="100" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="micronutrients" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Micronutrients (comma-separated)</FormLabel>
                    <FormControl><Input placeholder="e.g., Zinc, Iron" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="pricePerKg" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Kg (₹) *</FormLabel>
                      <FormControl><Input type="number" min="0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="applicationMethod" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Method</FormLabel>
                      <FormControl>
                        <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" {...field}>
                          <option value="soil">Soil</option>
                          <option value="foliar">Foliar</option>
                          <option value="drip">Drip</option>
                          <option value="broadcast">Broadcast</option>
                          <option value="mixed">Mixed</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="suitableCrops" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suitable Crops *</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {crops.map((crop) => (
                        <div key={crop} className="flex items-center gap-2">
                          <Checkbox
                            id={`crop-${crop}`}
                            checked={field.value?.includes(crop)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              const updated = checked
                                ? [...current, crop]
                                : current.filter((c) => c !== crop);
                              field.onChange(updated);
                            }}
                          />
                          <label htmlFor={`crop-${crop}`} className="text-sm capitalize cursor-pointer">
                            {crop}
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="dosageGuide" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dosage Guide (JSON format, optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder='{"grape": "50-75 kg/acre"}' rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="precautions" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precautions</FormLabel>
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="organic" render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer text-sm">Organic Product</FormLabel>
                  </FormItem>
                )} />

                <div className="flex gap-2 justify-end pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">{editingId ? "Update Fertilizer" : "Add Fertilizer"}</Button>
                </div>
              </form>
            </Form>
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
