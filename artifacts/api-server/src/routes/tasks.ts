import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, tasksTable, usersTable, projectsTable, projectMembersTable } from "@workspace/db";
import {
  ListProjectTasksParams,
  CreateTaskParams,
  CreateTaskBody,
  GetTaskParams,
  UpdateTaskParams,
  UpdateTaskBody,
  DeleteTaskParams,
} from "@workspace/api-zod";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

function formatUser(u: { id: number; name: string; email: string; role: "admin" | "member"; createdAt: Date } | undefined | null) {
  if (!u) return null;
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt.toISOString() };
}

async function getTaskWithDetails(taskId: number) {
  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, taskId)).limit(1);
  if (!task) return null;

  const [createdBy] = await db.select().from(usersTable).where(eq(usersTable.id, task.createdById)).limit(1);
  let assignedTo = null;
  if (task.assignedToId) {
    const [u] = await db.select().from(usersTable).where(eq(usersTable.id, task.assignedToId)).limit(1);
    assignedTo = u ? formatUser(u) : null;
  }

  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, task.projectId)).limit(1);

  const now = new Date();
  const isOverdue = task.dueDate ? (task.dueDate < now && task.status !== "completed") : false;

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    project: project ? { id: project.id, title: project.title, description: project.description, ownerId: project.ownerId, members: [], createdAt: project.createdAt.toISOString() } : undefined,
    assignedToId: task.assignedToId ?? null,
    assignedTo,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    isOverdue,
    createdById: task.createdById,
    createdBy: formatUser(createdBy),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

router.get("/projects/:id/tasks", authenticate, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = ListProjectTasksParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ message: "Invalid id" }); return; }

  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.projectId, parsed.data.id));
  const detailed = await Promise.all(tasks.map(t => getTaskWithDetails(t.id)));
  res.json(detailed.filter(Boolean));
});

router.post("/projects/:id/tasks", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = CreateTaskParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ message: "Invalid id" }); return; }

  const bodyParsed = CreateTaskBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ message: bodyParsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { title, description, assignedToId, status, priority, dueDate } = bodyParsed.data;

  const [task] = await db.insert(tasksTable).values({
    title,
    description: description ?? "",
    projectId: paramParsed.data.id,
    assignedToId: assignedToId ?? null,
    status: status as "todo" | "in_progress" | "completed",
    priority: priority as "low" | "medium" | "high",
    dueDate: dueDate ? new Date(dueDate) : null,
    createdById: req.user!.id,
  }).returning();

  const detail = await getTaskWithDetails(task.id);
  res.status(201).json(detail);
});

router.get("/tasks/my", authenticate, async (req, res): Promise<void> => {
  const tasks = await db.select().from(tasksTable).where(eq(tasksTable.assignedToId, req.user!.id));
  const detailed = await Promise.all(tasks.map(t => getTaskWithDetails(t.id)));
  res.json(detailed.filter(Boolean));
});

router.get("/tasks/:id", authenticate, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetTaskParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ message: "Invalid id" }); return; }

  const detail = await getTaskWithDetails(parsed.data.id);
  if (!detail) { res.status(404).json({ message: "Task not found" }); return; }
  res.json(detail);
});

router.put("/tasks/:id", authenticate, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = UpdateTaskParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ message: "Invalid id" }); return; }

  const [task] = await db.select().from(tasksTable).where(eq(tasksTable.id, paramParsed.data.id)).limit(1);
  if (!task) { res.status(404).json({ message: "Task not found" }); return; }

  const isAdmin = req.user!.role === "admin";
  const isAssignee = task.assignedToId === req.user!.id;
  if (!isAdmin && !isAssignee) {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  const bodyParsed = UpdateTaskBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ message: bodyParsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (bodyParsed.data.title !== undefined) updateData.title = bodyParsed.data.title;
  if (bodyParsed.data.description !== undefined) updateData.description = bodyParsed.data.description;
  if (bodyParsed.data.status !== undefined) updateData.status = bodyParsed.data.status;
  if (bodyParsed.data.priority !== undefined) updateData.priority = bodyParsed.data.priority;
  if (bodyParsed.data.assignedToId !== undefined) updateData.assignedToId = bodyParsed.data.assignedToId;
  if (bodyParsed.data.dueDate !== undefined) updateData.dueDate = bodyParsed.data.dueDate ? new Date(bodyParsed.data.dueDate) : null;

  await db.update(tasksTable).set(updateData).where(eq(tasksTable.id, paramParsed.data.id));

  const detail = await getTaskWithDetails(paramParsed.data.id);
  res.json(detail);
});

router.delete("/tasks/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteTaskParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ message: "Invalid id" }); return; }

  await db.delete(tasksTable).where(eq(tasksTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
