import { Router, type IRouter } from "express";
import { eq, count, sql, lt, and, ne } from "drizzle-orm";
import { db, usersTable, projectsTable, tasksTable, projectMembersTable } from "@workspace/db";
import { authenticate } from "../middlewares/auth";

const router: IRouter = Router();

async function getTaskWithProject(taskId: number) {
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);
  if (!task) return null;
  const [project] = task.projectId ? await db.select().from(projectsTable).where(eq(projectsTable.id, task.projectId)).limit(1) : [null];
  const now = new Date();
  const isOverdue = task.dueDate ? (task.dueDate < now && task.status !== "completed") : false;
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    project: project ? { id: project.id, title: project.title, description: project.description, ownerId: project.ownerId, members: [], createdAt: project.createdAt.toISOString() } : undefined,
    assignedToId: task.assignedToId ?? null,
    assignedTo: null,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    isOverdue,
    createdById: task.createdById,
    createdBy: null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

router.get("/dashboard", authenticate, async (req, res): Promise<void> => {
  const now = new Date();

  if (req.user!.role === "admin") {
    const [projectCount] = await db.select({ total: count() }).from(projectsTable);
    const [userCount] = await db.select({ total: count() }).from(usersTable);
    const [taskCount] = await db.select({ total: count() }).from(tasksTable);
    const [completedCount] = await db.select({ total: count() }).from(tasksTable).where(eq(tasksTable.status, "completed"));
    const [overdueCount] = await db.select({ total: count() }).from(tasksTable).where(
      and(lt(tasksTable.dueDate, now), ne(tasksTable.status, "completed"))
    );
    const [todoCount] = await db.select({ total: count() }).from(tasksTable).where(eq(tasksTable.status, "todo"));
    const [inProgressCount] = await db.select({ total: count() }).from(tasksTable).where(eq(tasksTable.status, "in_progress"));

    const total = Number(taskCount.total);
    const completed = Number(completedCount.total);
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const recentTaskRows = await db.select().from(tasksTable).orderBy(sql`${tasksTable.updatedAt} DESC`).limit(10);
    const recentActivity = await Promise.all(recentTaskRows.map(t => getTaskWithProject(t.id)));

    res.json({
      totalProjects: Number(projectCount.total),
      totalUsers: Number(userCount.total),
      totalTasks: total,
      completedTasks: completed,
      overdueTasks: Number(overdueCount.total),
      completionPercentage,
      tasksByStatus: {
        todo: Number(todoCount.total),
        in_progress: Number(inProgressCount.total),
        completed,
      },
      recentActivity: recentActivity.filter(Boolean),
      assignedProjects: [],
      assignedTasks: [],
    });
  } else {
    const memberProjectRows = await db
      .select({ projectId: projectMembersTable.projectId })
      .from(projectMembersTable)
      .where(eq(projectMembersTable.userId, req.user!.id));

    const ownedProjectRows = await db
      .select({ id: projectsTable.id })
      .from(projectsTable)
      .where(eq(projectsTable.ownerId, req.user!.id));

    const projectIds = [...new Set([...memberProjectRows.map(r => r.projectId), ...ownedProjectRows.map(r => r.id)])];

    const myTaskRows = await db.select().from(tasksTable).where(eq(tasksTable.assignedToId, req.user!.id));
    const completed = myTaskRows.filter(t => t.status === "completed").length;
    const total = myTaskRows.length;
    const overdue = myTaskRows.filter(t => t.dueDate && t.dueDate < now && t.status !== "completed").length;

    const assignedTasks = await Promise.all(myTaskRows.slice(0, 10).map(t => getTaskWithProject(t.id)));

    const assignedProjectDetails = await Promise.all(projectIds.slice(0, 10).map(async (id) => {
      const [p] = await db.select().from(projectsTable).where(eq(projectsTable.id, id)).limit(1);
      if (!p) return null;
      return { id: p.id, title: p.title, description: p.description, ownerId: p.ownerId, members: [], createdAt: p.createdAt.toISOString() };
    }));

    res.json({
      totalProjects: projectIds.length,
      totalUsers: 0,
      totalTasks: total,
      completedTasks: completed,
      overdueTasks: overdue,
      completionPercentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      tasksByStatus: {
        todo: myTaskRows.filter(t => t.status === "todo").length,
        in_progress: myTaskRows.filter(t => t.status === "in_progress").length,
        completed,
      },
      recentActivity: [],
      assignedProjects: assignedProjectDetails.filter(Boolean),
      assignedTasks: assignedTasks.filter(Boolean),
    });
  }
});

export default router;
