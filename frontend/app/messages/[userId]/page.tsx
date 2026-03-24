"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";
import { ArrowLeft, AlertTriangle, Paperclip, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMessages, useSendMessage } from "@/hooks/useMessages";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

export default function MessageThreadPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const [input, setInput] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [escalate, setEscalate] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: msgData, isLoading } = useMessages(userId);
  const sendMessage = useSendMessage();

  const messages = msgData?.data ?? [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || sendMessage.isPending) return;
    sendMessage.mutate(
      {
        receiverId: userId,
        content,
        attachmentUrl: attachmentUrl.trim() || undefined,
        attachmentType: attachmentUrl ? "image" : undefined,
        escalateToSupport: escalate,
      },
      {
        onSuccess: () => {
          setInput("");
          setAttachmentUrl("");
          setEscalate(false);
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 border-b px-4 py-3 shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback>{userId.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm leading-none">Message Thread</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {messages.length > 0
              ? `${messages.length} message${messages.length !== 1 ? "s" : ""}`
              : "No messages yet"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2",
                  i % 2 === 0 ? "justify-start" : "justify-end",
                )}
              >
                <Skeleton className="h-10 w-48 rounded-2xl" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p className="text-sm">No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isMine = msg.senderId === currentUser?.id;
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2 items-end",
                    isMine ? "justify-end" : "justify-start",
                  )}
                >
                  {!isMine && (
                    <Avatar className="h-6 w-6 shrink-0">
                      <AvatarFallback className="text-xs">
                        {msg.sender?.name?.slice(0, 2).toUpperCase() ?? "U"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[70%] rounded-2xl px-3 py-2 text-sm wrap-break-word",
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted rounded-bl-sm",
                    )}
                  >
                    <p className="wrap-break-word">{msg.content}</p>
                    {msg.attachmentUrl && (
                      <a
                        href={msg.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs underline"
                      >
                        <Paperclip className="h-3 w-3" />
                        Attachment
                      </a>
                    )}
                    <p
                      className={cn(
                        "text-[10px] mt-0.5 select-none",
                        isMine
                          ? "text-primary-foreground/70 text-right"
                          : "text-muted-foreground",
                      )}
                    >
                      {format(new Date(msg.createdAt), "HH:mm")}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="border-t px-4 py-3 shrink-0 flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="resize-none min-h-10 max-h-32"
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              placeholder="Attachment URL (optional)"
              className="h-9 flex-1 rounded-md border bg-background px-3 text-xs"
            />
            <label className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={escalate}
                onChange={(e) => setEscalate(e.target.checked)}
              />
              <AlertTriangle className="h-3.5 w-3.5" />
              Escalate to support
            </label>
          </div>
        </div>
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!input.trim() || sendMessage.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
