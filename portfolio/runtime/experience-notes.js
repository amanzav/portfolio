export const EXPERIENCE_NOTES = [
  {
    id: 'vooma', company: 'Vooma', homeContext: '', role: 'AI Platform Engineer', side: 'left', row: 0,
    articleHref: '/vooma/',
    text: 'Better memory for our AI.',
    description: 'Keeping context across conversations, linking related entities, and checking response quality.',
    summary: [
      'I’m working on how Vee remembers older conversations and keeps track of unfinished tasks. I also build reusable workflows and checks for how the agent responds after a change.',
    ],
    notes: [
      'I rebuilt Vee’s LangGraph architecture around one ongoing conversation, with persistent user profiles, time-based compaction, and searchable history.',
      'I extracted reusable workflows from nightly runs so Jev can choose a workflow for each message. Parallel tool calls reduce the time spent waiting on independent steps.',
      'I helped fine-tune a speech model on dispatcher audio, using human-corrected labels and noise augmentation.',
      'I replaced manual prompt edits with configurable procedures and failure labeling. Agents repair configurations and rerun snapshot and simulation cases to check fixes and regressions.',
      'I also built a MotherDuck pipeline for usage data and nightly evals, using retention cohorts to find failing workflows.',
    ],
  },
  {
    id: 'boomerang', company: 'Boomerang', homeContext: '', role: 'AI Engineering Intern', side: 'left', row: 1,
    articleHref: '/boomerang/',
    text: 'Better candidate search.',
    description: 'Matching candidates to jobs with neural search, plus internal tools for bug fixes and code review.',
    summary: [
      'I worked on how recruiters search for candidates and match them to jobs. I also built a bug-reporting tool that gathers context and drafts a fix for an engineer to review.',
    ],
    notes: [
      'I replaced a gradient-boosted candidate ranker with a two-stage neural retriever built in PyTorch and served through FastAPI.',
      'Natural-language search over alumni embeddings let recruiters describe who they wanted to find instead of combining hundreds of filters.',
      'I built a local software factory and connected Claude to the development workflow. An in-app bug widget retrieves context from Notion and Granola, triages the report, and drafts a fix.',
      'I also sped up HR synchronization with Redis caching and reduced repeated model calls through field normalization and delta-only updates.',
    ],
  },
  {
    id: 'ford', company: 'Ford', homeContext: '', role: 'Embedded & systems software', side: 'left', row: 2,
    articleHref: '/ford/',
    text: 'In-car infotainment.',
    description: 'Infotainment software, debugging, and testing.',
    summary: [
      'I worked on infotainment software across two internships. Some of that was C++ navigation and message handling; I also built Python tools for debugging firmware failures and testing changes on hardware.',
    ],
    notes: [
      'In my embedded software internship, I built a C++ graph-based route ranker for the F-150 and Mustang Mach-E.',
      'I reworked the tire-pressure monitoring interrupt path with deferred packet parsing and event-driven dispatch so puncture alerts could arrive sooner.',
      'In my systems software internship, I built a Python and FastAPI firmware-debugging assistant over Kafka events, returning root causes with supporting traces.',
      'I also built a hardware-in-the-loop harness for CAN replay and fault injection, covering dropped messages, stale readings, and ECU resets.',
    ],
  },
];
