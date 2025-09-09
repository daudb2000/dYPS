import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { insertMembershipApplicationSchema, type InsertMembershipApplication } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import dypsImage from "@assets/092FBE56-12B6-4789-91A0-21B03FFCB0C3_1_105_c copy.jpeg(1)_1757453665965.png";

export default function Home() {
  const { toast } = useToast();

  const form = useForm<InsertMembershipApplication>({
    resolver: zodResolver(insertMembershipApplicationSchema),
    defaultValues: {
      name: "",
      company: "",
      role: "",
      email: "",
      consent: false,
    },
  });

  const submitApplication = useMutation({
    mutationFn: async (data: InsertMembershipApplication) => {
      const response = await apiRequest("POST", "/api/membership-applications", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted Successfully!",
        description: "We will be in touch soon regarding your membership application.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Submission error:", error);
      toast({
        title: "Submission Failed",
        description: "Please check your information and try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertMembershipApplication) => {
    submitApplication.mutate(data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-background">
      
      <div className="max-w-2xl w-full space-y-8">
        
        {/* Logo Section */}
        <div className="text-center">
          <div className="inline-block">
            <img 
              src={dypsImage} 
              alt="DYPS" 
              className="h-32 w-auto object-contain"
              data-testid="dyps-logo"
            />
          </div>
        </div>

        {/* Title and Description */}
        <div className="text-center space-y-4">
          <h1 className="ft-serif-straight text-3xl md:text-4xl leading-tight font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-800 via-purple-700 to-slate-900 bg-[length:200%_100%] animate-gradient">
            Deals Young Professional Society
          </h1>
          <p className="text-base leading-relaxed max-w-2xl mx-auto text-muted-foreground">
            The Deals Young Professional Society (DYPS) is a Manchester based referral-only society dedicated to fostering professional relationships and knowledge exchange among young practitioners in the small to mid-market corporate transaction sector.
          </p>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="flex items-center flex-wrap justify-center gap-3">
              <span className="text-sm text-muted-foreground mr-2">A space for</span>
              
              {/* First row - 3 roles */}
              <div className="flex gap-3">
                <span className="px-4 py-2 bg-amber-50 text-amber-900 rounded-lg text-sm font-medium shadow-sm">
                  Corporate Financiers
                </span>
                <span className="px-4 py-2 bg-amber-50 text-amber-900 rounded-lg text-sm font-medium shadow-sm">
                  Investment Bankers
                </span>
                <span className="px-4 py-2 bg-amber-50 text-amber-900 rounded-lg text-sm font-medium shadow-sm">
                  Venture Capitalists
                </span>
              </div>
            </div>
            
            {/* Second row - 3 roles, aligned to start of "Venture" */}
            <div className="flex gap-3 self-center" style={{ marginLeft: '120px' }}>
              <span className="px-4 py-2 bg-amber-50 text-amber-900 rounded-lg text-sm font-medium shadow-sm">
                Private Equity
              </span>
              <span className="px-4 py-2 bg-amber-50 text-amber-900 rounded-lg text-sm font-medium shadow-sm">
                Corporate Lawyers
              </span>
              <span className="px-4 py-2 bg-amber-50 text-amber-900 rounded-lg text-sm font-medium shadow-sm">
                Transaction Services
              </span>
            </div>
            
            {/* Large horizontal dark purple bubble */}
            <div className="px-8 py-3 bg-purple-800 text-purple-100 rounded-xl text-sm font-medium shadow-lg w-80 text-center">
              and ambitious professionals
            </div>
          </div>
        </div>
      </div>

      {/* Membership Form - Narrower Section */}
      <div className="max-w-lg w-full mt-16">
        <Card className="bg-card border border-border shadow-sm">
          <CardContent className="p-8">
            <h2 className="ft-serif text-xl font-semibold mb-6 text-center text-card-foreground">
              Apply for Membership
            </h2>
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Name Field */}
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  {...form.register("name")}
                  className="form-field w-full px-4 py-3 border border-input bg-background rounded-md text-foreground placeholder-muted-foreground"
                  placeholder="Enter your full name"
                  data-testid="input-name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1" data-testid="error-name">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              {/* Company Field */}
              <div>
                <Label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                  Company *
                </Label>
                <Input
                  id="company"
                  type="text"
                  {...form.register("company")}
                  className="form-field w-full px-4 py-3 border border-input bg-background rounded-md text-foreground placeholder-muted-foreground"
                  placeholder="Enter your company name"
                  data-testid="input-company"
                />
                {form.formState.errors.company && (
                  <p className="text-sm text-destructive mt-1" data-testid="error-company">
                    {form.formState.errors.company.message}
                  </p>
                )}
              </div>

              {/* Role Field */}
              <div>
                <Label htmlFor="role" className="block text-sm font-medium text-foreground mb-2">
                  Role *
                </Label>
                <Input
                  id="role"
                  type="text"
                  {...form.register("role")}
                  className="form-field w-full px-4 py-3 border border-input bg-background rounded-md text-foreground placeholder-muted-foreground"
                  placeholder="Enter your job title"
                  data-testid="input-role"
                />
                {form.formState.errors.role && (
                  <p className="text-sm text-destructive mt-1" data-testid="error-role">
                    {form.formState.errors.role.message}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className="form-field w-full px-4 py-3 border border-input bg-background rounded-md text-foreground placeholder-muted-foreground"
                  placeholder="Enter your professional email"
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive mt-1" data-testid="error-email">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              {/* Consent Checkbox */}
              <div className="space-y-4 pt-2">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consent"
                    checked={form.watch("consent")}
                    onCheckedChange={(checked) => form.setValue("consent", !!checked)}
                    className="mt-1"
                    data-testid="checkbox-consent"
                  />
                  <Label htmlFor="consent" className="text-sm text-amber-900 leading-relaxed cursor-pointer">
                    I consent to being contacted regarding my membership application status
                  </Label>
                </div>
                {form.formState.errors.consent && (
                  <p className="text-sm text-destructive" data-testid="error-consent">
                    {form.formState.errors.consent.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={submitApplication.isPending}
                  className="btn-submit w-full bg-amber-900 hover:bg-amber-800 text-white font-medium py-3 px-6 rounded-md transition-all duration-200 shadow-lg hover:shadow-xl"
                  data-testid="button-submit"
                >
                  {submitApplication.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>

            {/* Data Policy Link */}
            <div className="mt-6 pt-4 border-t border-border text-center">
              <p className="text-sm text-muted-foreground">
                By submitting this form, you agree to our{" "}
                <Link 
                  to="/data-retention" 
                  className="link-policy text-amber-900 hover:text-amber-800 hover:underline transition-all duration-200"
                  data-testid="link-data-policy"
                >
                  Data Retention Policy
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
