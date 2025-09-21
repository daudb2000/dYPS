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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  TrendingUp,
  Users,
  Mail,
  MapPin,
  ChevronDown,
  Building2,
  Network,
  Handshake,
  ChevronUp,
  CheckCircle,
  Circle,
  Clock,
  UserCheck
} from "lucide-react";
import dypsImage from "@assets/092FBE56-12B6-4789-91A0-21B03FFCB0C3_1_105_c copy.jpeg(1)_1757453665965.png";

export default function Home() {
  const { toast } = useToast();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [bannerExpanded, setBannerExpanded] = useState(false);

  const form = useForm<InsertMembershipApplication>({
    resolver: zodResolver(insertMembershipApplicationSchema),
    defaultValues: {
      name: "",
      company: "",
      role: "",
      email: "",
      linkedin: "",
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
        description: "Your application is now being processed.",
      });
      form.reset();
      setApplicationSubmitted(true);
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

  const faqData = [
    {
      question: "How do I become a member of DYPS?",
      answer: "DYPS is a referral-only society. To join, you must be referred by an existing member or apply through our website and be approved by our leadership team. We focus on young professionals in corporate finance, investment banking, private equity, venture capital, corporate law, and transaction services."
    },
    {
      question: "What are the membership criteria?",
      answer: "We welcome young professionals working in the small to mid-market corporate transaction sector in Manchester. This includes corporate financiers, investment bankers, private equity professionals, venture capitalists, corporate lawyers, and transaction services specialists."
    },
    {
      question: "What can I expect at DYPS events?",
      answer: "Our events are designed to facilitate authentic networking. You can expect a relaxed atmosphere where you can expand your network, share experiences, and learn from fellow young professionals in the deals community. We host a regular monthly drinks get-together where members can touch-base with one another. We are looking into starting sport networking and more tight-knit lunches with select professional groups, get in touch to learn more."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-amber-50 to-slate-100">
      {/* Header Navigation */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-amber-200/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-16">
            {/* Right Side - Navigation Dropdown and Login */}
            <div className="flex items-center space-x-4">
              {/* Navigation Dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-1 text-slate-700 hover:text-amber-900 transition-colors p-2">
                  <span className="text-sm font-medium">Menu</span>
                  <svg
                    className="w-3 h-3 transform group-hover:rotate-180 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-amber-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                    >
                      About Us
                    </button>
                    <button
                      onClick={() => document.querySelector('section:last-of-type')?.scrollIntoView({ behavior: 'smooth' })}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-amber-50 hover:text-amber-900 transition-colors"
                    >
                      Get In Touch
                    </button>
                  </div>
                </div>
              </div>

              {/* Single Login Button */}
              <Button className="bg-amber-900 hover:bg-amber-800 text-white">
                Member Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Integrated Application */}
      <section className="relative py-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-900/10 to-slate-900/10"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left Side - Branding */}
            <div className="text-center lg:text-left space-y-8">
              <div className="flex justify-center lg:justify-start">
                <img
                  src={dypsImage}
                  alt="DYPS"
                  className="h-20 w-auto object-contain"
                  data-testid="dyps-logo"
                />
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-900 via-slate-800 to-amber-900">
                Deals Young Professional Society
              </h1>
              <p className="text-lg md:text-xl text-slate-700 leading-relaxed mb-8">
                The Deals Young Professional Society (DYPS) is a Manchester based curated network dedicated to fostering professional relationships and knowledge exchange among young practitioners in the small to mid-market corporate transaction sector.
              </p>

              {/* Feature Icons */}
              <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full border-4 flex items-center justify-center relative" style={{backgroundColor: '#fceadc', borderColor: '#374151'}}>
                    <span className="font-bold text-xl" style={{color: '#374151'}}>£</span>
                    <div className="absolute inset-2 flex items-center justify-center">
                      <div className="w-full h-0.5 transform rotate-45" style={{backgroundColor: '#374151'}}></div>
                    </div>
                  </div>
                  <div className="text-center text-sm text-slate-700">
                    <p className="font-semibold">No membership fees</p>
                    <p className="text-xs">No-cost invites to our drinks events</p>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-full border-4 flex items-center justify-center" style={{backgroundColor: '#fceadc', borderColor: '#374151'}}>
                    <MapPin className="h-6 w-6" style={{color: '#374151'}} />
                  </div>
                  <div className="text-center text-sm text-slate-700">
                    <p className="font-semibold">Manchester-based</p>
                    <p className="text-xs">Dedicated to local dealmaking</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Application Form */}
            <div className="w-full">
              <Card className="bg-white/90 backdrop-blur-sm border-amber-200 shadow-2xl" id="membership">
                <CardHeader className="bg-gradient-to-r from-amber-900 to-slate-800 text-white rounded-t-lg py-4 px-6 flex items-center justify-center">
                  <div className="text-center space-y-1">
                    <CardTitle className="text-2xl md:text-3xl font-bold tracking-wide">
                      Apply for Membership
                    </CardTitle>
                    <p className="text-amber-100 text-lg font-medium">
                      Join the community
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Name Field */}
                      <div>
                        <Label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-1">
                          Full Name *
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          {...form.register("name")}
                          className="w-full px-3 py-2 border-2 border-amber-200 bg-white rounded-lg text-slate-700 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                          placeholder="Enter your full name"
                          data-testid="input-name"
                        />
                        {form.formState.errors.name && (
                          <p className="text-xs text-red-600 mt-1" data-testid="error-name">
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      {/* Company Field */}
                      <div>
                        <Label htmlFor="company" className="block text-sm font-semibold text-slate-700 mb-1">
                          Company *
                        </Label>
                        <Input
                          id="company"
                          type="text"
                          {...form.register("company")}
                          className="w-full px-3 py-2 border-2 border-amber-200 bg-white rounded-lg text-slate-700 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                          placeholder="Enter your company"
                          data-testid="input-company"
                        />
                        {form.formState.errors.company && (
                          <p className="text-xs text-red-600 mt-1" data-testid="error-company">
                            {form.formState.errors.company.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Role Field */}
                      <div>
                        <Label htmlFor="role" className="block text-sm font-semibold text-slate-700 mb-1">
                          Role *
                        </Label>
                        <Input
                          id="role"
                          type="text"
                          {...form.register("role")}
                          className="w-full px-3 py-2 border-2 border-amber-200 bg-white rounded-lg text-slate-700 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                          placeholder="Your job title"
                          data-testid="input-role"
                        />
                        {form.formState.errors.role && (
                          <p className="text-xs text-red-600 mt-1" data-testid="error-role">
                            {form.formState.errors.role.message}
                          </p>
                        )}
                      </div>

                      {/* Email Field */}
                      <div>
                        <Label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                          Email Address *
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          {...form.register("email")}
                          className="w-full px-3 py-2 border-2 border-amber-200 bg-white rounded-lg text-slate-700 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                          placeholder="Professional email"
                          data-testid="input-email"
                        />
                        {form.formState.errors.email && (
                          <p className="text-xs text-red-600 mt-1" data-testid="error-email">
                            {form.formState.errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* LinkedIn Field */}
                    <div>
                      <Label htmlFor="linkedin" className="block text-sm font-semibold text-slate-700 mb-1">
                        LinkedIn Profile (Optional)
                      </Label>
                      <Input
                        id="linkedin"
                        type="url"
                        {...form.register("linkedin")}
                        className="w-full px-3 py-2 border-2 border-amber-200 bg-white rounded-lg text-slate-700 placeholder-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                        placeholder="https://linkedin.com/in/your-profile"
                        data-testid="input-linkedin"
                      />
                      {form.formState.errors.linkedin && (
                        <p className="text-xs text-red-600 mt-1" data-testid="error-linkedin">
                          {form.formState.errors.linkedin.message}
                        </p>
                      )}
                    </div>

                    {/* Consent Checkbox */}
                    <div className="col-span-2 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="consent"
                          checked={form.watch("consent")}
                          onCheckedChange={(checked) => form.setValue("consent", !!checked)}
                          className="mt-1 border-amber-400 data-[state=checked]:bg-amber-900"
                          data-testid="checkbox-consent"
                        />
                        <Label htmlFor="consent" className="text-xs text-slate-700 leading-relaxed cursor-pointer">
                          I consent to being contacted regarding my membership application status and future DYPS events, and I agree to the data retention policy.
                        </Label>
                      </div>
                      {form.formState.errors.consent && (
                        <p className="text-xs text-red-600 mt-1" data-testid="error-consent">
                          {form.formState.errors.consent.message}
                        </p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="col-span-2">
                      <Button
                      type="submit"
                      disabled={submitApplication.isPending}
                      className="w-full bg-gradient-to-r from-amber-900 to-slate-800 hover:from-amber-800 hover:to-slate-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                      data-testid="button-submit"
                    >
                      {submitApplication.isPending ? "Submitting Application..." : "Apply for Membership"}
                    </Button>
                    </div>
                  </form>

                  {/* Data Policy Link */}
                  <div className="mt-4 pt-4 border-t border-amber-200 text-center">
                    <p className="text-xs text-slate-600">
                      By submitting this form, you agree to our{" "}
                      <Link
                        to="/data-retention"
                        className="text-amber-900 hover:text-amber-800 hover:underline font-medium transition-all duration-200"
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
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 px-4 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-amber-900 mb-4">About DYPS</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-900 to-slate-800 h-1 w-20 rounded"></div>
              <p className="text-lg text-slate-700 leading-relaxed">
                Founded in 2024, DYPS has rapidly grown from 2 founding members to over 125 active professionals.
                The society is dedicated to fostering meaningful relationships and knowledge exchange
                among young practitioners in the small to mid-market corporate transaction sector.
              </p>
              <p className="text-lg text-slate-700 leading-relaxed">
                Our approach is simple: <strong>"No name tags. No long speeches. Just great conversations."</strong>
                We believe in creating authentic networking opportunities that help young professionals
                expand their networks, share experiences, and learn from one another.
              </p>
              <p className="text-lg text-slate-700 leading-relaxed">
                Our growth is underpinned by our strong community. Once a member you are free to refer colleagues & connections into the DYPS network.
              </p>
            </div>

            <div className="space-y-4">
              <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Our Community
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      "Corporate Financiers",
                      "Private Equity Professionals",
                      "Venture Capitalists",
                      "Investment Bankers",
                      "Corporate Lawyers",
                      "Transaction Services Specialists"
                    ].map((profession, index) => (
                      <div key={index} className="bg-white/70 p-2 rounded-md border border-amber-100 hover:bg-white/90 transition-colors">
                        <div className="text-amber-900 font-medium flex items-center gap-2 text-sm">
                          <Handshake className="h-3 w-3" />
                          {profession}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ Section - Full Width */}
          <div className="mt-12">
            <Card className="border-amber-200 bg-gradient-to-br from-white to-amber-50 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl font-semibold text-amber-900 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    FAQ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {faqData.map((faq, index) => (
                    <details key={index} className="group bg-white/60 rounded-lg border border-amber-100 hover:bg-white/80 transition-colors">
                      <summary className="p-3 cursor-pointer list-none flex justify-between items-start">
                        <span className="text-sm font-medium text-amber-900 flex-1 pr-2">{faq.question}</span>
                        <svg
                          className="h-4 w-4 text-amber-600 transform group-open:rotate-180 transition-transform duration-200 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-3 pb-3 pt-1">
                        <p className="text-xs text-slate-600 leading-relaxed">{faq.answer}</p>
                      </div>
                    </details>
                  ))}

                  <div className="mt-4 pt-3 border-t border-amber-200">
                    <p className="text-xs text-slate-500 text-center">
                      More questions? <span className="text-amber-700 font-medium cursor-pointer hover:text-amber-800">Contact us</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-gradient-to-br from-amber-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">Get In Touch</h2>
          <p className="text-xl text-amber-100 mb-12 max-w-2xl mx-auto">
            Ready to join Manchester's premier deals community? Contact us to learn more about membership opportunities.
          </p>

          <div className="flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-md w-full text-center">
              <Network className="h-8 w-8 text-amber-300 mx-auto mb-6" />
              <h3 className="text-xl font-semibold mb-6">Leadership Committee</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-amber-300 font-medium mb-2">Alkesh Monja ACCA</p>
                    <p className="text-amber-100 text-sm mb-2">Co-Chair</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-amber-300 text-xs">alkesh.monja@example.com</span>
                      <a
                        href="mailto:alkesh.monja@example.com"
                        className="text-amber-300 hover:text-amber-200 transition-colors"
                        title="Send email to Alkesh"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-amber-300 font-medium mb-2">Daud Bhatti, ACSI</p>
                    <p className="text-amber-100 text-sm mb-2">Co-Chair</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-amber-300 text-xs">daud.bhatti@mavencp.com</span>
                      <a
                        href="mailto:daud.bhatti@mavencp.com"
                        className="text-amber-300 hover:text-amber-200 transition-colors"
                        title="Send email to Daud"
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <p className="text-amber-300 font-medium mb-2">Max Conder</p>
                  <p className="text-amber-100 text-sm mb-2">Committee Member</p>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-amber-300 text-xs">max.conder@example.com</span>
                    <a
                      href="mailto:max.conder@example.com"
                      className="text-amber-300 hover:text-amber-200 transition-colors"
                      title="Send email to Max"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <Button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="bg-white text-amber-900 hover:bg-amber-50 font-semibold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Apply for Membership
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <img src={dypsImage} alt="DYPS" className="h-8 w-auto" />
            <span className="text-lg font-semibold">Deals Young Professional Society</span>
          </div>
          <div className="text-slate-400 text-sm">
            © 2024 DYPS. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Application Status Banner */}
      {applicationSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-amber-200 shadow-2xl">
          {/* Main Banner Content */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Processing Animation */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="w-8 h-8 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin"></div>
                    <CheckCircle className="absolute inset-0 w-8 h-8 text-green-600 opacity-0 animate-pulse" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">Application Processing</p>
                    <p className="text-xs text-slate-600">Your membership application has been received</p>
                  </div>
                </div>
              </div>

              {/* Expand/Collapse Button */}
              <button
                onClick={() => setBannerExpanded(!bannerExpanded)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
              >
                <span className="text-sm text-amber-800 font-medium">View Details</span>
                {bannerExpanded ? (
                  <ChevronDown className="w-4 h-4 text-amber-600" />
                ) : (
                  <ChevronUp className="w-4 h-4 text-amber-600" />
                )}
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          {bannerExpanded && (
            <div className="px-6 pb-6 border-t border-amber-100 bg-gradient-to-br from-amber-50 to-slate-50">
              <div className="pt-4">
                {/* Application Timeline */}
                <div className="mb-6">
                  <h3 className="font-semibold text-slate-800 mb-4 text-sm">Application Status Timeline</h3>
                  <div className="space-y-3">
                    {/* Step 1 - Completed */}
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800">Application Received and Validated</p>
                        <p className="text-xs text-slate-600">Your application has been successfully submitted and validated</p>
                      </div>
                      <span className="text-xs text-green-600 font-medium">✓ Complete</span>
                    </div>

                    {/* Step 2 - In Progress */}
                    <div className="flex items-center space-x-3">
                      <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600">Committee Review</p>
                        <p className="text-xs text-slate-500">Our leadership team will review your application</p>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">Pending</span>
                    </div>

                    {/* Step 3 - Pending */}
                    <div className="flex items-center space-x-3">
                      <Circle className="w-5 h-5 text-slate-400 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600">Introduction Email from Committee Members</p>
                        <p className="text-xs text-slate-500">You'll receive next steps and welcome information</p>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">Pending</span>
                    </div>
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <div className="flex items-start space-x-3">
                    {/* Jagged upward trending line icon */}
                    <div className="w-5 h-5 mt-0.5 flex-shrink-0">
                      <svg viewBox="0 0 20 20" className="w-5 h-5 text-amber-600">
                        <path
                          d="M2 16 L6 12 L10 14 L14 8 L18 4"
                          stroke="currentColor"
                          strokeWidth="2"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 text-sm mb-2">What Happens Next?</h4>
                      <ul className="space-y-2 text-sm text-slate-700">
                        <li className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Our committee will review your application within 3-5 business days</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span>You'll receive an email confirmation with next steps</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mt-2 flex-shrink-0"></span>
                          <span>Upon acceptance, you'll join DYPS and receive the regular monthly invites to our events</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Close Banner Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setApplicationSubmitted(false)}
                    className="text-sm text-slate-600 hover:text-slate-800 px-3 py-1 rounded hover:bg-slate-100 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}