import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import type { MembershipApplication } from "@shared/schema";

export default function AdminAccepted() {
  const [, setLocation] = useLocation();

  const { data: acceptedApplications, isLoading } = useQuery({
    queryKey: ["/api/admin/accepted"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/accepted");
      const data = await response.json();
      return data.applications as MembershipApplication[];
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Accepted Members</h1>
            <p className="text-muted-foreground">Welcome new members and organize coffee meetings</p>
          </div>
          <div className="flex gap-4">
            <Button
              onClick={() => setLocation("/admin/dashboard")}
              variant="outline"
              data-testid="button-back-dashboard"
            >
              ← Back to Dashboard
            </Button>
            <Button
              onClick={() => logoutMutation.mutate()}
              variant="outline"
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
            >
              Logout
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">Accepted Applications</h2>
            <Badge variant="default" className="bg-green-600">
              {acceptedApplications?.length || 0} members
            </Badge>
          </div>

          {!acceptedApplications?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No accepted applications yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {acceptedApplications.map((application) => (
                <Card key={application.id} className="w-full border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <h3 className="font-semibold text-lg">{application.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Accepted: {application.reviewedAt ? new Date(application.reviewedAt).toLocaleDateString() : 'N/A'}
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
                          <p className="font-medium text-primary">{application.email}</p>
                          <p className="text-sm text-muted-foreground">Email for welcome</p>
                        </div>
                      </div>
                      <div className="ml-6 text-center">
                        <div className="bg-amber-100 dark:bg-amber-900 border border-amber-300 dark:border-amber-700 rounded-lg p-4 max-w-xs">
                          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            📧 Send Welcome Email
                          </p>
                          <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                            Organize coffee meeting
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}