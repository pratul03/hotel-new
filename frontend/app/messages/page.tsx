"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { MessageCircle } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useConversations } from "@/hooks/useMessages";
import { Skeleton as BoneyardSkeleton } from "boneyard-js/react";

export default function MessagesPage() {
  const { data: conversations, isLoading } = useConversations();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with guests and hosts
          </p>
        </div>

        {!isLoading && !conversations?.length ? (
          <EmptyState
            icon={<MessageCircle className="h-12 w-12 text-muted-foreground" />}
            title="No Messages"
            description="Start a conversation with a host or guest"
          />
        ) : (
          <BoneyardSkeleton
            loading={isLoading}
            name="messages-conversation-list"
            fallback={
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-xl" />
                ))}
              </div>
            }
          >
            <div className="space-y-3">
              {(conversations ?? []).map((conv) => (
                <Link key={conv.userId} href={`/messages/${conv.userId}`}>
                  <Card
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${
                      conv.unreadCount > 0 ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={conv.userAvatar}
                          alt={conv.userName}
                        />
                        <AvatarFallback>
                          {conv.userName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">
                            {conv.userName}
                          </span>
                          {conv.lastMessageAt && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {formatDistanceToNow(
                                new Date(conv.lastMessageAt),
                                {
                                  addSuffix: true,
                                },
                              )}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage ?? "No messages yet"}
                        </p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <Badge variant="default" className="shrink-0">
                          {conv.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </BoneyardSkeleton>
        )}
      </div>
    </AppLayout>
  );
}
