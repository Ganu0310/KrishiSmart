import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout, CloudSun, TrendingUp, Droplets, ShieldCheck, Truck, Users } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay */}
                <div
                    className="absolute inset-0 z-0 bg-[url('https://images.unsplash.com/photo-1625246333195-bf7f9435b38b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center"
                >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                </div>

                {/* Content */}
                <div className="container relative z-10 px-4 text-center animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white mb-6">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-sm font-medium">Empowering Farmers with AI</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 leading-tight tracking-tight">
                        Smart Farming for a <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400">
                            Resilient Future
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-white/80 mb-8 leading-relaxed">
                        Access real-time crop advisories, weather insights, and market prices tailored to your location. Join thousands of farmers making data-driven decisions.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/login">
                            <Button size="lg" className="h-14 px-8 text-lg bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/20">
                                Get Started Now
                            </Button>
                        </Link>
                        <Link to="/about">
                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm">
                                Learn More
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/60">
                    <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
                        <div className="w-1 h-2 bg-white/60 rounded-full" />
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-muted/50">
                <div className="container px-4">
                    <div className="text-center max-w-2xl mx-auto mb-16">
                        <h2 className="text-3xl font-bold mb-4 font-display">Everything you need to grow better</h2>
                        <p className="text-muted-foreground text-lg">
                            Our comprehensive platform integrates advanced technology with agricultural expertise.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={CloudSun}
                            title="Weather Precision"
                            description="Hyper-local weather forecasts and extreme weather alerts to plan your farming activities."
                            color="text-blue-500"
                        />
                        <FeatureCard
                            icon={Sprout}
                            title="Crop Advisory"
                            description="Stage-specific advice on fertilizer, irrigation, and pest management for your specific crops."
                            color="text-emerald-500"
                        />
                        <FeatureCard
                            icon={TrendingUp}
                            title="Market Prices"
                            description="Real-time mandi prices to help you decide the best time and place to sell your produce."
                            color="text-amber-500"
                        />
                        <FeatureCard
                            icon={Droplets}
                            title="Irrigation Planning"
                            description="Smart water management calculated based on soil moisture and weather conditions."
                            color="text-cyan-500"
                        />
                        <FeatureCard
                            icon={ShieldCheck}
                            title="Pest & Disease ID"
                            description="AI-powered identification of crop diseases with instant treatment recommendations."
                            color="text-rose-500"
                        />
                        <FeatureCard
                            icon={Users}
                            title="Expert Community"
                            description="Connect with agricultural experts and fellow farmers to share knowledge."
                            color="text-violet-500"
                        />
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 bg-emerald-900 text-white">
                <div className="container px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <StatCard number="10k+" label="Farmers" />
                        <StatCard number="50+" label="Crops Supported" />
                        <StatCard number="95%" label="Advisory Accuracy" />
                        <StatCard number="24/7" label="Real-time Updates" />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-background py-12 border-t">
                <div className="container px-4">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center gap-2 font-display font-bold text-xl mb-4">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                                    <Sprout className="h-5 w-5" />
                                </div>
                                KrishiSmart
                            </div>
                            <p className="text-muted-foreground max-w-xs">
                                Empowering farmers with technology for a sustainable and profitable future.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-3">Platform</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><Link to="/login" className="hover:text-primary">Login</Link></li>
                                <li><Link to="/signup" className="hover:text-primary">Register</Link></li>
                                <li><Link to="/features" className="hover:text-primary">Features</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-3">Support</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li><a href="#" className="hover:text-primary">Help Center</a></li>
                                <li><a href="#" className="hover:text-primary">Contact Us</a></li>
                                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t pt-8 text-center text-sm text-muted-foreground">
                        © 2024 KrishiSmart. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, description, color }: { icon: any, title: string, description: string, color: string }) {
    return (
        <div className="bg-background items-start text-left p-6 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:border-primary/20 group">
            <div className={`h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 ${color} bg-opacity-10`}>
                <Icon className={`h-6 w-6 ${color}`} />
            </div>
            <h3 className="font-display font-semibold text-xl mb-2 group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    );
}

function StatCard({ number, label }: { number: string, label: string }) {
    return (
        <div className="p-4">
            <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">{number}</div>
            <div className="text-emerald-100 font-medium">{label}</div>
        </div>
    );
}
