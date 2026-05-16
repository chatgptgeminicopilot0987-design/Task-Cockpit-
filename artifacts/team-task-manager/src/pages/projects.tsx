import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useListProjects, useCreateProject, getListProjectsQueryKey, useDeleteProject } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users, CheckSquare, Trash2, Search, CalendarDays } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";

const createProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  dueDate: z.string().optional().nullable(),
});

export default function Projects() {
  const { user } = useAuth();
  const { data: projects, isLoading } = useListProjects();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = projects?.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage your team's initiatives and workspaces.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-9 bg-card"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {user?.role === "admin" && <CreateProjectModal />}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredProjects?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg bg-card/50 text-center p-8">
          <BriefcaseIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No projects found</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            {searchTerm ? "No projects match your search criteria." : "Get started by creating a new project to organize your team's work."}
          </p>
          {user?.role === "admin" && !searchTerm && <CreateProjectModal />}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects?.map((project, i) => (
            <div key={project.id} className="animate-in-hero" style={{ animationDelay: `${i * 80}ms`, opacity: 0 }}>
              <ProjectCard project={project} isAdmin={user?.role === "admin"} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BriefcaseIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}

function ProjectCard({ project, isAdmin }: { project: any, isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteProject();
  const { toast } = useToast();

  const progress = project.taskCount ? Math.round(((project.completedTaskCount || 0) / project.taskCount) * 100) : 0;
  const isOverdue = (project as any).dueDate && new Date((project as any).dueDate) < new Date();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    deleteMutation.mutate({ id: project.id }, {
      onSuccess: () => {
        toast({ title: "Project deleted" });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Failed to delete project" });
      }
    });
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full flex flex-col glow-card cursor-pointer group border-border/50">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="line-clamp-1">{project.title}</CardTitle>
            {isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the project
                      "{project.title}" and all its tasks and comments.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
          <CardDescription className="line-clamp-2 h-10">{project.description || "No description provided."}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{project.members?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckSquare className="h-4 w-4" />
              <span>{project.taskCount || 0}</span>
            </div>
            {(project as any).dueDate && (
              <div className={`flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${isOverdue ? "bg-red-500/10 text-red-400" : "bg-muted/60 text-muted-foreground"}`}>
                <CalendarDays className="h-3 w-3" />
                <span>{format(new Date((project as any).dueDate), "MMM d, yyyy")}</span>
                {isOverdue && <span className="font-semibold">Overdue</span>}
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-border">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="font-medium text-foreground">Progress</span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CreateProjectModal() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateProject();

  const form = useForm<z.infer<typeof createProjectSchema>>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: null,
    },
  });

  const onSubmit = (data: z.infer<typeof createProjectSchema>) => {
    createMutation.mutate({
      data: {
        title: data.title,
        description: data.description ?? "",
        dueDate: data.dueDate ? new Date(data.dueDate + "T00:00:00").toISOString() : null,
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Project created" });
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setOpen(false);
        form.reset();
      },
      onError: () => {
        toast({ variant: "destructive", title: "Failed to create project" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new workspace for your team to collaborate on.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Project Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Q3 Marketing Campaign" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="What is this project about?" className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" /> Deadline (Optional)
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    value={field.value ?? ""}
                    className="cursor-pointer"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
