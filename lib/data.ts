/* ==========================================================================
   Site content — everything on the page comes from the resume
   (plus the positioning and the Octopus project supplied by the owner)
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
  title: 'Senior Full Stack Engineer',
  tagline: 'AI Agents · Automation · DevOps',
  description:
    'Mehmood Ul Hassan — Senior Full Stack Engineer building AI agents, automation and the cloud-native systems behind them: microservices in NestJS and Python, React / Next.js / Vue front ends, Terraform-managed Kubernetes on GCP, AWS and Azure. HealthTech, e-commerce and marketplace platforms. CKAD certified. Lahore, Pakistan.',
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
    { text: 'I build ' },
    { text: 'AI automations & AI agents', strong: true },
    { text: ' that do real work — backed by 5+\u00A0years of full stack and DevOps: microservices in NestJS & Python, React / Next.js front ends, and ' },
    { text: 'Terraform-managed Kubernetes', strong: true },
    { text: ' I build and operate.' },
  ] satisfies RichText,
};

/* ---------- Marquee ---------- */
/**
 * One slim schematic "run log" row of capability terms (not a tool list — the Stack
 * section covers the tools). Every row renders in the small mono annotation style with
 * ring-node separators; `dir` is the loop direction (-1 = leftwards).
 */
export const marqueeRows: { dir: 1 | -1; items: string[] }[] = [
  {
    dir: -1,
    items: ['AI Agents', 'AI Automation', 'Full Stack', 'DevOps', 'Microservices', 'Micro-frontends', 'Kubernetes', 'Terraform · IaC', 'HealthTech', 'E-commerce', 'System Design', 'Cloud-Native'],
  },
];

/* ---------- About ---------- */
export const about = {
  statement: [
    { text: 'I build ' },
    { text: 'AI automations and agents', em: true },
    { text: ' that take real work off people’s plates — and the fast, reliable systems underneath them: Python and Node.js services talking over gRPC, Kafka and RabbitMQ, on Kubernetes I design and operate myself.' },
  ] satisfies RichText,
  paragraphs: [
    'Full stack engineer with 5+ years in production across healthcare, e-commerce, automotive and consumer apps. I’ve led a 20+ microservice healthcare platform from requirements to Terraform-managed GKE environments, led backend teams of up to six engineers, and cut server response times by ~40% through Redis caching and database optimization.',
    'Today my focus is AI and DevOps: agents and automation pipelines wired into real business workflows, LLM-powered document extraction, and integrations with Kimi, Hume AI and AssemblyAI — shipped through infrastructure as code and CI/CD. CKAD certified, with working knowledge of Go.',
  ],
};

/** Countries of the employers in the resume (drives the stat and the Experience intro). */
const COUNTRIES = ['Pakistan', 'USA', 'UAE', 'South Korea'];

export type Stat = { value: number; prefix?: string; suffix?: string; srText: string; label: string };

export const stats: Stat[] = [
  { value: 5, suffix: '+', srText: '5+', label: 'Years shipping production systems' },
  { value: 40, prefix: '~', suffix: '%', srText: 'About 40%', label: 'Reduction in server response times via caching & DB optimization' },
  { value: 6, srText: '6', label: 'Engineers led on backend teams' },
  { value: 20, suffix: '+', srText: '20+', label: 'Microservices on BlockMed Pro, the healthcare platform I led' },
];

/* ---------- Skills ---------- */
export type SkillIcon = 'code' | 'server' | 'agent' | 'database' | 'network' | 'cloud' | 'pipeline' | 'blueprint' | 'frontend';
export type SkillGroup = { title: string; icon: SkillIcon; items: string[] };

/* Eight groups + the featured CKAD card fill a 3 × 3 grid on desktop */
export const skillGroups: SkillGroup[] = [
  { title: 'AI & Automation', icon: 'agent', items: ['AI agents', 'AI automations', 'LLM document extraction', 'Kimi', 'Hume AI', 'AssemblyAI'] },
  { title: 'Frontend', icon: 'frontend', items: ['React', 'Next.js', 'Vue.js', 'TypeScript', 'Micro-frontends', 'Tailwind CSS', 'React Query', 'jQuery', 'SFCC storefronts · ISML / SSR'] },
  { title: 'Backend', icon: 'server', items: ['NestJS', 'Node.js', 'Express', 'Fastify', 'FastAPI', 'asyncio', 'Django', 'Laravel'] },
  { title: 'Languages', icon: 'code', items: ['TypeScript', 'JavaScript', 'Python', 'Go'] },
  { title: 'Data & Caching', icon: 'database', items: ['PostgreSQL', 'MySQL', 'MongoDB · CSFLE', 'Redis', 'TypeORM', 'Prisma'] },
  { title: 'APIs & Messaging', icon: 'network', items: ['REST', 'GraphQL', 'gRPC / Protobuf', 'Kafka', 'RabbitMQ', 'TCP', 'Swagger / OpenAPI', 'Ambassador API gateway'] },
  { title: 'DevOps & Cloud', icon: 'cloud', items: ['Terraform · IaC', 'Kubernetes', 'Helm', 'Docker', 'GCP · GKE Autopilot', 'VPC peering', 'Cloud Armor', 'AWS · Lambda, EKS', 'Azure · Kubernetes', 'GitHub Actions', 'Jenkins', 'Azure DevOps'] },
  { title: 'Architecture', icon: 'blueprint', items: ['System design', 'Microservices', 'Database per service', 'Read / write API gateways', 'Monorepos', 'Design patterns', 'Salesforce Commerce Cloud'] },
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
      'Lead engineer on BlockMed Pro, a healthcare platform of 20+ microservices (patient, pharmacy, pharmaceutical, clinic and super-admin modules) — working directly with the business on requirements and running delivery in Jira.',
      'Each service owns its database and RabbitMQ carries inter-service events; patient and medical-report data live in separate MongoDB databases protected with client-side field-level encryption (CSFLE).',
      'Separate API gateways for read and write traffic; micro-frontends in Next.js.',
      'Infrastructure as code with Terraform: GKE Autopilot on a private VPC with dev, QA, UAT, staging and production environments, and VPC peering between two clusters.',
      'Led backend architecture on FastAPI and Python async patterns; Redis caching and a refactor cut server response times by ~40%; Cloud Armor rate limiting & DDoS policies; CI/CD on GitHub Actions and Jenkins.',
      'Review PRs, mentor developers and set engineering standards.',
    ],
    stack: ['NestJS', 'Python', 'FastAPI', 'Next.js', 'RabbitMQ', 'MongoDB · CSFLE', 'Redis', 'Terraform', 'GKE Autopilot', 'Cloud Armor', 'GitHub Actions', 'Jenkins'],
  },
  {
    company: 'Upwork',
    counterLabel: 'Upwork · Freelance',
    role: 'Freelance Backend Engineer',
    dates: '2026 · 2 months',
    location: 'Remote · Contract',
    points: [
      'Delivered the Bill of Lading module of Octopus, a trade payment platform, end to end in 8 weeks — from invoice intake to a bank-ready document pack.',
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
      'Built the backend of Charmy, a dating app on the App Store, from scratch: a NestJS monorepo of microservices — auth, account, profile, chat, order, charities and notification — each with its own PostgreSQL database (TypeORM).',
      'Kafka for inter-service events; an Ambassador API gateway exposing GraphQL plus public Swagger APIs; deployed on Kubernetes in Azure.',
      'Led backend development of Python/FastAPI microservices and managed a 6-member backend team; gRPC for low-latency internal calls, Redis caching, CI/CD in Azure DevOps.',
    ],
    stack: ['NestJS', 'TypeORM', 'PostgreSQL', 'Kafka', 'GraphQL', 'Python', 'FastAPI', 'gRPC', 'Redis', 'Docker', 'Kubernetes', 'Azure'],
  },
  {
    company: 'Otobucks',
    counterLabel: 'Otobucks',
    role: 'Lead Backend Engineer',
    dates: 'Jan 2023 — Sep 2023',
    location: 'UAE · Remote',
    points: [
      'Led the backend of Otobucks, an automotive services platform launched in Dubai with web and mobile apps — similar to PakWheels in Pakistan.',
      'Built on Python, FastAPI, Redis and PostgreSQL; designed MongoDB data models using aggregation pipelines and virtual relations.',
      'Built and optimized the Service Provider Panel, Admin Panel and Android app; guided developers, ran code reviews and defined quality standards.',
    ],
    stack: ['Python', 'FastAPI', 'Node.js', 'Express', 'React', 'PostgreSQL', 'Redis', 'MongoDB', 'MySQL', 'AWS'],
  },
  {
    company: 'Eguana Commerce',
    counterLabel: 'Eguana Commerce',
    role: 'Lead Software Engineer',
    dates: 'Dec 2022 — Aug 2023',
    location: 'Seoul, South Korea · Remote',
    points: [
      'Led Under Armour’s transition to headless commerce on Salesforce Commerce Cloud, redesigning the product listing page for scalability and performance.',
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
      'Built SFCC features across multiple B2B/B2C brands — including L’Oréal Paris (Japan region) and the Lightning New York e-commerce platform — with OCAPI integrations.',
      'Delivered L’Oréal Japan integrations for PayPal, Braintree, Yotpo and GTM, plus Impex jobs.',
      'Client-side integrations with AJAX and server-side rendering in core JavaScript across PDP, PLP, Cart and Checkout, with a focus on SEO.',
    ],
    stack: ['SFCC', 'Custom Cartridges', 'JavaScript', 'ISML / XML', 'AJAX'],
  },
];

/* ---------- Work (Octopus + project cards derived from experience) ---------- */
export type ProjectArtId = 'octopus' | 'bill-of-lading' | 'blockmed' | 'charmy' | 'otobucks' | 'headless' | 'payments';
export type Project = {
  num: string;
  years: string;
  art: ProjectArtId;
  meta: string;
  title: string;
  desc: string;
  highlights: string[];
  tags: string[];
  /** Featured card: wider, with accent brackets. */
  featured?: boolean;
  /** Optional status chip over the artwork (e.g. on the featured card). */
  badge?: string;
  /** Optional public link (a card with a link renders as one). */
  href?: string;
};

export const workIntro = {
  title: [{ text: 'Selected ' }, { text: 'work', em: true }] satisfies RichText,
  lead: 'Platforms I’ve built and led — from the AI layer of a trade payment platform and a 20+ microservice healthcare platform to a dating-app backend, an automotive marketplace and global e-commerce.',
  outro: [{ text: 'Got a system that needs to ' }, { text: 'scale', em: true }, { text: '?' }] satisfies RichText,
};

export const projects: Project[] = [
  {
    // Octopus — a team project; the card is scoped to Mehmood's own modules (AI document
    // layer, Bill of Lading).
    num: '01',
    years: '2026',
    art: 'octopus',
    featured: true,
    badge: 'Featured · AI platform',
    href: 'https://octopus.multilines-group.com',
    meta: 'Team project · AI document layer & Bill\u00A0of\u00A0Lading module',
    title: 'Octopus',
    desc: 'Trade payment platform with multi-stage approvals, compliance checks and bank execution, built by a small team. I built its AI document layer and the Bill of Lading automation.',
    highlights: [
      'Built the OCR / vision document extraction behind the AI compliance checks, and their first Kimi-based version',
      'Built the Bill of Lading module end to end (see\u00A002)',
      'Contributed across the compliance → QA → bank\u2011execution workflow',
    ],
    tags: ['React', 'NestJS', 'PostgreSQL', 'LLMs'],
  },
  {
    // The same engagement as Octopus's Bill of Lading module (card 01), delivered as an Upwork
    // contract: the meta and description say so, so it isn't presented as a separate project.
    num: '02',
    years: '2026',
    art: 'bill-of-lading',
    badge: 'Logistics · Global shipping',
    meta: 'Logistics · BL generation · Octopus (Upwork)',
    title: 'Bill of Lading Generator',
    desc: 'Carrier-agnostic engine that turns a commercial invoice into a ready-to-issue Bill of Lading on each shipping line’s own template. Octopus BL module (01), 8\u00A0weeks.',
    highlights: [
      'Invoice in, BL out: the Kimi LLM extracts shipper, buyer, goods and weights for operator review',
      'Per-shipping-line Excel templates rendered to PDF, plus AI packing, container and HS-code estimates',
      'Write-once, checksummed approvals, a bank verification link and zipped bank packs',
    ],
    tags: ['Kimi LLM', 'Carrier templates', 'Excel → PDF'],
  },
  {
    num: '03',
    years: '2024 — Now',
    art: 'blockmed',
    badge: 'HealthTech · 20+ services',
    meta: 'Code Encoders · Lead engineer · Healthcare',
    title: 'BlockMed Pro',
    desc: 'Healthcare platform of 20+ microservices — patient, pharmacy, pharma, clinic and admin modules — led with the business from requirements to production.',
    highlights: [
      'Database per service and RabbitMQ events; patient records in separate MongoDB databases with CSFLE',
      'Separate read and write API gateways; micro-frontends in Next.js',
      'Terraform-managed GKE — dev, QA, UAT, staging, prod — with VPC peering between two clusters',
    ],
    tags: ['Microservices', 'Next.js', 'MongoDB · CSFLE', 'Terraform'],
  },
  {
    num: '04',
    years: '2023 — 2024',
    art: 'charmy',
    badge: 'On the App Store',
    meta: 'Consforc LLC · Lead Backend Engineer · Dating app',
    title: 'Charmy',
    desc: 'The backend of Charmy, a dating app on the App Store — built from scratch as a NestJS monorepo of microservices.',
    highlights: [
      'Auth, account, profile, chat, order, charities and notification services, each with its own PostgreSQL database',
      'Kafka for inter-service events; TypeORM data layer',
      'Ambassador API gateway with GraphQL and public Swagger APIs; Kubernetes on Azure',
    ],
    tags: ['NestJS', 'Kafka', 'PostgreSQL', 'GraphQL', 'Azure'],
  },
  {
    num: '05',
    years: '2023',
    art: 'otobucks',
    badge: 'Launched in Dubai',
    meta: 'Otobucks · Lead Backend Engineer · Automotive',
    title: 'Otobucks',
    desc: 'Automotive services platform launched in Dubai, with web and mobile apps — similar to PakWheels in Pakistan.',
    highlights: [
      'Python / FastAPI backend with Redis and PostgreSQL',
      'MongoDB models with aggregation pipelines and virtual relations',
      'Service Provider Panel, Admin Panel and Android app',
    ],
    tags: ['FastAPI', 'Node.js', 'MongoDB', 'React', 'AWS'],
  },
  {
    num: '06',
    years: '2022 — 2023',
    art: 'headless',
    meta: 'Eguana Commerce · Lead Software Engineer',
    title: 'Headless Commerce for Under Armour',
    desc: 'Led Under Armour’s transition to headless commerce on Salesforce Commerce Cloud.',
    highlights: [
      'Product listing page redesigned for scalability & performance',
      'SiteGenesis → SFRA cartridge migration, Impex jobs & TossPay',
      'RMA and Personal Information Protection compliance',
    ],
    tags: ['SFCC', 'SFRA', 'Headless', 'Payments'],
  },
  {
    num: '07',
    years: '2021 — 2022',
    art: 'payments',
    meta: 'Aiva Creative · Software Engineer · E-commerce',
    title: 'L’Oréal Paris Japan & Lightning New York',
    desc: 'Salesforce Commerce Cloud storefront work for L’Oréal Paris (Japan region) and the Lightning New York e-commerce platform.',
    highlights: [
      'PayPal, Braintree, Yotpo and GTM integrations plus Impex jobs',
      'OCAPI integrations across multiple B2B/B2C brands',
      'AJAX + server-side rendering on PDP, PLP, Cart and Checkout, with an SEO focus',
    ],
    tags: ['SFCC', 'PayPal', 'Braintree', 'OCAPI'],
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
    issuer: 'The Linux Foundation / CNCF · Sep\u00A02026 · ID LF-sxz34xuhog',
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
    { text: 'Atlético de Madrid Academy Pakistan (U\u201119)', strong: true },
    { text: ' in PFFF tournaments, and Punjab University Sports Complex teams indoors and out (2016–2020). Same instincts on the pitch as in production — read the play, move fast, finish.' },
  ] satisfies RichText,
};

/* ---------- Contact ---------- */
export const contact = {
  titleLines: ['Let’s build', 'AI that', 'ships.'] as const, // last line is emphasised
  kicker: 'Need an AI agent, an automation pipeline, or a platform that has to stay up? Let’s talk.',
};

/* ---------- Section labels, titles & intros ---------- */

export const sections = {
  about: { num: '01', label: 'About', link: 'See where I’ve shipped' },
  skills: {
    num: '02',
    label: 'Stack',
    title: 'The toolkit',
    intro: 'Full stack, AI and DevOps tooling I use to design, ship and operate systems in production.',
  },
  experience: {
    num: '03',
    label: 'Experience',
    title: 'Where I’ve shipped',
    // Counts derive from the data, so adding a role keeps the sentence true
    intro: `${numberWord(experience.length)} roles across ${numberWord(COUNTRIES.length).toLowerCase()} countries — from commerce platforms to cloud-native microservices and AI automation.`,
  },
  work: { num: '04', label: 'Selected Work' },
  credentials: { num: '05', label: 'Credentials', title: 'Certified & always learning' },
  contact: { num: '06', label: 'Contact' },
} as const;
