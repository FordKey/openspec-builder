import { Hono } from 'hono';
import type { Db } from './db.js';
import { getProject } from './projects.js';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export function createExportApi(db: Db): Hono {
  const app = new Hono();

  app.get('/projects/:id', (c) => {
    const project = getProject(db, c.req.param('id'));
    if (!project) return c.json({ error: 'Project not found' }, 404);

    const format = c.req.query('format') ?? 'json';
    if (format === 'zip') {
      return zipProject(project);
    }

    if (format === 'json') {
      return c.json({
        exportedAt: new Date().toISOString(),
        project
      });
    }

    if (format === 'markdown' || format === 'md') {
      const markdown = renderProjectMarkdown(project);
      c.header('Content-Type', 'text/markdown; charset=utf-8');
      c.header(
        'Content-Disposition',
        `attachment; filename="${project.slug || project.id}-openspec.md"`
      );
      return c.body(markdown);
    }

    return c.json({ error: 'Unsupported export format' }, 400);
  });

  return app;
}

type ExportProject = NonNullable<ReturnType<typeof getProject>>;

function zipProject(project: ExportProject) {
  const root = join('/opt', project.slug);
  const files = collectFiles(root);
  if (files.length === 0) {
    return new Response(JSON.stringify({ error: 'No OpenSpec artifacts found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const zip = createZip(files.map((path) => ({
    name: relative(root, path).replaceAll('\\', '/'),
    data: readFileSync(path)
  })));

  return new Response(new Uint8Array(zip), {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${project.slug}.zip"`
    }
  });
}

function renderProjectMarkdown(project: ExportProject): string {
  const sections = project.artifacts
    .map((artifact) => `\n\n---\n\n${artifact.content.trim()}`)
    .join('');

  return [
    `# ${project.name}`,
    '',
    `- ID: ${project.id}`,
    `- Slug: ${project.slug}`,
    `- Status: ${project.status}`,
    `- Created: ${project.createdAt}`,
    `- Updated: ${project.updatedAt}`,
    project.description ? `\n${project.description}` : '',
    sections
  ]
    .filter(Boolean)
    .join('\n');
}

function collectFiles(root: string): string[] {
  try {
    return readdirSync(root, { recursive: true })
      .map((entry) => join(root, String(entry)))
      .filter((path) => statSync(path).isFile());
  } catch {
    return [];
  }
}

function createZip(files: Array<{ name: string; data: Buffer }>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const name = Buffer.from(file.name);
    const crc = crc32(file.data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(0, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(file.data.length, 18);
    local.writeUInt32LE(file.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    localParts.push(local, name, file.data);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8);
    central.writeUInt16LE(0, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(file.data.length, 20);
    central.writeUInt32LE(file.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30);
    central.writeUInt16LE(0, 32);
    central.writeUInt16LE(0, 34);
    central.writeUInt16LE(0, 36);
    central.writeUInt32LE(0, 38);
    central.writeUInt32LE(offset, 42);
    centralParts.push(central, name);
    offset += local.length + name.length + file.data.length;
  }

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, end]);
}

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
