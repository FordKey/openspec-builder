import { Hono } from 'hono';
import type { Context } from 'hono';
import type { Db } from './db.js';
import { artifactDefinitions, artifactKeys, renderArtifactContent } from './artifacts.js';
import { deleteProjectArtifacts, writeProjectArtifacts } from './artifact-files.js';
import { z } from 'zod';

type ProjectStatus = 'draft' | 'active' | 'archived';

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  details_json: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

type ArtifactRow = {
  project_id: string;
  section_key: string;
  title: string;
  content: string;
  sort_order: number;
  updated_at: string;
};

const projectCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(5000).default(''),
  details: z.record(z.string(), z.unknown()).default({})
});

const projectUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(5000).optional(),
    details: z.record(z.string(), z.unknown()).optional(),
    status: z.enum(['draft', 'active', 'archived']).optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required'
  });

const artifactUpdateSchema = z.object({
  content: z.string().max(500_000),
  title: z.string().trim().min(1).max(120).optional()
});

export function createProjectsApi(db: Db): Hono {
  const app = new Hono();

  app.get('/', (c) => {
    const rows = db
      .prepare(
        `SELECT id, slug, name, description, details_json, status, created_at, updated_at
         FROM projects
         ORDER BY updated_at DESC`
      )
      .all() as ProjectRow[];

    return c.json({ projects: rows.map(toProject) });
  });

  app.post('/', async (c) => {
    const parsed = projectCreateSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return validationError(c, parsed.error);

    const id = crypto.randomUUID();
    const slug = makeUniqueSlug(db, parsed.data.slug ?? parsed.data.name);

    try {
      db.transaction(() => {
        db.prepare(
          `INSERT INTO projects (id, slug, name, description, details_json)
           VALUES (@id, @slug, @name, @description, @detailsJson)`
        ).run({
          id,
          slug,
          name: parsed.data.name,
          description: parsed.data.description,
          detailsJson: JSON.stringify(parsed.data.details)
        });

        const insertArtifact = db.prepare(
          `INSERT INTO artifact_sections (project_id, section_key, title, content, sort_order)
           VALUES (@projectId, @sectionKey, @title, @content, @sortOrder)`
        );

        artifactDefinitions.forEach((artifact, index) => {
          insertArtifact.run({
            projectId: id,
            sectionKey: artifact.key,
            title: artifact.title,
            content: renderArtifactContent(
              artifact.key,
              parsed.data.name,
              parsed.data.description,
              parsed.data.details
            ),
            sortOrder: index
          });
        });
      })();
    } catch (error) {
      return databaseError(c, error);
    }

    const project = getProjectOrThrow(db, id);
    try {
      writeProjectArtifacts(project);
    } catch (error) {
      db.prepare('DELETE FROM projects WHERE id = ?').run(id);
      deleteProjectArtifacts(project.slug);
      return artifactError(c, error);
    }
    return c.json({ project }, 201);
  });

  app.get('/:id', (c) => {
    const project = getProject(db, c.req.param('id'));
    if (!project) return c.json({ error: 'Project not found' }, 404);
    return c.json({ project });
  });

  app.patch('/:id', async (c) => {
    const id = c.req.param('id');
    if (!projectExists(db, id)) return c.json({ error: 'Project not found' }, 404);
    const before = getProjectOrThrow(db, id);

    const parsed = projectUpdateSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return validationError(c, parsed.error);

    const assignments: string[] = [];
    const params: Record<string, string> = { id };

    for (const [key, value] of Object.entries(parsed.data)) {
      if (value === undefined) continue;
      if (key === 'slug') {
        assignments.push('slug = @slug');
        params.slug = makeUniqueSlug(db, String(value), id);
      } else if (key === 'details') {
        assignments.push('details_json = @detailsJson');
        params.detailsJson = JSON.stringify(value);
      } else {
        assignments.push(`${key} = @${key}`);
        params[key] = String(value);
      }
    }

    try {
      db.prepare(
        `UPDATE projects
         SET ${assignments.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = @id`
      ).run(params);
    } catch (error) {
      return databaseError(c, error);
    }

    const project = getProjectOrThrow(db, id);
    refreshGeneratedArtifacts(db, project.id);
    const refreshed = getProjectOrThrow(db, id);
    try {
      writeProjectArtifacts(refreshed);
      if (before.slug !== refreshed.slug) deleteProjectArtifacts(before.slug);
    } catch (error) {
      if (before.slug !== refreshed.slug) deleteProjectArtifacts(refreshed.slug);
      restoreProject(db, before);
      writeProjectArtifacts(before);
      return artifactError(c, error);
    }
    return c.json({ project: refreshed });
  });

  app.post('/:id/clone', async (c) => {
    const source = getProject(db, c.req.param('id'));
    if (!source) return c.json({ error: 'Project not found' }, 404);

    const body = await c.req.json().catch(() => ({}));
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : `${source.name} copy`;
    const id = crypto.randomUUID();
    const slug = makeUniqueSlug(db, name);
    const capabilityName = `${slug}-app`;
    const changeId = `add-${capabilityName}`;
    const cloneDetails = {
      ...source.details,
      projectName: name,
      capabilityName,
      changeId,
      affectedSpecs: capabilityName,
      validationCommand: `openspec validate ${changeId} --strict`
    };

    db.transaction(() => {
      db.prepare(
        `INSERT INTO projects (id, slug, name, description, details_json, status)
         VALUES (@id, @slug, @name, @description, @detailsJson, 'draft')`
      ).run({
        id,
        slug,
        name,
        description: source.description,
        detailsJson: JSON.stringify(cloneDetails)
      });

      const insertArtifact = db.prepare(
        `INSERT INTO artifact_sections (project_id, section_key, title, content, sort_order)
         VALUES (@projectId, @sectionKey, @title, @content, @sortOrder)`
      );
      artifactDefinitions.forEach((artifact, index) => {
        insertArtifact.run({
          projectId: id,
          sectionKey: artifact.key,
          title: artifact.title,
          content: renderArtifactContent(artifact.key, name, source.description, cloneDetails),
          sortOrder: index
        });
      });
    })();

    const project = getProjectOrThrow(db, id);
    try {
      writeProjectArtifacts(project);
    } catch (error) {
      db.prepare('DELETE FROM projects WHERE id = ?').run(id);
      deleteProjectArtifacts(project.slug);
      return artifactError(c, error);
    }
    return c.json({ project }, 201);
  });

  app.delete('/:id', (c) => {
    const id = c.req.param('id');
    const project = getProject(db, id);
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    if (result.changes === 0) return c.json({ error: 'Project not found' }, 404);
    if (project) deleteProjectArtifacts(project.slug);
    return c.body(null, 204);
  });

  app.get('/:id/artifacts', (c) => {
    const id = c.req.param('id');
    if (!projectExists(db, id)) return c.json({ error: 'Project not found' }, 404);
    return c.json({ artifacts: getArtifacts(db, id) });
  });

  app.put('/:id/artifacts/:section', async (c) => {
    const id = c.req.param('id');
    const section = c.req.param('section');

    if (!projectExists(db, id)) return c.json({ error: 'Project not found' }, 404);
    if (!artifactKeys.has(section)) return c.json({ error: 'Unknown artifact section' }, 404);
    const before = getProjectOrThrow(db, id);

    const parsed = artifactUpdateSchema.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return validationError(c, parsed.error);

    const existing = db
      .prepare('SELECT title FROM artifact_sections WHERE project_id = ? AND section_key = ?')
      .get(id, section) as Pick<ArtifactRow, 'title'> | undefined;

    db.transaction(() => {
      db.prepare(
        `UPDATE artifact_sections
         SET title = @title,
             content = @content,
             updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE project_id = @projectId AND section_key = @sectionKey`
      ).run({
        projectId: id,
        sectionKey: section,
        title: parsed.data.title ?? existing?.title ?? section,
        content: parsed.data.content
      });

      db.prepare(
        `UPDATE projects
         SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
         WHERE id = ?`
      ).run(id);
    })();

    const project = getProjectOrThrow(db, id);
    try {
      writeProjectArtifacts(project);
    } catch (error) {
      restoreProject(db, before);
      writeProjectArtifacts(before);
      return artifactError(c, error);
    }
    return c.json({
      artifact: getArtifactOrThrow(db, id, section),
      project
    });
  });

  return app;
}

export function getProject(db: Db, id: string) {
  const row = db
    .prepare(
      `SELECT id, slug, name, description, details_json, status, created_at, updated_at
       FROM projects
       WHERE id = ?`
    )
    .get(id) as ProjectRow | undefined;

  if (!row) return null;
  return {
    ...toProject(row),
    artifacts: getArtifacts(db, row.id)
  };
}

export function getProjectOrThrow(db: Db, id: string) {
  const project = getProject(db, id);
  if (!project) throw new Error(`Project not found: ${id}`);
  return project;
}

export function projectExists(db: Db, id: string): boolean {
  return Boolean(db.prepare('SELECT 1 FROM projects WHERE id = ?').get(id));
}

export function getArtifacts(db: Db, projectId: string) {
  const rows = db
    .prepare(
      `SELECT project_id, section_key, title, content, sort_order, updated_at
       FROM artifact_sections
       WHERE project_id = ?
       ORDER BY sort_order ASC`
    )
    .all(projectId) as ArtifactRow[];

  return rows.map(toArtifact);
}

function getArtifactOrThrow(db: Db, projectId: string, section: string) {
  const row = db
    .prepare(
      `SELECT project_id, section_key, title, content, sort_order, updated_at
       FROM artifact_sections
       WHERE project_id = ? AND section_key = ?`
    )
    .get(projectId, section) as ArtifactRow | undefined;

  if (!row) throw new Error(`Artifact not found: ${projectId}/${section}`);
  return toArtifact(row);
}

function refreshGeneratedArtifacts(db: Db, projectId: string) {
  const project = getProjectOrThrow(db, projectId);
  const updateArtifact = db.prepare(
    `UPDATE artifact_sections
     SET content = @content,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
     WHERE project_id = @projectId AND section_key = @sectionKey`
  );

  db.transaction(() => {
    artifactDefinitions.forEach((artifact) => {
      updateArtifact.run({
        projectId,
        sectionKey: artifact.key,
        content: renderArtifactContent(artifact.key, project.name, project.description, project.details)
      });
    });
  })();
}

function makeUniqueSlug(db: Db, value: string, currentProjectId?: string): string {
  const base = slugify(value);
  let candidate = base;
  let suffix = 2;

  while (slugTaken(db, candidate, currentProjectId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function slugTaken(db: Db, slug: string, currentProjectId?: string): boolean {
  const row = db.prepare('SELECT id FROM projects WHERE slug = ?').get(slug) as
    | Pick<ProjectRow, 'id'>
    | undefined;
  return Boolean(row && row.id !== currentProjectId);
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || 'project';
}

function toProject(row: ProjectRow) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    details: parseDetails(row.details_json),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function toArtifact(row: ArtifactRow) {
  return {
    key: row.section_key,
    title: row.title,
    content: row.content,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at
  };
}

function parseDetails(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function validationError(c: Context, error: z.ZodError) {
  return c.json(
    {
      error: 'Validation failed',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }))
    },
    400
  );
}

function databaseError(c: Context, error: unknown) {
  const message = error instanceof Error ? error.message : 'Database error';
  return c.json({ error: message }, 500);
}

function artifactError(c: Context, error: unknown) {
  console.error(error);
  const message = error instanceof Error ? error.message : 'Artifact generation failed';
  return c.json({ error: message }, 500);
}

function restoreProject(db: Db, project: ReturnType<typeof getProjectOrThrow>) {
  db.transaction(() => {
    db.prepare(
      `UPDATE projects
       SET slug = @slug,
           name = @name,
           description = @description,
           details_json = @detailsJson,
           status = @status,
           updated_at = @updatedAt
       WHERE id = @id`
    ).run({
      id: project.id,
      slug: project.slug,
      name: project.name,
      description: project.description,
      detailsJson: JSON.stringify(project.details),
      status: project.status,
      updatedAt: project.updatedAt
    });

    db.prepare('DELETE FROM artifact_sections WHERE project_id = ?').run(project.id);
    const insertArtifact = db.prepare(
      `INSERT INTO artifact_sections (project_id, section_key, title, content, sort_order)
       VALUES (@projectId, @sectionKey, @title, @content, @sortOrder)`
    );
    project.artifacts.forEach((artifact) => {
      insertArtifact.run({
        projectId: project.id,
        sectionKey: artifact.key,
        title: artifact.title,
        content: artifact.content,
        sortOrder: artifact.sortOrder
      });
    });
  })();
}
