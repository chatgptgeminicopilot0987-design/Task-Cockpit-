import { useAuth } from "@/context/AuthContext";
import { useGetDashboard } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Briefcase, Users, CheckSquare, Clock, AlertTriangle, Activity, TrendingUp, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Link } from "wouter";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const StatCard = ({
  title, value, sub, icon: Icon, color, delay = 0
}: {
  title: string; value: React.ReactNode; sub?: React.ReactNode; icon: any; color: string; delay?: number;
}) => (
  <div
    className="animate-in-hero rounded-2xl border border-border/40 p-5 relative overflow-hidden group hover:border-opacity-60 transition-all duration-300 hover:-translate-y-1"
    style={{
      background: "rgba(255,255,255,0.025)",
      animationDelay: `${delay}ms`,
      opacity: 0,
    }}
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
      style={{ background: `radial-gradient(circle at 80% 20%, ${color}10 0%, transparent 60%)` }} />
    <div className="flex items-start justify-between mb-3">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}25` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
    </div>
    <div className="text-2xl font-bold tracking-tight mb-0.5">{value}</div>
    <div className="text-xs text-muted-foreground">{title}</div>
    {sub && <div className="mt-2">{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-border/60 px-3 py-2 text-sm" style={{ background: "hsl(var(--card))", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
        <p className="font-medium mb-1">{label}</p>
        <p className="text-primary font-bold">{payload[0].value} tasks</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading, isError } = useGetDashboard();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="text-xl font-bold mb-2">Failed to load dashboard</h2>
        <p className="text-muted-foreground">Please try refreshing the page.</p>
      </div>
    );
  }

  const barColors: Record<string, string> = {
    "To Do": "hsl(var(--muted-foreground))",
    "In Progress": "hsl(var(--primary))",
    "Completed": "#34d399",
  };

  const chartData = [
    { name: "To Do", count: stats.tasksByStatus?.todo ?? 0 },
    { name: "In Progress", count: stats.tasksByStatus?.in_progress ?? 0 },
    { name: "Completed", count: stats.tasksByStatus?.completed ?? 0 },
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="animate-in-hero">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Welcome back, <span className="text-foreground font-medium">{user?.name}</span>. Here is what's happening.
        </p>
      </div>

      {user?.role === "admin" ? (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Projects"
              value={stats.totalProjects}
              icon={Briefcase}
              color="#a78bfa"
              delay={0}
            />
            <StatCard
              title="Team Members"
              value={stats.totalUsers}
              icon={Users}
              color="#67e8f9"
              delay={80}
            />
            <StatCard
              title="Tasks Completed"
              value={`${stats.completedTasks} / ${stats.totalTasks}`}
              sub={<Progress value={stats.completionPercentage} className="h-1.5 mt-1" />}
              icon={CheckSquare}
              color="#34d399"
              delay={160}
            />
            <StatCard
              title="Overdue Tasks"
              value={<span className={stats.overdueTasks > 0 ? "text-red-400" : ""}>{stats.overdueTasks}</span>}
              icon={Clock}
              color={stats.overdueTasks > 0 ? "#f87171" : "#a78bfa"}
              delay={240}
            />
          </div>

          {/* Chart + Activity */}
          <div className="grid gap-5 md:grid-cols-7">
            <div
              className="md:col-span-4 rounded-2xl border border-border/40 p-6 animate-in-hero"
              style={{ background: "rgba(255,255,255,0.025)", animationDelay: "320ms", opacity: 0 }}
            >
              <div className="mb-5">
                <h2 className="font-bold text-base mb-0.5">Tasks by Status</h2>
                <p className="text-xs text-muted-foreground">Distribution across all projects</p>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barSize={48}>
                    <XAxis
                      dataKey="name"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(139,92,246,0.06)", radius: 8 } as any} />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={barColors[entry.name]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="md:col-span-3 rounded-2xl border border-border/40 p-6 animate-in-hero"
              style={{ background: "rgba(255,255,255,0.025)", animationDelay: "400ms", opacity: 0 }}
            >
              <div className="mb-5">
                <h2 className="font-bold text-base mb-0.5">Recent Activity</h2>
                <p className="text-xs text-muted-foreground">Recently updated tasks</p>
              </div>
              {stats.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-2">
                  {stats.recentActivity.slice(0, 5).map((task, i) => (
                    <Link key={task.id} href={`/tasks/${task.id}`}>
                      <div
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-all duration-200 group animate-in-hero"
                        style={{ animationDelay: `${480 + i * 60}ms`, opacity: 0 }}
                      >
                        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center flex-shrink-0">
                          <Activity className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors duration-200">{task.title}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {task.project?.title} · {format(new Date(task.updatedAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <Activity className="h-8 w-8 mb-2 opacity-15" />
                  <p className="text-sm">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Member view */
        <div className="grid gap-5 md:grid-cols-2">
          <div
            className="rounded-2xl border border-border/40 p-6 animate-in-hero"
            style={{ background: "rgba(255,255,255,0.025)", animationDelay: "80ms", opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-violet-400" />
              </div>
              <div>
                <h2 className="font-bold text-sm">My Projects</h2>
                <p className="text-xs text-muted-foreground">Projects you're a member of</p>
              </div>
            </div>
            {stats.assignedProjects && stats.assignedProjects.length > 0 ? (
              <div className="space-y-3">
                {stats.assignedProjects.map((project, i) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <div
                      className="p-3.5 border border-border/40 rounded-xl hover:border-primary/30 cursor-pointer transition-all duration-200 hover:bg-white/3 group animate-in-hero"
                      style={{ animationDelay: `${160 + i * 60}ms`, opacity: 0 }}
                    >
                      <div className="font-medium text-sm group-hover:text-primary transition-colors duration-200 mb-0.5">{project.title}</div>
                      <div className="text-xs text-muted-foreground mb-3 line-clamp-1">{project.description}</div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">
                          {project.taskCount ? Math.round(((project.completedTaskCount || 0) / project.taskCount) * 100) : 0}%
                        </span>
                      </div>
                      <Progress value={project.taskCount ? ((project.completedTaskCount || 0) / project.taskCount) * 100 : 0} className="h-1.5" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-15" />
                <p className="text-sm">No projects assigned yet.</p>
              </div>
            )}
          </div>

          <div
            className="rounded-2xl border border-border/40 p-6 animate-in-hero"
            style={{ background: "rgba(255,255,255,0.025)", animationDelay: "160ms", opacity: 0 }}
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <CheckSquare className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="font-bold text-sm">My Tasks</h2>
                <p className="text-xs text-muted-foreground">Tasks assigned to you</p>
              </div>
            </div>
            {stats.assignedTasks && stats.assignedTasks.length > 0 ? (
              <div className="space-y-2">
                {stats.assignedTasks.slice(0, 5).map((task, i) => (
                  <Link key={task.id} href={`/tasks/${task.id}`}>
                    <div
                      className="flex gap-3 p-3 rounded-xl border border-border/40 hover:border-primary/30 cursor-pointer transition-all duration-200 hover:bg-white/3 group animate-in-hero"
                      style={{ animationDelay: `${240 + i * 60}ms`, opacity: 0 }}
                    >
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate group-hover:text-primary transition-colors duration-200">{task.title}</span>
                          <Badge variant="outline" className="uppercase text-[9px] shrink-0 px-1.5">{task.status.replace("_", " ")}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{task.project?.title}</span>
                      </div>
                      {task.dueDate && (
                        <div className={`flex items-center gap-1 text-xs shrink-0 rounded-full px-2 py-0.5 self-center ${task.isOverdue ? "bg-red-500/10 text-red-400" : "bg-muted/60 text-muted-foreground"}`}>
                          <Clock className="h-3 w-3" />
                          {format(new Date(task.dueDate), "MMM d")}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
                {stats.assignedTasks.length > 5 && (
                  <Link href="/my-tasks">
                    <div className="text-center py-2 text-xs text-primary hover:underline cursor-pointer">
                      View all {stats.assignedTasks.length} tasks
                    </div>
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Zap className="h-8 w-8 mx-auto mb-2 opacity-15" />
                <p className="text-sm">All caught up! No tasks assigned.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
