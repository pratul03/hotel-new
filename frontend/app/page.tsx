"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HotelSearchBar } from "@/components/hotels/HotelSearchBar";
import { HotelCard } from "@/components/hotels/HotelCard";
import { useAuthStore } from "@/store/authStore";
import { LogIn, LogOut, User, Building2, Star } from "lucide-react";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { usePromotedHotels, useHotels } from "@/hooks/useHotels";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Footer } from "@/components/layout/Footer";
import { Skeleton as UISkeleton } from "@/components/ui/skeleton";
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react";
import { TypingAnimation } from "@/components/ui/typing-animation";
import axiosInstance from "@/lib/axios";

export default function HomePage() {
  const { user, isAuthenticated, logout } = useAuthStore();
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
    adults: number;
    childCount: number;
    childAges: number[];
    guests: number;
    lat?: number;
    lng?: number;
  }) => {
    const params = new URLSearchParams();
    if (filters.location) params.set("location", filters.location);
    if (filters.checkIn) params.set("checkIn", filters.checkIn);
    if (filters.checkOut) params.set("checkOut", filters.checkOut);
    if (filters.adults > 0) params.set("adults", String(filters.adults));
    if (filters.childCount > 0) {
      params.set("childCount", String(filters.childCount));
      params.set("childAges", filters.childAges.join(","));
    }
    if (filters.guests > 1) params.set("guests", String(filters.guests));
    if (filters.lat !== undefined && filters.lng !== undefined) {
      params.set("lat", String(filters.lat));
      params.set("lng", String(filters.lng));
    }
    router.push(`/search?${params.toString()}`);
  };

  const handleLogout = () => {
    axiosInstance.post("/auth/logout").catch(() => {});
    logout();
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Image src="/icon.svg" alt="App logo" width={32} height={32} />
            <span>FND OUT SPACE</span>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <User className="h-4 w-4" />
                      {user.name}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/host" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
            <TypingAnimation
              as="h1"
              className="style-script-regular text-4xl md:text-5xl text-balance"
            >
              Explore Unique Stays and Experiences
            </TypingAnimation>
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
          <BoneyardSkeleton
            loading={promotedLoading}
            name="home-featured-hotels"
            fallback={<HotelGridSkeleton count={4} />}
          >
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
          </BoneyardSkeleton>
        </section>
      )}

      {/* Recent Hotels */}
      <section className="container max-w-7xl mx-auto px-4 py-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-6">Explore Stays</h2>
            <BoneyardSkeleton
              loading={recentLoading}
              name="home-recent-hotels"
              fallback={<HotelGridSkeleton count={8} />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(recentData?.data ?? []).map((hotel) => (
                  <HotelCard
                    key={hotel.id}
                    hotel={hotel}
                    onViewDetails={(id) => router.push(`/hotels/${id}`)}
                  />
                ))}
              </div>
            </BoneyardSkeleton>
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

      <Footer />
    </main>
  );
}

function HotelGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-xl border bg-card overflow-hidden">
          <UISkeleton className="h-48 w-full" />
          <div className="p-4 space-y-3">
            <UISkeleton className="h-5 w-2/3" />
            <UISkeleton className="h-4 w-full" />
            <UISkeleton className="h-4 w-3/4" />
            <UISkeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
