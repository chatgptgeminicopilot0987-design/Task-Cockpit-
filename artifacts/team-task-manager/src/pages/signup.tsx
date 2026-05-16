import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignup } from "@workspace/api-client-react";
const SignupInputRole = { admin: "admin", member: "member" } as const;
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum([SignupInputRole.admin, SignupInputRole.member]).default(SignupInputRole.member),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const { login: setAuthToken } = useAuth();
  const { toast } = useToast();

  const signupMutation = useSignup();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", role: SignupInputRole.member },
  });

  const onSubmit = (data: SignupFormValues) => {
    signupMutation.mutate({ data }, {
      onSuccess: (response) => {
        setAuthToken(response.token);
        toast({ title: "Account created", description: "Welcome to TaskCockpit." });
        setLocation("/dashboard");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.data?.message || "Could not create account.",
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden py-10">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(200,200,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(200,200,255,0.8) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
        <div className="absolute -top-[30%] -right-[20%] w-[600px] h-[600px] rounded-full animate-glow-pulse"
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, transparent 70%)" }} />
        <div className="absolute -bottom-[30%] -left-[20%] w-[500px] h-[500px] rounded-full animate-glow-pulse"
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
            <h1 className="text-2xl font-bold tracking-tight mb-1.5">Create your account</h1>
            <p className="text-sm text-muted-foreground">Join your team on TaskCockpit</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Alex Johnson"
                        className="bg-white/5 border-white/10 focus:border-primary/50 transition-all duration-200 h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        className="bg-white/5 border-white/10 focus:border-primary/50 transition-all duration-200 h-10"
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
                        className="bg-white/5 border-white/10 focus:border-primary/50 transition-all duration-200 h-10"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground/80">Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white/5 border-white/10 focus:border-primary/50 h-10">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SignupInputRole.member}>Team Member</SelectItem>
                        <SelectItem value={SignupInputRole.admin}>Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-1">
                <Button
                  type="submit"
                  className="w-full h-10 glow-button bg-primary hover:bg-primary/90 text-primary-foreground font-semibold group"
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="mr-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  )}
                  Create Account
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-6 pt-5 border-t border-white/8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-primary hover:text-primary/80 font-medium cursor-pointer transition-colors duration-200">
                Log in
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
