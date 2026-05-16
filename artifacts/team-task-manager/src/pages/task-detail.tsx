import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useGetTask,
  useUpdateTask,
  useDeleteTask,
  useListComments,
  useCreateComment,
  useDeleteComment,
  useListUsers,
  useAddProjectMember,
  getGetTaskQueryKey,
  getGetProjectQueryKey,
  getListCommentsQueryKey,
  useGetProject,
} from "@workspace/api-client-react";

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
import { useQueryClient } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  Loader2, ArrowLeft, Clock, Trash2, Send, Edit, X,
  UserCircle, CalendarDays, Check, Users, Crown, UserPlus,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const taskId = parseInt(id, 10);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: task, isLoading: taskLoading } = useGetTask(taskId);
  const { data: comments, isLoading: commentsLoading } = useListComments(taskId);
  const { data: project } = useGetProject(task?.projectId ?? 0);
  const deleteMutation = useDeleteTask();
  const updateMutation = useUpdateTask();

  // Edit mode state — covers ALL fields
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>({});

  if (taskLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!task) {
    return <div className="p-8 text-center text-muted-foreground">Task not found</div>;
  }

  const priorityColors = {
    low: "bg-chart-2/20 text-chart-2 border-chart-2/20",
    medium: "bg-chart-3/20 text-chart-3 border-chart-3/20",
    high: "bg-destructive/20 text-destructive border-destructive/20",
  };

  const isAdmin = user?.role === "admin";
  const isAssignee = task.assignedToId === user?.id;
  const canEdit = isAdmin || isAssignee;

  const handleDelete = () => {
    deleteMutation.mutate({ id: taskId }, {
      onSuccess: () => {
        toast({ title: "Task deleted" });
        setLocation(`/projects/${task.projectId}`);
      },
      onError: () => toast({ variant: "destructive", title: "Failed to delete task" }),
    });
  };

  const handleStatusChange = (newStatus: any) => {
    updateMutation.mutate({ id: taskId, data: { status: newStatus } }, {
      onSuccess: () => {
        toast({ title: "Status updated" });
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
      },
    });
  };

  const startEdit = () => {
    setEditData({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
      assignedToId: task.assignedToId ?? -1,
    });
    setIsEditing(true);
  };

  const saveEdit = () => {
    updateMutation.mutate({
      id: taskId,
      data: {
        title: editData.title,
        description: editData.description,
        priority: editData.priority,
        status: editData.status,
        assignedToId: editData.assignedToId === -1 ? null : editData.assignedToId,
        dueDate: editData.dueDate ? new Date(editData.dueDate + "T00:00:00").toISOString() : null,
      },
    }, {
      onSuccess: () => {
        toast({ title: "Task updated" });
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
      },
      onError: () => toast({ variant: "destructive", title: "Failed to update task" }),
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href={`/projects/${task.projectId}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8 -ml-2 text-muted-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="text-sm font-medium text-muted-foreground">{task.project?.title}</div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && !isEditing && (
            <Button variant="outline" size="sm" onClick={startEdit}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          )}
          {isEditing && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={saveEdit} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </>
          )}
          {isAdmin && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this task? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4">
              {isEditing ? (
                <div>
                  <Label className="mb-1 block">Title</Label>
                  <Input
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="font-semibold text-lg"
                  />
                </div>
              ) : (
                <CardTitle className="text-2xl leading-tight">{task.title}</CardTitle>
              )}
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div>
                  <Label className="mb-1 block">Description</Label>
                  <Textarea
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="min-h-[150px]"
                  />
                </div>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground whitespace-pre-wrap">
                  {task.description || "No description provided."}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Discussion</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {commentsLoading ? (
                <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : comments?.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to start the discussion.</p>
              ) : (
                <div className="space-y-4">
                  {comments?.map(comment => (
                    <CommentItem key={comment.id} comment={comment} currentUserId={user?.id} taskId={taskId} />
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter>
              <AddCommentForm taskId={taskId} />
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Status</CardTitle>
            </CardHeader>
            <CardContent>
              {canEdit ? (
                <Select
                  value={isEditing ? editData.status : task.status}
                  onValueChange={(v) => isEditing ? setEditData({ ...editData, status: v }) : handleStatusChange(v)}
                >
                  <SelectTrigger className="w-full font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline" className="text-sm px-3 py-1 uppercase">{task.status.replace("_", " ")}</Badge>
              )}
            </CardContent>
          </Card>

          {/* Details card */}
          <Card>
            <CardContent className="p-0 divide-y divide-border">

              {/* Assignee */}
              <div className="p-4 flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                  <UserCircle className="h-3 w-3" /> Assignee
                </span>
                {isEditing ? (
                  <Select
                    value={String(editData.assignedToId ?? -1)}
                    onValueChange={(v) => setEditData({ ...editData, assignedToId: Number(v) })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-1">Unassigned</SelectItem>
                      {project?.members?.map((m: any) => (
                        <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : task.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border border-primary/20">
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                        {task.assignedTo.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{task.assignedTo.name}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">Unassigned</span>
                )}
              </div>

              {/* Priority */}
              <div className="p-4 flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Priority</span>
                {isEditing ? (
                  <Select
                    value={editData.priority}
                    onValueChange={(v) => setEditData({ ...editData, priority: v })}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline" className={`text-xs capitalize w-fit ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                    {task.priority}
                  </Badge>
                )}
              </div>

              {/* Deadline */}
              <div className="p-4 flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Deadline
                </span>
                {isEditing ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      type="date"
                      className="h-8 text-sm cursor-pointer flex-1"
                      value={editData.dueDate}
                      onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                    />
                    {editData.dueDate && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => setEditData({ ...editData, dueDate: "" })}
                        title="Clear deadline"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ) : task.dueDate ? (
                  <div className={`flex items-center gap-1.5 text-sm font-medium px-2 py-1 rounded-lg w-fit ${task.isOverdue && task.status !== "completed" ? "bg-red-500/10 text-red-400" : "bg-muted/40 text-foreground"}`}>
                    <CalendarDays className="h-3.5 w-3.5" />
                    {format(new Date(task.dueDate), "MMM d, yyyy")}
                    {task.isOverdue && task.status !== "completed" && <span className="text-xs font-semibold ml-1">Overdue</span>}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground italic">No deadline set</span>
                )}
              </div>

              {/* Created By */}
              <div className="p-4 flex flex-col gap-1.5">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Created By</span>
                <div className="flex items-center gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[9px] bg-secondary text-secondary-foreground">
                      {task.createdBy?.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{task.createdBy?.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Manage Members card — admin only */}
          {isAdmin && project && (
            <ManageMembersCard project={project} projectId={task.projectId} taskId={taskId} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Manage Members Card (in task sidebar) ────────────────────────────────────

function ManageMembersCard({ project, projectId, taskId }: { project: any; projectId: number; taskId: number }) {
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
        queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
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
      queryClient.invalidateQueries({ queryKey: getGetTaskQueryKey(taskId) });
    } catch {
      toast({ variant: "destructive", title: "Failed to remove member" });
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Project Members
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {/* Member list */}
        <div className="space-y-1">
          {currentMembers.map((m: any) => {
            const isOwner = m.id === project.ownerId;
            return (
              <div key={m.id} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors group">
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-6 w-6 shrink-0">
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                      {m.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm truncate">{m.name}</span>
                  {isOwner && <Crown className="h-3 w-3 text-amber-400 shrink-0" />}
                </div>
                {!isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => handleRemove(m.id)}
                    disabled={removingId === m.id}
                  >
                    {removingId === m.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Add member */}
        {availableUsers.length > 0 && (
          <>
            <Separator />
            <div className="flex gap-1.5">
              <Select value={addingUserId} onValueChange={setAddingUserId}>
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Add member..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.map((u: any) => (
                    <SelectItem key={u.id} value={u.id.toString()} className="text-sm">
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleAdd}
                disabled={!addingUserId || addMemberMutation.isPending}
              >
                {addMemberMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Comment components ───────────────────────────────────────────────────────

function CommentItem({ comment, currentUserId, taskId }: { comment: any; currentUserId?: number; taskId: number }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteComment();

  const handleDelete = () => {
    deleteMutation.mutate({ id: comment.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(taskId) });
      },
    });
  };

  return (
    <div className="flex gap-3 group">
      <Avatar className="h-8 w-8 mt-0.5">
        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
          {comment.author?.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author?.name}</span>
            <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "MMM d, h:mm a")}</span>
          </div>
          {comment.authorId === currentUserId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        <p className="text-sm text-foreground bg-muted/30 p-3 rounded-md rounded-tl-none">{comment.body}</p>
      </div>
    </div>
  );
}

function AddCommentForm({ taskId }: { taskId: number }) {
  const [body, setBody] = useState("");
  const queryClient = useQueryClient();
  const createMutation = useCreateComment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    createMutation.mutate({ data: { body, taskId } as any }, {
      onSuccess: () => {
        setBody("");
        queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(taskId) });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full gap-2 items-end">
      <div className="flex-1">
        <Textarea
          placeholder="Write a comment..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[80px] resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
      </div>
      <Button type="submit" size="icon" className="h-10 w-10 shrink-0" disabled={!body.trim() || createMutation.isPending}>
        {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
      </Button>
    </form>
  );
}
