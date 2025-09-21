import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { EyeOff, Eye } from "lucide-react";
import type { MembershipApplication } from "@shared/schema";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [hideAccepted, setHideAccepted] = useState(false);

  const { data: pendingApplications, isLoading: pendingLoading } = useQuery({
    queryKey: ["/api/admin/pending"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/pending");
      const data = await response.json();
      return data.applications as MembershipApplication[];
    },
  });

  const { data: acceptedApplications, isLoading: acceptedLoading } = useQuery({
    queryKey: ["/api/admin/accepted"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/accepted");
      const data = await response.json();
      return data.applications as MembershipApplication[];
    },
  });

  const acceptMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await apiRequest("PATCH", `/api/admin/applications/${applicationId}/status`, {
        status: "accepted"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Accepted",
        description: "The application has been approved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/accepted"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept application.",
        variant: "destructive",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await apiRequest("PATCH", `/api/admin/applications/${applicationId}/status`, {
        status: "rejected"
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Declined",
        description: "The application has been declined.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to decline application.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/logout");
      return response.json();
    },
    onSuccess: () => {
      setLocation("/admin/login");
    },
  });

  if (pendingLoading || acceptedLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#fceadc'}}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setHideAccepted(!hideAccepted)}
              variant="outline"
              size="sm"
              className="border-gray-300"
              data-testid="button-hide-accepted"
            >
              {hideAccepted ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {hideAccepted ? "Show Accepted" : "Hide Accepted"}
            </Button>
            <div>
              <h1 className="text-3xl font-bold" style={{color: '#374151'}}>DYPS Admin Dashboard</h1>
              <p style={{color: '#6b7280'}}>Review and manage membership applications</p>
            </div>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setLocation("/admin/backlog")}
              variant="outline"
              className="border-gray-300"
              data-testid="button-backlog"
            >
              📋 Backlog View
            </Button>
            <Button
              onClick={() => setLocation("/admin/accepted")}
              className="bg-green-600 hover:bg-green-700 text-white"
              data-testid="button-accepted"
            >
              ✓ Accepted Applications
            </Button>
            <Button
              onClick={() => logoutMutation.mutate()}
              variant="outline"
              className="border-gray-300"
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Pending Applications Section */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">Pending Applications</h2>
              <Badge variant="secondary">{pendingApplications?.length || 0} pending</Badge>
            </div>

            {!pendingApplications?.length ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No pending applications</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingApplications.map((application) => (
                  <Card key={application.id} className="w-full">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                          <div>
                            <h3 className="font-semibold text-lg">{application.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Submitted: {new Date(application.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="font-medium">{application.company}</p>
                            <p className="text-sm text-muted-foreground">Company</p>
                          </div>
                          <div>
                            <p className="font-medium">{application.role}</p>
                            <p className="text-sm text-muted-foreground">Role</p>
                          </div>
                          <div>
                            <p className="font-medium">{application.email}</p>
                            <p className="text-sm text-muted-foreground">Email</p>
                          </div>
                          <div>
                            {application.linkedin ? (
                              <a
                                href={application.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-blue-600 hover:text-blue-800 underline"
                              >
                                LinkedIn Profile
                              </a>
                            ) : (
                              <p className="font-medium text-muted-foreground">-</p>
                            )}
                            <p className="text-sm text-muted-foreground">LinkedIn</p>
                          </div>
                        </div>
                        <div className="ml-6 flex gap-2">
                          <Button
                            onClick={() => declineMutation.mutate(application.id)}
                            disabled={declineMutation.isPending || acceptMutation.isPending}
                            variant="outline"
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                            data-testid={`button-decline-${application.id}`}
                          >
                            {declineMutation.isPending ? "Declining..." : "Decline"}
                          </Button>
                          <Button
                            onClick={() => acceptMutation.mutate(application.id)}
                            disabled={acceptMutation.isPending || declineMutation.isPending}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`button-accept-${application.id}`}
                          >
                            {acceptMutation.isPending ? "Accepting..." : "Accept"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Accepted Applications Section - Show/Hide based on toggle */}
          {!hideAccepted && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-semibold">Accepted Applications</h2>
                <Badge variant="default" className="bg-green-600">{acceptedApplications?.length || 0} accepted</Badge>
              </div>

              {!acceptedApplications?.length ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No accepted applications</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {acceptedApplications.map((application) => (
                    <Card key={application.id} className="w-full border-green-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                              <h3 className="font-semibold text-lg">{application.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Accepted: {new Date(application.reviewedAt || application.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="font-medium">{application.company}</p>
                              <p className="text-sm text-muted-foreground">Company</p>
                            </div>
                            <div>
                              <p className="font-medium">{application.role}</p>
                              <p className="text-sm text-muted-foreground">Role</p>
                            </div>
                            <div>
                              <p className="font-medium">{application.email}</p>
                              <p className="text-sm text-muted-foreground">Email</p>
                            </div>
                            <div>
                              {application.linkedin ? (
                                <a
                                  href={application.linkedin}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-blue-600 hover:text-blue-800 underline"
                                >
                                  LinkedIn Profile
                                </a>
                              ) : (
                                <p className="font-medium text-muted-foreground">-</p>
                              )}
                              <p className="text-sm text-muted-foreground">LinkedIn</p>
                            </div>
                          </div>
                          <div className="ml-6">
                            <Badge className="bg-green-600">✓ Accepted</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}