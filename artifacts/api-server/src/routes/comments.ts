import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, commentsTable, usersTable } from "@workspace/db";
import { ListCommentsParams, CreateCommentParams, CreateCommentBody, DeleteCommentParams } from "@workspace/api-zod";
import { authenticate } from "../middlewares/auth";

const router: IRouter = Router();

router.get("/tasks/:id/comments", authenticate, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = ListCommentsParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ message: "Invalid id" }); return; }

  const comments = await db
    .select({
      id: commentsTable.id,
      body: commentsTable.body,
      taskId: commentsTable.taskId,
      authorId: commentsTable.authorId,
      createdAt: commentsTable.createdAt,
      authorName: usersTable.name,
      authorEmail: usersTable.email,
      authorRole: usersTable.role,
      authorCreatedAt: usersTable.createdAt,
    })
    .from(commentsTable)
    .innerJoin(usersTable, eq(commentsTable.authorId, usersTable.id))
    .where(eq(commentsTable.taskId, parsed.data.id))
    .orderBy(commentsTable.createdAt);

  res.json(comments.map(c => ({
    id: c.id,
    body: c.body,
    taskId: c.taskId,
    authorId: c.authorId,
    author: { id: c.authorId, name: c.authorName, email: c.authorEmail, role: c.authorRole, createdAt: c.authorCreatedAt.toISOString() },
    createdAt: c.createdAt.toISOString(),
  })));
});

router.post("/tasks/:id/comments", authenticate, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const paramParsed = CreateCommentParams.safeParse({ id: parseInt(raw, 10) });
  if (!paramParsed.success) { res.status(400).json({ message: "Invalid id" }); return; }

  const bodyParsed = CreateCommentBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ message: bodyParsed.error.issues[0]?.message ?? "Comment cannot be empty" });
    return;
  }

  const [comment] = await db
    .insert(commentsTable)
    .values({ body: bodyParsed.data.body, taskId: paramParsed.data.id, authorId: req.user!.id })
    .returning();

  const [author] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);

  res.status(201).json({
    id: comment.id,
    body: comment.body,
    taskId: comment.taskId,
    authorId: comment.authorId,
    author: author ? { id: author.id, name: author.name, email: author.email, role: author.role, createdAt: author.createdAt.toISOString() } : null,
    createdAt: comment.createdAt.toISOString(),
  });
});

router.delete("/comments/:id", authenticate, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = DeleteCommentParams.safeParse({ id: parseInt(raw, 10) });
  if (!parsed.success) { res.status(400).json({ message: "Invalid id" }); return; }

  const [comment] = await db.select().from(commentsTable).where(eq(commentsTable.id, parsed.data.id)).limit(1);
  if (!comment) { res.status(404).json({ message: "Comment not found" }); return; }

  if (comment.authorId !== req.user!.id && req.user!.role !== "admin") {
    res.status(403).json({ message: "Forbidden" });
    return;
  }

  await db.delete(commentsTable).where(eq(commentsTable.id, parsed.data.id));
  res.status(204).send();
});

export default router;
