import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Car, Calculator, Globe, FileText, Bot, Users, ArrowRight } from "lucide-react"
import { auth } from "@clerk/nextjs/server"
import { UserButton } from "@clerk/nextjs"

export default async function LandingPage() {
  const { userId } = await auth()

  return (
    <div className="relative min-h-screen bg-[#030712] text-white overflow-hidden">
      {/* ── Background Glow Orbs ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[700px] h-[700px] rounded-full bg-orange-500/5 blur-[180px] pointer-events-none" />

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030712]/70 backdrop-blur-xl transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 group-hover:scale-105 transition-transform duration-300">
              <Car className="h-5 w-5 text-orange-400" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
              Deal<span className="text-orange-400">X</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200">Features</Link>
            <Link href="#how-it-works" className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200">How It Works</Link>
            <Link href="/pricing" className="text-sm font-medium text-white/60 hover:text-white transition-colors duration-200">Pricing</Link>
          </div>
          <div className="flex items-center gap-4">
            {userId ? (
              <>
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-[0_0_20px_rgba(249,115,22,0.25)] hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] transition-all duration-300 font-semibold" asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
                <div className="border-l border-white/10 pl-4 h-6 flex items-center">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            ) : (
              <>
                <Button variant="ghost" className="text-white/60 hover:text-white hover:bg-white/[0.04] transition-all duration-200" asChild>
                  <Link href="/sign-in">Sign In</Link>
                </Button>
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-[0_0_20px_rgba(249,115,22,0.25)] hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] transition-all duration-300 font-semibold" asChild>
                  <Link href="/sign-up">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/20 bg-orange-500/5 text-orange-400 text-xs font-semibold tracking-wider uppercase animate-pulse shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              ✨ AI-Powered Dealership Management
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
              The All-in-One AI Platform for{" "}
              <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(249,115,22,0.15)]">
                SA Car Dealerships
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              Automate your listings, finance applications, quotes, and customer follow-ups — all from one place. 
              Your dealership, supercharged by next-generation AI agents.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {userId ? (
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-[0_0_35px_rgba(249,115,22,0.3)] hover:shadow-[0_0_45px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 px-8 py-6 text-base font-semibold rounded-xl" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-[0_0_35px_rgba(249,115,22,0.3)] hover:shadow-[0_0_45px_rgba(249,115,22,0.5)] transition-all duration-300 transform hover:-translate-y-0.5 px-8 py-6 text-base font-semibold rounded-xl" asChild>
                    <Link href="/sign-up">
                      Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/[0.08] text-white/80 hover:text-white hover:bg-white/[0.05] hover:border-white/20 transition-all duration-300 transform hover:-translate-y-0.5 px-8 py-6 text-base font-semibold rounded-xl" asChild>
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="border-t border-white/[0.06] py-14 bg-white/[0.01]">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-xs uppercase tracking-widest text-white/30 mb-8 font-semibold">
            Trusted by dealerships across South Africa
          </p>
          <div className="flex items-center justify-center gap-10 md:gap-16 flex-wrap opacity-60">
            {["Sandton Auto", "Cape Town Motors", "Durban Car Sales", "Pretoria Auto", "Fourways Vehicles"].map((name) => (
              <span key={name} className="text-white/40 text-base md:text-lg font-bold hover:text-white transition-colors duration-200">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features" className="border-t border-white/[0.06] py-28 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              Everything Your Dealership Needs
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Four powerful, autonomous AI agents working in harmony to streamline your operations and drive sales.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Globe,
                title: "Multi-Platform Publisher",
                desc: "Publish your inventory to AutoTrader, Cars.co.za, CHANGECARS, Facebook Marketplace, and your own website instantly. Our browser automation handles the heavy lifting, logging in and populating listings seamlessly.",
                color: "text-orange-400",
                bg: "bg-orange-500/10 border-orange-500/20",
              },
              {
                icon: Calculator,
                title: "Finance Application Assistant",
                desc: "Capture customer credentials directly via WhatsApp. AI extracts relevant variables, populates the bank's F&I portal, and submits applications directly to WesBank, Absa, or MFC for review within minutes.",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10 border-emerald-500/20",
              },
              {
                icon: FileText,
                title: "AI Quote & Invoice Generator",
                desc: "Generate professional, itemized vehicle quotes, financial breakdowns, and Offer to Purchase (OTP) documents. Instantly deliver them directly to your customers' WhatsApp or inbox with a single click.",
                color: "text-violet-400",
                bg: "bg-violet-500/10 border-violet-500/20",
              },
              {
                icon: Bot,
                title: "AI Blog & SEO Engine",
                desc: "Keep your dealership ranked on Google. The engine automatically creates localized, SEO-optimized blog posts highlighting your new arrivals, dealership news, and automotive trends.",
                color: "text-cyan-400",
                bg: "bg-cyan-500/10 border-cyan-500/20",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group relative p-8 rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-transparent hover:border-orange-500/20 hover:from-white/[0.06] hover:to-orange-500/[0.02] transition-all duration-300 hover:-translate-y-1 shadow-[0_4px_30px_rgba(0,0,0,0.4)]"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-500/5 to-transparent rounded-tr-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className={`w-14 h-14 rounded-xl ${feature.bg} border flex items-center justify-center mb-6 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)] group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-orange-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="border-t border-white/[0.06] py-28 bg-white/[0.005] relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white">
              How It Works
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto">
              Get up and running in three simple steps. No coding or complex configuration required.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Timeline connecting line */}
            <div className="hidden md:block absolute top-[28px] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-orange-500/5 via-orange-500/30 to-orange-500/5 z-0" />
            
            {[
              { 
                step: "01", 
                title: "Connect Your Dealership", 
                desc: "Sign up, add your current inventory, link your WhatsApp Business number, and configure your target listing portal logins in our secure credentials vault." 
              },
              { 
                step: "02", 
                title: "Automate Workflows", 
                desc: "Use our clean dashboard UI to publish listings, respond to inbound WhatsApp leads, draft quotes, and process credit applications automatically." 
              },
              { 
                step: "03", 
                title: "Accelerate Sales", 
                desc: "Watch your inquiries soar as AI agents publish vehicles, write blog posts, draft OTPs, and pre-submit bank applications while you focus on handovers." 
              },
            ].map((item) => (
              <div key={item.step} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-14 h-14 rounded-full bg-[#030712] border-2 border-white/[0.08] group-hover:border-orange-500 flex items-center justify-center text-base font-extrabold text-orange-400 shadow-[0_0_20px_rgba(0,0,0,0.6)] group-hover:shadow-[0_0_25px_rgba(249,115,22,0.25)] transition-all duration-300 mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white transition-colors duration-200">
                  {item.title}
                </h3>
                <p className="text-white/60 text-sm leading-relaxed max-w-xs">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-t border-white/[0.06] py-28 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { value: "10x", label: "Faster Listings" },
              { value: "85%", label: "Less Admin Overhead" },
              { value: "3min", label: "Finance Application Time" },
              { value: "24/7", label: "Lead Capture & Response" },
            ].map((stat) => (
              <div key={stat.label} className="p-6 rounded-2xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors duration-300 text-center">
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner Section ── */}
      <section className="border-t border-white/[0.06] py-28 relative">
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-12 md:p-16 text-center space-y-8 shadow-[0_10px_50px_rgba(0,0,0,0.6)]">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-orange-600/10 rounded-full blur-[110px] pointer-events-none" />
            
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white max-w-2xl mx-auto leading-tight relative z-10">
              Ready to Transform Your Dealership?
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto leading-relaxed relative z-10">
              Join South African dealerships that are already using DealX to sell more cars, faster. Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              {userId ? (
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all duration-300 transform hover:-translate-y-0.5 px-8 py-6 rounded-xl font-semibold" asChild>
                  <Link href="/dashboard">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 shadow-[0_0_30px_rgba(249,115,22,0.3)] transition-all duration-300 transform hover:-translate-y-0.5 px-8 py-6 rounded-xl font-semibold" asChild>
                    <Link href="/sign-up">
                      Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white/[0.08] text-white/80 hover:text-white hover:bg-white/[0.05] transition-all duration-300 transform hover:-translate-y-0.5 px-8 py-6 rounded-xl font-semibold" asChild>
                    <Link href="/pricing">See Plans</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-16 bg-[#030712]/50 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-10">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Car className="h-5 w-5 text-orange-400" />
                <span className="font-black text-lg tracking-tight">DealX</span>
              </div>
              <p className="text-white/40 text-sm max-w-sm leading-relaxed">
                AI-powered dealership automation for South African auto dealers. 
                Publish listings, capture WhatsApp leads, compile bank applications, and rank on Google.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm text-white/80">Product</h4>
              <div className="flex flex-col gap-2">
                <Link href="#features" className="text-sm text-white/40 hover:text-white transition-colors duration-200">Features</Link>
                <Link href="/pricing" className="text-sm text-white/40 hover:text-white transition-colors duration-200">Pricing</Link>
                <Link href="#how-it-works" className="text-sm text-white/40 hover:text-white transition-colors duration-200">How It Works</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-sm text-white/80">Company</h4>
              <div className="flex flex-col gap-2">
                <span className="text-sm text-white/40">Built by Majestic Dev</span>
                <span className="text-sm text-white/40">South Africa</span>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/[0.06] mt-12 pt-8 text-center text-xs text-white/30">
            © {new Date().getFullYear()} DealX. All rights reserved. Built by Majestic Dev in South Africa.
          </div>
        </div>
      </footer>
    </div>
  )
}
