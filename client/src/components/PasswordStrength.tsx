import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Check, X } from 'lucide-react';

interface PasswordStrengthProps {
  password: string;
  onStrengthChange?: (strength: number) => void;
}

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const requirements: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (pwd) => pwd.length >= 8 },
  { label: "Contains uppercase letter", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "Contains lowercase letter", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "Contains number", test: (pwd) => /\d/.test(pwd) },
  { label: "Contains special character", test: (pwd) => /[@$!%*?&]/.test(pwd) },
];

export function PasswordStrength({ password, onStrengthChange }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    const metRequirements = requirements.filter(req => req.test(password)).length;
    const newStrength = (metRequirements / requirements.length) * 100;
    setStrength(newStrength);
    onStrengthChange?.(newStrength);
  }, [password, onStrengthChange]);

  const getStrengthColor = () => {
    if (strength < 40) return "bg-red-500";
    if (strength < 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = () => {
    if (strength < 40) return "Weak";
    if (strength < 80) return "Medium";
    return "Strong";
  };

  return (
    <div className="space-y-3 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Password Strength</span>
        <span className={`text-sm font-semibold ${
          strength < 40 ? 'text-red-600' :
          strength < 80 ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {getStrengthText()}
        </span>
      </div>

      <Progress
        value={strength}
        className="h-2"
        style={{
          background: '#e2e8f0'
        }}
      />

      <div className="space-y-1">
        {requirements.map((requirement, index) => {
          const isMet = requirement.test(password);
          return (
            <div key={index} className="flex items-center gap-2 text-xs">
              {isMet ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <X className="h-3 w-3 text-red-400" />
              )}
              <span className={isMet ? 'text-green-700' : 'text-slate-500'}>
                {requirement.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}