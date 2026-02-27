import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userApi, BASE_URL } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, User as UserIcon, LogOut, Save, MapPin, Phone, User, TreePine } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Separator } from "@/components/ui/separator";

export default function ProfilePage() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false); // For form submission
  const [fetching, setFetching] = useState(true); // For initial data fetch
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    location: "",
    farmSize: "",
    address: "",
    crops: "", 
  });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setFetching(true);
      const userData = await userApi.getProfile();
      setFormData({
        name: userData.name || "",
        mobile: userData.mobile || "",
        location: userData.location || "",
        farmSize: userData.farmSize?.toString() || "",
        address: userData.address || "",
        crops: Array.isArray(userData.crops) ? userData.crops.join(", ") : userData.crops || "",
      });
      if (userData.profilePicture) {
        setPreview(`${BASE_URL}/${userData.profilePicture}`);
      }
    } catch (error: any) {
      console.error("Profile fetch error:", error);
      // Handle "User not found" explicitly
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Basic Validation
    if (!formData.name.trim()) {
      toast.error("Name is required");
      setLoading(false);
      return;
    }
    if (formData.mobile && !/^\d{10}$/.test(formData.mobile.trim())) {
      toast.error("Please enter a valid 10-digit mobile number");
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();
      data.append("name", formData.name.trim());
      data.append("mobile", formData.mobile.trim());
      data.append("location", formData.location.trim());
      data.append("farmSize", formData.farmSize);
      data.append("address", formData.address.trim());
      
      const cropsArray = formData.crops.split(",").map((c) => c.trim()).filter((c) => c);
      data.append("crops", JSON.stringify(cropsArray));

      if (file) {
        data.append("profilePicture", file);
      }

      const res = await userApi.updateProfile(data);
      toast.success("Profile updated successfully!");
      
      // Update preview if returned from server (optional, but good practice)
      if (res.user.profilePicture) {
         setPreview(`${BASE_URL}/${res.user.profilePicture}`);
         setFile(null); // Clear pending file
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
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="w-full md:w-1/3 space-y-6">
            <Card className="border-t-4 border-t-green-600 shadow-md">
              <CardContent className="pt-8 flex flex-col items-center">
                <div className="relative h-32 w-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 mb-4">
                  {preview ? (
                    <img src={preview} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-green-100 text-green-600">
                      <UserIcon className="h-16 w-16" />
                    </div>
                  )}
                  
                  {/* Overlay for hover effect could go here */}
                </div>
                
                <h2 className="text-xl font-bold text-gray-900">{formData.name || "Farmer"}</h2>
                <p className="text-sm text-gray-500 mb-6">{formData.location || "Location not set"}</p>
                
                <div className="w-full">
                  <input
                    type="file"
                    id="picture"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Label
                    htmlFor="picture"
                    className="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Change Photo
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
               <CardContent className="p-4">
                  <Button variant="destructive" className="w-full" onClick={logout}>
                     <LogOut className="mr-2 h-4 w-4" />
                     Log Out
                  </Button>
               </CardContent>
            </Card>
          </div>

          {/* Right Column: Edit Details */}
          <div className="flex-1">
            <form onSubmit={handleSubmit}>
              
              {/* Personal Information */}
              <Card className="mb-6 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-green-600" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number (10 digits)</Label>
                    <div className="relative">
                       <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                       <Input className="pl-9" id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="9876543210" maxLength={10} />
                    </div>
                  </div>
                  
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="address">Full Address</Label>
                    <div className="relative">
                       <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                       <Textarea className="pl-9 min-h-[80px]" id="address" name="address" value={formData.address} onChange={handleChange} placeholder="House No, Street, Village, Taluka..." />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Farm Details */}
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TreePine className="h-5 w-5 text-green-600" />
                    Farm Details
                  </CardTitle>
                  <CardDescription>Tell us about your farm to get better recommendations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                     <div className="space-y-2">
                       <Label htmlFor="location">District / City</Label>
                       <Input id="location" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Nashik" />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="farmSize">Farm Size (Acres)</Label>
                       <Input type="number" step="0.1" id="farmSize" name="farmSize" value={formData.farmSize} onChange={handleChange} placeholder="0.0" />
                     </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="crops">Crops Grown</Label>
                    <Input id="crops" name="crops" value={formData.crops} onChange={handleChange} placeholder="Wheat, Rice, Tomato, Onion..." />
                    <p className="text-xs text-muted-foreground">Separate multiple crops with commas</p>
                  </div>
                </CardContent>
              </Card>

              {/* Sticky Action Bar */}
              <div className="sticky bottom-4 mt-6 z-10 flex justify-end">
                <Button type="submit" size="lg" className="shadow-lg bg-green-600 hover:bg-green-700 text-white" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Changes
                </Button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
