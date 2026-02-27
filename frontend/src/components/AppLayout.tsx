import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Main content - adjusted padding since Navbar is fixed/sticky */}
      <main className="flex-1 px-4 py-8 max-w-7xl mx-auto w-full animate-fade-in">
        {children}
      </main>
    </div>
  );
}
