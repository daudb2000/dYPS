import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import {
  Shield,
  Crown,
  TrendingUp,
  Users,
  Eye,
  Clock,
  CheckCircle,
  Star
} from 'lucide-react';
import dypsImage from "@assets/092FBE56-12B6-4789-91A0-21B03FFCB0C3_1_105_c copy.jpeg(1)_1757453665965.png";

export default function ApplicationSubmitted() {
  const [currentStep, setCurrentStep] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);

  const steps = [
    "Application received and validated",
    "Security and compliance checks",
    "Founder review in progress",
    "Final assessment by leadership team"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    const animationInterval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 4);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(animationInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-slate-50 to-amber-100">
      {/* Exclusive Header */}
      <header className="bg-gradient-to-r from-amber-900 to-slate-800 text-white py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <img src={dypsImage} alt="DYPS" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Application Under Exclusive Review
          </h1>
          <p className="text-amber-100 text-lg">
            Your membership application has been submitted to Manchester's most selective professional society
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Main Status Card */}
        <Card className="border-amber-200 bg-white/90 backdrop-blur-sm shadow-2xl mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Crown className="h-16 w-16 text-amber-600" />
                <div className="absolute -top-2 -right-2">
                  <div className={`w-4 h-4 bg-amber-400 rounded-full animate-ping ${animationPhase % 2 === 0 ? 'opacity-75' : 'opacity-25'}`}></div>
                </div>
              </div>
            </div>
            <CardTitle className="text-2xl text-amber-900 mb-2">
              Exclusive Review in Progress
            </CardTitle>
            <p className="text-slate-600">
              Our founding partners are personally reviewing your application
            </p>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Animated Loading Bar */}
            <div className="relative">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>Application Processing</span>
                <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-amber-600 to-amber-400 h-3 rounded-full transition-all duration-1000 ease-in-out"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                >
                  <div className="w-full h-full bg-white/30 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="bg-gradient-to-br from-amber-50 to-white p-6 rounded-xl border border-amber-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <Eye className="h-6 w-6 text-amber-600" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-lg font-semibold text-amber-900">Current Status</h3>
              </div>
              <p className="text-slate-700 font-medium text-lg">
                {steps[currentStep]}
              </p>
              <p className="text-slate-500 text-sm mt-2">
                Expected review time: 2-5 business days
              </p>
            </div>

            {/* Review Process Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-all duration-500 ${
                    index <= currentStep
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {index <= currentStep ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-slate-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      index <= currentStep ? 'text-green-800' : 'text-slate-600'
                    }`}>
                      {step}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exclusivity Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-amber-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Shield className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Exclusive Access</h3>
              <p className="text-slate-600 text-sm">
                Only 80+ carefully vetted professionals in Manchester's deal-making community
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Founder Review</h3>
              <p className="text-slate-600 text-sm">
                Alkesh Monja ACCA & Daud Bhatti ACSI personally review each application
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Star className="h-12 w-12 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-amber-900 mb-2">Elite Network</h3>
              <p className="text-slate-600 text-sm">
                Connect with top-tier professionals in PE, VC, IB, and corporate law
              </p>
            </CardContent>
          </Card>
        </div>

        {/* What Happens Next */}
        <Card className="border-amber-200 bg-gradient-to-br from-white to-amber-50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-amber-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              What Happens Next
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800">If Approved:</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Exclusive member dashboard access
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Monthly networking event invitations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Direct messaging with other members
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Access to deal flow and opportunities
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800">Review Timeline:</h4>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• Initial review: 24-48 hours</li>
                  <li>• Founder assessment: 2-3 days</li>
                  <li>• Final decision: 5 business days max</li>
                  <li>• Email notification with outcome</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Link to="/">
            <Button variant="outline" className="border-amber-300 text-amber-900 hover:bg-amber-50">
              Return to Homepage
            </Button>
          </Link>
          <Button className="bg-gradient-to-r from-amber-900 to-slate-800 hover:from-amber-800 hover:to-slate-700 text-white">
            Contact Leadership Team
          </Button>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 p-6 bg-white/50 rounded-lg border border-amber-200">
          <p className="text-slate-600 text-sm">
            <strong>Note:</strong> DYPS is a referral-only society. Your application demonstrates your interest in joining
            Manchester's most exclusive deals community. We maintain high standards to ensure the quality and
            exclusivity of our network.
          </p>
        </div>
      </div>
    </div>
  );
}