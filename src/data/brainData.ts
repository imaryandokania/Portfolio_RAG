// ═══════════════════════════════════════════════════════════════════
// BRAIN LAYER — everything the resume can't say.
// Each entry becomes a document in the RAG index, so the agent can
// answer questions the way Aryan would in a real conversation.
//
// draft: true  → EXCLUDED from the index (placeholder awaiting Aryan's words)
// draft: false → live, the agent can use it
//
// Write entries in first person, like you'd actually say it.
// ═══════════════════════════════════════════════════════════════════

export type BrainEntry = {
  id: string;
  topic:
    | "story" // career stories, turning points
    | "opinion" // technical takes and beliefs
    | "deep-dive" // how something he built actually works
    | "faq" // questions visitors/recruiters actually ask
    | "personal" // interests, life outside work
    | "looking-for"; // what he wants next
  title: string;
  content: string;
  draft: boolean;
};

export const brainData: BrainEntry[] = [
  // ─── LIVE ENTRIES (verified facts, written from known sources) ───
  {
    id: "story-career-arc",
    topic: "story",
    title: "My career arc: from telecom infrastructure to AI agents",
    content:
      "I started at Oracle in Bengaluru working on telecom infrastructure — MySQL replication, Docker/Kubernetes migrations, VoLTE call-flow performance. Real large-scale systems work. But I kept gravitating toward ML, so I moved to the US for my MS in CS at UC San Diego (3.96 GPA). There I did research in Prof. Rose Yu's lab on meta-learning optimizers, which became an ICLR 2025 workshop paper. My Cisco internship let me combine both worlds: LLM-based code review with RAG pipelines on AWS. Then a short AI research stint at UCSD's CSE department working on AI agents and infrastructure at CodeNib, and now I'm a Research Engineer at Microsoft on the Copilot Studio Engineering team — building the agent platform other people use to build agents.",
    draft: false
  },
  {
    id: "deep-dive-iclr-paper",
    topic: "deep-dive",
    title: "What my ICLR paper is actually about (in plain words)",
    content:
      "The paper is 'Improving Learning to Optimize Using Parameter Symmetries' (ICLR 2025 Workshop on Neural Network Weights as a New Data Modality, with Guy Zamir, Bo Zhao, and Rose Yu). The core idea: neural network loss landscapes have symmetries — different parameter values that compute the exact same function. 'Teleportation' exploits this by moving parameters within a symmetry orbit to spots where optimization goes faster. We analyzed a learning-to-optimize (L2O) algorithm that jointly learns symmetry transformations and update rules, showed it locally resembles Newton's method even without finding the optimal group element, built a benchmark to evaluate L2O with teleportation, and showed enhancements like momentum push performance further. My hands-on part: building the PyTorch meta-learning optimizer — a two-layer LSTM + MLP architecture with adaptive momentum, trained on GPU across 100+ optimization trajectories, then benchmarked on unseen ones where it beat gradient descent and LSTM baselines.",
    draft: false
  },
  {
    id: "deep-dive-this-site",
    topic: "deep-dive",
    title: "How this portfolio works under the hood",
    content:
      "This site is itself one of my projects. It's Next.js with a RAG pipeline: my resume and knowledge base get chunked into documents, embedded with OpenAI's text-embedding-3-small, and cached server-side. Your question gets embedded, cosine similarity plus section-keyword boosting ranks documents, and the top matches go to GPT as context. The agent runs a tool loop — it can fetch my live GitHub activity mid-answer — and streams tokens to the console. There's also an MCP server at /api/mcp so other AI assistants can query my resume as a tool, a JSON resume API at /api/resume, and a full terminal version at /ssh. Everything you're seeing — the boot sequence, the 3D career graph, the fit-check mode — is in the public repo: github.com/imaryandokania/Portfolio_RAG.",
    draft: false
  },
  {
    id: "deep-dive-codenib",
    topic: "deep-dive",
    title: "CodeNib: my latest paper on repository context for coding agents",
    content:
      "CodeNib (arXiv:2607.25431, July 2026) came out of my AI Researcher stint at UC San Diego's CSE department with Prof. Jishen Zhao's group. The problem: coding agents constantly search, navigate, and re-discover context in evolving repositories, because indexes, language servers, and task histories are all disconnected. CodeNib builds reusable lexical, dense, and structural views per repository commit, maps outputs to repository-relative source ranges, keeps views valid across edits, and serves ranked search, symbol navigation, and bounded context through one runtime. Results: graph and vector updates 8.7x and 25.4x faster than independent rebuilds at the median, 4.7x median latency advantage over live language servers on static navigation, and across five models the selected-context policies preserved localization with 50-87% fewer trajectory tokens than paired grep/read. It's directly relevant to my Microsoft work — it's the data-systems side of making coding agents efficient.",
    draft: false
  },
  {
    id: "faq-what-is-copilot-studio",
    topic: "faq",
    title: "What do you do at Microsoft?",
    content:
      "I'm a Research Engineer on the Copilot Studio Engineering team in Redmond (started April 2026). Copilot Studio is Microsoft's platform for building, customizing, and deploying AI agents and copilots. I work on the agentic AI side — the experiences and workflows that let LLM-powered agents actually get things done. Having built agent systems from scratch (including this portfolio's agent), working on the platform layer that democratizes that for everyone else is exactly where I wanted to be.",
    draft: false
  },
  {
    id: "faq-recruiter-basics",
    topic: "faq",
    title: "Recruiter quick facts (location, contact, links)",
    content:
      "Location: Greater Seattle Area (Redmond, WA). Currently: Research Engineer at Microsoft, Copilot Studio. Education: MS CS from UC San Diego (Sept 2024 – March 2026, 3.96 GPA), BTech CSE from VIT (9.4 CGPA). Best way to reach me: aryandokania2001@gmail.com or LinkedIn (linkedin.com/in/aryandokania). Code: github.com/imaryandokania. Publications: Google Scholar. For a machine-readable resume, hit /api/resume on this site; to plug me into your AI assistant, use the MCP server at /api/mcp.",
    draft: false
  },

  // ─── DRAFTS — Aryan: replace each content with your real answer,
  //     then set draft: false to make the agent know it. ───
  {
    id: "story-hardest-problem",
    topic: "story",
    title: "The hardest technical problem I've solved",
    content: "[Aryan: describe one gnarly bug or design problem — what made it hard, how you cracked it, what you learned.]",
    draft: true
  },
  {
    id: "opinion-agents",
    topic: "opinion",
    title: "My take on AI agents and where they're going",
    content: "[Aryan: your honest opinion — what's overhyped, what's real, what you'd bet on for the next 2 years.]",
    draft: true
  },
  {
    id: "opinion-rag",
    topic: "opinion",
    title: "What people get wrong about RAG",
    content: "[Aryan: lessons from building RAG systems at Cisco and here — chunking? evals? retrieval quality?]",
    draft: true
  },
  {
    id: "story-why-microsoft",
    topic: "story",
    title: "Why I chose Microsoft over other offers",
    content: "[Aryan: what pulled you to Copilot Studio — the team, the mission, the tech?]",
    draft: true
  },
  {
    id: "personal-outside-work",
    topic: "personal",
    title: "Who I am outside of work",
    content: "[Aryan: hobbies, what you read/watch, where you're from, what Seattle life is like, fun facts.]",
    draft: true
  },
  {
    id: "faq-work-style",
    topic: "faq",
    title: "How I like to work",
    content: "[Aryan: your working style — how you approach new problems, collaboration preferences, what makes you productive.]",
    draft: true
  },
  {
    id: "looking-for-next",
    topic: "looking-for",
    title: "What I'm looking for / open to",
    content: "[Aryan: are you open to collaborations, speaking, side projects, research? What kind of inbound do you want?]",
    draft: true
  }
];

export function buildBrainDocuments() {
  return brainData
    .filter((entry) => !entry.draft)
    .map((entry) => ({
      id: `brain-${entry.id}`,
      section: "brain",
      title: entry.title,
      subtitle: entry.topic,
      content: entry.content
    }));
}
