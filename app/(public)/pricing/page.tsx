import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Car, ArrowRight } from "lucide-react"

const plans = [
  {
    name: "Starter",
    price: "R 999",
    period: "/month",
    desc: "Perfect for small independent dealerships",
    features: [
      "Up to 20 vehicles in inventory",
      "Multi-Platform Publisher (2 platforms)",
      "Basic quotes generator",
      "WhatsApp lead capture",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: "R 2,499",
    period: "/month",
    desc: "For growing dealerships ready to scale",
    features: [
      "Unlimited vehicles",
      "Multi-Platform Publisher (all platforms)",
      "AI Quote & Invoice Generator",
      "Finance Application Assistant",
      "WhatsApp + Email integration",
      "AI Blog Writer (4 posts/month)",
      "Lead CRM with pipeline",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "R 4,999",
    period: "/month",
    desc: "For multi-franchise dealer groups",
    features: [
      "Everything in Professional",
      "Multi-dealership management",
      "Custom workflow templates",
      "Unlimited AI Blog posts",
      "API access & webhooks",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee",
      "White-label option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#030712] text-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-[#030712]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Car className="h-6 w-6 text-orange-400" />
            <span className="font-bold text-lg">DealX</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white/60 hover:text-white" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button className="bg-orange-500 text-white hover:bg-orange-600" asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">
            Simple, Transparent Pricing
          </h1>
          <p className="text-white/60 max-w-2xl mx-auto text-lg">
            All plans include a 14-day free trial. No credit card required. 
            Cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-xl border ${
                  plan.popular
                    ? "border-orange-500/30 bg-orange-500/[0.03]"
                    : "border-white/[0.08] bg-white/[0.02]"
                } p-8 flex flex-col`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-orange-500 text-white text-xs font-medium">
                    Most Popular
                  </div>
                )}

                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-white/60 text-sm mb-4">{plan.desc}</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-white/40">{plan.period}</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-orange-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-white/70">{f}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className={
                    plan.popular
                      ? "bg-orange-500 text-white hover:bg-orange-600 w-full"
                      : "border-white/[0.08] text-white hover:bg-white/[0.05] w-full"
                  }
                  variant={plan.popular ? "default" : "outline"}
                  asChild
                >
                  <Link href="/sign-up">
                    {plan.cta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto mt-24 space-y-8">
            <h2 className="text-2xl font-bold text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {[
                { q: "Can I try before I buy?", a: "Yes! All plans come with a 14-day free trial. No credit card required." },
                { q: "Do you support all SA car listing platforms?", a: "Yes — AutoTrader SA, Cars.co.za, CHANGECARS, Facebook Marketplace, and your own website." },
                { q: "What banks do you support for finance applications?", a: "WesBank, Absa, MFC, Standard Bank, and Nedbank. More being added." },
                { q: "Is my data secure?", a: "Absolutely. All data is encrypted at rest and in transit. We're POPIA compliant." },
                { q: "Can I switch plans?", a: "Yes — upgrade or downgrade anytime. Changes take effect immediately." },
              ].map((faq) => (
                <div key={faq.q}>
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-white/60 text-sm">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-white/30">
          © {new Date().getFullYear()} DealX. All rights reserved. Built by Majestic Dev.
        </div>
      </footer>
    </div>
  )
}
