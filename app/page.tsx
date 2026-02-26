import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Zap, Shield, BarChart3, Layers } from "lucide-react"

const FEATURES = [
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Built for performance from the ground up. Sub-second load times on every device.",
  },
  {
    icon: Shield,
    title: "Secure by Default",
    description: "Enterprise-grade security baked in. Your data is always protected.",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Actionable insights at a glance. Know exactly what's happening at all times.",
  },
  {
    icon: Layers,
    title: "Modular Design",
    description: "Pick and choose what you need. Every component is independently scalable.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <main>
        <section
          id="home"
          className="flex flex-col items-center justify-center text-center px-4 pt-40 pb-24"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-6">
            <Zap className="w-3 h-3" aria-hidden="true" />
            Now in public beta
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-balance max-w-3xl leading-tight">
            Build faster with{" "}
            <span className="text-primary">Nexus</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl text-pretty leading-relaxed">
            The modern platform that accelerates your workflow. Ship with confidence, scale with ease, and delight your users every time.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center gap-3">
            <Button size="lg" className="rounded-lg px-8 font-semibold">
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" className="rounded-lg px-8 font-semibold">
              View Demo
            </Button>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24"
        >
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-balance">
              Everything you need to ship
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty max-w-lg mx-auto leading-relaxed">
              A comprehensive set of tools designed to take your product from idea to production in record time.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 hover:border-primary/40 hover:shadow-sm transition-all duration-200"
              >
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section
          id="pricing"
          className="mx-4 sm:mx-6 lg:mx-8 mb-24 max-w-6xl lg:mx-auto rounded-2xl bg-primary px-8 py-14 text-center"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground text-balance">
            Ready to get started?
          </h2>
          <p className="mt-3 text-primary-foreground/80 text-pretty leading-relaxed max-w-md mx-auto">
            Join thousands of teams already building with Nexus. Free plan available — no credit card required.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-8 rounded-lg px-8 font-semibold"
          >
            Start for free
          </Button>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Nexus. All rights reserved.
      </footer>
    </div>
  )
}
