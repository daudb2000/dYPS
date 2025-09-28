import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function AdminLogin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Check for bypass query parameter on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const bypass = urlParams.get('bypass');

    if (bypass === 'dyps2024') {
      // Call bypass API to authenticate
      fetch('/api/admin/bypass?key=dyps2024', { method: 'GET' })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            toast({
              title: "Admin Access Granted",
              description: "Bypassing login for admin access.",
            });
            setLocation("/admin/dashboard");
          }
        })
        .catch(() => {
          toast({
            title: "Bypass Failed",
            description: "Please use regular login.",
            variant: "destructive",
          });
        });
    }
  }, [setLocation, toast]);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/admin/login", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Login Successful",
        description: "Welcome to the admin dashboard.",
      });
      setLocation("/admin/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login Failed",
        description: "Invalid username or password.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            DYPS Admin Login
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                {...form.register("username")}
                className="mt-1"
                data-testid="input-username"
              />
              {form.formState.errors.username && (
                <p className="text-sm text-destructive mt-1" data-testid="error-username">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                className="mt-1"
                data-testid="input-password"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1" data-testid="error-password">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full"
              data-testid="button-login"
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}