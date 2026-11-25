export const EXPERIENCE_NOTES = [
  {
    id: 'vooma', company: 'Vooma', homeContext: '', role: 'AI Platform Engineer', side: 'left', row: 0,
    articleHref: '/vooma/',
    text: 'Better memory for our AI.',
    description: 'Keeping context across conversations, linking related entities, and checking response quality.',
    summary: [
      'Rebuilt LangGraph memory to retain context, link related entities, and preserve unfinished tasks.',
      'Reused workflows to cut routine tasks to a third of the steps and reduce runtime by over half.',
      'Automated configuration fixes and verified them against 500 test cases across 30 procedures.',
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
      'Built a local software factory that shipped 2.2× as many tickets per cycle.',
      'Replaced the candidate ranker with two-stage neural retrieval, increasing match acceptance from 8% to 31%.',
      'Built natural-language search over 2M alumni profiles, replacing 300+ filters.',
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
      'Built C++ route ranking for the F-150 and Mach-E, reducing unnecessary detours by 41%.',
      'Reworked tire-pressure interrupts, cutting alert latency from 1.4s to 612ms.',
      'Built firmware-debugging tools and automated 300 hardware regression tests.',
    ],
    notes: [
      'In my embedded software internship, I built a C++ graph-based route ranker for the F-150 and Mustang Mach-E.',
      'I reworked the tire-pressure monitoring interrupt path with deferred packet parsing and event-driven dispatch so puncture alerts could arrive sooner.',
      'In my systems software internship, I built a Python and FastAPI firmware-debugging assistant over Kafka events, returning root causes with supporting traces.',
      'I also built a hardware-in-the-loop harness for CAN replay and fault injection, covering dropped messages, stale readings, and ECU resets.',
    ],
  },
];
