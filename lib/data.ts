/* ==========================================================================
   Site content — everything on the page comes from the resume
   (public/Mehmood_Ul_Hassan_Resume.pdf). Edit here, not in components.
   ========================================================================== */

/* ---------- Shared types ---------- */

/** Rich text: an array of segments; `em` / `strong` segments are emphasised. */
export type RichText = { text: string; em?: boolean; strong?: boolean }[];
export type TextPart = RichText[number];

const NUMBER_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
const numberWord = (n: number) => NUMBER_WORDS[n] ?? String(n);

/* ---------- Site ---------- */
export const site = {
  name: 'Mehmood Ul Hassan',
  firstName: 'Mehmood',
  lastName: ['Ul', 'Hassan'] as const,
  title: 'Senior Backend Engineer',
  tagline: 'Distributed Systems · Python · Cloud-Native',
  description:
    'Mehmood Ul Hassan — Senior Backend Engineer building distributed systems with Python, FastAPI, gRPC, Kafka and Kubernetes. CKAD certified. Based in Lahore, Pakistan.',
  location: 'Lahore, Pakistan',
  locationShort: 'Lahore, PK',
  cityCode: 'LHR', // nav clock label
  timeZone: 'Asia/Karachi',
  tzLabel: 'PKT',
  email: 'this.mehmood@gmail.com',
  phone: { display: '+92 337 4846627', href: 'tel:+923374846627' },
  resume: '/Mehmood_Ul_Hassan_Resume.pdf',
  links: {
    linkedin: 'https://www.linkedin.com/in/mehmood-ul-hassan-95346814a/',
    github: 'https://github.com/thismehmood',
  },
  /** Build-time fallback; the footer switches to the visitor's current year after mount. */
  year: 2026,
} as const;

export type NavLink = { href: `#${string}`; num: string; label: string };

export const navLinks: NavLink[] = [
  { href: '#about', num: '01', label: 'About' },
  { href: '#skills', num: '02', label: 'Stack' },
  { href: '#experience', num: '03', label: 'Experience' },
  { href: '#work', num: '04', label: 'Work' },
  { href: '#credentials', num: '05', label: 'Credentials' },
  { href: '#contact', num: '06', label: 'Contact' },
];

/* ---------- Hero ---------- */
export const hero = {
  meta: `(Portfolio — ©${site.year})`,
  lede: [
    { text: 'Backend engineer', strong: true },
    { text: ' with 5+ years building distributed systems in Python & Node.js — services that talk over ' },
    { text: 'gRPC, Kafka & RabbitMQ', strong: true },
    { text: ', running on Kubernetes I build and operate.' },
  ] satisfies RichText,
  badge: 'CKAD CERTIFIED ✦ KUBERNETES ✦ CLOUD-NATIVE ✦',
};

/* ---------- Marquee ---------- */
export const marqueeRows: { dir: 1 | -1; tone: 'lime' | 'dark'; items: string[] }[] = [
  {
    dir: -1,
    tone: 'lime',
    items: ['Python', 'FastAPI', 'asyncio', 'NestJS', 'gRPC', 'Kafka', 'RabbitMQ', 'Redis', 'PostgreSQL', 'Kubernetes', 'GKE Autopilot', 'Go'],
  },
  {
    dir: 1,
    tone: 'dark',
    items: ['Distributed Systems', 'Horizontal Scaling', 'Reliability', 'System Design', 'Microservices', 'Performance', 'AI Integrations'],
  },
];

/* ---------- About ---------- */
export const about = {
  statement: [
    { text: 'I build backends that stay ' },
    { text: 'fast under pressure', em: true },
    { text: ' — distributed systems in Python and Node.js, services that talk over gRPC, Kafka and RabbitMQ, running on Kubernetes infrastructure I design and operate myself.' },
  ] satisfies RichText,
  paragraphs: [
    "Over five years I've led backend teams of up to six engineers, built GKE Autopilot infrastructure from scratch on a private VPC, and cut server response times by ~40% through Redis caching and database optimization.",
    'I care about performance, horizontal scaling and reliability — clean service boundaries, per-service databases, and CI/CD that makes shipping boring. CKAD certified, with working knowledge of Go.',
  ],
};

/** Countries of the employers in the resume (drives the stat and the Experience intro). */
const COUNTRIES = ['Pakistan', 'USA', 'UAE', 'South Korea'];

export type Stat = { value: number; prefix?: string; suffix?: string; srText: string; label: string };

export const stats: Stat[] = [
  { value: 5, suffix: '+', srText: '5+', label: 'Years building production backends' },
  { value: 40, prefix: '~', suffix: '%', srText: 'About 40%', label: 'Reduction in server response times via caching & DB optimization' },
  { value: 6, srText: '6', label: 'Engineers led on backend teams' },
  { value: COUNTRIES.length, srText: String(COUNTRIES.length), label: `Countries shipped for — ${COUNTRIES.join(', ')}` },
];

/* ---------- Skills ---------- */
export type SkillIcon = 'code' | 'server' | 'database' | 'network' | 'cloud' | 'pipeline' | 'sparkle';
export type SkillGroup = { title: string; icon: SkillIcon; items: string[] };

export const skillGroups: SkillGroup[] = [
  { title: 'Languages', icon: 'code', items: ['Python', 'Go', 'JavaScript', 'TypeScript'] },
  { title: 'Backend', icon: 'server', items: ['FastAPI', 'asyncio', 'Django', 'NestJS', 'Node.js', 'Express', 'Fastify'] },
  { title: 'Data & Caching', icon: 'database', items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis'] },
  { title: 'APIs & Messaging', icon: 'network', items: ['gRPC / Protobuf', 'REST', 'GraphQL', 'Kafka', 'RabbitMQ', 'TCP'] },
  { title: 'Cloud & Infra', icon: 'cloud', items: ['GCP · GKE Autopilot', 'VPC', 'Cloud Armor', 'AWS · Lambda, EKS', 'Azure', 'Kubernetes', 'Helm', 'Docker', 'IaC'] },
  { title: 'CI / CD', icon: 'pipeline', items: ['GitHub Actions', 'Jenkins', 'Azure DevOps'] },
  { title: 'Other', icon: 'sparkle', items: ['System design', 'Microservices', 'AI · Kimi, Hume AI, AssemblyAI', 'Salesforce Commerce Cloud'] },
];

export const featuredCert = {
  title: 'CKAD Certified',
  date: 'Sep 2026',
  text: 'Certified Kubernetes Application Developer — The Linux Foundation / CNCF.',
  items: ['Kubernetes', 'Cloud-native'],
};

/* ---------- Experience ---------- */
export type Role = {
  company: string;
  counterLabel: string; // shown in the sticky counter
  role: string;
  dates: string;
  location: string;
  points: string[];
  stack: string[];
};

export const experience: Role[] = [
  {
    company: 'Code Encoders',
    counterLabel: 'Code Encoders',
    role: 'Lead Full Stack Cloud Engineer',
    dates: 'Dec 2024 — Present',
    location: 'Lahore, Pakistan',
    points: [
      'Lead backend architecture for a microservices platform on FastAPI and Python async patterns — service design, PR review, engineering standards and mentoring.',
      'Built GKE Autopilot infrastructure from scratch on a private VPC for horizontally scaled, multi-environment deployments.',
      'Deployed services over gRPC and TCP, each with its own database in a private subnet; targeted indexing plus Redis caching and a refactor cut response times by ~40%.',
      'Rolled out self-hosted API gateways with DNS-based ingress, Cloud Armor rate limiting & DDoS policies, and CI/CD on GitHub Actions and Jenkins.',
    ],
    stack: ['Python', 'FastAPI', 'NestJS', 'gRPC', 'RabbitMQ', 'Redis', 'MongoDB', 'GKE Autopilot', 'Cloud Armor', 'Jenkins'],
  },
  {
    company: 'Upwork',
    counterLabel: 'Upwork · Freelance',
    role: 'Freelance Backend Engineer',
    dates: '2026 · 2 months',
    location: 'Remote · Contract',
    points: [
      'Delivered an end-to-end Bill of Lading platform for a logistics client in 8 weeks — from invoice intake to a bank-ready document pack.',
      'Integrated the Kimi LLM to extract shipper, buyer, goods and weight data, with operator review in a gated 5-step wizard.',
      'Designed a tamper-evident approval flow: write-once, checksummed, versioned artifacts plus a bank verification link.',
    ],
    stack: ['Kimi LLM', 'LibreOffice (headless)', 'Excel → PDF', 'Checksums', 'Bank pack'],
  },
  {
    company: 'Consforc LLC',
    counterLabel: 'Consforc LLC',
    role: 'Lead Backend Engineer',
    dates: 'Jul 2023 — Sep 2024',
    location: 'Boston / New York, USA · Remote',
    points: [
      'Led backend development of a Python/FastAPI microservices platform and managed a 6-member backend team.',
      'Designed per-service databases to isolate load; gRPC for low-latency internal calls and Kafka for high-volume async messaging.',
      'Built a custom GraphQL gateway in NestJS; containerized with Docker, ran Kubernetes clusters and managed CI/CD in Azure DevOps.',
    ],
    stack: ['Python', 'FastAPI', 'NestJS', 'GraphQL', 'gRPC', 'Kafka', 'Redis', 'Docker', 'Kubernetes', 'Azure'],
  },
  {
    company: 'Otobucks',
    counterLabel: 'Otobucks',
    role: 'Lead Backend Engineer',
    dates: 'Jan 2023 — Sep 2023',
    location: 'UAE · Remote',
    points: [
      'Led backend development with Python, FastAPI, Redis and PostgreSQL.',
      'Designed MongoDB data models using aggregation pipelines and virtual relations.',
      'Built and optimized the Service Provider Panel, Admin Panel and Android app backend; defined code-quality standards.',
    ],
    stack: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'MongoDB', 'MySQL', 'Node.js', 'Express', 'AWS'],
  },
  {
    company: 'Eguana Commerce',
    counterLabel: 'Eguana Commerce',
    role: 'Lead Software Engineer',
    dates: 'Dec 2022 — Aug 2023',
    location: 'Seoul, South Korea · Remote',
    points: [
      "Led Under Armour's transition to headless commerce on Salesforce Commerce Cloud, redesigning the product listing page for scalability and performance.",
      'Migrated cartridges from SiteGenesis to SFRA; built Impex jobs, services and the TossPay payment integration.',
      'Implemented Return Merchandise Authorization and Personal Information Protection compliance (consents, action logs).',
    ],
    stack: ['SFCC', 'SFRA', 'Cartridges', 'Jobs', 'Services', 'JS / ISML'],
  },
  {
    company: 'Aiva Creative',
    counterLabel: 'Aiva Creative',
    role: 'Software Engineer',
    dates: 'Jun 2021 — Dec 2022',
    location: 'Lahore, Pakistan · Hybrid',
    points: [
      'Built SFCC backend features across multiple B2B/B2C brands, including OCAPI integrations.',
      "Delivered L'Oréal Japan integrations for Braintree, PayPal, Yotpo and GTM, plus Impex jobs.",
      'Worked across PDP, PLP, Cart and Checkout with a focus on SEO and server-side rendering performance.',
    ],
    stack: ['SFCC', 'Custom Cartridges', 'JavaScript', 'ISML / XML', 'AJAX'],
  },
];

/* ---------- Work (project cards derived from experience) ---------- */
export type ProjectArtId = 'bill-of-lading' | 'gke' | 'gateway' | 'headless' | 'payments';
export type Project = {
  num: string;
  years: string;
  art: ProjectArtId;
  meta: string;
  title: string;
  desc: string;
  highlights: string[];
  tags: string[];
};

export const workIntro = {
  title: [{ text: 'Selected ' }, { text: 'work', em: true }] satisfies RichText,
  lead: "Platforms I've led, architected and shipped — from LLM-powered document pipelines to cloud-native microservices and global commerce.",
  outro: [{ text: 'Got a system that needs to ' }, { text: 'scale', em: true }, { text: '?' }] satisfies RichText,
};

export const projects: Project[] = [
  {
    num: '01',
    years: '2026',
    art: 'bill-of-lading',
    meta: 'Logistics · Freelance (Upwork)',
    title: 'Bill of Lading Platform',
    desc: 'End-to-end platform delivered in 8 weeks — from commercial-invoice intake to a zipped, bank-ready submission pack with manifest.',
    highlights: [
      'Kimi LLM extraction with operator review in a gated 5-step wizard',
      'Excel BL templates rendered to PDF via headless LibreOffice',
      'Write-once, checksummed, versioned approvals + bank verification link',
    ],
    tags: ['Kimi LLM', 'LibreOffice', 'Excel → PDF', 'Tamper-evident'],
  },
  {
    num: '02',
    years: '2024 — Now',
    art: 'gke',
    meta: 'Code Encoders · Lead Full Stack Cloud Engineer',
    title: 'Cloud-Native Microservices on GKE',
    desc: 'FastAPI microservices platform with Redis caching and a refactor that cut server response times by ~40%.',
    highlights: [
      'GKE Autopilot on a private VPC, built from scratch for multi-env deploys',
      'gRPC/TCP services, each with its own DB in a private subnet',
      'Self-hosted API gateways, DNS ingress & Cloud Armor DDoS policies',
    ],
    tags: ['FastAPI', 'gRPC', 'GKE', 'Redis'],
  },
  {
    num: '03',
    years: '2023 — 2024',
    art: 'gateway',
    meta: 'Consforc LLC · Lead Backend Engineer',
    title: 'GraphQL Gateway over gRPC & Kafka',
    desc: 'Python/FastAPI microservices platform, delivered with a 6-member backend team on Docker, Kubernetes and Azure DevOps.',
    highlights: [
      'Custom GraphQL gateway in NestJS routing across services',
      'gRPC for low-latency internal calls, Kafka for high-volume async',
      'Per-service databases so services scale independently',
    ],
    tags: ['NestJS', 'GraphQL', 'Kafka', 'Kubernetes'],
  },
  {
    num: '04',
    years: '2022 — 2023',
    art: 'headless',
    meta: 'Eguana Commerce · Lead Software Engineer',
    title: 'Headless Commerce for Under Armour',
    desc: "Led Under Armour's transition to headless commerce on Salesforce Commerce Cloud.",
    highlights: [
      'Product listing page redesigned for scalability & performance',
      'SiteGenesis → SFRA cartridge migration, Impex jobs & TossPay',
      'RMA and Personal Information Protection compliance',
    ],
    tags: ['SFCC', 'SFRA', 'Headless', 'Payments'],
  },
  {
    num: '05',
    years: '2021 — 2022',
    art: 'payments',
    meta: 'Aiva Creative · Software Engineer',
    title: "L'Oréal Japan Integrations",
    desc: "Payment, reviews and analytics integrations on Salesforce Commerce Cloud for L'Oréal Japan.",
    highlights: [
      'Braintree, PayPal, Yotpo and GTM integrations plus Impex jobs',
      'OCAPI integrations across multiple B2B/B2C brands',
      'SEO & server-side rendering performance on PDP, PLP, Cart, Checkout',
    ],
    tags: ['SFCC', 'Braintree', 'PayPal', 'OCAPI'],
  },
];

/* ---------- Credentials ---------- */
export type Credential = {
  title: string;
  issuer: string;
  tag: 'Certification' | 'Degree' | 'Course';
  href?: string;
  linkLabel?: string;
};

export const credentials: Credential[] = [
  {
    title: 'Certified Kubernetes Application Developer (CKAD)',
    issuer: 'The Linux Foundation / CNCF · Sep 2026 · ID LF-sxz34xuhog',
    tag: 'Certification',
    href: 'https://www.credly.com/badges/60b7cc54-5479-4f42-9aec-fca6336c5e30',
    linkLabel: 'View CKAD badge on Credly',
  },
  {
    title: 'Salesforce Certified B2C Commerce Developer',
    issuer: 'Salesforce',
    tag: 'Certification',
    href: 'https://www.linkedin.com/posts/mehmood-hassan_salesforcecertified-salesforcecommercecloud-activity-7005201402725588992-LJHg/',
    linkLabel: 'View Salesforce certification',
  },
  {
    title: 'BS Software Engineering',
    issuer: 'Virtual University of Pakistan, Lahore · 2016 — 2020',
    tag: 'Degree',
  },
  {
    title: 'SQL for Data Science',
    issuer: 'Coursera · UC Davis',
    tag: 'Course',
    href: 'https://www.coursera.org/account/accomplishments/certificate/YRYE7V9Y5CFC',
    linkLabel: 'View certificate',
  },
  {
    title: 'Introduction to Structured Query Language (SQL)',
    issuer: 'Coursera · University of Michigan',
    tag: 'Course',
    href: 'https://www.coursera.org/account/accomplishments/certificate/UM6XVFZMFEGA',
    linkLabel: 'View certificate',
  },
  {
    title: 'HTML, CSS & JavaScript for Web Developers',
    issuer: 'Coursera · Johns Hopkins University',
    tag: 'Course',
    href: 'https://www.coursera.org/account/accomplishments/certificate/E92X6F7WQ5AH',
    linkLabel: 'View certificate',
  },
];

export const interest = {
  label: 'Off the keyboard',
  title: 'Attacking midfielder / forward',
  text: [
    { text: 'Competitive football for ' },
    { text: 'Real Lahore FC', strong: true },
    { text: '. Formerly with the ' },
    { text: 'Atlético de Madrid Academy Pakistan (U-19)', strong: true },
    { text: '. Same instincts on the pitch as in production — read the play, move fast, finish.' },
  ] satisfies RichText,
};

/* ---------- Contact ---------- */
export const contact = {
  titleLines: ["Let's build", 'systems that', 'scale.'] as const, // last line is emphasised
  kicker: "Have a platform to scale, a backend team to lead, or a system that needs to stay up? Let's talk.",
};

/* ---------- Section labels, titles & intros ---------- */

export const sections = {
  about: { num: '01', label: 'About', link: "See where I've shipped" },
  skills: {
    num: '02',
    label: 'Stack',
    title: 'The toolkit',
    intro: 'Languages, frameworks and infrastructure I use to design, ship and operate systems in production.',
  },
  experience: {
    num: '03',
    label: 'Experience',
    title: "Where I've shipped",
    // Counts derive from the data, so adding a role keeps the sentence true
    intro: `${numberWord(experience.length)} roles across ${numberWord(COUNTRIES.length).toLowerCase()} countries — from Salesforce Commerce Cloud storefronts to cloud-native microservice platforms on Kubernetes.`,
  },
  work: { num: '04', label: 'Selected Work' },
  credentials: { num: '05', label: 'Credentials', title: 'Certified & always learning' },
  contact: { num: '06', label: 'Contact' },
} as const;
