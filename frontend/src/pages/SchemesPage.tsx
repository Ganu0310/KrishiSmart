import { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import {
  FileText, IndianRupee, Shield, GraduationCap, Tractor,
  Search, ExternalLink, ChevronDown, ChevronUp, Filter,
  AlertCircle, CheckCircle2, MapPin, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { schemesApi, type GovernmentScheme } from "@/services/api";

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  subsidy:   { label: "Subsidy",   icon: IndianRupee,  color: "text-green-700",  bg: "bg-green-100" },
  insurance: { label: "Insurance", icon: Shield,        color: "text-blue-700",   bg: "bg-blue-100" },
  loan:      { label: "Loan",      icon: FileText,      color: "text-purple-700", bg: "bg-purple-100" },
  training:  { label: "Training",  icon: GraduationCap, color: "text-orange-700", bg: "bg-orange-100" },
  equipment: { label: "Equipment", icon: Tractor,       color: "text-teal-700",   bg: "bg-teal-100" },
  other:     { label: "Other",     icon: FileText,      color: "text-gray-700",   bg: "bg-gray-100" },
};

const CROP_FILTERS = ["all", "grape", "onion", "tomato", "wheat", "rice", "cotton", "sugarcane"];
const TYPE_FILTERS = ["all", "subsidy", "insurance", "loan", "training", "equipment", "other"];
const cropEmojis: Record<string, string> = {
  grape: "🍇", onion: "🧅", tomato: "🍅", wheat: "🌾", rice: "🍚",
  cotton: "🪴", sugarcane: "🌿", all: "🌐",
};

function SchemeCard({ scheme }: { scheme: GovernmentScheme }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = TYPE_CONFIG[scheme.schemeType] || TYPE_CONFIG.other;
  const Icon = typeInfo.icon;

  return (
    <Card className="hover:shadow-md transition-all border hover:border-emerald-300 group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2.5 rounded-lg ${typeInfo.bg} flex-shrink-0 mt-0.5`}>
              <Icon className={`h-5 w-5 ${typeInfo.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors leading-tight">
                {scheme.schemeName}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{scheme.ministry}</p>
            </div>
          </div>
          <Badge className={`${typeInfo.bg} ${typeInfo.color} border-0 text-xs flex-shrink-0`}>
            {typeInfo.label}
          </Badge>
        </div>

        <p className="text-sm text-gray-700 mt-3 leading-relaxed">{scheme.benefitSummary}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {scheme.applicableCrops.slice(0, 4).map((crop) => (
            <span key={crop} className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              {cropEmojis[crop] || "🌱"} {crop}
            </span>
          ))}
          {scheme.applicableCrops.length > 4 && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              +{scheme.applicableCrops.length - 4} more
            </span>
          )}
          <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {scheme.applicableStates[0] === "all" ? "All India" : scheme.applicableStates.join(", ")}
          </span>
        </div>

        {/* Expand / Collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Show less" : "Show eligibility & how to apply"}
        </button>

        {expanded && (
          <div className="mt-3 space-y-3 border-t pt-3 animate-fade-in">
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Eligibility</p>
              <p className="text-sm text-gray-700 leading-relaxed">{scheme.eligibility}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">How to Apply</p>
              <p className="text-sm text-gray-700 leading-relaxed">{scheme.howToApply}</p>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                📅 Deadline: {scheme.deadline}
              </span>
              {scheme.applicationUrl && (
                <a
                  href={scheme.applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-full transition-colors"
                >
                  Apply Now <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SchemesPage() {
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [total, setTotal] = useState(0);

  const loadSchemes = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedCrop !== "all") params.crop = selectedCrop;
      if (selectedType !== "all") params.type = selectedType;
      if (search.trim()) params.search = search.trim();

      const data = await schemesApi.getAll(params);
      setSchemes(data.data);
      setTotal(data.pagination.total);
    } catch (e: any) {
      setError(e.message || "Failed to load schemes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSchemes(); }, [selectedCrop, selectedType]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadSchemes();
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
              🏛️ Government of India
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Agricultural Schemes</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover subsidies, insurance, loans, and other government benefits available for farmers in India.
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Schemes", value: total, icon: "📋" },
              { label: "Showing Now", value: schemes.length, icon: "✅" },
              { label: "Active Programs", value: total, icon: "🌱" },
            ].map((stat) => (
              <Card key={stat.label} className="text-center">
                <CardContent className="p-4">
                  <p className="text-2xl mb-1">{stat.icon}</p>
                  <p className="text-2xl font-bold text-emerald-700">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search schemes..."
                    className="pl-9"
                  />
                </div>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Search className="h-4 w-4" /> Search
                </Button>
              </form>

              {/* Crop Filter */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Filter by Crop
                </p>
                <div className="flex flex-wrap gap-2">
                  {CROP_FILTERS.map((crop) => (
                    <button
                      key={crop}
                      onClick={() => setSelectedCrop(crop)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        selectedCrop === crop
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-emerald-300"
                      }`}
                    >
                      {cropEmojis[crop] || "🌱"} {crop.charAt(0).toUpperCase() + crop.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type Filter */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Filter by Type</p>
                <div className="flex flex-wrap gap-2">
                  {TYPE_FILTERS.map((type) => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                        selectedType === type
                          ? "bg-blue-500 text-white border-blue-500"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
              ))}
            </div>
          )}

          {/* Schemes */}
          {!loading && schemes.length === 0 && !error && (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No schemes found matching your filters.</p>
            </div>
          )}

          {!loading && schemes.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Showing <strong>{schemes.length}</strong> of <strong>{total}</strong> scheme{total !== 1 ? "s" : ""}
              </p>
              {schemes.map((scheme) => (
                <SchemeCard key={scheme._id} scheme={scheme} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
