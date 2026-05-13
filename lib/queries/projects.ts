import { db } from "@/db/client";
import { projects, type Project } from "@/db/schema";
import { asc, desc, eq, isNotNull, isNull } from "drizzle-orm";

export function listProjects({ includeArchived = false }: { includeArchived?: boolean } = {}): Project[] {
  const query = db.select().from(projects);
  const rows = includeArchived
    ? query.orderBy(asc(projects.name)).all()
    : query.where(isNull(projects.archivedAt)).orderBy(asc(projects.name)).all();
  return rows;
}

export function getProjectBySlug(slug: string): Project | undefined {
  return db.select().from(projects).where(eq(projects.slug, slug)).get();
}

export function getProjectById(id: number): Project | undefined {
  return db.select().from(projects).where(eq(projects.id, id)).get();
}

export function listProjectSlugs(): string[] {
  return db.select({ slug: projects.slug }).from(projects).all().map((r) => r.slug);
}

export function listArchivedProjects(): Project[] {
  return db
    .select()
    .from(projects)
    .where(isNotNull(projects.archivedAt))
    .orderBy(desc(projects.archivedAt))
    .all();
}

