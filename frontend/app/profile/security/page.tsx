"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";

interface SessionItem {
  sessionId: string;
  createdAt: string;
  lastSeenAt: string;
}

export default function ProfileSecurityPage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [mfaSecret, setMfaSecret] = useState<string>("");
  const [mfaCode, setMfaCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadSessions = async () => {
    try {
      const { data } = await axiosInstance.get("/auth/sessions");
      setSessions(data?.data ?? []);
    } catch {
      toast.error("Failed to load active sessions");
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const revokeSession = async (sessionId: string) => {
    try {
      await axiosInstance.delete(`/auth/sessions/${sessionId}`);
      toast.success("Session revoked");
      await loadSessions();
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  const revokeOthers = async () => {
    try {
      await axiosInstance.post("/auth/sessions/revoke-others", {});
      toast.success("Other sessions revoked");
      await loadSessions();
    } catch {
      toast.error("Failed to revoke other sessions");
    }
  };

  const setupMfa = async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post("/auth/mfa/setup", {});
      setMfaSecret(data?.data?.secret || "");
      toast.success("MFA setup generated");
    } catch {
      toast.error("Failed to generate MFA setup");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMfa = async () => {
    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/mfa/verify", { code: mfaCode });
      toast.success("MFA scaffold enabled");
      setMfaCode("");
    } catch {
      toast.error("Failed to verify MFA code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Security</h1>
          <p className="text-muted-foreground">
            Manage active sessions and multi-factor authentication.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Button variant="outline" onClick={revokeOthers}>
                Revoke Other Sessions
              </Button>
            </div>
            {sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active sessions found.
              </p>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="rounded-md border bg-muted/30 p-3 flex items-center justify-between gap-3"
                  >
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {session.sessionId}
                      </p>
                      <p>
                        Created: {new Date(session.createdAt).toLocaleString()}
                      </p>
                      <p>
                        Last seen:{" "}
                        {new Date(session.lastSeenAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => revokeSession(session.sessionId)}
                    >
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MFA (Scaffold)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={setupMfa} disabled={isLoading}>
              Generate MFA Secret
            </Button>
            {mfaSecret ? (
              <p className="rounded-md border bg-muted/30 p-2 text-xs break-all">
                Secret: {mfaSecret}
              </p>
            ) : null}
            <div className="flex gap-2">
              <Input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="Enter 6-digit code"
              />
              <Button onClick={verifyMfa} disabled={isLoading}>
                Verify
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
