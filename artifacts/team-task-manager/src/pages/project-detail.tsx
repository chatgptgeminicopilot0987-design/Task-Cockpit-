import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useGetProject,
  useUpdateProject,
  useListProjectTasks,
  useCreateTask,
  useAddProjectMember,
  useListUsers,
  getGetProjectQueryKey,
  getListProjectTasksQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Plus, UserPlus, ArrowLeft, CalendarDays, Users, X, Crown } from "lucide-react";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useDeleteProject, getListProjectsQueryKey } from "@workspace/api-client-react";
import { Trash2, CheckSquare, Search } from "lucide-react";

const TaskInputStatus = { todo: "todo", in_progress: "in_progress", completed: "completed" } as const;
const TaskInputPriority = { low: "low", medium: "medium", high: "high" } as const;

async function removeProjectMember(projectId: number, userId: number): Promise<void> {
  const token = localStorage.getItem("token");
  const res = await fetch(`/api/projects/${projectId}/members/${userId}`, {
    method: "DELETE",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any).message ?? "Failed to remove member");
  }
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id, 10);
  const { user } = useAuth();

  const { data: project, isLoading: projectLoading } = useGetProject(projectId);
  const { data: tasks, isLoading: tasksLoading } = useListProjectTasks(projectId);

  if (projectLoading || tasksLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return <div className="p-8 text-center">Project not found</div>;
  }

  const todoTasks = tasks?.filter(t => t.status === "todo") || [];
  const inProgressTasks = tasks?.filter(t => t.status === "in_progress") || [];
  const completedTasks = tasks?.filter(t => t.status === "completed") || [];

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/projects">
              <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 text-muted-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">{project.description}</p>
          {(project as any).dueDate && (
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Due {format(new Date((project as any).dueDate), "MMM d, yyyy")}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          {user?.role === "admin" && <EditProjectModal project={project} />}
          {user?.role === "admin" && <ManageMembersModal projectId={projectId} project={project} />}
          <div className="flex -space-x-2">
            {project.members?.slice(0, 5).map(member => (
              <Avatar key={member.id} className="border-2 border-background h-8 w-8">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ))}
            {(project.members?.length || 0) > 5 && (
              <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-background bg-muted text-[10px] font-medium text-muted-foreground z-10">
                +{project.members.length - 5}
              </div>
            )}
          </div>
          {user?.role === "admin" && <CreateTaskModal projectId={projectId} members={project.members} />}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden pb-2">
        <KanbanColumn title="To Do" tasks={todoTasks} count={todoTasks.length} dotColor="bg-muted-foreground" />
        <KanbanColumn title="In Progress" tasks={inProgressTasks} count={inProgressTasks.length} dotColor="bg-primary" />
        <KanbanColumn title="Completed" tasks={completedTasks} count={completedTasks.length} dotColor="bg-chart-2" />
      </div>
    </div>
  );
}

function KanbanColumn({ title, tasks, count, dotColor }: { title: string; tasks: any[]; count: number; dotColor: string }) {
  return (
    <div className="flex flex-col h-full rounded-xl border border-border/40 overflow-hidden" style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="px-4 py-3 border-b border-border/40 flex justify-between items-center" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${dotColor}`} />
          <h3 className="font-semibold text-sm tracking-wide">{title}</h3>
        </div>
        <span className="text-xs font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full tabular-nums">{count}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {tasks.length === 0 ? (
          <div className="h-20 flex items-center justify-center text-xs text-muted-foreground/50 border border-dashed border-border/30 rounded-lg mt-1">
            No tasks
          </div>
        ) : (
          tasks.map((task, i) => <TaskCard key={task.id} task={task} index={i} />)
        )}
      </div>
    </div>
  );
}

function TaskCard({ task, index }: { task: any; index: number }) {
  const priorityColors = {
    low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    high: "bg-red-500/15 text-red-400 border-red-500/20",
  };

  return (
    <Link href={`/tasks/${task.id}`}>
      <div
        className="group rounded-xl border border-border/40 p-3 cursor-pointer transition-all duration-200 hover:border-primary/35 hover:shadow-[0_0_20px_rgba(139,92,246,0.08)] hover:-translate-y-0.5"
        style={{ background: "rgba(255,255,255,0.03)", animationDelay: `${index * 60}ms` }}
      >
        <div className="flex justify-between items-start gap-2 mb-3">
          <h4 className="font-medium text-sm leading-snug group-hover:text-primary transition-colors duration-200 line-clamp-2">
            {task.title}
          </h4>
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 capitalize shrink-0 ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
            {task.priority}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          {task.assignedTo ? (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-5 w-5 border border-primary/20">
                <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                  {task.assignedTo.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground max-w-[80px] truncate">{task.assignedTo.name}</span>
            </div>
          ) : (
            <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Unassigned</span>
          )}
          {task.dueDate && (
            <div className={`flex items-center gap-1 text-xs rounded-full px-2 py-0.5 ${task.isOverdue && task.status !== "completed" ? "bg-red-500/10 text-red-400" : "bg-muted/60 text-muted-foreground"}`}>
              <CalendarDays className="h-2.5 w-2.5" />
              <span>{format(new Date(task.dueDate), "MMM d")}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Create Task Modal ────────────────────────────────────────────────────────

const addTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  assignedToId: z.coerce.number().optional().nullable(),
  status: z.enum([TaskInputStatus.todo, TaskInputStatus.in_progress, TaskInputStatus.completed]),
  priority: z.enum([TaskInputPriority.low, TaskInputPriority.medium, TaskInputPriority.high]),
  dueDate: z.string().optional().nullable(),
});

function CreateTaskModal({ projectId, members }: { projectId: number; members: any[] }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateTask();

  const form = useForm<z.infer<typeof addTaskSchema>>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: TaskInputStatus.todo,
      priority: TaskInputPriority.medium,
      assignedToId: null,
      dueDate: null,
    },
  });

  const onSubmit = (data: z.infer<typeof addTaskSchema>) => {
    if (data.dueDate) {
      const selected = new Date(data.dueDate + "T00:00:00");
      const today = new Date(); today.setHours(0, 0, 0, 0);
      if (selected < today) {
        form.setError("dueDate", { message: "Deadline cannot be in the past" });
        return;
      }
    }
    createMutation.mutate({
      data: {
        ...data,
        projectId,
        assignedToId: data.assignedToId === -1 ? null : data.assignedToId,
        dueDate: data.dueDate ? new Date(data.dueDate + "T00:00:00").toISOString() : null,
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Task created" });
        queryClient.invalidateQueries({ queryKey: getListProjectTasksQueryKey(projectId) });
        setOpen(false);
        form.reset();
      },
      onError: () => toast({ variant: "destructive", title: "Failed to create task" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>Fill in the details below to add a task to this project.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Task Title <span className="text-destructive">*</span></FormLabel>
                <FormControl><Input placeholder="What needs to be done?" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea placeholder="Add details..." className="resize-none h-20" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="assignedToId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee</FormLabel>
                  <Select onValueChange={(val) => field.onChange(Number(val))} value={field.value?.toString() ?? "-1"}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="-1">Unassigned</SelectItem>
                      {members?.map((m: any) => (
                        <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="dueDate" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary" /> Deadline
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
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Manage Members Modal ─────────────────────────────────────────────────────

function ManageMembersModal({ projectId, project }: { projectId: number; project: any }) {
  const [addingUserId, setAddingUserId] = useState<string>("");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: allUsers } = useListUsers();
  const addMemberMutation = useAddProjectMember();

  const currentMembers: any[] = project.members ?? [];
  const availableUsers = allUsers?.filter((u: any) => !currentMembers.some((m: any) => m.id === u.id)) ?? [];

  const handleAdd = () => {
    const userId = Number(addingUserId);
    if (!userId) return;
    addMemberMutation.mutate({ id: projectId, data: { userId } }, {
      onSuccess: () => {
        toast({ title: "Member added" });
        setAddingUserId("");
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to add member" }),
    });
  };

  const handleRemove = async (userId: number) => {
    setRemovingId(userId);
    try {
      await removeProjectMember(projectId, userId);
      toast({ title: "Member removed" });
      queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
    } catch {
      toast({ variant: "destructive", title: "Failed to remove member" });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Users className="mr-2 h-4 w-4" /> Members
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Manage Members</DialogTitle>
          <DialogDescription>Add or remove members from this project.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {currentMembers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No members yet.</p>
          ) : (
            currentMembers.map((m: any) => {
              const isOwner = m.id === project.ownerId;
              return (
                <div key={m.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                        {m.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none flex items-center gap-1.5">
                        {m.name}
                        {isOwner && <Crown className="h-3 w-3 text-amber-400" />}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{m.email}</p>
                    </div>
                  </div>
                  {!isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemove(m.id)}
                      disabled={removingId === m.id}
                    >
                      {removingId === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-sm font-medium">Add a member</p>
          <div className="flex gap-2">
            <Select value={addingUserId} onValueChange={setAddingUserId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent>
                {availableUsers.length === 0 ? (
                  <div className="py-2 px-2 text-sm text-muted-foreground text-center">No users to add</div>
                ) : (
                  availableUsers.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()}>
                      {u.name} ({u.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!addingUserId || addMemberMutation.isPending} size="sm" className="shrink-0">
              {addMemberMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Project Modal ───────────────────────────────────────────────────────

const editProjectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  dueDate: z.string().optional().nullable(),
});

function EditProjectModal({ project }: { project: any }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const updateMutation = useUpdateProject();

  const form = useForm<z.infer<typeof editProjectSchema>>({
    resolver: zodResolver(editProjectSchema),
    defaultValues: {
      title: project.title,
      description: project.description || "",
      dueDate: (project as any).dueDate ? new Date((project as any).dueDate).toISOString().split("T")[0] : "",
    },
  });

  const onSubmit = (data: z.infer<typeof editProjectSchema>) => {
    updateMutation.mutate({
      id: project.id,
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate + "T00:00:00").toISOString() : null,
      } as any,
    }, {
      onSuccess: () => {
        toast({ title: "Project updated" });
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(project.id) });
        setOpen(false);
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update project" }),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Edit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Edit Project</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Project Title</FormLabel>
                <FormControl><Input {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl><Textarea className="resize-none" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="dueDate" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-primary" /> Deadline
                </FormLabel>
                <div className="flex gap-2 items-center">
                  <FormControl>
                    <Input type="date" {...field} value={field.value ?? ""} className="cursor-pointer" />
                  </FormControl>
                  {field.value && (
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => form.setValue("dueDate", "")}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
