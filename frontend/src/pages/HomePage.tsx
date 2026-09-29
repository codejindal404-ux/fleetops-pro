import React from 'react';
import { 
  Car, 
  Wrench, 
  Activity, 
  Users, 
  Clock, 
  ShieldCheck, 
  ArrowRight,
  MonitorSmartphone,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  MapPin,
  Lock,
  ArrowDownToLine
} from 'lucide-react';
import { motion } from 'motion/react';
import { User } from '../types.ts';

import vehicleVanImg from '../assets/images/vehicle_van_1785355569391.jpg';
import vehicleTruckImg from '../assets/images/vehicle_truck_1785355537774.jpg';
import vehiclePickupImg from '../assets/images/vehicle_pickup_1790249980980.jpg';

interface HomePageProps {
  onNavigate: (path: string) => void;
  user?: User | null;
}

const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80',
  mechanicSplit: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&q=80',
  workshopBanner: 'https://images.unsplash.com/photo-1503328427499-d92d1fa3ce72?auto=format&fit=crop&q=80',
  ctaBg: 'https://images.unsplash.com/photo-1605810756788-29cf9bc9fbdb?auto=format&fit=crop&q=80',
  roles: {
    customer: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80',
    mechanic: 'https://images.unsplash.com/photo-1615906655593-ad0386982a0f?auto=format&fit=crop&q=80',
    admin: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80',
  },
  services: [
    'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80', // Vehicle Maintenance
    'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&q=80', // Service Booking
    'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&q=80', // Repair Tracking
    'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&q=80', // Mechanic Management
    'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80', // Digital Invoices
    'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80', // Maintenance Reminders
    vehicleVanImg,   // Service Centers – local asset
    vehicleTruckImg, // Fleet Monitoring – local asset
  ],
  vehicles: {
    sedan: 'https://images.unsplash.com/photo-1550355291-bbee04a92027?auto=format&fit=crop&q=80',
    suv: 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&q=80',
    ev: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80',
    commercial: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&q=80',
    truck: vehiclePickupImg,
    heavy: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&q=80'
  }
};

const FadeIn: React.FC<{ children: React.ReactNode, delay?: number, direction?: 'up' | 'down' | 'left' | 'right' }> = ({ children, delay = 0, direction = 'up' }) => {
  const directions = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { x: 40, y: 0 },
    right: { x: -40, y: 0 },
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, user }) => {
  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin/dashboard';
    if (user.role === 'MECHANIC') return '/mechanic/tasks';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Public_Sans'] text-slate-900 selection:bg-amber-500/30 selection:text-amber-900 overflow-x-hidden">
      
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo(0, 0)}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm tracking-wider font-['Oswald'] border border-amber-400 group-hover:scale-105 transition-transform shadow-lg shadow-amber-500/20">
                FP
              </div>
              <span className="font-['Oswald'] font-bold text-2xl uppercase tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                FleetOps <span className="text-amber-500">Pro</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600 uppercase tracking-wider font-['Oswald']">
              <a href="#home" className="hover:text-amber-600 transition-colors">Home</a>
              <a href="#features" className="hover:text-amber-600 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-amber-600 transition-colors">How it Works</a>
              <a href="#services" className="hover:text-amber-600 transition-colors">Services</a>
              <a href="#about" className="hover:text-amber-600 transition-colors">About</a>
            </div>

            <div className="flex items-center gap-4">
              {user ? (
                <button
                  onClick={() => onNavigate(getDashboardPath())}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg font-['Oswald'] uppercase tracking-wider flex items-center gap-2 group"
                >
                  Dashboard <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('/login')}
                    className="text-slate-700 hover:text-amber-600 font-bold px-4 py-2.5 text-sm transition-colors font-['Oswald'] uppercase tracking-wider"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => onNavigate('/register')}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg font-['Oswald'] uppercase tracking-wider"
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Premium Hero Section */}
      <section id="home" className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={IMAGES.hero} 
            alt="Professional vehicle workshop" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8 py-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/50 border border-amber-500/30 backdrop-blur-md"
            >
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-bold">Smart Fleet & Vehicle Service Platform</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-white font-['Oswald'] uppercase tracking-tight leading-[1.05]"
            >
              Complete Vehicle Service Management, <span className="text-amber-500">All in One Place.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg sm:text-xl text-slate-300 font-medium leading-relaxed max-w-2xl border-l-4 border-amber-500 pl-4"
            >
              Manage your vehicles, schedule service, track repairs, monitor maintenance, and manage your entire fleet from one powerful platform.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-4"
            >
              {user ? (
                 <button
                  onClick={() => onNavigate(getDashboardPath())}
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-4 rounded-xl font-black transition-all shadow-lg shadow-amber-500/25 font-['Oswald'] uppercase tracking-widest text-lg flex items-center justify-center gap-3 group"
                >
                  Dashboard <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onNavigate('/login')}
                    className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-4 rounded-xl font-black transition-all shadow-lg shadow-amber-500/25 font-['Oswald'] uppercase tracking-widest text-lg flex items-center justify-center gap-3 group"
                  >
                    Book a Service <CalendarCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </button>
                  <button
                    onClick={() => onNavigate('/register')}
                    className="w-full sm:w-auto bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-xl font-black transition-all shadow-lg font-['Oswald'] uppercase tracking-widest text-lg flex items-center justify-center gap-2 group"
                  >
                    Get Started <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-amber-500" />
                  </button>
                </>
              )}
            </motion.div>
          </div>

          {/* Floating UI Elements */}
          <div className="hidden lg:block lg:col-span-5 relative h-[500px]">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="absolute top-10 right-0 bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 shadow-2xl w-72"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-xs font-mono uppercase">System Status</p>
                  <p className="text-white font-bold">98% Vehicle Health</p>
                </div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2">
                <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '98%' }} />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="absolute top-48 right-20 bg-slate-900/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 shadow-2xl flex items-center gap-4 w-64"
            >
               <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Service Completed</p>
                  <p className="text-slate-400 text-xs">Toyota Camry - INSP</p>
                </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="absolute bottom-20 right-10 bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-700/50 shadow-2xl w-80"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-bold text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-rose-400 animate-pulse" /> Live Repair Tracking
                </p>
                <span className="text-[10px] bg-amber-500 text-slate-900 px-2 py-0.5 rounded font-bold uppercase">In Bay 4</span>
              </div>
              <div className="space-y-3 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-amber-500 before:to-slate-800">
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-white bg-amber-500 text-slate-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] pl-3 text-xs">
                        <p className="text-white font-medium">Diagnostic</p>
                    </div>
                </div>
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-700 bg-slate-800 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                        <Wrench className="w-3 h-3" />
                    </div>
                    <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] pl-3 text-xs">
                        <p className="text-slate-400 font-medium">Repairing</p>
                    </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust / Statistics Section */}
      <section className="bg-slate-950 py-12 relative z-20 -mt-8 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-slate-800/50 text-center">
            <FadeIn delay={0.1}>
              <div className="px-4">
                <Car className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                <h3 className="text-white font-['Oswald'] uppercase font-bold text-xl mb-1">Multi-Vehicle</h3>
                <p className="text-slate-400 text-sm">Management</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.2}>
              <div className="px-4">
                <Activity className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-white font-['Oswald'] uppercase font-bold text-xl mb-1">Real-Time</h3>
                <p className="text-slate-400 text-sm">Tracking</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.3}>
              <div className="px-4">
                <MapPin className="w-8 h-8 text-rose-500 mx-auto mb-3" />
                <h3 className="text-white font-['Oswald'] uppercase font-bold text-xl mb-1">Service Center</h3>
                <p className="text-slate-400 text-sm">Network</p>
              </div>
            </FadeIn>
            <FadeIn delay={0.4}>
              <div className="px-4">
                <Lock className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
                <h3 className="text-white font-['Oswald'] uppercase font-bold text-xl mb-1">Role-Based</h3>
                <p className="text-slate-400 text-sm">Secure Access</p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 font-['Oswald'] uppercase tracking-tight">Everything Your Fleet Needs</h2>
              <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">A comprehensive suite of tools designed for seamless automotive service operations.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Car, title: 'Vehicle Maintenance', desc: 'Centralized registry and history for all your vehicles.', img: IMAGES.services[0] },
              { icon: CalendarCheck, title: 'Service Booking', desc: 'Schedule maintenance with real-time workshop availability.', img: IMAGES.services[1] },
              { icon: Activity, title: 'Repair Tracking', desc: 'Monitor service progress step-by-step from your phone.', img: IMAGES.services[2] },
              { icon: Users, title: 'Mechanic Management', desc: 'Assign jobs and track staff performance efficiently.', img: IMAGES.services[3] },
              { icon: BarChart3, title: 'Digital Invoices', desc: 'Automated billing and simulated payment workflows.', img: IMAGES.services[4] },
              { icon: Clock, title: 'Maintenance Reminders', desc: 'Never miss an oil change, inspection, or tune-up.', img: IMAGES.services[5] },
              { icon: Wrench, title: 'Service Centers', desc: 'Locate and manage multiple repair workshops globally.', img: IMAGES.services[6] },
              { icon: MonitorSmartphone, title: 'Fleet Monitoring', desc: 'Comprehensive dashboards and audit logs for admins.', img: IMAGES.services[7] },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <div className="h-48 overflow-hidden relative">
                    <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/0 transition-colors z-10" />
                    <img src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 z-20 w-10 h-10 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center shadow-lg">
                      <s.icon className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-black text-slate-900 text-lg mb-2 font-['Oswald'] uppercase tracking-wide">{s.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Why FleetOps Pro (Split Section) */}
      <section className="py-24 bg-slate-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <FadeIn direction="right">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-amber-500/20 mix-blend-multiply z-10" />
                <img 
                  src={IMAGES.mechanicSplit} 
                  alt="Mechanic inspecting vehicle" 
                  className="w-full h-[600px] object-cover"
                />
                <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-md p-6 rounded-2xl z-20 shadow-xl border border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                      <TrendingUp className="w-7 h-7 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">Increased Efficiency</h4>
                      <p className="text-slate-600 text-sm">Reduce downtime by 40% with smart scheduling.</p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
            
            <FadeIn direction="left">
              <div className="space-y-8">
                <h2 className="text-4xl sm:text-5xl font-black text-slate-900 font-['Oswald'] uppercase tracking-tight leading-[1.1]">
                  Built for Modern <span className="text-amber-500">Vehicle Service Operations</span>
                </h2>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Whether you manage a small fleet or a massive commercial transport network, FleetOps Pro provides the robust infrastructure needed to track, manage, and optimize every vehicle's lifecycle.
                </p>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    'Centralized Vehicle Management',
                    'Faster Service Booking',
                    'Real-Time Repair Progress',
                    'Role-Based Access Control',
                    'Digital Invoicing',
                    'Detailed Service History',
                    'Maintenance Tracking',
                    'Admin Monitoring'
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                      <span className="text-slate-700 font-medium">{benefit}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6">
                  <button onClick={() => onNavigate('/register')} className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-lg font-['Oswald'] uppercase tracking-widest text-lg flex items-center gap-2 group">
                    Explore Platform <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-amber-500" />
                  </button>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.1),transparent_50%)] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
            <div className="text-center mb-20">
              <span className="text-amber-500 font-mono font-bold tracking-widest uppercase text-sm mb-4 block">Process</span>
              <h2 className="text-4xl md:text-5xl font-black font-['Oswald'] uppercase tracking-tight">Streamlined Workflow</h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-slate-800 z-0">
               <div className="absolute inset-0 bg-amber-500 w-full animate-laserScan opacity-50" />
            </div>

            {[
              { step: '1', title: 'Add Your Vehicle', desc: 'Register your vehicle details, VIN, and current mileage to initialize your fleet database.', icon: Car },
              { step: '2', title: 'Book Your Service', desc: 'Select an authorized service center, choose required repairs, and schedule a convenient date.', icon: CalendarCheck },
              { step: '3', title: 'Track the Repair', desc: 'Monitor live repair progress, review diagnostics, and pay your invoice securely online.', icon: ShieldCheck },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.2}>
                <div className="relative z-10 flex flex-col items-center text-center group">
                  <div className="w-24 h-24 bg-slate-900 border border-slate-700 rounded-2xl flex items-center justify-center mb-8 shadow-xl group-hover:border-amber-500 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.2)] transition-all duration-300 transform group-hover:-translate-y-2 relative overflow-hidden">
                     <div className="absolute inset-0 bg-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <item.icon className="w-10 h-10 text-amber-500 relative z-10" />
                     <div className="absolute -bottom-2 -right-2 text-6xl font-black text-slate-800/50 font-['Oswald']">
                       {item.step}
                     </div>
                  </div>
                  <h3 className="text-2xl font-black mb-4 font-['Oswald'] uppercase tracking-wide">{item.title}</h3>
                  <p className="text-slate-400 text-base max-w-sm leading-relaxed">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Real Vehicle Workshop Banner */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={IMAGES.workshopBanner} 
            alt="Modern service workshop" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-slate-900/70" />
        </div>
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white font-['Oswald'] uppercase tracking-tight mb-6 leading-tight">
              Keep Every Vehicle <br/> <span className="text-amber-500">Ready for the Road</span>
            </h2>
            <p className="text-xl text-slate-300 font-medium mb-10 max-w-2xl mx-auto">
              FleetOps Pro brings vehicle records, service operations, repair progress, and maintenance information together in one platform.
            </p>
            <button onClick={() => onNavigate('/register')} className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-10 py-4 rounded-xl font-black transition-all shadow-xl shadow-amber-500/20 font-['Oswald'] uppercase tracking-widest text-lg inline-flex items-center gap-2 hover:scale-105">
              Get Started Now <ArrowRight className="w-5 h-5" />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* User Roles Section */}
      <section id="roles" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <FadeIn>
             <div className="text-center mb-16">
              <span className="text-amber-600 font-mono font-bold tracking-widest uppercase text-sm mb-4 block">Ecosystem</span>
              <h2 className="text-4xl font-black text-slate-900 font-['Oswald'] uppercase tracking-tight">Purpose-Built Dashboards</h2>
              <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">Tailored experiences designed for every participant in the service lifecycle.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                role: 'Customer',
                img: IMAGES.roles.customer,
                desc: 'Vehicle Owners & Fleet Managers',
                features: ['Manage vehicles', 'Book service', 'Track repairs', 'View invoices']
              },
              {
                role: 'Mechanic',
                img: IMAGES.roles.mechanic,
                desc: 'Professional Technicians',
                features: ['View assigned jobs', 'Perform inspection', 'Update repair progress', 'Record repair logs'],
                featured: true
              },
              {
                role: 'Admin',
                img: IMAGES.roles.admin,
                desc: 'Workshop & System Managers',
                features: ['Manage users', 'Manage service centers', 'Monitor system', 'View analytics & logs']
              }
            ].map((role, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className={`h-full bg-white rounded-3xl overflow-hidden border ${role.featured ? 'border-amber-500 shadow-2xl shadow-amber-500/10 md:-translate-y-4' : 'border-slate-200 shadow-lg'} transition-all flex flex-col`}>
                  <div className="h-48 relative">
                    <img src={role.img} alt={role.role} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                    <h3 className="absolute bottom-4 left-6 text-3xl font-black text-white font-['Oswald'] uppercase tracking-wide">{role.role}</h3>
                  </div>
                  <div className="p-8 flex-1 flex flex-col">
                    <p className="text-amber-600 font-bold mb-6 text-sm uppercase tracking-wider">{role.desc}</p>
                    <ul className="space-y-4 mb-8 flex-1">
                      {role.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-slate-700">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> 
                          <span className="font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button onClick={() => onNavigate('/register')} className={`w-full py-3 rounded-xl font-bold font-['Oswald'] uppercase tracking-wider transition-colors ${role.featured ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                      Access Portal
                    </button>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Vehicle Service Showcase */}
      <section className="py-24 bg-slate-950 text-white">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
           <FadeIn>
             <div className="text-center mb-16">
              <h2 className="text-4xl font-black font-['Oswald'] uppercase tracking-tight mb-4">Professional Care for Every Vehicle</h2>
              <p className="text-slate-400 text-lg">From personal sedans to heavy commercial fleets, we support it all.</p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Sedan', img: IMAGES.vehicles.sedan },
              { label: 'SUV', img: IMAGES.vehicles.suv },
              { label: 'Electric Vehicle', img: IMAGES.vehicles.ev },
              { label: 'Commercial', img: IMAGES.vehicles.commercial },
              { label: 'Pickup Truck', img: IMAGES.vehicles.truck },
              { label: 'Heavy Vehicle', img: IMAGES.vehicles.heavy },
            ].map((v, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer">
                  <img src={v.img} alt={v.label} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="block text-amber-500 font-bold text-sm mb-1 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">Category</span>
                    <h4 className="text-lg font-black font-['Oswald'] uppercase tracking-wide">{v.label}</h4>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black text-slate-900 font-['Oswald'] uppercase tracking-tight">Trusted by Professionals</h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { role: 'Fleet Manager', quote: 'FleetOps Pro makes it easier to keep vehicle service information organized and accessible across our entire operation.' },
              { role: 'Workshop Manager', quote: 'The real-time bay tracking and mechanic assignment features have completely transformed our daily workflow.' },
              { role: 'Vehicle Owner', quote: 'I love being able to book a service online and track exactly what stage of repair my car is in without calling.' }
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 0.2}>
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 relative">
                  <div className="text-amber-500 text-6xl font-serif absolute top-4 left-6 opacity-20">"</div>
                  <p className="text-slate-700 text-lg leading-relaxed relative z-10 mb-8 italic">"{t.quote}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{t.role}</p>
                      <p className="text-sm text-slate-500">Verified User</p>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={IMAGES.ctaBg} 
            alt="Dark automotive background" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-slate-950/80" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white font-['Oswald'] uppercase tracking-tight mb-6 leading-tight">
              Ready to Simplify <br/><span className="text-amber-500">Vehicle Service Management?</span>
            </h2>
            <p className="text-xl text-slate-300 mb-10">
              Bring vehicles, bookings, repairs, maintenance, and service operations together with FleetOps Pro.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button onClick={() => onNavigate('/register')} className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-10 py-4 rounded-xl font-black transition-all shadow-xl shadow-amber-500/20 font-['Oswald'] uppercase tracking-widest text-lg">
                Create Account
              </button>
              <button onClick={() => onNavigate('/login')} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-10 py-4 rounded-xl font-bold transition-all backdrop-blur-sm text-lg">
                Login to Portal
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xs tracking-wider font-['Oswald']">
                  FP
                </div>
                <span className="font-['Oswald'] font-bold text-2xl uppercase tracking-tight text-white">FleetOps <span className="text-amber-500">Pro</span></span>
              </div>
              <p className="max-w-xs text-sm leading-relaxed">
                Smart Fleet & Vehicle Service Management Platform. Built for modern automotive operations.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-4 font-['Oswald'] uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-amber-500 transition-colors">Features</a></li>
                <li><a href="#services" className="hover:text-amber-500 transition-colors">Services</a></li>
                <li><a href="#how-it-works" className="hover:text-amber-500 transition-colors">How It Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 font-['Oswald'] uppercase tracking-wider">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><button onClick={() => onNavigate('/login')} className="hover:text-amber-500 transition-colors">Login</button></li>
                <li><button onClick={() => onNavigate('/register')} className="hover:text-amber-500 transition-colors">Sign Up</button></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© {new Date().getFullYear()} FleetOps Pro. All rights reserved.</p>
            <div className="flex gap-4">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};
