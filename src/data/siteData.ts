export interface Program {
  id: string;
  name: string;
  slug: string;
  category: 'Technology' | 'Data & AI' | 'Cloud & DevOps' | 'Cybersecurity' | 'Design & Digital' | 'Professional Skills';
  audience: string;
  deliveryMode: 'On-Campus Workshop' | 'Blended Learning' | 'Instructor-Led Bootcamp' | 'Institutional CoE';
  duration: string;
  description: string;
  curriculumHighlights: string[];
  prerequisites: string;
  targetOutcome: string;
}

export interface EventItem {
  id: string;
  title: string;
  slug: string;
  category: 'Faculty Development' | 'Technical Workshop' | 'Institutional Seminar' | 'Industry Interaction' | 'Student Bootcamp';
  date: string;
  mode: string;
  location: string;
  targetAudience: string;
  description: string;
  isUpcoming: boolean;
}

export interface ResourceArticle {
  id: string;
  title: string;
  slug: string;
  category: 'Curriculum & Pedagogy' | 'NEP 2020 Insights' | 'Industry Trends' | 'Institutional Development';
  readTime: string;
  publishDate: string;
  excerpt: string;
  content: string[];
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
  institution: string;
  badge: 'Institutional Partner' | 'Academic Leader' | 'Faculty Member' | 'Corporate L&D' | 'Student Readiness';
  isVerifiedPlaceholder: boolean;
}

export interface ImpactStat {
  value: string;
  label: string;
  subtext: string;
  note: string;
}

export const BRAND_INFO = {
  name: 'Skill Mantra Academy',
  tagline: 'Learn Today • Build Tomorrow',
  positioning: 'A professional education and skill-development organization connecting learners, institutions, and industry through practical, industry-relevant training.',
  contactEmail: 'contact@skillmantraacademy.com', // Replace with verified client email
  contactPhone: '+91 (0) 98765 43210', // Replace with verified client phone
  officeLocation: 'Tamil Nadu & Pan-India Institutional Network',
  accreditationNote: 'Designed in alignment with AICTE, UGC guidelines, and National Education Policy (NEP 2020) skill framework.',
};

export const NAVIGATION_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/about' },
  { name: 'Programs', href: '/programs' },
  { name: 'For Institutions', href: '/for-institutions' },
  { name: 'For Corporates', href: '/for-corporates' },
  { name: 'Faculty Development', href: '/faculty-development' },
  { name: 'Student Development', href: '/student-development' },
  { name: 'Resources', href: '/resources' },
  { name: 'Events', href: '/events' },
  { name: 'Contact', href: '/contact' },
];

export const TRUST_PILLARS = [
  {
    title: 'Higher-Education Institutions',
    description: 'Engineering colleges, Arts & Science institutions, and Universities seeking structured skill programs.',
    badge: 'Institutional Training',
  },
  {
    title: 'Academic Faculty & HODs',
    description: 'Faculty Development Programs (FDP) modernizing pedagogy with current industry technologies.',
    badge: 'Faculty Empowerment',
  },
  {
    title: 'Students & Graduates',
    description: 'Outcome-driven technical training moving from theoretical concepts to deployable industry projects.',
    badge: 'Student Readiness',
  },
  {
    title: 'Corporate & L&D Teams',
    description: 'Tailored technology upskilling, lateral hire bootcamps, and foundational digital training modules.',
    badge: 'Corporate Upskilling',
  },
];

export const SERVICE_AREAS = [
  {
    id: 'student-skills',
    title: 'Student Skill Development',
    shortDesc: 'Structured, hands-on technology courses and problem-solving tracks bridging campus curriculum with industry expectations.',
    highlights: ['Hands-on laboratory sessions', 'Mini and capstone projects', 'Rigorous problem-solving assessments'],
    href: '/student-development',
  },
  {
    id: 'fdp',
    title: 'Faculty Development Programs (FDP)',
    shortDesc: 'Specialized technology and pedagogy programs empowering professors and lecturers with emerging industry frameworks.',
    highlights: ['Emerging tech toolkits', 'Industry-vetted curriculum insights', 'Hands-on implementation labs'],
    href: '/faculty-development',
  },
  {
    id: 'institutional-collab',
    title: 'Institutional Training & MoUs',
    shortDesc: 'End-to-end partnership programs designed for engineering & science colleges including workshops, semester tracks, and bootcamps.',
    highlights: ['Custom semester-aligned tracks', 'Center of Excellence (CoE) guidance', 'Structured outcome reporting'],
    href: '/for-institutions',
  },
  {
    id: 'corporate-upskilling',
    title: 'Corporate Upskilling & Team Training',
    shortDesc: 'Role-based technology training designed for corporate teams, new hire onboarding, and lateral transformation.',
    highlights: ['Tailored enterprise syllabus', 'Real-world project simulations', 'Flexible delivery formats'],
    href: '/for-corporates',
  },
  {
    id: 'employability-readiness',
    title: 'Career & Employability Readiness',
    shortDesc: 'Comprehensive preparation combining technical competence, architectural thinking, and professional communication.',
    highlights: ['Technical interview prep', 'Code review & git workflows', 'Professional presentation skills'],
    href: '/programs',
  },
];

export const PROGRAMS_DATA: Program[] = [
  {
    id: 'prog-fullstack-web',
    name: 'Full-Stack Modern Web Engineering',
    slug: 'fullstack-web-engineering',
    category: 'Technology',
    audience: 'Engineering Students, Polytechnic & IT Graduates',
    deliveryMode: 'Blended Learning',
    duration: '60 - 90 Hours',
    description: 'Comprehensive program covering modern frontend architecture, backend RESTful/GraphQL APIs, database modeling, and cloud deployment practices.',
    curriculumHighlights: [
      'HTML5, Modern CSS, Responsive Design Systems',
      'JavaScript (ES6+) & TypeScript Core',
      'React Architecture, State Management & Hooks',
      'Node.js, Express & REST API Architecture',
      'Relational (PostgreSQL/MySQL) & NoSQL (MongoDB) Modeling',
      'Git workflows, CI/CD basics & Vercel/Cloud deployment',
    ],
    prerequisites: 'Basic understanding of programming fundamentals and logic.',
    targetOutcome: 'Ability to architect, build, and deploy production-grade multi-tier web applications with real-world authentication and data handling.',
  },
  {
    id: 'prog-python-data',
    name: 'Data Analytics & Applied Python',
    slug: 'data-analytics-applied-python',
    category: 'Data & AI',
    audience: 'Students, Faculty & Research Scholars',
    deliveryMode: 'Instructor-Led Bootcamp',
    duration: '45 - 60 Hours',
    description: 'Practical data processing, statistical visualization, SQL analysis, and business intelligence reporting for decision-making and academic research.',
    curriculumHighlights: [
      'Python for Data Science (NumPy, Pandas, Vectorization)',
      'Exploratory Data Analysis (EDA) & Matplotlib/Seaborn',
      'Advanced SQL queries, window functions & aggregation',
      'Interactive Dashboarding with Power BI & Tableau',
      'Real-world business case studies (retail, logistics, education)',
      'Introduction to predictive modeling concepts',
    ],
    prerequisites: 'Foundational mathematics and basic analytical reasoning.',
    targetOutcome: 'Proficiency in data cleaning, exploratory analysis, SQL database interrogation, and executive visualization.',
  },
  {
    id: 'prog-ai-ml-foundations',
    name: 'Artificial Intelligence & Machine Learning Foundations',
    slug: 'ai-ml-foundations',
    category: 'Data & AI',
    audience: 'CSE/IT Students, Faculty Members & Engineers',
    deliveryMode: 'Blended Learning',
    duration: '60 Hours',
    description: 'Mathematics, algorithmic intuition, and supervised/unsupervised machine learning implementations with Scikit-learn and introductory neural networks.',
    curriculumHighlights: [
      'Linear Algebra & Probability for Machine Learning',
      'Supervised Algorithms: Regression, Trees, Ensemble Methods',
      'Unsupervised Clustering & Dimensionality Reduction (PCA)',
      'Model Evaluation, Cross-Validation & Hyperparameter Tuning',
      'Introduction to Deep Learning with PyTorch/TensorFlow',
      'Responsible AI & Ethical ML deployment considerations',
    ],
    prerequisites: 'Intermediate Python programming and linear algebra basics.',
    targetOutcome: 'End-to-end ML pipeline creation from raw datasets to evaluated, deployable predictive models.',
  },
  {
    id: 'prog-cloud-devops',
    name: 'Cloud Infrastructure & DevOps Fundamentals',
    slug: 'cloud-devops-fundamentals',
    category: 'Cloud & DevOps',
    audience: 'Students, System Administrators & Corporate Teams',
    deliveryMode: 'On-Campus Workshop',
    duration: '40 - 50 Hours',
    description: 'Hands-on cloud architecture on AWS/Azure, Linux systems administration, containerization with Docker, and automated CI/CD pipelines.',
    curriculumHighlights: [
      'Linux command-line mastery, shell scripting & networking',
      'Core Cloud Concepts: Compute (EC2), Storage (S3), Virtual Networks',
      'Docker Containerization, Multi-stage builds & Compose',
      'Introduction to Container Orchestration (Kubernetes)',
      'Continuous Integration with GitHub Actions',
      'Infrastructure as Code (IaC) principles',
    ],
    prerequisites: 'Basic knowledge of operating systems and networking.',
    targetOutcome: 'Ability to containerize software, configure cloud virtual environments, and automate deployment workflows.',
  },
  {
    id: 'prog-cybersecurity',
    name: 'Cybersecurity & Network Defense Fundamentals',
    slug: 'cybersecurity-network-defense',
    category: 'Cybersecurity',
    audience: 'Engineering Students, Faculty & IT Staff',
    deliveryMode: 'Instructor-Led Bootcamp',
    duration: '45 Hours',
    description: 'Practical security methodologies covering network protocols, vulnerability assessment, web application security (OWASP Top 10), and ethical defense.',
    curriculumHighlights: [
      'Networking Protocols, Packet Analysis (Wireshark) & Firewalls',
      'OWASP Top 10 Web Application Vulnerabilities & Remediation',
      'Reconnaissance, Port Scanning & Nmap practicals',
      'Cryptography Fundamentals & Public Key Infrastructure (PKI)',
      'Secure Coding Guidelines for Modern Software',
      'Security compliance, ethical guidelines & cyber laws',
    ],
    prerequisites: 'Familiarity with computer networks and basic programming.',
    targetOutcome: 'Competence in identifying system vulnerabilities, running diagnostic scans, and applying defensive hardening.',
  },
  {
    id: 'prog-ui-ux-design',
    name: 'Digital Product Design & UI/UX Systems',
    slug: 'ui-ux-product-design',
    category: 'Design & Digital',
    audience: 'Design Enthusiasts, CS Students & Professionals',
    deliveryMode: 'On-Campus Workshop',
    duration: '35 - 45 Hours',
    description: 'User-centered design principles, wireframing, high-fidelity prototyping in Figma, typography, and scalable design token systems for digital products.',
    curriculumHighlights: [
      'User Research, Persona Modeling & User Journey Mapping',
      'Information Architecture & Wireframing Low-Fidelity Layouts',
      'Figma Mastery: Auto-Layout, Components & Design Tokens',
      'Typography, Color Psychology & Accessibility (WCAG 2.2 AA)',
      'Interactive Prototyping, Micro-interactions & User Testing',
      'Design handoff to engineering teams',
    ],
    prerequisites: 'No prior coding experience required; curiosity for design and problem solving.',
    targetOutcome: 'A complete portfolio-ready case study and high-fidelity interactive prototype ready for developer implementation.',
  },
  {
    id: 'prog-campus-corporate',
    name: 'Campus to Corporate: Professional & Placement Readiness',
    slug: 'campus-to-corporate-readiness',
    category: 'Professional Skills',
    audience: 'Pre-final & Final Year College Students',
    deliveryMode: 'On-Campus Workshop',
    duration: '30 - 40 Hours',
    description: 'Holistic career readiness program strengthening technical communication, aptitude problem solving, GD mastery, and technical interview confidence.',
    curriculumHighlights: [
      'Structured Technical Communication & Email Etiquette',
      'Quantitative Aptitude & Logical Reasoning Frameworks',
      'Group Discussion (GD) Tactics, Articulation & Body Language',
      'Resume Engineering for Applicant Tracking Systems (ATS)',
      'Technical Interview Mock Sessions & Coding Whiteboarding',
      'Workplace professionalism and continuous learning mindset',
    ],
    prerequisites: 'Open to undergraduate and postgraduate students preparing for placements.',
    targetOutcome: 'Elevated confidence and polished communication in institutional placement drives and corporate interviews.',
  },
];

export const INSTITUTIONAL_SERVICES = [
  {
    title: 'Curriculum-Aligned Technical Workshops',
    description: '2 to 5-day intense immersion workshops focused on high-demand technical skills to complement university syllabus.',
    scope: 'Engineering & Arts/Science colleges',
  },
  {
    title: 'Semester-Long Skill Integration',
    description: 'Structured weekend or elective modules running across academic semesters with project milestones and graded evaluations.',
    scope: 'Degree programs & Autonomous Colleges',
  },
  {
    title: 'Faculty Development Programs (FDP)',
    description: 'Upskilling academic faculty on cutting-edge industry software tools, pedagogy modernization, and research methodologies.',
    scope: 'Department-wide & Inter-college faculties',
  },
  {
    title: 'Center of Excellence (CoE) Collaboration',
    description: 'Advisory and training support to help institutions establish specialized lab environments in Cloud, AI, and Full-Stack.',
    scope: 'Forward-thinking academic campuses',
  },
  {
    title: 'Hackathons & Technical Symposia',
    description: 'Organization, problem formulation, mentoring, and judging of institutional hackathons and coding tournaments.',
    scope: 'College tech fests & campus-wide events',
  },
  {
    title: 'Pre-Placement Technical Bootcamps',
    description: 'Rigorous intensive coding camps for pre-final and final year batches preceding campus placement cycles.',
    scope: 'Placement & Training (PAT) departments',
  },
];

export const INSTITUTION_PROCESS_STEPS = [
  {
    step: '01',
    title: 'Requirement & Gap Analysis',
    desc: 'We consult with the Principal, Dean, HOD, and Placement team to assess student skill baselines and institutional goals.',
  },
  {
    step: '02',
    title: 'Tailored Curriculum Design',
    desc: 'A customized syllabus is structured with appropriate durations, lab exercises, and domain-aligned project milestones.',
  },
  {
    step: '03',
    title: 'Expert Practitioner Delivery',
    desc: 'Sessions are delivered by experienced industry trainers using live coding, interactive demonstrations, and mentoring.',
  },
  {
    step: '04',
    title: 'Continuous Rigorous Assessment',
    desc: 'Learners complete lab tasks, coding evaluations, and capstone projects under direct mentor feedback.',
  },
  {
    step: '05',
    title: 'Outcome & Placement Reporting',
    desc: 'Comprehensive performance analytics, attendance metrics, and skill-gap documentation are submitted to the college leadership.',
  },
];

export const TRAINING_METHODOLOGY = [
  {
    number: '01',
    name: 'Understand',
    summary: 'Identify the exact academic or business objective, student baseline, and required skill outcomes.',
  },
  {
    number: '02',
    name: 'Design',
    summary: 'Structure an industry-vetted curriculum with modular topics, lab exercises, and evaluative milestones.',
  },
  {
    number: '03',
    name: 'Deliver',
    summary: 'Conduct high-energy, practitioner-led sessions combining theory with live practical implementation.',
  },
  {
    number: '04',
    name: 'Practice',
    summary: 'Reinforce learning through active lab assignments, code challenges, and real-world project simulations.',
  },
  {
    number: '05',
    name: 'Assess',
    summary: 'Evaluate practical application through automated test cases, code reviews, and viva discussions.',
  },
  {
    number: '06',
    name: 'Improve',
    summary: 'Provide constructive feedback, personalized learning recommendations, and continuous progression support.',
  },
];

export const TECHNOLOGY_DOMAINS = [
  {
    category: 'Programming & Foundations',
    description: 'Algorithmic thinking, object-oriented concepts, and clean coding standards.',
    technologies: ['Python', 'Java', 'C / C++', 'JavaScript (ES6+)', 'TypeScript', 'SQL'],
  },
  {
    category: 'Data & Artificial Intelligence',
    description: 'Data wrangling, statistical discovery, machine learning models, and BI reporting.',
    technologies: ['Data Analytics', 'Pandas & NumPy', 'Machine Learning', 'Power BI', 'SQL Server / PostgreSQL', 'PyTorch / TensorFlow'],
  },
  {
    category: 'Cloud & Infrastructure',
    description: 'Scalable deployment, virtualization, containerization, and automated workflows.',
    technologies: ['AWS Essentials', 'Microsoft Azure', 'Linux Systems', 'Docker Containers', 'Git & GitHub Actions', 'CI/CD Pipelines'],
  },
  {
    category: 'Cybersecurity & Defense',
    description: 'Vulnerability discovery, network protocols, defensive architecture, and application security.',
    technologies: ['Network Protocols', 'OWASP Security', 'Vulnerability Assessment', 'Cryptography Basics', 'Wireshark Analysis'],
  },
  {
    category: 'Web & Digital Architecture',
    description: 'User interface development, full-stack systems, modern APIs, and responsive design.',
    technologies: ['React.js', 'Next.js', 'Node.js & Express', 'Tailwind CSS', 'RESTful APIs', 'Figma & UI/UX'],
  },
];

// Admin/CMS note: These initial statistics are placeholders as instructed by guidelines.
// "Replace placeholder statistics only after client verification."
export const IMPACT_STATISTICS: ImpactStat[] = [
  {
    value: '[XX]+',
    label: 'Structured Programs',
    subtext: 'Delivered across technical and professional skill domains',
    note: 'Initial placeholder — pending verified client data',
  },
  {
    value: '[XX]+',
    label: 'Learners Engaged',
    subtext: 'Engineering students, polytechnic graduates & faculty participants',
    note: 'Initial placeholder — pending verified client data',
  },
  {
    value: '[XX]+',
    label: 'Institutional Engagements',
    subtext: 'Workshops, FDPs & customized campus training modules',
    note: 'Initial placeholder — pending verified client data',
  },
  {
    value: '[XX]+',
    label: 'Training Delivery Hours',
    subtext: 'Practical hands-on lab sessions & practitioner-led seminars',
    note: 'Initial placeholder — pending verified client data',
  },
];

export const FOUNDER_INFO = {
  name: '[LEAD TRAINER / FOUNDER]',
  title: 'Founder & Lead Technical Trainer',
  organization: 'Skill Mantra Academy',
  bio: "With professional experience delivering training programs across the higher-education and skill-development ecosystem, the founder established Skill Mantra Academy to bridge the critical gap between academic curricula and industry readiness. The academy's pedagogy centers on practical, hands-on learning, real-world engineering discipline, and measurable learning outcomes.",
  trainingExpertise: [
    'Institutional Technical Training & Bootcamp Architecture',
    'Faculty Development Programs (FDP) in Modern Technologies',
    'Full-Stack Web Technologies, Database Architecture & Python Ecosystem',
    'Placement-Oriented Problem Solving & Technical Aptitude Development',
    'Curriculum Alignment for Engineering & Polytechnic Colleges',
  ],
  pedagogyQuote: 'Education must translate into capability. When learners are empowered to build real systems, academic knowledge transforms into career confidence.',
  editorNote: 'Founder name, formal qualifications, and verified institutional track record to be updated upon final client review.',
};

export const EVENTS_DATA: EventItem[] = [
  {
    id: 'evt-01',
    title: 'Modern Full-Stack Engineering Faculty Development Program',
    slug: 'modern-fullstack-fdp',
    category: 'Faculty Development',
    date: 'Upcoming • Next Cohort',
    mode: 'Hybrid (Campus + Virtual Lab)',
    location: 'Regional Engineering Institutions',
    targetAudience: 'CSE, IT & MCA Faculty Members',
    description: 'An intensive 5-day faculty empowerment program covering modern TypeScript, React ecosystem, and microservice backend architecture for academic instructors.',
    isUpcoming: true,
  },
  {
    id: 'evt-02',
    title: 'Institutional Technical Immersion: Cloud & Containers Workshop',
    slug: 'cloud-containers-immersion',
    category: 'Technical Workshop',
    date: 'Institutional Booking Open',
    mode: 'On-Campus Hands-on Lab',
    location: 'Host Campus / Partner Colleges',
    targetAudience: 'Pre-final & Final Year Engineering Batches',
    description: '3-day practical workshop where students containerize full-stack applications with Docker, deploy to cloud instances, and configure automated GitHub CI/CD.',
    isUpcoming: true,
  },
  {
    id: 'evt-03',
    title: 'Data Analytics & Business Intelligence for Engineering Faculty',
    slug: 'data-analytics-bi-fdp',
    category: 'Faculty Development',
    date: 'Quarterly Academic Series',
    mode: 'Interactive Hands-on Seminar',
    location: 'Academic Partner Campuses',
    targetAudience: 'Academic Faculty & Research Scholars',
    description: 'Hands-on curriculum exploring exploratory data analysis with Python, Power BI visualization, and real-world case studies for university educators.',
    isUpcoming: false,
  },
];

export const TESTIMONIALS_DATA: TestimonialItem[] = [
  {
    id: 'test-01',
    quote: 'The structured approach to technical training and hands-on lab sessions provided our students with the exact practical clarity needed before campus placement drives.',
    author: '[Verified Representative]',
    role: 'Head of Department / Placement Director',
    institution: 'Partner Engineering College',
    badge: 'Institutional Partner',
    isVerifiedPlaceholder: true,
  },
  {
    id: 'test-02',
    quote: 'The Faculty Development Program bridged industry practices with our classroom syllabus. The live demonstrations and code walkthroughs were exceptionally well-structured.',
    author: '[Verified Academic Leader]',
    role: 'Professor & Dean of Computing',
    institution: 'Autonomous Engineering Institution',
    badge: 'Faculty Member',
    isVerifiedPlaceholder: true,
  },
  {
    id: 'test-03',
    quote: 'Rather than passive slides, every session required us to write code, debug errors, and deploy. It completely transformed how I approach software development.',
    author: '[Verified Student Participant]',
    role: 'Computer Science Graduate',
    institution: 'College of Engineering & Technology',
    badge: 'Student Readiness',
    isVerifiedPlaceholder: true,
  },
];

export const RESOURCES_DATA: ResourceArticle[] = [
  {
    id: 'res-01',
    title: 'Bridging the Campus-to-Industry Divide: A Blueprint for Engineering Colleges',
    slug: 'campus-to-industry-divide-blueprint',
    category: 'Curriculum & Pedagogy',
    readTime: '6 min read',
    publishDate: 'Academic Insight',
    excerpt: 'How institutions can integrate hands-on technology tracks into standard semesters without overloading the core university syllabus.',
    content: [
      'The modern engineering ecosystem requires students who can not only recite theoretical algorithms but also implement, debug, and deploy reliable software systems.',
      'By establishing modular weekend or evening technical immersion tracks, colleges can maintain academic compliance while granting students tangible project portfolios.',
      'Direct collaboration with industry trainers provides students with real-world code review standards and modern tooling familiarity.',
    ],
  },
  {
    id: 'res-02',
    title: 'Empowering Faculty as the Catalysts of Emerging Technology Education',
    slug: 'empowering-faculty-emerging-technology',
    category: 'NEP 2020 Insights',
    readTime: '5 min read',
    publishDate: 'Institutional Paper',
    excerpt: 'Why continuous faculty upskilling is the single most cost-effective lever for improving campus placement quality and student engagement.',
    content: [
      'While student workshops offer immediate localized impact, upskilling faculty members multiplies that benefit across multiple student batches year after year.',
      'Faculty development programs (FDPs) focused on applied implementations help professors incorporate modern case studies into routine laboratory curricula.',
      'Skill Mantra Academy designs FDPs specifically tailored to academic schedules and research priorities.',
    ],
  },
  {
    id: 'res-03',
    title: 'From Code Syntax to System Architecture: Preparing Students for Modern Interviews',
    slug: 'preparing-students-modern-interviews',
    category: 'Industry Trends',
    readTime: '7 min read',
    publishDate: 'Employability Series',
    excerpt: 'Why top recruiters have shifted from memorized syntax questions to system design, git discipline, and problem-solving reasoning.',
    content: [
      'Campus recruiters increasingly report that candidates can write simple loops but struggle when tasked with integrating an API or structuring database schemas.',
      'Our student training methodology emphasizes the "Learn -> Practice -> Build -> Apply -> Assess -> Improve" continuum to build true developer intuition.',
      'Exposure to collaborative tools such as Git, Docker, and API testing tools prepares graduates for seamless corporate onboarding.',
    ],
  },
];
