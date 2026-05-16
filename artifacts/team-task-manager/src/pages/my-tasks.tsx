import { useGetMyTasks } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";

export default function MyTasks() {
  const { data: tasks, isLoading } = useGetMyTasks();

  const priorityColors = {
    low: "bg-chart-2/20 text-chart-2 border-chart-2/20",
    medium: "bg-chart-3/20 text-chart-3 border-chart-3/20",
    high: "bg-destructive/20 text-destructive border-destructive/20",
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
        <p className="text-muted-foreground">All tasks assigned to you across all projects.</p>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : tasks?.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg bg-card/50 text-center p-8">
          <CheckSquare className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h2 className="text-xl font-semibold mb-2">You're all caught up</h2>
          <p className="text-muted-foreground max-w-md">
            You don't have any tasks assigned to you right now. Enjoy the downtime!
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {tasks?.map((task, i) => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <div
                className="animate-in-hero"
                style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}
              >
                <Card className="glow-card cursor-pointer group border-border/50">
                  <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 overflow-hidden">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">{task.title}</h3>
                        <Badge variant="outline" className="uppercase text-[10px] shrink-0">{task.status.replace("_", " ")}</Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-2">
                        <span className="font-medium">{task.project?.title}</span>
                        <span>•</span>
                        <span className="truncate">{task.description || "No description"}</span>
                      </div>
                    </div>

                    <div className="flex items-center sm:flex-col sm:items-end gap-3 sm:gap-2 shrink-0">
                      <Badge variant="outline" className={`capitalize text-xs ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                        {task.priority} Priority
                      </Badge>

                      {task.dueDate && (
                        <div className={`flex items-center gap-1.5 text-xs rounded-full px-2 py-0.5 ${task.isOverdue && task.status !== "completed" ? "bg-red-500/10 text-red-400" : "bg-muted/60 text-muted-foreground"}`}>
                          <Clock className="h-3.5 w-3.5" />
                          <span>{format(new Date(task.dueDate), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
