import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userApi, BASE_URL } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Upload, LogOut, Save, MapPin, Phone, User, TreePine, Mail, CheckCircle2, XCircle, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, ProfileFormValues } from "@/lib/validations/profile";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  
  // Custom crops state for the tags input
  const [crops, setCrops] = useState<string[]>([]);
  const [cropInput, setCropInput] = useState("");

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      mobile: "",
      location: "",
      farmSize: "",
      address: "",
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setFetching(true);
      const userData = await userApi.getProfile();
      
      form.reset({
        name: userData.name || "",
        mobile: userData.mobile || "",
        location: userData.location || "",
        farmSize: userData.farmSize?.toString() || "",
        address: userData.address || "",
      });

      setCrops(Array.isArray(userData.crops) ? userData.crops : []);

      if (userData.profilePicture) {
        setPreview(`${BASE_URL}/${userData.profilePicture}`);
      }
    } catch (error: any) {
      console.error("Profile fetch error:", error);
      if (error.message?.includes("404") || error.message?.includes("User not found")) {
        toast.error("User session invalid. Please log in again.");
        logout();
      } else {
        toast.error("Failed to load profile. Please refresh.");
      }
    } finally {
      setFetching(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const addCrop = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newCrop = cropInput.trim();
      if (newCrop && !crops.includes(newCrop)) {
        setCrops([...crops, newCrop]);
        setCropInput("");
      }
    }
  };

  const removeCrop = (cropToRemove: string) => {
    setCrops(crops.filter(c => c !== cropToRemove));
  };

  const onSubmit = async (values: ProfileFormValues) => {
    setLoading(true);

    try {
      const data = new FormData();
      data.append("name", values.name.trim());
      if (values.mobile) data.append("mobile", values.mobile.trim());
      if (values.location) data.append("location", values.location.trim());
      if (values.farmSize) data.append("farmSize", values.farmSize);
      if (values.address) data.append("address", values.address.trim());
      
      data.append("crops", JSON.stringify(crops));

      if (file) {
        data.append("profilePicture", file);
      }

      const res = await userApi.updateProfile(data);
      toast.success("Profile updated successfully!");
      
      if (res.user.profilePicture) {
         setPreview(`${BASE_URL}/${res.user.profilePicture}`);
         setFile(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-4xl py-8 animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="w-full lg:w-1/3 space-y-6">
            <Card className="border-t-4 border-t-emerald-500 shadow-xl overflow-hidden bg-white/50 backdrop-blur-sm">
              <div className="h-24 bg-gradient-to-r from-emerald-400 to-green-600 absolute w-full top-0 left-0 z-0"></div>
              <CardContent className="pt-12 px-6 pb-6 flex flex-col items-center relative z-10">
                <div className="relative h-32 w-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white mb-4 transition-transform hover:scale-105 duration-300">
                  {preview ? (
                    <img src={preview} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-emerald-50 text-emerald-500">
                      <User className="h-16 w-16" />
                    </div>
                  )}
                  <label htmlFor="picture" className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-1 cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                    Change
                  </label>
                   <input
                    type="file"
                    id="picture"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
                
                <h2 className="text-2xl font-bold rounded-lg text-slate-800">{form.getValues("name") || "Farmer"}</h2>
                <Badge variant="outline" className="mt-2 bg-emerald-50 text-emerald-700 border-emerald-200">
                  {user?.role?.toUpperCase() || "FARMER"}
                </Badge>
                
                <div className="w-full mt-6 space-y-3">
                  <div className="flex items-center text-sm text-slate-600 bg-slate-50 p-2 rounded-md">
                    <Mail className="h-4 w-4 mr-3 text-emerald-600" />
                    <span className="truncate flex-1" title={user?.email}>{user?.email || 'No email'}</span>
                  </div>
                </div>

                <div className="w-full mt-6">
                  <Label
                    htmlFor="picture"
                    className="flex items-center justify-center w-full py-2 px-4 shadow-sm text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors border border-emerald-200"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Update Photo
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-rose-100">
               <CardContent className="p-4">
                  <Button variant="ghost" className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={logout}>
                     <LogOut className="mr-2 h-4 w-4" />
                     Sign Out
                  </Button>
               </CardContent>
            </Card>
          </div>

          {/* Right Column: Edit Details */}
          <div className="flex-1">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              
              {/* Personal Information */}
              <Card className="mb-6 shadow-md border-0 ring-1 ring-slate-100">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                    <User className="h-5 w-5 text-emerald-600" />
                    Personal Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 sm:grid-cols-2 pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-700">Full Name <span className="text-rose-500">*</span></Label>
                    <Input id="name" placeholder="John Doe" {...form.register("name")} className="bg-slate-50/50 focus:bg-white transition-colors" />
                    {form.formState.errors.name && (
                      <p className="text-xs text-rose-500 font-medium">{form.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile" className="text-slate-700">Mobile Number</Label>
                    <div className="relative">
                       <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                       <Input id="mobile" placeholder="9876543210" maxLength={10} {...form.register("mobile")} className="pl-9 bg-slate-50/50 focus:bg-white transition-colors" />
                    </div>
                    {form.formState.errors.mobile && (
                      <p className="text-xs text-rose-500 font-medium">{form.formState.errors.mobile.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address" className="text-slate-700">Street Address</Label>
                    <div className="relative">
                       <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                       <Textarea id="address" placeholder="House No, Street, Village, Taluka..." {...form.register("address")} className="pl-9 min-h-[80px] resize-none bg-slate-50/50 focus:bg-white transition-colors" />
                    </div>
                    {form.formState.errors.address && (
                      <p className="text-xs text-rose-500 font-medium">{form.formState.errors.address.message}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Farm Details */}
              <Card className="shadow-md border-0 ring-1 ring-slate-100">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                    <TreePine className="h-5 w-5 text-emerald-600" />
                    Farm Information
                  </CardTitle>
                  <CardDescription>Details help us provide accurate weather and advisory.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                     <div className="space-y-2">
                       <Label htmlFor="location" className="text-slate-700">District / City</Label>
                       <Input id="location" placeholder="e.g. Nashik" {...form.register("location")} className="bg-slate-50/50 focus:bg-white transition-colors" />
                        {form.formState.errors.location && (
                          <p className="text-xs text-rose-500 font-medium">{form.formState.errors.location.message}</p>
                        )}
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="farmSize" className="text-slate-700">Farm Size (Acres)</Label>
                       <Input type="number" step="0.1" id="farmSize" placeholder="0.0" {...form.register("farmSize")} className="bg-slate-50/50 focus:bg-white transition-colors" />
                        {form.formState.errors.farmSize && (
                          <p className="text-xs text-rose-500 font-medium">{form.formState.errors.farmSize.message}</p>
                        )}
                     </div>
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="crops" className="text-slate-700">Crops Grown</Label>
                    
                    <div className="flex flex-wrap gap-2 mb-2 min-h-[32px] p-1 border rounded-md bg-slate-50">
                      {crops.length === 0 && (
                        <span className="text-sm text-slate-400 py-1 px-2 italic">No crops added yet</span>
                      )}
                      {crops.map((crop, idx) => (
                        <Badge key={idx} variant="secondary" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 px-3 py-1 flex items-center gap-1 shadow-sm">
                          {crop}
                          <X 
                            className="h-3 w-3 cursor-pointer hover:text-rose-600 transition-colors" 
                            onClick={() => removeCrop(crop)}
                          />
                        </Badge>
                      ))}
                    </div>

                    <Input 
                      id="crops" 
                      value={cropInput}
                      onChange={(e) => setCropInput(e.target.value)}
                      onKeyDown={addCrop}
                      placeholder="Type a crop (e.g., Wheat) and press Enter..." 
                      className="bg-white focus:ring-emerald-500 transition-shadow"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sticky Action Bar */}
              <div className="sticky bottom-6 mt-8 z-10 flex justify-end">
                <Button type="submit" size="lg" className="shadow-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white rounded-full px-8 h-12" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                  Save Profile
                </Button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
