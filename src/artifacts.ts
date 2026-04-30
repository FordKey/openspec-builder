export const artifactDefinitions = [
  { key: 'proposal', title: 'Proposal', content: '# Proposal\n' },
  { key: 'specs', title: 'Delta Specs', content: '# Delta Specs\n' },
  { key: 'design', title: 'Design', content: '# Design\n' },
  { key: 'tasks', title: 'Tasks', content: '# Tasks\n' },
  { key: 'verification', title: 'Verification', content: '# Verification\n' },
  { key: 'archive', title: 'Archive', content: '# Archive\n' }
] as const;

export type ArtifactKey = (typeof artifactDefinitions)[number]['key'];

export const artifactKeys = new Set<string>(artifactDefinitions.map((artifact) => artifact.key));

export function renderArtifactContent(
  key: ArtifactKey,
  projectName: string,
  description: string,
  details: Record<string, unknown>
): string {
  const list = (name: string) => asArray(details[name]).join(', ') || 'None selected';
  const rawValue = (name: string, fallback = 'TBD') => String(details[name] ?? fallback);
  const isFactoringProject = /\bfactoring\b|\binvoice factoring\b/i.test(
    `${projectName} ${rawValue('mission', '')} ${rawValue('mainWorkflow', '')} ${rawValue('dataNeeds', '')}`
  );
  const value = (name: string, fallback = 'TBD') => normalizeDomainText(rawValue(name, fallback), isFactoringProject);
  const capability = value('capabilityName', 'app-foundation');
  const changeId = value('changeId', `add-${capability}`);
  const artifactRoot = `/opt/${slugify(projectName)}`;
  const operation = value('deltaOperation', 'ADDED').toUpperCase();
  const paletteChoice = value('selectedPaletteOption', 'balanced');
  const paletteColors = asArray(details.palette);
  const palette = paletteColors.map((color, index) => `- Color ${index + 1}: ${color}`).join('\n');
  const paletteTokens = renderPaletteTokens(paletteColors, paletteChoice);
  const stack = stackBrief(details, value);
  const brand = brandBrief(details, list, value, palette || 'No palette selected yet.', paletteTokens);
  const deployment = deploymentBrief(value);
  const agent = agentBrief(details, list, value);

  if (key === 'proposal') {
    return `## Why

${value('proposalWhy', description || value('mission', 'The project needs durable OpenSpec artifacts before implementation.'))}

## What Changes

${bullets(details.proposalChanges, `Build ${projectName} as a ${value('runtimeOption', 'modern web application')}\nGenerate OpenSpec proposal, design, tasks, and spec delta artifacts\nPersist artifacts under ${artifactRoot}`)}

## Impact

${bullets(details.proposalImpact, `Affected specs: ${value('affectedSpecs', capability)}\nAffected code: ${value('affectedCode', 'TBD')}\nTarget audience: ${value('audience', 'Application designers')}`)}

## Project Context

- Capability: ${capability}
- Change ID: ${changeId}
- Technology stack: ${value('technologyStack')}
- Runtime: ${value('runtimeOption')}
- Backend: ${value('backendFramework')}
- Styling: ${list('styling')}
- Dark/light mode: ${value('mode')}
- Selected palette option: ${paletteChoice}
- Icons: ${value('fontLibrary')}
- Primary font: ${value('primaryFont')}
- Secondary font: ${value('secondaryFont')}
- Docker strategy: ${value('dockerStrategy')}
- Additional tech stack requirements: ${value('additionalTechStackRequirements', 'None specified')}
- Cloudflared: ${value('cloudflared')}
- Portainer: ${value('portainer')}
- Target chat extension: ${value('targetChatExtension')}
- Agent packs: ${list('agentModels')}
- Skills: ${list('skills')}

## Product Intent

${intentBrief(details, value)}

## Implementation Stack Contract

${stack}

## Brand and UI Contract

${brand}

## Deployment Contract

${deployment}
`;
  }

  if (key === 'specs') {
    return `## ${operation} Requirements

### Requirement: ${value('requirementName', 'Core App Workflow')}

${value('requirementStatement', 'The system SHALL support the approved application workflow.')}

#### Scenario: ${value('scenarioName', 'User completes the main workflow')}

- **GIVEN** ${value('scenarioGiven', 'a user has opened the app')}
- **WHEN** ${scenarioWhen(details, value)}
- **THEN** ${value('scenarioThen', 'the app saves the result and shows the updated state')}

${domainRequirements(projectName, details, value)}
`;
  }

  if (key === 'design') {
    return `## Context

${value('designContext', `${description || value('mission', 'TBD')}\n\nFrontend: ${value('runtimeOption')}; Backend: ${value('backendFramework')}; Styling: ${list('styling')}`)}

## Goals / Non-Goals

- Goals: ${value('designGoals', 'Reliable implementation from durable specs; clean handoff to AI coding agents')}
- Non-Goals: ${value('designNonGoals', 'Do not build features outside the approved OpenSpec change')}

## Decisions

${bullets(details.designDecisions, `Use ${value('runtimeOption')} for runtime\nUse ${value('backendFramework')} as backend default\nUse ${list('styling')} for styling\nPersist artifacts to ${artifactRoot}`)}

## Architecture Contract

${stack}

## Backend and Data Contract

- Backend framework/service: ${value('backendFramework')}
- Data needs: ${value('dataNeeds', 'TBD')}
- Integrations: ${value('integrations', 'None specified')}
- Constraints: ${value('constraints', 'None specified')}
- Docker/cloud: ${value('dockerStrategy')}; Cloudflared ${value('cloudflared')}; Portainer ${value('portainer')}
- Additional tech stack requirements: ${value('additionalTechStackRequirements', 'None specified')}

## Visual System Contract

${brand}

## Agent Handoff Contract

${agent}

## Risks / Trade-offs

${bullets(details.risksTradeoffs, 'Generated artifacts still require Builder review before implementation')}

## Migration Plan

${value('migrationPlan', 'No migration required for a new app. For existing apps, preserve current data and add changes incrementally.')}

## Open Questions

${bullets(details.openQuestions, 'None at this time')}

## Generated Palette Inputs

${palette || 'No palette selected yet.'}

Selected palette option: ${paletteChoice}

## Selected Palette Tokens

${paletteTokens}
`;
  }

  if (key === 'tasks') {
    return `## 1. Implementation

${tasks(details.taskPlan)}

## 2. Foundation Must Match Approved Selections

- [ ] Scaffold the app with ${value('technologyStack')} and runtime ${value('runtimeOption')}.
- [ ] Configure backend/data access for ${value('backendFramework')} and the data needs listed in the design.
- [ ] Apply ${list('styling')} with ${value('mode')} support, palette ${paletteChoice}, ${value('primaryFont')} / ${value('secondaryFont')}, and ${value('fontLibrary')}.
- [ ] Add Docker/deployment files according to: ${value('dockerStrategy')}; Cloudflared ${value('cloudflared')}; Portainer ${value('portainer')}.
- [ ] Apply any additional stack requirements listed by the project owner: ${value('additionalTechStackRequirements', 'None specified')}.
- [ ] Keep logo and brand assets under \`public/brand/\` and use them in the UI where appropriate.

## 3. OpenSpec Verification

- [ ] Review generated Proposal, Design, Specs, and Tasks with the project owner.
- [ ] Install OpenSpec in the target repo with \`npm install -g @fission-ai/openspec@latest\`.
- [ ] Run \`${value('validationCommand', `openspec validate ${changeId} --strict`)}\`.
- [ ] Install Superpowers in the selected coding agent.
- [ ] Copy OpenSpec artifacts under \`openspec/\`.
- [ ] Ask the coding agent to implement from OpenSpec after proposal approval.
- [ ] Verify build, tests, lint, and UI against the OpenSpec requirements.

## 4. AI Sanity Check Cadence

- [ ] Before writing code, produce an AI Sanity Check comparing project intent, stack, backend, deployment, UI, brand, data, integrations, and constraints against the artifacts.
- [ ] Before choosing between multiple good approaches, stop and ask the application developer for direction instead of assuming.
- [ ] Confirm first-principles reasoning and best practices for UI/UX orchestration, accessibility, data structures, database normalization, API connectivity, state handling, validation, and error handling.
- [ ] Confirm every button, link, form action, icon action, and navigation control has a requirement-backed purpose and working behavior.
- [ ] Confirm every control that saves required data persists it to the approved database/storage path, and every event control triggers the required event.
- [ ] Stop implementation and ask the application developer for instructions if any control lacks clear purpose, cannot persist required data, cannot trigger the required event, or conflicts with first principles or best practices.
- [ ] After scaffolding, confirm the generated project structure, package choices, backend choice, Docker/deployment files, and styling setup match the OpenSpec artifacts.
- [ ] After backend/database/auth/storage/API changes, confirm data model, security, integration, and deployment choices still match project intent.
- [ ] After each major workflow or screen group, compare the implementation to \`docs/wireframe/index.html\`, proposal, design, and specs.
- [ ] After every 8-12 meaningfully edited files or roughly every 60-90 minutes in a long session, repeat the sanity check.
- [ ] Before final handoff, run one final sanity check and include mismatches, risks, commands run, and next actions.
`;
  }

  if (key === 'verification') {
    return `# Verification

## Completeness Checklist

- Project name: ${projectName}
- Mission captured: ${Boolean(description || details.mission)}
- Audience captured: ${Boolean(details.audience)}
- Audience sophistication captured: ${Boolean(details.audienceSophistication)}
- Capability name: ${capability}
- Change ID: ${changeId}
- Delta operation: ${operation}
- Requirement has scenario: ${Boolean(details.scenarioName)}
- Stack selected: ${Boolean(details.technologyStack)}
- Runtime selected: ${Boolean(details.runtimeOption)}
- Backend selected: ${Boolean(details.backendFramework)}
- Styling selected: ${asArray(details.styling).length > 0}
- Palette selected: ${asArray(details.palette).length === 3}
- Fonts selected: ${Boolean(details.primaryFont) && Boolean(details.secondaryFont)}
- Icon library selected: ${Boolean(details.fontLibrary)}
- Docker strategy selected: ${Boolean(details.dockerStrategy)}
- Additional tech stack requirements captured: ${Boolean(details.additionalTechStackRequirements)}
- Cloudflared selected: ${Boolean(details.cloudflared)}
- Portainer selected: ${Boolean(details.portainer)}
- Agent target selected: ${Boolean(details.targetChatExtension)}
- Agent packs selected: ${asArray(details.agentModels).length > 0}
- Skills selected: ${asArray(details.skills).length > 0}
- User actions captured: ${Boolean(details.userActions)}
- Main workflow captured: ${Boolean(details.mainWorkflow)}
- Data needs captured: ${Boolean(details.dataNeeds)}
- Integrations captured: ${Boolean(details.integrations)}
- Constraints captured: ${Boolean(details.constraints)}
- Strict validation: ${value('validationCommand', `openspec validate ${changeId} --strict`)}

## Stack/Brand Summary

${stack}

${brand}

## Prompting Guidance

Use one prompt for small apps. For larger apps, split into foundation, data/API, core workflows, UI polish, and verification prompts.

## AI Sanity Check Guidance

Tell Claude/Codex to run the sanity check before coding, after scaffold, after backend/data/security work, after each major screen/workflow group, every 8-12 meaningfully edited files or 60-90 minutes in long sessions, and before final handoff.

## First Principles Stop Guidance

Tell Claude/Codex that it is required to stop building and ask the application developer when more than one good option exists, when any button/control lacks a clear requirement-backed purpose, when data cannot be persisted correctly, when an event cannot be wired to the required behavior, or when implementation conflicts with first principles, best practices, database normalization, API contracts, data integrity, accessibility, or UI/UX intent.
`;
  }

  return `# Archive

## Project

${projectName}

## OpenSpec Commands

\`\`\`bash
npm install -g @fission-ai/openspec@latest
openspec init
${value('validationCommand', `openspec validate ${changeId} --strict`)}
openspec archive ${changeId} --yes
\`\`\`

## Superpowers Install

Claude Code:

\`\`\`text
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
\`\`\`

Codex:

\`\`\`text
/plugins
\`\`\`

Then search for or install the Superpowers plugin/skill pack from https://github.com/obra/superpowers.
`;
}

function bullets(value: unknown, fallback: string): string {
  return lines(value, fallback).map((line) => `- ${line.replace(/^[-*]\s*/, '')}`).join('\n');
}

function tasks(value: unknown): string {
  return lines(value, '1.1 Implement the approved change\n1.2 Add verification coverage')
    .map((line) => `- [ ] ${line.replace(/^[-*]\s*(\[[ x]\]\s*)?/, '')}`)
    .join('\n');
}

function lines(value: unknown, fallback: string): string[] {
  const source = typeof value === 'string' && value.trim() ? value : fallback;
  return source.split('\n').map((line) => line.trim()).filter(Boolean);
}

function asArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
}

function normalizeDomainText(value: string, isFactoringProject: boolean): string {
  if (!isFactoringProject) return value;
  return value
    .replace(/Desktop layout is right sidebar/gi, 'Desktop layout uses a left sidebar')
    .replaceAll('App Builder', 'Apply')
    .replace(/\bDocs\b/g, 'Documents')
    .replace(/\bRecords\b/g, 'Documents')
    .replace(/Home,\s*Apply,\s*Documents,\s*Invoices,\s*Status/gi, 'Home, Apply, Documents, Invoices, Status')
    .replace(/Home,\s*Apply,\s*Records,\s*Invoices,\s*Status/gi, 'Home, Apply, Documents, Invoices, Status');
}

function scenarioWhen(
  details: Record<string, unknown>,
  value: (name: string, fallback?: string) => string
): string {
  const source = value('scenarioWhen', 'the user completes the main workflow');
  return isInvoiceFactoring(details, value) ? normalizeDomainText(source, true) : source;
}

function stackBrief(details: Record<string, unknown>, value: (name: string, fallback?: string) => string): string {
  return `- Technology stack: ${value('technologyStack')}
- Runtime: ${value('runtimeOption')}
- Backend: ${value('backendFramework')}
- Stack interpretation: ${stackInterpretation(value)}
- Additional tech stack requirements: ${value('additionalTechStackRequirements', 'None specified')}
- Data needs: ${value('dataNeeds', 'TBD')}
- Main workflow: ${value('mainWorkflow', 'TBD')}
- User actions: ${value('userActions', 'TBD')}
- Out of scope: ${value('outOfScope', 'None specified')}
- Constraints: ${value('constraints', 'None specified')}
- OpenSpec profile: ${value('openspecProfile', 'Default artifact-guided workflow')}`;
}

function brandBrief(
  details: Record<string, unknown>,
  list: (name: string) => string,
  value: (name: string, fallback?: string) => string,
  palette: string,
  paletteTokens: string
): string {
  return `- Styling libraries: ${list('styling')}
- Theme mode: ${value('mode')}
- Mood style: ${value('moodStyle')}
- Selected palette option: ${value('selectedPaletteOption')}
${palette}
Selected token set:
${paletteTokens}
- Primary font: ${value('primaryFont')}
- Secondary font: ${value('secondaryFont')}
- Icon library: ${value('fontLibrary')}
- Logo uploaded: ${Boolean(details.logoDataUrl)}
- Extracted logo colors: ${list('extractedLogoColors')}`;
}

function renderPaletteTokens(colors: string[], selected: string): string {
  const primary = normalizeHex(colors[0], '#22d3ee');
  const accent = normalizeHex(colors[1], '#8b5cf6');
  const tertiary = normalizeHex(colors[2], '#10b981');
  const palettes: Record<string, Record<string, string>> = {
    minimalist: {
      background: '#09090b',
      surface: '#18181b',
      primary,
      accent,
      success: tertiary,
      muted: '#71717a',
      warning: '#f59e0b',
      danger: '#ef4444'
    },
    dynamic: {
      background: '#0f1115',
      surface: '#1d2027',
      primary: accent,
      accent: primary,
      success: '#34d399',
      muted: '#8b949e',
      warning: '#fbbf24',
      danger: '#fb7185'
    },
    corporate: {
      background: '#0a0f14',
      surface: '#121922',
      primary: tertiary,
      accent: primary,
      success: '#22c55e',
      muted: '#64748b',
      warning: '#eab308',
      danger: '#f43f5e'
    },
    chill: {
      background: '#100f16',
      surface: '#1f1b2d',
      primary,
      accent: tertiary,
      success: '#2dd4bf',
      muted: '#8f8aa3',
      warning: '#f97316',
      danger: '#e11d48'
    }
  };
  const tokens = palettes[selected.toLowerCase()] ?? palettes.minimalist!;
  return Object.entries(tokens).map(([name, color]) => `- ${name}: ${color}`).join('\n');
}

function normalizeHex(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return fallback;
}

function deploymentBrief(value: (name: string, fallback?: string) => string): string {
  return `- Docker containers: ${value('dockerStrategy')}
- Additional tech stack requirements: ${value('additionalTechStackRequirements', 'None specified')}
- Cloudflared: ${value('cloudflared')}
- Portainer: ${value('portainer')}
- Container naming: use simple service names such as app, api, db, supabase, cloudflared, and portainer.`;
}

function domainRequirements(
  projectName: string,
  details: Record<string, unknown>,
  value: (name: string, fallback?: string) => string
): string {
  if (isInvoiceFactoring(details, value, projectName)) {
    return `### Requirement: Company Onboarding

The system SHALL let a business operator create their profile and company profile before preparing factoring applications.

#### Scenario: Operator completes company onboarding

- **GIVEN** a new operator has authenticated
- **WHEN** the operator enters required company identity and contact details
- **THEN** the app saves the company profile and shows the next required application step

### Requirement: Private Document Collection

The system SHALL guide the operator through required personal, company, bank, tax, and invoice document collection using private storage and user-visible completion state.

#### Scenario: Operator uploads and confirms a required document

- **GIVEN** the operator is viewing the factoring application checklist
- **WHEN** the operator uploads or captures a required document, reviews OCR-extracted fields, and saves it
- **THEN** the document is stored in private project storage, marked complete, and the checklist updates without losing in-progress work

### Requirement: OCR Review and Correction

The system SHALL process uploaded or captured documents through OCR and let the operator correct extracted fields before the document is treated as application-ready.

#### Scenario: Operator corrects OCR output

- **GIVEN** OCR has extracted fields from an uploaded document
- **WHEN** the operator edits incorrect extracted values and saves the review
- **THEN** the corrected values are retained with the document and used for readiness checks and packet generation

### Requirement: Offline-First Progress Preservation

The system SHALL preserve user progress locally when connectivity is unavailable and sync with the backend when connectivity returns.

#### Scenario: Operator continues work offline

- **GIVEN** the operator loses connectivity while completing documents or invoices
- **WHEN** the operator moves between screens or saves captured data
- **THEN** the app keeps the latest work available locally and queues backend sync for when connectivity returns

### Requirement: Factoring Readiness

The system SHALL calculate whether an invoice factoring application is missing documents, needs review, or is ready for submission.

#### Scenario: Operator sees factoring readiness

- **GIVEN** an operator has created an invoice and uploaded supporting documents
- **WHEN** the operator opens the invoice or application checklist
- **THEN** the app shows one of these states: needs_documents, needs_review, or ready

### Requirement: Factoring Packet Generation

The system SHALL generate provider-neutral factoring packets from completed company, document, and invoice data.

#### Scenario: Operator generates a packet

- **GIVEN** an application is ready
- **WHEN** the operator generates a factoring packet
- **THEN** the app creates private markdown and JSON packet artifacts containing the required application information

### Requirement: Application Status Tracking

The system SHALL show factoring application statuses and funding activity so operators can track submitted invoices.

#### Scenario: Operator reviews submitted applications

- **GIVEN** one or more factoring applications have been started or submitted
- **WHEN** the operator opens the status view
- **THEN** the app shows each application state and summary funding metrics

### Requirement: Audit and Security Controls

The system SHALL protect operator data with private access controls and record audit events for sensitive actions.

#### Scenario: Sensitive action is audited

- **GIVEN** an operator uploads, OCRs, corrects, generates, submits, exports, replaces, or deletes application data
- **WHEN** the action completes
- **THEN** the app records an audit event and keeps private data accessible only to authorized users

### Requirement: Provider-Neutral Integrations

The system SHALL integrate with factoring companies through configured APIs, MCP servers, SDKs, or export packets without owning provider-specific workflows directly.

#### Scenario: Operator prepares provider submission

- **GIVEN** a provider integration or export path is configured
- **WHEN** the operator prepares a factoring submission
- **THEN** the app uses the configured integration boundary and does not expose private data outside the approved submission path`;
  }

  const entities = asArray(details.dataNeeds).length ? asArray(details.dataNeeds) : lines(details.dataNeeds, 'Core records');
  const primaryEntity = entities[0]?.replace(/[:].*/, '').trim() || 'core records';
  return `### Requirement: ${toRequirementTitle(primaryEntity)} Management

The system SHALL let users create, view, update, and track ${primaryEntity.toLowerCase()} as part of the approved workflow.

#### Scenario: User manages ${primaryEntity.toLowerCase()}

- **GIVEN** a user is using the app
- **WHEN** the user creates or updates ${primaryEntity.toLowerCase()}
- **THEN** the app saves the change and shows the updated state`;
}

function toRequirementTitle(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ') || 'Core Records';
}

function isInvoiceFactoring(
  details: Record<string, unknown>,
  value: (name: string, fallback?: string) => string,
  projectName = ''
): boolean {
  const source = `${projectName} ${value('mission', '')} ${value('mainWorkflow', '')} ${value('dataNeeds', '')} ${String(
    details.description ?? ''
  )}`;
  return /\bfactoring\b|\binvoice factoring\b/i.test(source);
}

function stackInterpretation(value: (name: string, fallback?: string) => string): string {
  const stack = value('technologyStack', '');
  const backend = value('backendFramework', '');
  if (/sqlite/i.test(stack) && /supabase/i.test(backend)) {
    return 'Use Supabase as the production backend. Treat SQLite in the selected stack as local development, cache, test fixture, or lightweight prototype storage only when it does not conflict with Supabase.';
  }
  return 'Use the selected technology stack and backend together; if they conflict, prefer the explicit backend framework selection.';
}

function agentBrief(
  details: Record<string, unknown>,
  list: (name: string) => string,
  value: (name: string, fallback?: string) => string
): string {
  return `- Target chat extension: ${value('targetChatExtension')}
- Agent/model packs: ${list('agentModels')}
- Desired skills/MCPs: ${list('skills')}
- Superpowers selected: ${asArray(details.agentModels).includes('Superpowers')}`;
}

function intentBrief(details: Record<string, unknown>, value: (name: string, fallback?: string) => string): string {
  return `- Audience: ${value('audience', 'TBD')}
- Audience sophistication: ${value('audienceSophistication', 'TBD')}
- Mission: ${value('mission', 'TBD')}
- Main workflow: ${value('mainWorkflow', 'TBD')}
- Data needs: ${value('dataNeeds', 'TBD')}
- Integrations: ${value('integrations', 'None specified')}
- Out of scope: ${value('outOfScope', 'None specified')}`;
}
