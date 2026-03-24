"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HotelSearchBar } from "@/components/hotels/HotelSearchBar";
import { HotelCard } from "@/components/hotels/HotelCard";
import { useAuthStore } from "@/store/authStore";
import { LogIn, User, Building2, Star, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { usePromotedHotels, useHotels } from "@/hooks/useHotels";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const { data: promotedHotels, isLoading: promotedLoading } =
    usePromotedHotels();
  const { data: recentData, isLoading: recentLoading } = useHotels({
    limit: 8,
  });

  const handleSearch = (filters: {
    location: string;
    checkIn: string;
    checkOut: string;
    guests: number;
  }) => {
    const params = new URLSearchParams();
    if (filters.location) params.set("location", filters.location);
    if (filters.checkIn) params.set("checkIn", filters.checkIn);
    if (filters.checkOut) params.set("checkOut", filters.checkOut);
    if (filters.guests > 1) params.set("guests", String(filters.guests));
    router.push(`/search?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              🏠
            </div>
            <span>Airbnb Clone</span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle className="h-9 w-9" />
            {isAuthenticated && user ? (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/host">
                    <Building2 className="h-4 w-4 mr-2" />
                    Become a Host
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/profile">
                    <User className="h-4 w-4 mr-2" />
                    {user.name}
                  </Link>
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link href="/login" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-8">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Explore Unique Stays and Experiences
            </h1>
            <p className="text-lg text-muted-foreground text-balance">
              Find your perfect accommodation anywhere in the world
            </p>
          </div>

          {/* Search Bar */}
          <HotelSearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Promoted Hotels */}
      {(promotedLoading || (promotedHotels && promotedHotels.length > 0)) && (
        <section className="container max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <h2 className="text-2xl font-bold">Featured Properties</h2>
            <Badge variant="secondary" className="ml-2">
              Promoted
            </Badge>
          </div>
          {promotedLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(promotedHotels ?? []).map((hotel) => (
                <div key={hotel.id} className="relative">
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-yellow-500 text-white gap-1">
                      <Star className="h-3 w-3 fill-white" /> Featured
                    </Badge>
                  </div>
                  <HotelCard
                    hotel={hotel}
                    onViewDetails={(id) => router.push(`/hotels/${id}`)}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Recent Hotels */}
      <section className="container max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-6">Explore Stays</h2>
            {recentLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(recentData?.data ?? []).map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    onViewDetails={(id) => router.push(`/hotels/${id}`)}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="mt-12 space-y-6">
            <h2 className="text-2xl font-bold">Explore by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Beach", "Mountain", "City", "Luxury"].map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  className="h-16 text-lg"
                  onClick={() => router.push(`/search?location=${category}`)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="bg-primary/5 py-12 mt-12">
          <div className="container max-w-7xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl font-bold">
              Ready to Find Your Perfect Stay?
            </h2>
            <p className="text-muted-foreground text-lg">
              Create an account today and start exploring amazing destinations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/register">Create Account</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t bg-background/50 py-8">
        <div className="container max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Airbnb Clone. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
