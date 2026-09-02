import React, { useState, useEffect, useRef } from 'react';
import {
  Car,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ShieldCheck,
  Wrench,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Terminal,
  Activity,
  Cpu,
  Radio,
  Zap,
  ShieldAlert,
  Clock,
  RotateCcw,
  Key
} from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';
import { User as UserType } from '../types.ts';

interface LoginViewProps {
  onLoginSuccess: (user: UserType) => void;
  isStaff?: boolean;
  onNavigate?: (path: string) => void;
  initialPendingAuth?: { pendingToken: string; email: string } | null;
}

// Technical Wireframe Blueprint SVG Illustration for Service Vehicle
const BlueprintVehicle: React.FC<{ isStaff?: boolean }> = ({ isStaff }) => {
  return (
    <div className="relative w-full h-64 sm:h-72 lg:h-80 my-4 flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 shadow-inner">
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, ${isStaff ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'} 1px, transparent 1px),
            linear-gradient(to bottom, ${isStaff ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'} 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Sweep Diagnostic Scan Line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className={`w-1.5 h-full bg-gradient-to-b from-transparent ${isStaff ? 'via-rose-500 shadow-[0_0_15px_#f43f5e]' : 'via-amber-500 shadow-[0_0_15px_#f59e0b]'} to-transparent opacity-80 animate-laserScan absolute top-0`} />
      </div>

      {/* Blueprint SVG Schematic */}
      <svg
        viewBox="0 0 600 280"
        className={`w-full h-full max-w-lg object-contain ${isStaff ? 'text-amber-500/80' : 'text-amber-500/80'} relative z-10`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="amberGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Chassis & Body Shell Wireframe */}
        <path
          d="M 50,180 L 70,180 L 85,110 L 170,105 L 210,105 L 225,80 L 410,80 L 530,95 L 540,180 L 520,180"
          stroke="#f59e0b"
          strokeWidth="1.8"
          strokeDasharray="none"
          className="opacity-90"
          filter="url(#amberGlow)"
        />

        {/* Hood & Windshield */}
        <path d="M 85,110 L 140,110 L 175,135 L 210,135 L 225,80" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
        <path d="M 140,110 L 175,135 M 170,105 L 185,135" stroke="#f59e0b" strokeWidth="1" opacity="0.5" />

        {/* Driver Window & Cargo Bay Partition */}
        <rect x="235" y="90" width="80" height="40" rx="3" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
        <line x1="325" y1="80" x2="325" y2="180" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />

        {/* Main Frame Rails */}
        <line x1="40" y1="180" x2="540" y2="180" stroke="#f59e0b" strokeWidth="2.5" opacity="0.8" />
        <line x1="40" y1="190" x2="540" y2="190" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />

        {/* Front Wheel Well & Wheel */}
        <circle cx="130" cy="190" r="32" stroke="#f59e0b" strokeWidth="1.8" filter="url(#amberGlow)" />
        <circle cx="130" cy="190" r="22" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 2" />
        <circle cx="130" cy="190" r="8" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="130" y1="168" x2="130" y2="212" stroke="#f59e0b" strokeWidth="1" opacity="0.7" />
        <line x1="108" y1="190" x2="152" y2="190" stroke="#f59e0b" strokeWidth="1" opacity="0.7" />

        {/* Rear Wheel Well & Wheel */}
        <circle cx="450" cy="190" r="32" stroke="#f59e0b" strokeWidth="1.8" filter="url(#amberGlow)" />
        <circle cx="450" cy="190" r="22" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4 2" />
        <circle cx="450" cy="190" r="8" stroke="#f59e0b" strokeWidth="1.5" />
        <line x1="450" y1="168" x2="450" y2="212" stroke="#f59e0b" strokeWidth="1" opacity="0.7" />
        <line x1="428" y1="190" x2="472" y2="190" stroke="#f59e0b" strokeWidth="1" opacity="0.7" />

        {/* Dimension Line Callouts */}
        <g opacity="0.5" className="font-mono text-[9px]">
          <line x1="40" y1="230" x2="540" y2="230" stroke="#f59e0b" strokeWidth="0.8" />
          <line x1="40" y1="222" x2="40" y2="238" stroke="#f59e0b" strokeWidth="0.8" />
          <line x1="540" y1="222" x2="540" y2="238" stroke="#f59e0b" strokeWidth="0.8" />
          <text x="270" y="243" fill="#fbbf24" textAnchor="middle" fontSize="10" fontFamily="monospace">
            L: 5,980mm
          </text>

          <line x1="20" y1="80" x2="20" y2="190" stroke="#f59e0b" strokeWidth="0.8" />
          <line x1="12" y1="80" x2="28" y2="80" stroke="#f59e0b" strokeWidth="0.8" />
          <line x1="12" y1="190" x2="28" y2="190" stroke="#f59e0b" strokeWidth="0.8" />
          <text x="15" y="140" fill="#fbbf24" textAnchor="middle" fontSize="10" fontFamily="monospace" transform="rotate(-90, 15, 140)">
            H: 2,420mm
          </text>
        </g>

        {/* Telemetry Sensor Nodes */}
        <g>
          <circle cx="110" cy="130" r="4" fill="#f59e0b" className="animate-ping opacity-75" />
          <circle cx="110" cy="130" r="3" fill="#fbbf24" />
          <line x1="110" y1="130" x2="80" y2="50" stroke="#f59e0b" strokeWidth="0.8" opacity="0.8" />
          <rect x="40" y="36" width="70" height="18" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="0.8" />
          <text x="75" y="48" fill="#fbbf24" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">
            {isStaff ? 'DISPATCH: OK' : 'ECU: OK'}
          </text>
        </g>

        <g>
          <circle cx="280" cy="160" r="4" fill="#f59e0b" className="animate-ping opacity-75" />
          <circle cx="280" cy="160" r="3" fill="#fbbf24" />
          <line x1="280" y1="160" x2="310" y2="50" stroke="#f59e0b" strokeWidth="0.8" opacity="0.8" />
          <rect x="270" y="36" width="80" height="18" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="0.8" />
          <text x="310" y="48" fill="#fbbf24" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">
            {isStaff ? 'BAY QUEUE: LIVE' : 'OBD-II: READY'}
          </text>
        </g>

        <g>
          <circle cx="450" cy="190" r="4" fill="#f59e0b" className="animate-ping opacity-75" />
          <circle cx="450" cy="190" r="3" fill="#fbbf24" />
          <line x1="450" y1="190" x2="480" y2="250" stroke="#f59e0b" strokeWidth="0.8" opacity="0.8" />
          <rect x="440" y="250" width="85" height="18" rx="2" fill="#0f172a" stroke="#f59e0b" strokeWidth="0.8" />
          <text x="482" y="262" fill="#fbbf24" textAnchor="middle" fontSize="9" fontWeight="bold" fontFamily="monospace">
            {isStaff ? 'DIAGNOSTICS: 100%' : 'BRAKES: 98%'}
          </text>
        </g>
      </svg>
    </div>
  );
};

// Mask email helper for 2FA UI (e.g. robert@acmecorp.com -> r***t@acmecorp.com)
const maskEmail = (emailStr: string): string => {
  if (!emailStr) return '';
  const parts = emailStr.split('@');
  if (parts.length !== 2) return emailStr;
  const [userPart, domain] = parts;
  if (userPart.length <= 2) {
    return `${userPart[0]}***@${domain}`;
  }
  return `${userPart[0]}***${userPart[userPart.length - 1]}@${domain}`;
};

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  isStaff = false,
  onNavigate,
  initialPendingAuth
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register extra fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password states
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotEmailTouched, setForgotEmailTouched] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [resetIsDevFallback, setResetIsDevFallback] = useState(false);
  const [resetDevCode, setResetDevCode] = useState<string | null>(null);
  const [resetOtpDigits, setResetOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState<string | null>(null);
  const [resetTimeRemaining, setResetTimeRemaining] = useState<number>(600);
  const [resetResendCooldown, setResetResendCooldown] = useState<number>(60);
  const [resetResendLoading, setResetResendLoading] = useState<boolean>(false);

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field validation errors
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // 2FA OTP step states
  const [pendingToken, setPendingToken] = useState<string | null>(initialPendingAuth?.pendingToken || null);
  const [pendingEmail, setPendingEmail] = useState<string>(initialPendingAuth?.email || '');
  const [isDevFallback, setIsDevFallback] = useState<boolean>(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [otpInfoMessage, setOtpInfoMessage] = useState<string | null>(
    initialPendingAuth ? 'Verification code sent!' : null
  );

  useEffect(() => {
    if (initialPendingAuth?.pendingToken) {
      setPendingToken(initialPendingAuth.pendingToken);
      setPendingEmail(initialPendingAuth.email);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpTimeRemaining(300);
      setResendCooldown(60);
      setOtpError(null);
      setRemainingAttempts(null);
      setOtpInfoMessage('Verification code sent! (Check server console for code)');
      setIsBooting(false);
    }
  }, [initialPendingAuth]);

  // Timers: 5-minute expiry countdown & 60-second resend cooldown
  const [otpTimeRemaining, setOtpTimeRemaining] = useState<number>(300);
  const [resendCooldown, setResendCooldown] = useState<number>(60);
  const [resendLoading, setResendLoading] = useState<boolean>(false);

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  const resetOtpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // System Boot Sequence State
  const [isBooting, setIsBooting] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return true;
  });
  const [bootStep, setBootStep] = useState(0);

  const bootLogs = isStaff
    ? [
        'INITIALIZING FLEETOPS PRO INTERNAL STAFF CORE v2.4',
        'AUTHENTICATING ENCRYPTED PERSONNEL GATEWAY',
        'LOADING REPAIR QUEUE & DISPATCH MODULES',
        'RESTRICTED TERMINAL — AWAITING STAFF CREDENTIALS'
      ]
    : [
        'INITIALIZING FLEETOPS PRO SERVICE CORE v2.4',
        'AUTHENTICATING SECURE TELEMETRY PIPELINE',
        'MOUNTING DIAGNOSTIC QUEUE GATEWAY',
        'SYSTEM READY — AWAITING USER AUTHENTICATION'
      ];

  useEffect(() => {
    if (!isBooting) return;

    const t1 = setTimeout(() => setBootStep(1), 300);
    const t2 = setTimeout(() => setBootStep(2), 650);
    const t3 = setTimeout(() => setBootStep(3), 1000);
    const t4 = setTimeout(() => setBootStep(4), 1300);
    const tEnd = setTimeout(() => setIsBooting(false), 1600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tEnd);
    };
  }, [isBooting]);

  // 2FA Expiry & Resend Timers
  useEffect(() => {
    if (!pendingToken) return;

    const interval = setInterval(() => {
      setOtpTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingToken]);

  // Auto-focus first box when 2FA screen mounts
  useEffect(() => {
    if (pendingToken) {
      setTimeout(() => otpInputRefs[0].current?.focus(), 100);
    }
  }, [pendingToken]);

  // Validation getters
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPasswordValid = password.length >= 6;

  // Handle Login Submit (Step 1)
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailTouched(true);
    setPasswordTouched(true);

    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiClient.login(cleanEmail, password);
      if (res.pendingToken) {
        setPendingToken(res.pendingToken);
        setPendingEmail(res.email || cleanEmail);
        setIsDevFallback(Boolean(res.devFallback));
        if (res.devCode) {
          setDevCode(res.devCode);
          // Auto fill first box or full code
          const codeStr = String(res.devCode);
          if (codeStr.length === 6) {
            setOtpDigits(codeStr.split(''));
          }
        }
        setOtpTimeRemaining(300);
        setResendCooldown(60);
        setOtpError(null);
        setRemainingAttempts(null);
        setOtpInfoMessage(res.message || 'Verification code generated.');
      } else if (res.token) {
        // Fallback if 2FA disabled
        const meRes = await apiClient.getMe();
        onLoginSuccess(meRes.user);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Register Submit (Customer flow only)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEmailTouched(true);
    setPasswordTouched(true);

    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check and try again.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.register(name, cleanEmail, password, phone);
      const meRes = await apiClient.getMe();
      onLoginSuccess(meRes.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA OTP Digit Box Inputs
  const handleOtpDigitChange = (index: number, value: string) => {
    // Handle paste event of full 6-digit code
    if (value.length > 1) {
      const cleanPasted = value.replace(/\D/g, '').slice(0, 6);
      if (cleanPasted.length > 0) {
        const newDigits = ['', '', '', '', '', ''];
        for (let i = 0; i < cleanPasted.length; i++) {
          newDigits[i] = cleanPasted[i];
        }
        setOtpDigits(newDigits);
        if (cleanPasted.length === 6) {
          otpInputRefs[5].current?.focus();
          submitOtpCode(cleanPasted);
        } else {
          otpInputRefs[Math.min(cleanPasted.length, 5)].current?.focus();
        }
      }
      return;
    }

    // Handle single digit input
    const cleanChar = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = cleanChar;
    setOtpDigits(newDigits);

    if (cleanChar && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }

    // Auto-submit on filling 6th digit
    if (cleanChar && index === 5 && newDigits.every((d) => d !== '')) {
      submitOtpCode(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  // Submit 2FA Code (Step 2)
  const submitOtpCode = async (codeToSubmit?: string) => {
    const finalCode = codeToSubmit || otpDigits.join('');
    if (!pendingToken) return;

    if (finalCode.length < 6) {
      setOtpError('Please enter all 6 digits of the verification code.');
      return;
    }

    if (otpTimeRemaining <= 0) {
      setOtpError('Verification code has expired. Please request a new code.');
      return;
    }

    setOtpLoading(true);
    setOtpError(null);
    setOtpInfoMessage(null);

    try {
      const res = await apiClient.verifyOtp(pendingToken, finalCode);
      if (res.user) {
        onLoginSuccess(res.user);
      } else {
        const meRes = await apiClient.getMe();
        onLoginSuccess(meRes.user);
      }
    } catch (err: any) {
      setOtpError(err.message || 'Invalid or expired code.');
      if (err.remainingAttempts !== undefined) {
        setRemainingAttempts(err.remainingAttempts);
      }
    } finally {
      setOtpLoading(false);
    }
  };

  // Resend OTP Code
  const handleResendOtp = async () => {
    if (!pendingToken || resendCooldown > 0) return;

    setResendLoading(true);
    setOtpError(null);
    setOtpInfoMessage(null);

    try {
      const res = await apiClient.resendOtp(pendingToken);
      setIsDevFallback(Boolean(res.devFallback));
      if (res.devCode) {
        setDevCode(res.devCode);
        const codeStr = String(res.devCode);
        if (codeStr.length === 6) {
          setOtpDigits(codeStr.split(''));
        }
      }
      setOtpTimeRemaining(300);
      setResendCooldown(60);
      setRemainingAttempts(null);
      setOtpInfoMessage(res.message || 'Fresh code generated.');
      otpInputRefs[0].current?.focus();
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend verification code.');
    } finally {
      setResendLoading(false);
    }
  };

  // Reset Password Expiry & Resend Timers
  useEffect(() => {
    if (mode !== 'forgot-password' || !resetToken) return;

    const interval = setInterval(() => {
      setResetTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      setResetResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [mode, resetToken]);

  // Auto-focus first box when Reset OTP screen mounts
  useEffect(() => {
    if (mode === 'forgot-password' && forgotStep === 2) {
      setTimeout(() => resetOtpInputRefs[0].current?.focus(), 100);
    }
  }, [mode, forgotStep]);

  // Handle Request Password Reset Code
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotEmailTouched(true);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await apiClient.forgotPassword(cleanEmail);
      setResetToken(res.resetToken);
      setResetIsDevFallback(Boolean(res.devFallback));
      if (res.devCode) {
        setResetDevCode(res.devCode);
        const codeStr = String(res.devCode);
        if (codeStr.length === 6) {
          setResetOtpDigits(codeStr.split(''));
        }
      }
      setResetTimeRemaining(600);
      setResetResendCooldown(60);
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send reset code. Please verify the email and try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Reset OTP Digit Box Inputs
  const handleResetOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      const cleanPasted = value.replace(/\D/g, '').slice(0, 6);
      if (cleanPasted.length > 0) {
        const newDigits = ['', '', '', '', '', ''];
        for (let i = 0; i < cleanPasted.length; i++) {
          newDigits[i] = cleanPasted[i];
        }
        setResetOtpDigits(newDigits);
        resetOtpInputRefs[Math.min(cleanPasted.length, 5)].current?.focus();
      }
      return;
    }

    const cleanChar = value.replace(/\D/g, '');
    const newDigits = [...resetOtpDigits];
    newDigits[index] = cleanChar;
    setResetOtpDigits(newDigits);

    if (cleanChar && index < 5) {
      resetOtpInputRefs[index + 1].current?.focus();
    }
  };

  const handleResetOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !resetOtpDigits[index] && index > 0) {
      resetOtpInputRefs[index - 1].current?.focus();
    }
  };

  // Handle Reset Password Submission
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const finalCode = resetOtpDigits.join('');
    if (finalCode.length < 6) {
      setForgotError('Please enter all 6 digits of the password reset code.');
      return;
    }

    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match. Please verify and try again.');
      return;
    }

    if (!resetToken) {
      setForgotError('Missing password reset session. Please request a new code.');
      return;
    }

    setForgotLoading(true);

    try {
      const res = await apiClient.resetPassword(resetToken, finalCode, newPassword);
      setForgotSuccessMsg(res.message || 'Password reset successfully! Redirecting to login...');
      setForgotStep(3);

      setTimeout(() => {
        setEmail(forgotEmail);
        setPassword('');
        setMode('login');
        setForgotStep(1);
        setForgotSuccessMsg(null);
        setResetToken(null);
        setNewPassword('');
        setConfirmNewPassword('');
        setResetOtpDigits(['', '', '', '', '', '']);
      }, 2200);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. Code may be invalid or expired.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Resend Reset Code
  const handleResendResetCode = async () => {
    if (!resetToken || resetResendCooldown > 0) return;

    setResetResendLoading(true);
    setForgotError(null);

    try {
      const res = await apiClient.resendResetOtp(resetToken);
      if (res.devCode) {
        setResetDevCode(res.devCode);
        const codeStr = String(res.devCode);
        if (codeStr.length === 6) {
          setResetOtpDigits(codeStr.split(''));
        }
      }
      setResetTimeRemaining(600);
      setResetResendCooldown(60);
      resetOtpInputRefs[0].current?.focus();
    } catch (err: any) {
      setForgotError(err.message || 'Failed to resend reset code.');
    } finally {
      setResetResendLoading(false);
    }
  };

  // Helper for mm:ss display
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-3 sm:p-6 lg:p-8 font-['Public_Sans'] relative overflow-hidden select-none">
      {/* Laser Keyframe Style */}
      <style>{`
        @keyframes laserScan {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 0.9; }
          90% { opacity: 0.9; }
          100% { left: 98%; opacity: 0; }
        }
        .animate-laserScan {
          animation: laserScan 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Ambient Dark Steel Bay Atmosphere */}
      <div className="absolute inset-0 bg-slate-950 pointer-events-none" />
      <div
        className={`absolute inset-0 ${
          isStaff
            ? 'bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.1),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(30,41,59,0.5),transparent_60%)]'
            : 'bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.08),transparent_50%),radial-gradient(circle_at_bottom_right,rgba(30,41,59,0.5),transparent_60%)]'
        } pointer-events-none`}
      />

      {/* Main Container Card */}
      <div className="w-full max-w-6xl bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl shadow-black/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px] relative z-10">
        {/* ================= LEFT SIDE HERO PANEL ================= */}
        <div className="lg:col-span-7 bg-slate-950/95 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/90 relative overflow-hidden">
          {/* Subtle Ambient Hazards */}
          <div
            className={`absolute -top-32 -left-32 w-80 h-80 ${
              isStaff ? 'bg-rose-500/10' : 'bg-amber-500/10'
            } rounded-full blur-3xl pointer-events-none`}
          />
          <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-slate-800/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            {/* Header / Brand Identity */}
            <div className="flex items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${
                    isStaff ? 'from-amber-500 via-amber-600 to-rose-600' : 'from-amber-500 to-amber-600'
                  } flex items-center justify-center text-slate-950 font-black text-lg tracking-wider shadow-lg shadow-amber-500/20 font-['Oswald'] border border-amber-400/40`}
                >
                  FP
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-white font-['Oswald'] uppercase flex items-center gap-2">
                    FleetOps <span className="text-amber-500">Pro</span>
                  </h1>
                  <p className="text-[11px] text-amber-500/80 font-mono tracking-wide uppercase">
                    {isStaff ? 'Internal Personnel & Mechanics Portal' : 'Automotive Diagnostic & Garage Hub'}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isStaff ? 'bg-rose-500 animate-pulse ring-2 ring-rose-500/30' : 'bg-amber-500 animate-pulse'
                  }`}
                />
                <span>{isStaff ? 'RESTRICTED STAFF NODE' : 'BAY NODE ONLINE'}</span>
              </div>
            </div>

            {/* Value Proposition Headline */}
            <div className="mb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight font-['Oswald'] uppercase leading-snug">
                {isStaff ? 'Staff Access — Authorized Personnel Only' : 'Precision Maintenance & Telemetry Infrastructure'}
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
                {isStaff
                  ? 'Encrypted internal terminal for mechanics, technicians, and fleet administration staff.'
                  : 'Centralized fleet command for real-time service queues, mechanic dispatch, and automated repair logs.'}
              </p>
            </div>

            {/* Blueprint Wireframe Illustration */}
            <BlueprintVehicle isStaff={isStaff} />

            {/* Dashboard Telemetry Readout Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 my-2 pt-2 border-t border-slate-800/80">
              {isStaff ? (
                <>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono text-left">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Access Protocol</span>
                    <span className="text-sm sm:text-base font-bold text-amber-400 mt-0.5 block">2FA ENFORCED</span>
                    <span className="text-[9px] text-amber-400/80 flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" /> Encrypted Session
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono text-left">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Dispatch Mode</span>
                    <span className="text-sm sm:text-base font-bold text-amber-400 mt-0.5 block">LIVE WORKSHOP</span>
                    <span className="text-[9px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Wrench className="w-2.5 h-2.5" /> Active Gateway
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono text-left">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Security Node</span>
                    <span className="text-sm sm:text-base font-bold text-amber-400 mt-0.5 block">RBAC SECURED</span>
                    <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Users className="w-2.5 h-2.5" /> Staff Verified
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono text-left">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Fleet Management</span>
                    <span className="text-sm sm:text-base font-bold text-amber-400 mt-0.5 block">TELEMETRY</span>
                    <span className="text-[9px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <Activity className="w-2.5 h-2.5" /> Real-Time Sync
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono text-left">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Service Booking</span>
                    <span className="text-sm sm:text-base font-bold text-amber-400 mt-0.5 block">ONLINE QUEUE</span>
                    <span className="text-[9px] text-amber-400/80 flex items-center gap-1 mt-0.5">
                      <Wrench className="w-2.5 h-2.5" /> Instant Dispatch
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 font-mono text-left">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">System Status</span>
                    <span className="text-sm sm:text-base font-bold text-amber-400 mt-0.5 block">ACTIVE</span>
                    <span className="text-[9px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Cpu className="w-2.5 h-2.5" /> High Availability
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Panel Footer */}
          <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>{isStaff ? 'INTERNAL ENCRYPTED PIPELINE' : 'GARAGE SENSORS ATTACHED'}</span>
            </div>
            <span>{isStaff ? 'STAFF 2FA ENFORCED' : 'SECURE 2FA JWT'}</span>
          </div>
        </div>

        {/* ================= RIGHT SIDE FORM WORKSPACE ================= */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-slate-900/80 relative">
          {/* Boot Sequence Overlay Screen */}
          {isBooting ? (
            <div
              aria-live="polite"
              className="flex-1 flex flex-col justify-between font-mono bg-slate-950 p-6 rounded-xl border border-slate-800 text-slate-300 min-h-[460px] relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs text-amber-500">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 animate-bounce" />
                    <span className="font-bold">
                      {isStaff ? 'STAFF TERMINAL BOOT SEQUENCE' : 'SYSTEM BOOT SEQUENCE'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">BIOS v2.4</span>
                </div>

                <div className="space-y-3 text-xs leading-relaxed">
                  {bootLogs.map((log, idx) => {
                    const isPassed = bootStep > idx;
                    const isCurrent = bootStep === idx;
                    return (
                      <div
                        key={idx}
                        className={`flex items-start gap-2.5 transition-all duration-200 ${
                          isPassed
                            ? 'text-emerald-400 opacity-100'
                            : isCurrent
                            ? 'text-amber-400 animate-pulse opacity-100 font-bold'
                            : 'text-slate-600 opacity-40'
                        }`}
                      >
                        <span className="shrink-0 font-bold">{isPassed ? '[OK]' : isCurrent ? '[>>]' : '[..]'}</span>
                        <span>{log}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[11px] text-amber-500/80">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Loading authentication module...</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBooting(false)}
                  className="text-[10px] font-semibold text-slate-400 hover:text-amber-400 underline transition-colors"
                >
                  SKIP BOOT ▶
                </button>
              </div>
            </div>
          ) : pendingToken ? (
            /* ================= STEP 2: 2FA OTP ENTRY SCREEN ================= */
            <div className="flex-1 flex flex-col justify-between animate-fadeIn">
              <div>
                {/* 2FA Header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight font-['Oswald'] uppercase flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-500" />
                      Two-Factor Authentication
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Enter the 6-digit verification code sent to{' '}
                      <span className="font-mono font-bold text-amber-400">{maskEmail(pendingEmail)}</span>
                    </p>
                  </div>
                  <span className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-400 font-bold uppercase shrink-0">
                    2FA STEP 2/2
                  </span>
                </div>

                {/* Info / Alert Banner */}
                {otpInfoMessage && (
                  <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{otpInfoMessage}</span>
                  </div>
                )}

                {/* On-Screen OTP Display Banner (For Admin, Mechanic & Customer testing) */}
                {devCode && (
                  <div className="mb-5 p-4 bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-600/20 border-2 border-amber-500/60 rounded-2xl shadow-xl shadow-amber-500/10 animate-in fade-in duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-mono font-bold uppercase tracking-wider mb-1">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          <span>YOUR LOGIN OTP CODE (ON-SCREEN)</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl font-mono font-black text-amber-300 tracking-[0.25em] bg-slate-950 px-3.5 py-1 rounded-xl border border-amber-500/50 shadow-inner">
                            {devCode}
                          </span>
                          <span className="text-[11px] text-slate-300 font-sans">
                            Use this code to complete sign-in
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const digits = devCode.split('');
                          setOtpDigits(digits);
                          submitOtpCode(devCode);
                        }}
                        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-amber-500/30 flex items-center justify-center gap-1.5 cursor-pointer font-['Oswald'] uppercase tracking-wider active:scale-95 shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Auto-Fill & Verify</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {otpError && (
                  <div role="alert" className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-rose-200">Verification Error</p>
                      <p className="mt-0.5">{otpError}</p>
                      {remainingAttempts !== null && remainingAttempts > 0 && (
                        <p className="mt-1 font-mono text-[11px] text-amber-400">
                          Attempts remaining: <span className="font-bold">{remainingAttempts}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 6-Digit Box Inputs */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitOtpCode();
                  }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide font-mono text-center">
                      6-Digit Security Code
                    </label>
                    <div className="grid grid-cols-6 gap-2 my-3">
                      {otpDigits.map((digit, index) => (
                        <input
                          key={index}
                          ref={otpInputRefs[index]}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className="w-full h-12 text-center bg-slate-950 border border-slate-800 rounded-xl text-base font-bold text-amber-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/40 transition-all font-mono"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Expiry & Resend Controls */}
                  <div className="flex items-center justify-between text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Expires:</span>
                      <span className={`font-bold ${otpTimeRemaining < 60 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                        {formatTime(otpTimeRemaining)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={resendCooldown > 0 || resendLoading}
                      onClick={handleResendOtp}
                      className="text-amber-500 hover:text-amber-400 disabled:text-slate-600 disabled:cursor-not-allowed font-semibold flex items-center gap-1 transition-colors"
                    >
                      {resendLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : resendCooldown > 0 ? (
                        <span>Resend in {resendCooldown}s</span>
                      ) : (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Resend Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Dev Fallback Notice with Auto-fill option */}
                  {devCode && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase tracking-wider">Dev Mode Code</span>
                        <span className="font-bold text-amber-400 text-sm tracking-widest">{devCode}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const digits = devCode.split('');
                          setOtpDigits(digits);
                          submitOtpCode(devCode);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-amber-500/20 active:scale-95"
                      >
                        Auto-Fill Code
                      </button>
                    </div>
                  )}

                  {isDevFallback && !devCode && (
                    <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-[11px] text-slate-400 font-mono text-center">
                      <span className="text-amber-400/90 font-semibold">Dev Note:</span> SMTP not configured — check server console for code.
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={otpLoading || otpDigits.some((d) => d === '')}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 font-['Oswald'] uppercase tracking-wider active:scale-98"
                  >
                    {otpLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>VERIFYING CODE...</span>
                      </>
                    ) : (
                      <>
                        <span>VERIFY & ACCESS TERMINAL</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Cancel / Back to Login */}
              <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setPendingToken(null);
                    setOtpError(null);
                  }}
                  className="text-xs text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 font-mono"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </div>
          ) : (
            /* Real Auth Form Workspace (Step 1) */
            <div className="flex-1 flex flex-col justify-between">
              <div>
                {/* Header & Optional Mode Switcher */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight font-['Oswald'] uppercase">
                      {mode === 'forgot-password'
                        ? 'Reset Account Password'
                        : isStaff
                        ? 'Staff Terminal Access'
                        : mode === 'login'
                        ? 'Customer Portal Access'
                        : 'Register Vehicle Owner'}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {mode === 'forgot-password'
                        ? 'Recover access to your FleetOps Pro account with a secure verification code.'
                        : isStaff
                        ? 'Enter your assigned staff credentials to access repair queues and administration.'
                        : mode === 'login'
                        ? 'Authenticate to enter your fleet control portal'
                        : 'Register a new account to request vehicle services'}
                    </p>
                  </div>

                  {!isStaff ? (
                    <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError(null);
                          setForgotError(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          mode === 'login'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Sign In
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setError(null);
                          setForgotError(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          mode === 'register'
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Register
                      </button>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-400 font-bold uppercase shrink-0">
                      STAFF / 2FA ENFORCED
                    </span>
                  )}
                </div>

                {/* Main Error Banner */}
                {(error || forgotError) && (
                  <div role="alert" className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-start gap-2.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-rose-200">
                        {mode === 'forgot-password' ? 'Password Reset Notice' : 'Authentication Failure'}
                      </p>
                      <p className="mt-0.5">{error || forgotError}</p>
                    </div>
                  </div>
                )}

                {/* Success Banner */}
                {forgotSuccessMsg && (
                  <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2.5 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{forgotSuccessMsg}</span>
                  </div>
                )}

                {/* Forgot Password Flow */}
                {mode === 'forgot-password' ? (
                  forgotStep === 1 ? (
                    /* Step 1: Enter Email */
                    <form onSubmit={handleRequestResetCode} className="space-y-4" noValidate>
                      <div>
                        <label htmlFor="forgot-email" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide font-mono">
                          Account Email Address
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="forgot-email"
                            required
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => {
                              setForgotEmail(e.target.value);
                              if (!forgotEmailTouched) setForgotEmailTouched(true);
                            }}
                            placeholder="Enter your email"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                          />
                        </div>
                        {forgotEmailTouched && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim()) && forgotEmail.length > 0 && (
                          <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Please enter a valid email address format.
                          </p>
                        )}
                      </div>

                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-start gap-2 text-xs text-amber-300">
                        <Key className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span>We will send a 6-digit one-time password (OTP) to your email to verify your identity.</span>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-slate-950 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 font-['Oswald'] uppercase tracking-wider mt-2 active:scale-98 cursor-pointer"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            <span>SENDING RESET CODE...</span>
                          </>
                        ) : (
                          <>
                            <span>SEND RESET CODE</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="text-center pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setForgotError(null);
                          }}
                          className="text-xs text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1.5 font-mono cursor-pointer"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Back to Sign In</span>
                        </button>
                      </div>
                    </form>
                  ) : forgotStep === 2 ? (
                    /* Step 2: Enter OTP & New Password */
                    <form onSubmit={handleResetPasswordSubmit} className="space-y-4" noValidate>
                      {/* On-Screen Dev Code Banner if available */}
                      {resetDevCode && (
                        <div className="p-3.5 bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-600/20 border-2 border-amber-500/60 rounded-xl shadow-lg shadow-amber-500/10 mb-2">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] text-amber-400 font-mono font-bold uppercase block">RESET OTP CODE (ON-SCREEN)</span>
                              <span className="text-xl font-mono font-black text-amber-300 tracking-[0.2em]">{resetDevCode}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const digits = resetDevCode.split('');
                                setResetOtpDigits(digits);
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-all font-['Oswald'] uppercase cursor-pointer"
                            >
                              Auto-Fill
                            </button>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide font-mono text-center">
                          6-Digit Password Reset Code
                        </label>
                        <div className="grid grid-cols-6 gap-2 my-2">
                          {resetOtpDigits.map((digit, index) => (
                            <input
                              key={index}
                              ref={resetOtpInputRefs[index]}
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={digit}
                              onChange={(e) => handleResetOtpDigitChange(index, e.target.value)}
                              onKeyDown={(e) => handleResetOtpKeyDown(index, e)}
                              className="w-full h-11 text-center bg-slate-950 border border-slate-800 rounded-xl text-base font-bold text-amber-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/40 transition-all font-mono"
                            />
                          ))}
                        </div>

                        {/* Expiry & Resend Controls */}
                        <div className="flex items-center justify-between text-xs font-mono bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 mt-2">
                          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                            <Clock className="w-3.5 h-3.5 text-amber-500" />
                            <span>Expires:</span>
                            <span className={`font-bold ${resetTimeRemaining < 60 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                              {formatTime(resetTimeRemaining)}
                            </span>
                          </div>

                          <button
                            type="button"
                            disabled={resetResendCooldown > 0 || resetResendLoading}
                            onClick={handleResendResetCode}
                            className="text-amber-500 hover:text-amber-400 disabled:text-slate-600 disabled:cursor-not-allowed font-semibold flex items-center gap-1 transition-colors text-[11px] cursor-pointer"
                          >
                            {resetResendLoading ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : resetResendCooldown > 0 ? (
                              <span>Resend in {resetResendCooldown}s</span>
                            ) : (
                              <>
                                <RotateCcw className="w-3 h-3" />
                                <span>Resend Code</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="new-pass" className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide font-mono">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="new-pass"
                            required
                            type={showNewPassword ? 'text' : 'password'}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full pl-10 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800/80 cursor-pointer"
                          >
                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="confirm-new-pass" className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide font-mono">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            id="confirm-new-pass"
                            required
                            type={showConfirmNewPassword ? 'text' : 'password'}
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            placeholder="Confirm password"
                            className="w-full pl-10 pr-10 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                            aria-label={showConfirmNewPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1.5 rounded-lg hover:bg-slate-800/80 cursor-pointer"
                          >
                            {showConfirmNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={forgotLoading || resetOtpDigits.some((d) => d === '')}
                        className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 font-['Oswald'] uppercase tracking-wider mt-2 active:scale-98 cursor-pointer"
                      >
                        {forgotLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            <span>UPDATING PASSWORD...</span>
                          </>
                        ) : (
                          <>
                            <span>RESET PASSWORD & SIGN IN</span>
                            <CheckCircle2 className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="flex items-center justify-between text-xs pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setForgotStep(1);
                            setForgotError(null);
                          }}
                          className="text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center gap-1 font-mono cursor-pointer text-[11px]"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Change Email</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                            setForgotError(null);
                          }}
                          className="text-slate-400 hover:text-amber-400 transition-colors font-mono cursor-pointer text-[11px]"
                        >
                          Cancel & Sign In
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Step 3: Success Animation */
                    <div className="py-8 text-center space-y-4 animate-fadeIn">
                      <div className="w-14 h-14 bg-emerald-500/20 border-2 border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white font-['Oswald'] uppercase">Password Reset Successfully</h3>
                        <p className="text-xs text-slate-400 mt-1">Your password has been updated. Redirecting to sign in...</p>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-amber-400 font-mono">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in with new credentials...</span>
                      </div>
                    </div>
                  )
                ) : mode === 'login' || isStaff ? (
                  /* Login Form */
                  <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                    {/* Quick Fill Default Admin Credentials */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 mb-3 font-mono text-xs">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">System Administrator Access</span>
                        <span className="text-[10px] text-amber-400 font-sans font-bold flex items-center gap-1">
                          <Key className="w-3 h-3 text-amber-400" /> 2FA Verification Active
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEmail('admin@fleetops.com');
                            setPassword('Password123!');
                          }}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldCheck className="w-3 h-3 text-amber-400" />
                          <span>Fill Admin Credentials (admin@fleetops.com)</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
                        {isStaff ? 'Staff Email Address' : 'Email Address'}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="login-email"
                          required
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (!emailTouched) setEmailTouched(true);
                          }}
                          placeholder="Enter your email"
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                        />
                      </div>
                      {emailTouched && !isEmailValid && email.length > 0 && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Please enter a valid email address format.
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wide">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('forgot-password');
                            setForgotStep(1);
                            setForgotEmail(email || '');
                            setForgotError(null);
                            setForgotSuccessMsg(null);
                          }}
                          className="text-[11px] text-slate-500 hover:text-amber-400 cursor-pointer transition-colors font-mono"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="login-password"
                          required
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (!passwordTouched) setPasswordTouched(true);
                          }}
                          placeholder="Enter your password"
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800/80 cursor-pointer flex items-center justify-center"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordTouched && !isPasswordValid && password.length > 0 && (
                        <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Password must be at least 6 characters long.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500/20"
                        />
                        <span>Keep terminal session active</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-slate-950 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 font-['Oswald'] uppercase tracking-wider mt-2 active:scale-98 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>AUTHENTICATING TERMINAL...</span>
                        </>
                      ) : (
                        <>
                          <span>{isStaff ? 'CONTINUE TO 2FA STEP' : 'CONTINUE TO 2FA STEP'}</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Register Form (Customer only) */
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
                    <div>
                      <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="reg-name"
                          required
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Enter your full name"
                          className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="reg-email"
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="reg-phone"
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Enter your phone number (optional)"
                          className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="reg-pass" className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                          Password
                        </label>
                        <div className="relative">
                          <input
                            id="reg-pass"
                            required
                            type={showRegPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1 cursor-pointer"
                          >
                            {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <label htmlFor="reg-confirm" className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wide">
                          Confirm
                        </label>
                        <div className="relative">
                          <input
                            id="reg-confirm"
                            required
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 p-1 cursor-pointer"
                          >
                            {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-slate-950 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 font-['Oswald'] uppercase tracking-wider mt-2 active:scale-98 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>CREATING ACCOUNT...</span>
                        </>
                      ) : (
                        <>
                          <span>COMPLETE REGISTRATION</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Cross Navigation Link */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
                {isStaff ? (
                  <button
                    type="button"
                    onClick={() => onNavigate?.('/login')}
                    className="text-[11px] text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center justify-center gap-1.5 font-mono"
                  >
                    <ArrowRight className="w-3.5 h-3.5 text-amber-500 rotate-180" />
                    <span>Customer sign in</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate?.('/team/login')}
                    className="text-[11px] text-slate-400 hover:text-amber-400 transition-colors inline-flex items-center justify-center gap-1.5 font-mono"
                  >
                    <span>Staff sign in</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
