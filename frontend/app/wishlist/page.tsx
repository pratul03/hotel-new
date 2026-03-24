"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/common/EmptyState";
import { Heart, BedDouble, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatPrice } from "@/lib/format";
import {
  useAcceptWishlistInvite,
  useCreateWishlistShareLink,
  useInviteWishlistCollaborator,
  useSharedWishlist,
  useWishlist,
  useWishlistCollections,
  useWishlistInvites,
  useRemoveFromWishlist,
} from "@/hooks/useWishlist";

const DEFAULT_LIST = "Favorites";

export default function WishlistPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="py-12 text-center text-muted-foreground">
            Loading wishlist...
          </div>
        </AppLayout>
      }
    >
      <WishlistPageContent />
    </Suspense>
  );
}

function WishlistPageContent() {
  const searchParams = useSearchParams();
  const sharedCode = searchParams.get("shared") || undefined;
  const { data: collections = [], isLoading: collectionsLoading } =
    useWishlistCollections();
  const [selectedList, setSelectedList] = useState(DEFAULT_LIST);
  const [newListName, setNewListName] = useState("");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");

  const collectionNames = useMemo(() => {
    const names = collections.map((item) => item.name);
    if (!names.includes(DEFAULT_LIST)) names.unshift(DEFAULT_LIST);
    return names;
  }, [collections]);

  const { data: wishlist, isLoading } = useWishlist(selectedList);
  const { data: sharedWishlist } = useSharedWishlist(sharedCode);
  const { data: invites = [] } = useWishlistInvites();
  const removeFromWishlist = useRemoveFromWishlist();
  const createShare = useCreateWishlistShareLink();
  const inviteCollaborator = useInviteWishlistCollaborator();
  const acceptInvite = useAcceptWishlistInvite();

  const handleRemove = (roomId: string, listName: string) => {
    removeFromWishlist.mutate(
      { roomId, listName },
      {
        onSuccess: () => toast.success("Removed from wishlist"),
        onError: () => toast.error("Failed to remove from wishlist"),
      },
    );
  };

  const handleCreateList = () => {
    const value = newListName.trim();
    if (!value) return;
    setSelectedList(value);
    setNewListName("");
  };

  const handleShareList = () => {
    createShare.mutate(selectedList, {
      onSuccess: async (data) => {
        if (!data?.shareUrl) return;
        await navigator.clipboard.writeText(data.shareUrl);
        toast.success("Share link copied to clipboard");
      },
      onError: () => toast.error("Failed to create share link"),
    });
  };

  const handleInvite = () => {
    const email = collaboratorEmail.trim();
    if (!email) return;
    inviteCollaborator.mutate(
      { listName: selectedList, email },
      {
        onSuccess: () => {
          setCollaboratorEmail("");
          toast.success("Collaborator invited");
        },
        onError: () => toast.error("Failed to invite collaborator"),
      },
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="text-muted-foreground">
            Your saved rooms and favorite stays organized by lists
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {(collectionsLoading ? [DEFAULT_LIST] : collectionNames).map(
              (listName) => (
                <Button
                  key={listName}
                  type="button"
                  size="sm"
                  variant={selectedList === listName ? "default" : "outline"}
                  onClick={() => setSelectedList(listName)}
                >
                  {listName}
                </Button>
              ),
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Create or switch to list (e.g. Goa Trip)"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={handleCreateList}>
              Use List
            </Button>
            <Button type="button" variant="outline" onClick={handleShareList}>
              Share List
            </Button>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Invite collaborator by email"
              value={collaboratorEmail}
              onChange={(e) => setCollaboratorEmail(e.target.value)}
            />
            <Button type="button" variant="outline" onClick={handleInvite}>
              Invite
            </Button>
          </div>
        </div>

        {!!sharedWishlist && (
          <Card className="p-4 space-y-2 border-dashed">
            <h3 className="font-semibold">Shared List Preview</h3>
            <p className="text-sm text-muted-foreground">
              Viewing {sharedWishlist.listName} by {sharedWishlist.owner.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Items in this shared view: {sharedWishlist.items.length}
            </p>
          </Card>
        )}

        {invites.length > 0 && (
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">Wishlist Collaboration Invites</h3>
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2"
              >
                <p className="text-sm">
                  Invite to collaborate on{" "}
                  <strong>{invite.listName || "Shared list"}</strong>
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    acceptInvite.mutate(invite.id, {
                      onSuccess: () => toast.success("Invite accepted"),
                      onError: () => toast.error("Failed to accept invite"),
                    })
                  }
                >
                  Accept
                </Button>
              </div>
            ))}
          </Card>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : !wishlist?.length ? (
          <EmptyState
            icon={<Heart className="h-12 w-12 text-muted-foreground" />}
            title={`No Items in \"${selectedList}\"`}
            description="Save rooms into this list from listing pages"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold capitalize">
                        {item.room?.roomType?.replace(/_/g, " ")} Room
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                          {item.room?.hotel?.name} ·{" "}
                          {item.room?.hotel?.location}
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <BedDouble className="h-3.5 w-3.5 mr-1" />
                      {item.listName}
                    </Badge>
                  </div>

                  <p className="text-xl font-bold">
                    {item.room?.basePrice
                      ? formatPrice(item.room.basePrice)
                      : "—"}
                    <span className="text-sm font-normal text-muted-foreground">
                      {" "}
                      / night
                    </span>
                  </p>

                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link
                        href={`/hotels/${item.room?.hotel?.id}/rooms/${item.roomId}`}
                      >
                        Book Now
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemove(item.roomId, item.listName)}
                      disabled={removeFromWishlist.isPending}
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
