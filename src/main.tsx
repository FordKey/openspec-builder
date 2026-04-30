import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  FolderKanban,
  Home,
  Palette,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Sparkles,
  Trash2
} from 'lucide-react';
import './styles.css';

type Mode = 'home' | 'new' | 'projects' | 'edit' | 'summary';

type Project = {
  id: string;
  slug: string;
  name: string;
  description: string;
  details: Record<string, unknown>;
  status: 'draft' | 'active' | 'archived';
  updatedAt: string;
  artifacts?: Artifact[];
};

type Artifact = { key: string; title: string; content: string; sortOrder: number };

type FormState = {
  projectName: string;
  mission: string;
  audience: string;
  audienceSophistication: string;
  technologyStack: string;
  cloudflared: string;
  portainer: string;
  targetChatExtension: string;
  agentModels: string[];
  skills: string[];
  styling: string[];
  mode: string;
  palette: string[];
  selectedPaletteOption: string;
  moodStyle: string;
  fontLibrary: string;
  primaryFont: string;
  secondaryFont: string;
  runtimeOption: string;
  backendFramework: string;
  dockerStrategy: string;
  additionalTechStackRequirements: string;
  capabilityName: string;
  changeId: string;
  proposalWhy: string;
  proposalChanges: string;
  proposalImpact: string;
  affectedSpecs: string;
  affectedCode: string;
  deltaOperation: string;
  requirementName: string;
  requirementStatement: string;
  scenarioName: string;
  scenarioGiven: string;
  scenarioWhen: string;
  scenarioThen: string;
  taskPlan: string;
  designContext: string;
  designGoals: string;
  designNonGoals: string;
  designDecisions: string;
  risksTradeoffs: string;
  migrationPlan: string;
  openQuestions: string;
  validationCommand: string;
  openspecProfile: string;
  logoDataUrl: string;
  logoFileName: string;
  logoMimeType: string;
  extractedLogoColors: string[];
  paletteSeedVersion: number;
  userActions: string;
  mainWorkflow: string;
  dataNeeds: string;
  integrations: string;
  outOfScope: string;
  constraints: string;
};

const emptyForm: FormState = {
  projectName: '',
  mission: '',
  audience: '',
  audienceSophistication: 'Mixed technical and product sophistication',
  technologyStack: 'Hono + TanStack Router + Tailwind CSS + SQLite',
  cloudflared: 'No',
  portainer: 'No',
  targetChatExtension: 'Codex',
  agentModels: ['Superpowers'],
  skills: ['agent browser mcp'],
  styling: ['Tailwind CSS'],
  mode: 'Dark mode',
  palette: ['#22d3ee', '#8b5cf6', '#10b981'],
  selectedPaletteOption: 'minimalist',
  moodStyle: 'minimalist',
  fontLibrary: 'Lucide',
  primaryFont: 'Inter',
  secondaryFont: 'IBM Plex Sans',
  runtimeOption: 'Hono TanStack',
  backendFramework: 'Supabase',
  dockerStrategy: 'All backend except App',
  additionalTechStackRequirements: '',
  capabilityName: 'app-foundation',
  changeId: 'add-app-foundation',
  proposalWhy: '',
  proposalChanges: '',
  proposalImpact: '',
  affectedSpecs: 'app-foundation',
  affectedCode: 'src/, package.json, data schema, deployment config',
  deltaOperation: 'ADDED',
  requirementName: 'Core App Workflow',
  requirementStatement: 'The system SHALL support the approved application workflow.',
  scenarioName: 'User completes the main workflow',
  scenarioGiven: 'a user has opened the app',
  scenarioWhen: 'the user completes the main workflow',
  scenarioThen: 'the app saves the result and shows the updated state',
  taskPlan: '1.1 Scaffold project foundation\n1.2 Implement data model and API\n1.3 Build core user workflows\n1.4 Apply visual system\n1.5 Add tests and verification',
  designContext: '',
  designGoals: 'Reliable implementation from durable specs; clean handoff to AI coding agents',
  designNonGoals: 'Do not build features outside the approved OpenSpec change',
  designDecisions: '',
  risksTradeoffs: '',
  migrationPlan: 'No migration required for a new app. For existing apps, preserve current data and add changes incrementally.',
  openQuestions: '',
  validationCommand: 'openspec validate add-app-foundation --strict',
  openspecProfile: 'Default artifact-guided workflow',
  logoDataUrl: '',
  logoFileName: '',
  logoMimeType: '',
  extractedLogoColors: [],
  paletteSeedVersion: 0,
  userActions: '',
  mainWorkflow: '',
  dataNeeds: '',
  integrations: '',
  outOfScope: '',
  constraints: ''
};

const stacks = [
  'Hono + TanStack Router + Tailwind CSS + SQLite',
  'TanStack Start + Tailwind CSS + Drizzle + SQLite',
  'React + Vite + Hono + SQLite',
  'SvelteKit + Tailwind CSS + SQLite',
  'Astro + React Islands + Hono API'
];
const agentModels = ['Superpowers', 'Everything Claude', 'theme-factory', 'brand-guidelines', 'mail + calendar'];
const skills = ['agent browser mcp', 'chrome devtools mcp'];
const fonts = ['Inter', 'Geist', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Source Sans 3', 'IBM Plex Sans', 'Nunito Sans'];
const iconLibraries = ['Lucide', 'Heroicons', 'Phosphor', 'Hugeicons', 'Font Awesome'];
const runtimes = ['Hono TanStack', 'TanStack Start', 'React', 'Svelte'];
const backends = ['Supabase', 'PocketBase', 'Convex', 'Appwrite'];
const dockerOptions = ['Yes', 'No', 'All backend except App'];
const chatTargets = ['Claude', 'Codex', 'Roo', 'Continue'];
const moodStyles = ['Minimalist', 'Dynamic', 'Corporate', 'Chill'];
const fontRecommendations = {
  minimalist: ['Inter', 'Geist'],
  dynamic: ['Poppins', 'Inter'],
  corporate: ['IBM Plex Sans', 'Source Sans 3'],
  chill: ['Nunito Sans', 'Lato']
} as const;

function App() {
  const [mode, setMode] = useState<Mode>('home');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [step, setStep] = useState(0);
  const [toast, setToast] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  useEffect(() => {
    void refreshProjects();
  }, []);

  async function refreshProjects() {
    try {
      const data = await apiJson<{ projects: Project[] }>('/api/projects');
      setProjects(data.projects);
    } catch (error) {
      setToast(errorMessage(error, 'Could not load projects'));
    }
  }

  async function saveProject() {
    try {
      return await persistProject('edit');
    } catch (error) {
      setToast(errorMessage(error, 'Could not save project'));
      return null;
    }
  }

  async function createArtifacts() {
    try {
      const project = await persistProject('summary');
      setStep(0);
      setToast('Artifacts and wireframe created');
      return project;
    } catch (error) {
      setToast(errorMessage(error, 'Could not create artifacts'));
      return null;
    }
  }

  async function persistProject(nextMode: Mode) {
    const details = deriveProjectDetails(form);
    const body = {
      name: details.projectName,
      description: details.mission,
      details
    };
    const url = activeProject ? `/api/projects/${activeProject.id}` : '/api/projects';
    const method = activeProject ? 'PATCH' : 'POST';
    const data = await apiJson<{ project: Project }>(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    setActiveProject(data.project);
    setMode(nextMode);
    setToast('Project saved');
    await refreshProjects();
    return data.project;
  }

  async function editProject(project: Project) {
    try {
      const data = await apiJson<{ project: Project }>(`/api/projects/${project.id}`);
      setActiveProject(data.project);
      setForm({ ...emptyForm, ...(data.project.details as Partial<FormState>), projectName: data.project.name, mission: data.project.description });
      setStep(0);
      setMode('edit');
    } catch (error) {
      setToast(errorMessage(error, 'Could not open project'));
    }
  }

  async function cloneProject(project: Project) {
    try {
      const data = await apiJson<{ project: Project }>(`/api/projects/${project.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${project.name} copy` })
      });
      setToast('Clone created');
      await refreshProjects();
      await editProject(data.project);
    } catch (error) {
      setToast(errorMessage(error, 'Could not clone project'));
    }
  }

  async function deleteProject(project: Project) {
    try {
      await apiJson(`/api/projects/${project.id}`, { method: 'DELETE' });
      setToast('Project deleted');
      if (activeProject?.id === project.id) newProject();
      setDeleteTarget(null);
      await refreshProjects();
    } catch (error) {
      setToast(errorMessage(error, 'Could not delete project'));
    }
  }

  function newProject() {
    setActiveProject(null);
    setForm(emptyForm);
    setStep(0);
    setMode('new');
  }

  return (
    <div className={sidebarCollapsed ? 'app-shell sidebar-collapsed' : 'app-shell'}>
      <aside className="sidebar">
        <div className="brand">
          <BrandMark />
          <span>OpenSpec-Builder</span>
        </div>
        <button
          className="collapse-button"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          <span>{sidebarCollapsed ? 'Expand' : 'Collapse'}</span>
        </button>
        <button title="Home" className={mode === 'home' ? 'nav active' : 'nav'} onClick={() => setMode('home')}><Home size={18} /><span>Home</span></button>
        <button title="New" className={mode === 'new' ? 'nav active' : 'nav'} onClick={newProject}><Plus size={18} /><span>New</span></button>
        <button title="Projects" className={mode === 'projects' ? 'nav active' : 'nav'} onClick={() => setMode('projects')}><FolderKanban size={18} /><span>Projects</span></button>
        <div className="sidebar-foot">OpenSpec artifacts for VS Code Chat agents</div>
      </aside>
      <main className="main">
        {toast && <button className="toast" onClick={() => setToast('')}>{toast}</button>}
        {mode === 'home' ? (
          <HomeView onNew={newProject} onProjects={() => setMode('projects')} />
        ) : mode === 'projects' ? (
          <ProjectsView projects={projects} onNew={newProject} onEdit={editProject} onClone={cloneProject} onDelete={setDeleteTarget} />
        ) : mode === 'summary' && activeProject ? (
          <SummaryView project={activeProject} onEdit={() => editProject(activeProject)} onClone={cloneProject} onDelete={setDeleteTarget} />
        ) : (
          <Wizard
            form={form}
            setForm={setForm}
            step={step}
            setStep={setStep}
            activeProject={activeProject}
            onSave={saveProject}
            onCreateArtifacts={createArtifacts}
          />
        )}
        {deleteTarget && (
          <DeleteProjectModal
            project={deleteTarget}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={() => void deleteProject(deleteTarget)}
          />
        )}
      </main>
    </div>
  );
}

function BrandMark() {
  return (
    <img className="brand-mark" src="/logo.png" alt="" aria-hidden="true" />
  );
}

function ProjectIcon({ project }: { project: Project }) {
  const logoDataUrl = typeof project.details?.logoDataUrl === 'string' ? project.details.logoDataUrl : '';
  if (logoDataUrl.startsWith('data:image/')) {
    return <img className="project-logo" src={logoDataUrl} alt="" aria-hidden="true" />;
  }
  return <FileText className="file-icon" />;
}

function DeleteProjectModal({ project, onCancel, onConfirm }: { project: Project; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <div className="delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-project-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="alert-icon"><Trash2 size={22} /></div>
        <div>
          <p className="danger-eyebrow">Permanent delete</p>
          <h2 id="delete-project-title">Delete {project.name}?</h2>
          <p>
            This removes the project record and deletes all related folders and files on the server under
            <code>/opt/{project.slug}</code>. This action cannot be undone.
          </p>
        </div>
        <div className="modal-actions">
          <button className="secondary" onClick={onCancel}>Cancel</button>
          <button className="danger-button" onClick={onConfirm}><Trash2 size={16} />Delete project</button>
        </div>
      </div>
    </div>
  );
}

function HomeView({ onNew, onProjects }: { onNew: () => void; onProjects: () => void }) {
  return (
    <section className="home-page">
      <div className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">OpenSpec artifact studio</p>
          <h1>Design the spec before the code.</h1>
          <p>
            OpenSpec-Builder turns product intent, stack choices, brand direction, and
            practical home-lab constraints into a workspace your coding agent can run with.
          </p>
          <div className="home-actions">
            <button className="primary" onClick={onNew}><Plus size={18} />New project</button>
            <button className="secondary" onClick={onProjects}><FolderKanban size={18} />View projects</button>
          </div>
        </div>
        <div className="hero-mark" aria-hidden="true">
          <span className="hero-trail trail-one" />
          <span className="hero-trail trail-two" />
          <span className="hero-trail trail-three" />
          <img className="hero-logo" src="/logo.png" alt="" />
        </div>
      </div>
      <div className="info-grid">
        <article className="glass-card">
          <FileText size={20} />
          <h3>OpenSpec-native output</h3>
          <p>Generates project conventions, proposals, design docs, task plans, delta specs, verification notes, and archive guidance.</p>
        </article>
        <article className="glass-card">
          <Sparkles size={20} />
          <h3>Builder-friendly wizard</h3>
          <p>Collects app mission, audience, tech stack, deployment choices, agent targets, requirements, scenarios, and design trade-offs.</p>
        </article>
        <article className="glass-card">
          <Palette size={20} />
          <h3>Brand-aware decisions</h3>
          <p>Logo upload can seed color palettes, mood styles, and font recommendations so the generated wireframe reflects the project identity.</p>
        </article>
        <article className="glass-card">
          <Eye size={20} />
          <h3>Previewable wireframes</h3>
          <p>Each created project gets a static wireframe in its artifact folder, with one-click preview from the Projects and Summary pages.</p>
        </article>
      </div>
      <div className="developer-strip">
        <strong>Developer handoff:</strong>
        <span>/opt/&lt;project&gt;/openspec</span>
        <span>/wireframe</span>
        <span>/logo</span>
        <span>project.json</span>
      </div>
    </section>
  );
}

function ProjectsView(props: {
  projects: Project[];
  onNew: () => void;
  onEdit: (project: Project) => void;
  onClone: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Saved work</p>
          <h1>Projects</h1>
        </div>
        <button className="primary" onClick={props.onNew}><Plus size={18} />New project</button>
      </div>
      <div className="project-list">
        {props.projects.length === 0 && <div className="empty"><FileText />No saved projects yet.</div>}
        {props.projects.map((project) => (
          <article className="project-row" key={project.id}>
            <ProjectIcon project={project} />
            <div>
              <h3>{project.name}</h3>
              <p>{project.description || 'No mission entered yet.'}</p>
            </div>
            <span className="badge">{project.status}</span>
            <span className="date">{new Date(project.updatedAt).toLocaleString()}</span>
            <div className="actions">
              <a className="icon-link" title="View wireframe" href={wireframeUrl(project)} target="_blank" rel="noreferrer"><Eye size={16} /></a>
              <a className="icon-link" title="Download OpenSpec prompts zip" href={`/api/export/projects/${project.id}?format=zip`}><Download size={16} /></a>
              <button title="Edit" onClick={() => props.onEdit(project)}><Pencil size={16} /></button>
              <button title="Clone" onClick={() => props.onClone(project)}><Copy size={16} /></button>
              <button title="Delete" onClick={() => props.onDelete(project)}><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Wizard(props: {
  form: FormState;
  setForm: (form: FormState) => void;
  step: number;
  setStep: (step: number) => void;
  activeProject: Project | null;
  onSave: () => void;
  onCreateArtifacts: () => void;
}) {
  const { form, setForm, step, setStep } = props;
  const paletteOptions = useMemo(() => buildPaletteOptions(form.palette), [form.palette, form.paletteSeedVersion]);
  const palette = paletteOptions.find((option) => option.id === form.selectedPaletteOption)?.tokens ?? paletteOptions[0]!.tokens;
  const steps = ['Start', 'Build Setup', 'Look & Feel', 'App Behavior', 'Review'];

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm({ ...form, [key]: value });
  }

  function toggle(key: 'agentModels' | 'skills' | 'styling', value: string) {
    const current = form[key];
    update(key, current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  function selectPaletteOption(optionId: string) {
    const fontPair = fontRecommendations[optionId as keyof typeof fontRecommendations];
    setForm({
      ...form,
      selectedPaletteOption: optionId,
      moodStyle: optionId,
      primaryFont: fontPair?.[0] ?? form.primaryFont,
      secondaryFont: fontPair?.[1] ?? form.secondaryFont
    });
  }

  function selectMoodStyle(value: string) {
    const mood = value.toLowerCase();
    const seedColors = form.extractedLogoColors.length >= 3 ? form.extractedLogoColors : form.palette;
    const palettes = buildMoodPalettes(seedColors);
    const fontPair = fontRecommendations[mood as keyof typeof fontRecommendations];
    setForm({
      ...form,
      moodStyle: mood,
      selectedPaletteOption: mood,
      palette: palettes[mood as keyof typeof palettes] ?? form.palette,
      primaryFont: fontPair?.[0] ?? form.primaryFont,
      secondaryFont: fontPair?.[1] ?? form.secondaryFont
    });
  }

  function refreshPaletteSuggestions() {
    const seedColors = form.extractedLogoColors.length >= 3 ? form.extractedLogoColors : form.palette;
    const refreshed = jitterPalette(seedColors, form.paletteSeedVersion + 1);
    setForm({
      ...form,
      palette: refreshed,
      paletteSeedVersion: form.paletteSeedVersion + 1
    });
  }

  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">{props.activeProject ? 'Editing project' : 'New project'}</p>
          <h1>{props.activeProject?.name || 'New OpenSpec Artifact'}</h1>
        </div>
        {props.activeProject && (
          <a className="secondary" href={`/api/export/projects/${props.activeProject.id}?format=markdown`}><Download size={18} />Export markdown</a>
        )}
      </div>
      <div className="wizard">
        <nav className="step-rail">
          {steps.map((label, index) => (
            <button key={label} className={step === index ? 'step active' : 'step'} onClick={() => setStep(index)}>
              <span>{index + 1}</span>{label}
            </button>
          ))}
        </nav>
        <div className="panel">
          {step === 0 && (
            <div className="grid two">
              <Field label="Project name"><input value={form.projectName} onChange={(event) => update('projectName', event.target.value)} placeholder="Acme Field Ops" /></Field>
              <Field label="Audience sophistication"><input value={form.audienceSophistication} onChange={(event) => update('audienceSophistication', event.target.value)} /></Field>
              <LogoUpload form={form} onUpdate={setForm} />
              <Field label="Mission/problem solved"><textarea value={form.mission} onChange={(event) => update('mission', event.target.value)} placeholder="What will this app make easier, faster, or more reliable?" /></Field>
              <Field label="Intended audience"><textarea value={form.audience} onChange={(event) => update('audience', event.target.value)} placeholder="Who uses it, and what do they already understand?" /></Field>
            </div>
          )}
          {step === 1 && (
            <div className="grid three">
              <Select label="Technology stack" value={form.technologyStack} options={stacks} onChange={(value) => update('technologyStack', value)} />
              <Select label="Target chat extension" value={form.targetChatExtension} options={chatTargets} onChange={(value) => update('targetChatExtension', value)} />
              <Select label="Runtime" value={form.runtimeOption} options={runtimes} onChange={(value) => update('runtimeOption', value)} />
              <Select label="Backend" value={form.backendFramework} options={backends} onChange={(value) => update('backendFramework', value)} />
              <Select label="Cloudflared" value={form.cloudflared} options={['No', 'Yes']} onChange={(value) => update('cloudflared', value)} />
              <Select label="Portainer" value={form.portainer} options={['No', 'Yes']} onChange={(value) => update('portainer', value)} />
              <Select label="Docker containers" value={form.dockerStrategy} options={dockerOptions} onChange={(value) => update('dockerStrategy', value)} />
              <Field label="Additional Tech Stack Requirements" className="wide">
                <textarea
                  rows={5}
                  value={form.additionalTechStackRequirements}
                  onChange={(event) => update('additionalTechStackRequirements', event.target.value)}
                  placeholder="PaddleOCR, electricsql, Google Auth"
                />
              </Field>
              <CheckboxGroup label="Agent models" values={agentModels} selected={form.agentModels} onToggle={(value) => toggle('agentModels', value)} />
              <CheckboxGroup label="Desired skills" values={skills} selected={form.skills} onToggle={(value) => toggle('skills', value)} />
            </div>
          )}
          {step === 2 && (
            <div className="grid two">
              <Select label="Mood style" value={toTitleCase(form.moodStyle)} options={moodStyles} onChange={selectMoodStyle} />
              <div className="color-pickers">
                {form.palette.map((color, index) => (
                  <Field label={`Primary color ${index + 1}`} key={index}>
                    <div className="color-stack">
                      <input className="color-swatch" type="color" value={normalizeHex(color)} onChange={(event) => {
                        const next = [...form.palette];
                        next[index] = event.target.value;
                        update('palette', next);
                      }} />
                      <input
                        className="hex-input"
                        value={normalizeHex(color).toUpperCase()}
                        maxLength={7}
                        placeholder="#FFFFFF"
                        onChange={(event) => {
                          const next = [...form.palette];
                          next[index] = event.target.value;
                          update('palette', next);
                        }}
                        onBlur={(event) => {
                          const next = [...form.palette];
                          next[index] = normalizeHex(event.target.value);
                          update('palette', next);
                        }}
                      />
                      <div className="rgb-row">
                        {(['r', 'g', 'b'] as const).map((channel) => {
                          const rgb = hexToRgb(normalizeHex(color));
                          return (
                            <label key={channel}>
                              <span>{channel.toUpperCase()}</span>
                              <input
                                type="number"
                                min="0"
                                max="255"
                                value={rgb[channel]}
                                onChange={(event) => {
                                  const nextRgb = { ...rgb, [channel]: clampRgb(event.target.value) };
                                  const next = [...form.palette];
                                  next[index] = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
                                  update('palette', next);
                                }}
                              />
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </Field>
                ))}
              </div>
              <div className="palette-head">
                <div>
                  <h3>Suggested color palettes</h3>
                  <p>Refresh suggestions from the uploaded logo, or from the current seed colors.</p>
                </div>
                <button className="secondary" type="button" onClick={refreshPaletteSuggestions}>
                  <RefreshCw size={16} />Refresh suggestions
                </button>
              </div>
              <div className="palette-options">
                {paletteOptions.map((option) => (
                  <label className={form.selectedPaletteOption === option.id ? 'palette-option selected' : 'palette-option'} key={option.id}>
                    <input
                      type="checkbox"
                      checked={form.selectedPaletteOption === option.id}
                      onChange={() => selectPaletteOption(option.id)}
                    />
                    <PaletteCard title={option.name} description={option.description} palette={option.tokens} />
                  </label>
                ))}
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="grid two">
              <Field label="What should users be able to do?"><textarea value={form.userActions} onChange={(event) => update('userActions', event.target.value)} placeholder="Example: create jobs, assign drivers, track status, export reports." /></Field>
              <Field label="Main workflow"><textarea value={form.mainWorkflow} onChange={(event) => update('mainWorkflow', event.target.value)} placeholder="Example: user logs in, creates a work order, adds photos, then marks it complete." /></Field>
              <Field label="Data the app needs to store"><textarea value={form.dataNeeds} onChange={(event) => update('dataNeeds', event.target.value)} placeholder="Users, projects, tasks, files, status history..." /></Field>
              <Field label="Integrations, devices, or APIs"><textarea value={form.integrations} onChange={(event) => update('integrations', event.target.value)} placeholder="Stripe, Google Calendar, email, local network devices, none..." /></Field>
              <Field label="Out of scope"><textarea value={form.outOfScope} onChange={(event) => update('outOfScope', event.target.value)} placeholder="Things the coding agent should not build yet." /></Field>
              <Field label="Constraints or risks"><textarea value={form.constraints} onChange={(event) => update('constraints', event.target.value)} placeholder="Home lab limits, privacy needs, offline use, simple deployment, must run in Docker..." /></Field>
            </div>
          )}
          {step === 4 && (
            <div className="review-stack">
              <OpenSpecPreview form={deriveProjectDetails(form)} palette={palette} />
              <details className="advanced-panel">
                <summary>Advanced OpenSpec details</summary>
                <div className="grid two">
                  <Field label="Capability name"><input value={deriveProjectDetails(form).capabilityName} readOnly /></Field>
                  <Field label="Change ID"><input value={deriveProjectDetails(form).changeId} readOnly /></Field>
                  <Field label="Delta operation"><input value={deriveProjectDetails(form).deltaOperation} readOnly /></Field>
                  <Field label="Validation command"><input value={deriveProjectDetails(form).validationCommand} readOnly /></Field>
                </div>
              </details>
            </div>
          )}
          <footer className="wizard-foot">
            <button className="secondary" disabled={step === 0} onClick={() => setStep(Math.max(0, step - 1))}><ArrowLeft size={18} />Back</button>
            <button className="secondary" onClick={props.onSave}><Save size={18} />Save draft</button>
            {step < steps.length - 1 ? (
              <button className="primary" disabled={!form.projectName.trim()} onClick={() => setStep(step + 1)}>Continue<ArrowRight size={18} /></button>
            ) : (
              <button className="primary" disabled={!form.projectName.trim()} onClick={props.onCreateArtifacts}><Check size={18} />Create artifacts</button>
            )}
          </footer>
        </div>
      </div>
    </section>
  );
}

function LogoUpload({ form, onUpdate }: { form: FormState; onUpdate: (form: FormState) => void }) {
  async function handleFile(file: File | undefined) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    const extracted = await extractLogoColors(dataUrl);
    const recommended = buildMoodPalettes(extracted);
    const selected = recommended.minimalist;
    const [primaryFont, secondaryFont] = fontRecommendations.minimalist;

    onUpdate({
      ...form,
      logoDataUrl: dataUrl,
      logoFileName: file.name,
      logoMimeType: file.type,
      extractedLogoColors: extracted,
      paletteSeedVersion: form.paletteSeedVersion + 1,
      palette: selected,
      selectedPaletteOption: 'minimalist',
      moodStyle: 'minimalist',
      primaryFont,
      secondaryFont
    });
  }

  return (
    <div className="logo-upload">
      <div>
        <span>Project logo</span>
        <p>Upload a logo to extract brand colors and seed palette recommendations.</p>
      </div>
      <label className="logo-drop">
        {form.logoDataUrl ? <img src={form.logoDataUrl} alt="" /> : <Sparkles size={22} />}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => void handleFile(event.target.files?.[0])} />
        <strong>{form.logoFileName || 'Upload logo'}</strong>
      </label>
    </div>
  );
}

function SummaryView(props: {
  project: Project;
  onEdit: () => void;
  onClone: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  const capability = String(props.project.details.capabilityName ?? props.project.slug);
  const changeId = String(props.project.details.changeId ?? `add-${props.project.slug}`);
  return (
    <section>
      <div className="page-head">
        <div>
          <p className="eyebrow">Artifacts created</p>
          <h1>{props.project.name}</h1>
        </div>
        <a className="secondary" href={`/api/export/projects/${props.project.id}?format=markdown`}><Download size={18} />Export markdown</a>
      </div>
      <div className="summary-grid">
        <div className="summary-card">
          <h2>Project Summary</h2>
          <p>{props.project.description || 'No mission entered.'}</p>
          <div className="summary-facts">
            <span>Capability <strong>{capability}</strong></span>
            <span>Change <strong>{changeId}</strong></span>
            <span>Artifacts <strong>/opt/{props.project.slug}</strong></span>
            <span>Wireframe <strong>/opt/{props.project.slug}/docs/wireframe</strong></span>
          </div>
        </div>
        <div className="summary-actions">
          <a className="big-action" href={wireframeUrl(props.project)} target="_blank" rel="noreferrer"><Eye size={20} />View Wireframe</a>
          <button className="big-action" onClick={props.onEdit}><Pencil size={20} />Edit Project</button>
          <button className="big-action" onClick={() => props.onClone(props.project)}><Copy size={20} />Clone Project</button>
          <button className="big-action danger" onClick={() => props.onDelete(props.project)}><Trash2 size={20} />Delete Project</button>
        </div>
      </div>
    </section>
  );
}

function Field(props: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={['field', props.className].filter(Boolean).join(' ')}><span>{props.label}</span>{props.children}</label>;
}

function Select(props: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return <Field label={props.label}><select value={props.value} onChange={(event) => props.onChange(event.target.value)}>{props.options.map((option) => <option key={option}>{option}</option>)}</select></Field>;
}

function CheckboxGroup(props: { label: string; values: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="field checkbox-group">
      <span>{props.label}</span>
      {props.values.map((value) => (
        <label key={value} className="check-row"><input type="checkbox" checked={props.selected.includes(value)} onChange={() => props.onToggle(value)} />{value}</label>
      ))}
    </div>
  );
}

function FontRecommendationCard({ selectedMood, primary, secondary }: { selectedMood: string; primary: string; secondary: string }) {
  return (
    <div className="font-card">
      <h3>Recommended pairing</h3>
      <p>Based on the selected {selectedMood || 'minimalist'} color mood.</p>
      <div className="font-preview">
        <strong style={{ fontFamily: primary }}>{primary}</strong>
        <span style={{ fontFamily: secondary }}>{secondary} for body copy, forms, and dense specification text.</span>
      </div>
    </div>
  );
}

function PaletteCard({ palette, title = 'Generated palette', description }: { palette: Record<string, string>; title?: string; description?: string }) {
  return (
    <div className="palette-card">
      <div className="palette-title"><Palette size={18} />{title}</div>
      {description && <p className="palette-description">{description}</p>}
      <div className="swatches">{Object.entries(palette).map(([name, color]) => <span key={name} title={`${name}: ${color}`} style={{ background: color }} />)}</div>
      <div className="tokens">{Object.entries(palette).map(([name, color]) => <code key={name}>{name}: {color}</code>)}</div>
    </div>
  );
}

function OpenSpecPreview({ form, palette }: { form: FormState; palette: Record<string, string> }) {
  return (
    <div className="preview">
      <h2>{form.projectName || 'Unnamed project'} OpenSpec package</h2>
      <p>{form.mission || 'Mission pending.'}</p>
      <pre>{`openspec/
  specs/${slugify(form.projectName || 'project')}/spec.md
  changes/create-${slugify(form.projectName || 'project')}/
    proposal.md
    design.md
    tasks.md
    specs/${slugify(form.projectName || 'project')}/spec.md`}</pre>
      <h3>Superpowers first-session install</h3>
      <pre>{`Claude Code:
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace

Codex:
/plugins
Search for Superpowers, or follow https://github.com/obra/superpowers .`}</pre>
      <h3>Prompt strategy</h3>
      <p>Use one prompt for a small CRUD app. For larger apps, split into foundation, data/API, core workflows, UI polish, and verification prompts.</p>
      <PaletteCard palette={palette} />
    </div>
  );
}

function deriveProjectDetails(form: FormState): FormState {
  const projectSlug = slugify(form.projectName || 'project');
  const capabilityName = form.capabilityName && form.capabilityName !== 'app-foundation' ? form.capabilityName : `${projectSlug}-app`;
  const changeId = form.changeId && form.changeId !== 'add-app-foundation' ? form.changeId : `add-${capabilityName}`;
  const requirementName = form.requirementName && form.requirementName !== 'Guided Application Delivery' ? form.requirementName : 'Core App Workflow';
  const userActions = form.userActions || 'Create, review, update, and complete the core records for this app.';
  const mainWorkflow = form.mainWorkflow || 'A user opens the app, completes the primary task, reviews the result, and saves the outcome.';

  return {
    ...form,
    projectName: form.projectName || 'Untitled Project',
    capabilityName,
    changeId,
    affectedSpecs: capabilityName,
    affectedCode: 'App source, data model, UI routes, API endpoints, deployment config',
    deltaOperation: 'ADDED',
    proposalWhy: form.proposalWhy || form.mission || 'The Builder needs this app to solve a practical home-lab workflow.',
    proposalChanges: form.proposalChanges || [userActions, `Store: ${form.dataNeeds || 'core app data'}`, `Integrations: ${form.integrations || 'none specified'}`].join('\n'),
    proposalImpact: form.proposalImpact || [`Audience: ${form.audience || 'home-lab builders'}`, `Constraints: ${form.constraints || 'keep deployment simple'}`, `Out of scope: ${form.outOfScope || 'advanced edge cases'}`].join('\n'),
    requirementName,
    requirementStatement: form.requirementStatement && form.requirementStatement !== emptyForm.requirementStatement
      ? form.requirementStatement
      : `The system SHALL allow users to ${userActions.toLowerCase()}`,
    scenarioName: form.scenarioName && form.scenarioName !== emptyForm.scenarioName ? form.scenarioName : 'User completes the main workflow',
    scenarioGiven: form.scenarioGiven && form.scenarioGiven !== emptyForm.scenarioGiven ? form.scenarioGiven : 'a user has opened the app',
    scenarioWhen: form.scenarioWhen && form.scenarioWhen !== emptyForm.scenarioWhen ? form.scenarioWhen : mainWorkflow,
    scenarioThen: form.scenarioThen && form.scenarioThen !== emptyForm.scenarioThen ? form.scenarioThen : 'the app saves the result and shows the updated state',
    taskPlan: form.taskPlan && form.taskPlan !== emptyForm.taskPlan
      ? form.taskPlan
      : '1.1 Scaffold the app foundation\n1.2 Implement the data model and API\n1.3 Build the main workflow UI\n1.4 Add brand styling and responsive polish\n1.5 Verify with build and smoke tests',
    designContext: form.designContext || `${form.mission}\n\nAudience: ${form.audience}\n\nData: ${form.dataNeeds || 'TBD'}\nIntegrations: ${form.integrations || 'None specified'}\nAdditional tech stack requirements: ${form.additionalTechStackRequirements || 'None specified'}`,
    designGoals: form.designGoals || 'Simple to run in a home lab; clear enough for VS Code Chat agents to implement.',
    designNonGoals: form.designNonGoals || form.outOfScope || 'Avoid advanced edge cases until the first version works.',
    designDecisions: form.designDecisions || `Use ${form.runtimeOption} with ${form.backendFramework}. Prefer straightforward CRUD, readable code, and Docker-friendly deployment.${form.additionalTechStackRequirements ? ` Include these additional stack requirements where they fit the implementation: ${form.additionalTechStackRequirements}.` : ''}`,
    risksTradeoffs: form.risksTradeoffs || form.constraints || 'Keep setup simple and avoid unnecessary infrastructure.',
    migrationPlan: form.migrationPlan || 'No migration required for a new app.',
    openQuestions: form.openQuestions || 'None for the first implementation pass.',
    validationCommand: `openspec validate ${changeId} --strict`
  };
}

function buildPaletteOptions(colors: string[]) {
  const primary = normalizeHex(colors[0]);
  const accent = normalizeHex(colors[1] ?? '#8b5cf6');
  const tertiary = normalizeHex(colors[2] ?? '#10b981');
  return [
    {
      id: 'minimalist',
      name: 'Minimalist',
      description: 'Quiet, spacious, and restrained.',
      tokens: {
        background: '#09090b',
        surface: '#18181b',
        primary,
        accent,
        success: tertiary,
        muted: '#71717a',
        warning: '#f59e0b',
        danger: '#ef4444'
      }
    },
    {
      id: 'dynamic',
      name: 'Dynamic',
      description: 'High-energy palette for expressive products.',
      tokens: {
        background: '#0f1115',
        surface: '#1d2027',
        primary: accent,
        accent: primary,
        success: '#34d399',
        muted: '#8b949e',
        warning: '#fbbf24',
        danger: '#fb7185'
      }
    },
    {
      id: 'corporate',
      name: 'Corporate',
      description: 'Structured, trustworthy, and dashboard-ready.',
      tokens: {
        background: '#0a0f14',
        surface: '#121922',
        primary: tertiary,
        accent: primary,
        success: '#22c55e',
        muted: '#64748b',
        warning: '#eab308',
        danger: '#f43f5e'
      }
    },
    {
      id: 'chill',
      name: 'Chill',
      description: 'Soft contrast for calm builder experiences.',
      tokens: {
        background: '#100f16',
        surface: '#1f1b2d',
        primary,
        accent: tertiary,
        success: '#2dd4bf',
        muted: '#8f8aa3',
        warning: '#f97316',
        danger: '#e11d48'
      }
    }
  ];
}

function buildMoodPalettes(colors: string[]) {
  const primary = normalizeHex(colors[0]);
  const accent = normalizeHex(colors[1] ?? '#8b5cf6');
  const tertiary = normalizeHex(colors[2] ?? '#10b981');
  return {
    minimalist: [primary, mixHex(primary, '#ffffff', 0.28), mixHex(accent, '#09090b', 0.18)],
    dynamic: [accent, primary, boostHex(tertiary, 24)],
    corporate: [mixHex(primary, '#0f172a', 0.35), mixHex(accent, '#1e293b', 0.22), tertiary],
    chill: [mixHex(tertiary, '#ffffff', 0.18), mixHex(primary, '#64748b', 0.2), mixHex(accent, '#ffffff', 0.12)]
  };
}

function normalizeHex(value: string | undefined) {
  const fallback = '#22d3ee';
  if (!value) return fallback;
  const trimmed = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) return trimmed.toLowerCase();
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) return `#${trimmed.toLowerCase()}`;
  return fallback;
}

function mixHex(a: string, b: string, weight: number) {
  const first = hexToRgb(a);
  const second = hexToRgb(b);
  return rgbToHex(
    Math.round(first.r * (1 - weight) + second.r * weight),
    Math.round(first.g * (1 - weight) + second.g * weight),
    Math.round(first.b * (1 - weight) + second.b * weight)
  );
}

function boostHex(value: string, amount: number) {
  const rgb = hexToRgb(value);
  return rgbToHex(rgb.r + amount, rgb.g + amount, rgb.b + amount);
}

function jitterPalette(colors: string[], version: number) {
  const amount = ((version % 5) + 1) * 7;
  return [
    mixHex(normalizeHex(colors[0]), version % 2 === 0 ? '#ffffff' : '#020617', 0.08),
    boostHex(normalizeHex(colors[1] ?? '#8b5cf6'), version % 2 === 0 ? amount : -amount),
    mixHex(normalizeHex(colors[2] ?? '#10b981'), version % 3 === 0 ? '#ffffff' : '#111827', 0.12)
  ];
}

function hexToRgb(value: string) {
  const hex = normalizeHex(value).slice(1);
  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16)
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b].map((part) => clampRgb(part).toString(16).padStart(2, '0')).join('')}`;
}

function clampRgb(value: string | number) {
  const numeric = typeof value === 'number' ? value : Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) return 0;
  return Math.min(255, Math.max(0, numeric));
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'project';
}

function wireframeUrl(project: Project) {
  return `/artifacts/${project.slug}/docs/wireframe/index.html`;
}

async function apiJson<T = unknown>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string; message?: string };
      message = body.error || body.message || message;
    } catch {
      const text = await response.text().catch(() => '');
      if (text) message = text;
    }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function toTitleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : 'Minimalist';
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function extractLogoColors(dataUrl: string) {
  return new Promise<string[]>((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 96;
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        resolve(emptyForm.palette);
        return;
      }
      context.drawImage(image, 0, 0, size, size);
      const pixels = context.getImageData(0, 0, size, size).data;
      const buckets = new Map<string, { count: number; r: number; g: number; b: number }>();

      for (let index = 0; index < pixels.length; index += 16) {
        const alpha = pixels[index + 3] ?? 0;
        if (alpha < 120) continue;
        const r = pixels[index] ?? 0;
        const g = pixels[index + 1] ?? 0;
        const b = pixels[index + 2] ?? 0;
        if (r > 245 && g > 245 && b > 245) continue;
        const key = `${Math.round(r / 32) * 32}-${Math.round(g / 32) * 32}-${Math.round(b / 32) * 32}`;
        const bucket = buckets.get(key) ?? { count: 0, r: 0, g: 0, b: 0 };
        bucket.count += 1;
        bucket.r += r;
        bucket.g += g;
        bucket.b += b;
        buckets.set(key, bucket);
      }

      const colors = [...buckets.values()]
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map((bucket) => rgbToHex(Math.round(bucket.r / bucket.count), Math.round(bucket.g / bucket.count), Math.round(bucket.b / bucket.count)));
      resolve(colors.length >= 3 ? colors : [...colors, ...emptyForm.palette].slice(0, 3));
    };
    image.onerror = () => resolve(emptyForm.palette);
    image.src = dataUrl;
  });
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
