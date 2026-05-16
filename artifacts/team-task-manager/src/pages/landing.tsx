import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Layout, BarChart3, Shield, Sparkles, Zap, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export default function Landing() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">

      {/* Layered animated background */}
      <div className="fixed inset-0 pointer-events-none select-none">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(200,200,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(200,200,255,0.8) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
        <div className="absolute -top-[20%] -left-[10%] w-[700px] h-[700px] rounded-full animate-glow-pulse"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-[25%] -right-[10%] w-[600px] h-[600px] rounded-full animate-glow-pulse"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.14) 0%, transparent 70%)", animationDelay: "2.5s" }} />
        <div className="absolute top-[35%] left-[45%] w-[500px] h-[500px] rounded-full animate-float-slow"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto w-full max-w-7xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
          <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center animate-border-glow">
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <span>Task<span className="text-primary">Cockpit</span></span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors duration-200">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all duration-200">
              Sign up
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pt-10 pb-20">
        <div className="animate-in-hero">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-sm font-medium text-primary/90 mb-10">
            <Sparkles className="h-3.5 w-3.5" />
            Built for high-performance teams
          </div>
        </div>

        <h1 className="animate-in-hero-1 text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight max-w-5xl mb-6 leading-[1.05]">
          Manage work with
          <span className="block gradient-text mt-1">surgical precision.</span>
        </h1>

        <p className="animate-in-hero-2 text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 leading-relaxed">
          A dense, purposeful cockpit for small-to-medium teams. Real-time visibility on every project, every task, and every person. No noise, just signal.
        </p>

        <div className="animate-in-hero-3">
          <Link href="/login">
            <Button
              size="lg"
              className="h-12 px-10 text-base font-semibold glow-button bg-primary hover:bg-primary/90 text-primary-foreground group"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        <div className="animate-in-hero-4 mt-20 flex flex-col sm:flex-row gap-12 items-center justify-center">
          {[
            { value: "100%", label: "Visibility", icon: BarChart3 },
            { value: "Zero", label: "Complexity", icon: Zap },
            { value: "2 min", label: "To onboard", icon: Users },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1.5 group">
              <stat.icon className="h-4 w-4 text-muted-foreground mb-1 group-hover:text-primary transition-colors duration-200" />
              <span className="text-3xl font-bold gradient-text-subtle">{stat.value}</span>
              <span className="text-sm text-muted-foreground">{stat.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-24">
        <div className="animate-in-hero-4 text-center mb-14">
          <h2 className="text-3xl font-bold mb-3">Everything your team needs</h2>
          <p className="text-muted-foreground">Purpose-built tools. Zero overhead.</p>
        </div>
        <div className="animate-in-hero-5 grid md:grid-cols-3 gap-5">
          {[
            {
              icon: Layout,
              title: "Kanban Boards",
              desc: "Column-based flow — todo, in progress, done. Move work forward without friction.",
              bg: "rgba(139,92,246,0.10)",
              iconClass: "text-violet-400",
              borderColor: "rgba(139,92,246,0.18)",
            },
            {
              icon: Shield,
              title: "Role-Based Access",
              desc: "Admins structure the work. Members execute. Simple, secure, and auditable.",
              bg: "rgba(34,211,238,0.07)",
              iconClass: "text-cyan-400",
              borderColor: "rgba(34,211,238,0.14)",
            },
            {
              icon: BarChart3,
              title: "Live Dashboard",
              desc: "Real-time stats, task distribution charts, and overdue alerts — one glance away.",
              bg: "rgba(99,102,241,0.09)",
              iconClass: "text-indigo-400",
              borderColor: "rgba(99,102,241,0.16)",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="glow-card group rounded-2xl p-7 cursor-default"
              style={{ background: `linear-gradient(135deg, ${f.bg} 0%, rgba(255,255,255,0.01) 100%)`, border: `1px solid ${f.borderColor}` }}
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{ background: f.bg, border: `1px solid ${f.borderColor}` }}
              >
                <f.icon className={`h-5 w-5 ${f.iconClass}`} />
              </div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA banner */}
      <section className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-24">
        <div
          className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(34,211,238,0.07) 100%)",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        >
          <div className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: `linear-gradient(rgba(200,200,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(200,200,255,0.8) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to take control?</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Log in and see your team's work in a whole new light.
            </p>
            <Link href="/login">
              <Button size="lg" className="h-12 px-10 glow-button bg-primary hover:bg-primary/90 text-primary-foreground group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="relative z-10 py-6 border-t border-border/30 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
          <span className="font-medium text-foreground/70">TaskCockpit</span>
        </div>
        <p>&copy; {new Date().getFullYear()} All rights reserved.</p>
      </footer>
    </div>
  );
}
