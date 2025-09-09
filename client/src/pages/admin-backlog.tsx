import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Check, X, Clock, ArrowLeft } from "lucide-react";
import type { MembershipApplication } from "@shared/schema";

export default function AdminBacklog() {
  const [, setLocation] = useLocation();

  // Get all applications (pending, accepted, rejected)
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

  // Combine all applications
  const allApplications = [
    ...(pendingApplications || []).map(app => ({ ...app, status: "pending" as const })),
    ...(acceptedApplications || []).map(app => ({ ...app, status: "accepted" as const }))
  ];

  if (pendingLoading || acceptedLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return <Check className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <X className="h-4 w-4 text-red-600" />;
      case "pending":
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
      default:
        return "bg-orange-100 text-orange-800 border-orange-200";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => setLocation("/admin/dashboard")}
            variant="outline"
            size="sm"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Application Backlog</h1>
            <p className="text-muted-foreground">Compact view of all applications</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold">All Applications</h2>
            <Badge variant="secondary">{allApplications.length} total</Badge>
          </div>

          {!allApplications.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No applications found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allApplications.map((application) => (
                <Dialog key={application.id}>
                  <DialogTrigger asChild>
                    <Card 
                      className={`cursor-pointer hover:shadow-lg transition-shadow ${getStatusColor(application.status)} border-2`}
                      data-testid={`card-application-${application.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-lg truncate">
                              {application.name}
                            </h3>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(application.status)}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <p className="font-medium truncate">{application.company}</p>
                              <p className="text-sm text-muted-foreground">Company</p>
                            </div>
                            
                            <div>
                              <p className="font-medium truncate">{application.role}</p>
                              <p className="text-sm text-muted-foreground">Role</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant="outline" 
                              className={`${getStatusColor(application.status)} border`}
                            >
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </Badge>
                            <p className="text-xs text-muted-foreground">
                              Click for details
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {getStatusIcon(application.status)}
                        Application Details
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{application.name}</h3>
                        <Badge 
                          className={`${getStatusColor(application.status)} mt-1`}
                        >
                          {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">{application.email}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Company</p>
                          <p className="font-medium">{application.company}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">Role</p>
                          <p className="font-medium">{application.role}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {application.status === "accepted" ? "Accepted" : "Submitted"}
                          </p>
                          <p className="font-medium">
                            {new Date(application.status === "accepted" ? (application.reviewedAt || application.submittedAt) : application.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}