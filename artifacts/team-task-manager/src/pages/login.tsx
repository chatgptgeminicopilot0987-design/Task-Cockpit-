import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();

  const loginMutation = useLogin();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate({ data }, {
      onSuccess: (response) => {
        setAuthToken(response.token);
        toast({ title: "Welcome back", description: "Successfully logged in." });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: error.data?.message || "Invalid credentials.",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(200,200,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(200,200,255,0.8) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -top-[30%] -left-[20%] w-[600px] h-[600px] rounded-full animate-glow-pulse"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-[30%] -right-[20%] w-[500px] h-[500px] rounded-full animate-glow-pulse"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)", animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-in-hero">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center justify-center gap-2.5 mb-10 cursor-pointer group">
            <div className="h-9 w-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center transition-all duration-200 group-hover:bg-primary/25">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-2xl tracking-tight">
              Task<span className="text-primary">Cockpit</span>
            </span>
          </div>
        </Link>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(255,255,255,0.02) 100%)",
            border: "1px solid rgba(139,92,246,0.15)",
            boxShadow: "0 0 40px rgba(139,92,246,0.05), 0 20px 60px rgba(0,0,0,0.3)",
          }}
        >
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-bold tracking-tight mb-1.5">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Log in to your TaskCockpit account</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        autoComplete="email"
                        className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/8 transition-all duration-200 h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete="current-password"
                        className="bg-white/5 border-white/10 focus:border-primary/50 focus:bg-white/8 transition-all duration-200 h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-1">
                <Button
                  type="submit"
                  className="w-full h-10 glow-button bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  )}
                  Sign In
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-6 pt-5 border-t border-white/8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup">
              <span className="text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors duration-200">
                Sign up free
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
