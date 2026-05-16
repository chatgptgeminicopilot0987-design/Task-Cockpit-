import { Router, type IRouter } from "express";
import { eq, and, count, sql } from "drizzle-orm";
import { db, projectsTable, projectMembersTable, usersTable, tasksTable } from "@workspace/db";
import { CreateProjectBody, UpdateProjectBody, GetProjectParams, UpdateProjectParams, DeleteProjectParams, AddProjectMemberBody, AddProjectMemberParams } from "@workspace/api-zod";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

async function getProjectWithDetails(projectId: number) {
  const [project] = await db.select().from(projectsTable).where(eq(projectsTable.id, projectId)).limit(1);
  if (!project) return null;

  const [owner] = await db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(usersTable).where(eq(usersTable.id, project.ownerId)).limit(1);

  const memberRows = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, createdAt: usersTable.createdAt })
    .from(projectMembersTable)
    .innerJoin(usersTable, eq(projectMembersTable.userId, usersTable.id))
    .where(eq(projectMembersTable.projectId, projectId));

  const taskCountRows = await db
    .select({ total: count(), completed: sql<number>`SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)` })
    .from(tasksTable)
    .where(eq(tasksTable.projectId, projectId));

  const tc = taskCountRows[0];
  const now = new Date();
  const dueDate = (project as any).dueDate ?? null;
  const isOverdue = dueDate ? new Date(dueDate) < now : false;

  return {
    id: project.id,
    title: project.title,
    description: project.description,
    ownerId: project.ownerId,
    owner: owner ? { ...owner, createdAt: owner.createdAt.toISOString() } : undefined,
    members: memberRows.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })),
    taskCount: Number(tc?.total ?? 0),
    completedTaskCount: Number(tc?.completed ?? 0),
    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    isOverdue,
    createdAt: project.createdAt.toISOString(),
  };
}

router.get("/projects", authenticate, async (req, res): Promise<void> => {
  let projectIds: number[];

  if (req.user!.role === "admin") {
    const rows = await db.select({ id: projectsTable.id }).from(projectsTable);
    projectIds = rows.map(r => r.id);
  } else {
    const rows = await db
      .select({ projectId: projectMembersTable.projectId })
      .from(projectMembersTable)
      .where(eq(projectMembersTable.userId, req.user!.id));
    const ownedRows = await db.select({ id: projectsTable.id }).from(projectsTable).where(eq(projectsTable.ownerId, req.user!.id));
    const ids = new Set([...rows.map(r => r.projectId), ...ownedRows.map(r => r.id)]);
    projectIds = [...ids];
  }

  const projects = await Promise.all(projectIds.map(id => getProjectWithDetails(id)));
  res.json(projects.filter(Boolean));
});

router.post("/projects", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }
  const [project] = await db
    .insert(projectsTable)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      ownerId: req.user!.id,
      dueDate: (parsed.data as any).dueDate ? new Date((parsed.data as any).dueDate) : null,
    } as any)
    .returning();

  // Add owner as member too
  await db.insert(projectMembersTable).values({ projectId: project.id, userId: req.user!.id }).onConflictDoNothing();

  const detail = await getProjectWithDetails(project.id);
  res.status(201).json(detail);
});

router.get("/projects/:id", authenticate, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = GetProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ message: "Invalid id" }); return; }

  const detail = await getProjectWithDetails(parsed.data.id);
  if (!detail) { res.status(404).json({ message: "Project not found" }); return; }
  res.json(detail);
});

router.put("/projects/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = UpdateProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ message: "Invalid id" }); return; }

  const bodyParsed = UpdateProjectBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ message: bodyParsed.error.issues[0]?.message ?? "Invalid input" }); return; }

  const updateData: Record<string, unknown> = {};
  if (bodyParsed.data.title !== undefined) updateData.title = bodyParsed.data.title;
  if (bodyParsed.data.description !== undefined) updateData.description = bodyParsed.data.description;
  if ((bodyParsed.data as any).dueDate !== undefined) {
    updateData.dueDate = (bodyParsed.data as any).dueDate ? new Date((bodyParsed.data as any).dueDate) : null;
  }

  const [updated] = await db.update(projectsTable).set(updateData).where(eq(projectsTable.id, paramParsed.data.id)).returning();
  if (!updated) { res.status(404).json({ message: "Project not found" }); return; }

  const detail = await getProjectWithDetails(updated.id);
  res.json(detail);
});

router.delete("/projects/:id", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteProjectParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ message: "Invalid id" }); return; }

  await db.delete(projectsTable).where(eq(projectsTable.id, parsed.data.id));
  res.status(204).send();
});

router.post("/projects/:id/members", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = AddProjectMemberParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ message: "Invalid id" }); return; }

  const bodyParsed = AddProjectMemberBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ message: bodyParsed.error.issues[0]?.message ?? "Invalid input" }); return; }

  const [userExists] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.id, bodyParsed.data.userId)).limit(1);
  if (!userExists) { res.status(404).json({ message: "User not found" }); return; }

  await db.insert(projectMembersTable)
    .values({ projectId: paramParsed.data.id, userId: bodyParsed.data.userId })
    .onConflictDoNothing();

  const detail = await getProjectWithDetails(paramParsed.data.id);
  if (!detail) { res.status(404).json({ message: "Project not found" }); return; }
  res.json(detail);
});

router.delete("/projects/:id/members/:userId", authenticate, requireAdmin, async (req, res): Promise<void> => {
  const projectId = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id, 10);
  const userId = parseInt(Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId, 10);

  if (isNaN(projectId) || isNaN(userId)) {
    res.status(400).json({ message: "Invalid id" });
    return;
  }

  // Prevent removing the project owner
  const [project] = await db.select({ ownerId: projectsTable.ownerId }).from(projectsTable).where(eq(projectsTable.id, projectId)).limit(1);
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }
  if (project.ownerId === userId) {
    res.status(400).json({ message: "Cannot remove the project owner" });
    return;
  }

  await db.delete(projectMembersTable).where(
    and(eq(projectMembersTable.projectId, projectId), eq(projectMembersTable.userId, userId))
  );

  const detail = await getProjectWithDetails(projectId);
  res.json(detail);
});

export default router;
