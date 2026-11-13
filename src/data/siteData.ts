/**
 * Skillthinker Solutions — Official Business Data Store
 * Source: https://www.skillthinker.com/ (Exact verbatim content)
 * Location: H274, First Floor, Phase 1, Anna Nagar, Trichy – 620026
 */

export interface Program {
  id: string;
  name: string;
  slug: string;
  category: string;
  level: string;
  deliveryMode: string;
  durationEstimate: string;
  shortDesc: string;
  curriculumHighlights: string[];
  targetOutcome: string;
  idealFor: string;
  duration?: string;
  description?: string;
  audience?: string;
  prerequisites?: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  linkText?: string;
  linkHref?: string;
}

export interface AudienceGroup {
  id: string;
  title: string;
  description: string;
}

export interface LearningStep {
  step: string;
  title: string;
  description: string;
}

export interface CoreValue {
  title: string;
  description: string;
}

export const BRAND_INFO = {
  legalName: 'Skillthinker Solutions',
  name: 'Skillthinker Solutions',
  shortName: 'Skillthinker',
  tagline: 'Learn Today • Build Tomorrow',
  subtitle: 'practical, industry-relevant training for students, graduates, and working professionals.',
  heroHeadline: 'The right skills can transform your career.',
  heroSubheadline:
    'Our training programs are designed to help students, graduates, and working professionals develop practical, industry-relevant skills and prepare for the demands of the modern workplace.',
  positioning:
    'Skillthinker Solutions is a premier learning and professional development institution dedicated to empowering individuals with the skills, knowledge, and confidence needed to succeed in today\'s dynamic and competitive world.',
  aboutStoryP1:
    'Skillthinker Solutions is a premier learning and professional development institution dedicated to empowering individuals with the skills, knowledge, and confidence needed to succeed in today\'s dynamic and competitive world.',
  aboutStoryP2:
    'Founded with a vision to bridge the gap between education and industry requirements, we offer high-quality training programs that combine theoretical knowledge with practical, real-world application — helping learners develop job-ready skills, enhance their professional capabilities, and achieve their career aspirations. We serve students, fresh graduates, working professionals, and aspiring entrepreneurs through industry-relevant courses, expert-led training, hands-on projects, and career development initiatives.',
  missionSubtitle: 'Accessible, meaningful skill development',
  mission:
    'To make quality skill development accessible and meaningful for learners by providing structured training, practical exposure, expert guidance, and continuous support.',
  visionSubtitle: 'A trusted center of excellence',
  vision:
    'To become a trusted center of excellence in learning and skill development, transforming lives through quality education, innovation, and continuous growth.',
  aboutQuote: '“Learn with purpose. Practice with confidence. Grow with Skillthinker.”',
  trainerQuote: '“Learn from experts. Practice with guidance. Grow with confidence.”',
  contactEmail: 'info@skillthinker.com',
  contactPhone: '+91 94426 05096',
  whatsappNumber: '+919442605096',
  whatsappLink: 'https://wa.me/919442605096?text=Hi%20Skillthinker%2C%20I%20would%20like%20to%20know%20more%20about%20your%20training%20programs.',
  officeLocation: 'H274, First Floor, Phase 1, Anna Nagar, Trichy – 620026',
  address: {
    street: 'H274, First Floor, Phase 1',
    area: 'Anna Nagar',
    city: 'Trichy',
    pincode: '620026',
    state: 'Tamil Nadu',
    country: 'India',
  },
  accreditationNote: 'All certificates issued include a unique verifiable ID verifiable online.',
};

export const HERO_HIGHLIGHTS = [
  'Industry-relevant and practical training',
  'Experienced trainers and mentors',
  'Hands-on learning and real-world projects',
  'Personalized guidance and support',
  'Certification upon successful completion',
];

export const HERO_STATS = [
  { value: '10', label: 'Industry-Relevant Programs', subtext: 'Curated technical tracks' },
  { value: '3', label: 'Certificate Tiers', subtext: 'Bronze to Gold merit levels' },
  { value: '5', label: 'Step Guided Learning Journey', subtext: 'Enroll to certificate' },
  { value: '100%', label: 'Verifiable Digital Certificates', subtext: 'Unique certificate ID' },
];

export const WHY_CHOOSE_ITEMS = [
  {
    title: 'Industry-relevant and practical training',
    desc: 'Courses structured around modern industry tooling, active paradigms, and practical execution.',
  },
  {
    title: 'Experienced trainers and mentors',
    desc: 'Learn directly from seasoned mentors who bring deep software and domain experience to the classroom.',
  },
  {
    title: 'Hands-on learning and real-world projects',
    desc: 'Apply theoretical understanding through live coding, assignments, and real-world project portfolios.',
  },
  {
    title: 'Career-focused skill development',
    desc: 'Curriculum designed to build competencies that recruiters and technical teams actively look for.',
  },
  {
    title: 'Personalized guidance and support',
    desc: 'Individual attention, question resolution, and constructive feedback throughout your learning path.',
  },
  {
    title: 'Certification upon successful completion',
    desc: 'Earn a recognized Bronze, Silver, or Gold digital certificate backed by an online verification ID.',
  },
  {
    title: 'Interview and career preparation',
    desc: 'Dedicated placement training covering quantitative aptitude, reasoning, group discussions, and mock interviews.',
  },
];

export const CORE_VALUES: CoreValue[] = [
  {
    title: 'Quality',
    description: 'We focus on delivering meaningful and effective learning experiences.',
  },
  {
    title: 'Practical Learning',
    description: 'We encourage learners to apply knowledge through practical activities and projects.',
  },
  {
    title: 'Growth',
    description: 'We promote continuous improvement and lifelong learning.',
  },
  {
    title: 'Integrity',
    description: 'We believe in transparent, responsible, and learner-focused education.',
  },
  {
    title: 'Excellence',
    description: 'We encourage every learner to aim higher and achieve their potential.',
  },
];

export const TARGET_AUDIENCES: AudienceGroup[] = [
  {
    id: 'students',
    title: 'Students',
    description: 'Build a strong technical foundation alongside your degree, with structured, easy-to-follow learning paths.',
  },
  {
    id: 'graduates',
    title: 'Fresh Graduates',
    description: 'Sharpen placement-ready skills — aptitude, technical depth, and interview confidence — before you enter the job market.',
  },
  {
    id: 'professionals',
    title: 'Working Professionals',
    description: 'Upskill or pivot into a new domain with practical, project-driven training designed around a working schedule.',
  },
  {
    id: 'entrepreneurs',
    title: 'Aspiring Entrepreneurs',
    description: 'Pick up the technical and digital marketing skills needed to build, launch, and grow your own ideas.',
  },
];

export const COURSE_FEATURES_LIST = [
  'Structured, easy-to-understand learning',
  'Practical, hands-on training',
  'Projects and assignments',
  'Expert guidance',
  'Career-oriented learning',
  'Certification',
  'Continuous learner support',
];

const RAW_PROGRAMS_DATA: Program[] = [
  {
    id: 'prog-aptitude',
    name: 'Aptitude & Placement Training',
    slug: 'aptitude-placement-training',
    category: 'Placement & Career',
    level: 'All Levels',
    deliveryMode: 'Instructor-Led Live',
    durationEstimate: 'Placement Track',
    shortDesc: 'Quant, verbal, reasoning, GD & interview skills',
    curriculumHighlights: [
      'Quantitative Aptitude',
      'Verbal Ability & English',
      'Logical & Non-Verbal Reasoning',
      'Puzzles & Analytical Thinking',
      'Tabulation, DI & Charts',
      'Company-Specific Prep',
      'GD & Interview Skills',
    ],
    targetOutcome: 'Master campus recruitment tests, technical interviews, and group discussions.',
    idealFor: 'Final-year students & graduates preparing for placements',
  },
  {
    id: 'prog-programming',
    name: 'Programming Fundamentals',
    slug: 'programming-fundamentals',
    category: 'Core Programming',
    level: 'Beginner',
    deliveryMode: 'Hands-on Lab & Mentorship',
    durationEstimate: 'Foundational Track',
    shortDesc: 'C, C++, C#, DSA, OOP',
    curriculumHighlights: [
      'C and C++',
      'C# Programming',
      'Data Structures & Algorithms',
      'Object-Oriented Programming',
      'Problem Solving & Coding Practice',
    ],
    targetOutcome: 'Build strong algorithmic thinking and coding fundamentals.',
    idealFor: 'Beginners starting their programming journey',
  },
  {
    id: 'prog-web',
    name: 'Web & Full Stack Development',
    slug: 'web-full-stack-development',
    category: 'Software Engineering',
    level: 'Beginner to Advanced',
    deliveryMode: 'Hands-on Lab & Mentorship',
    durationEstimate: 'Full Stack Track',
    shortDesc: 'HTML, CSS, JavaScript, React.js, MongoDB',
    curriculumHighlights: [
      'HTML and CSS',
      'JavaScript',
      'React.js',
      'MongoDB',
      'Full Stack Project Development',
    ],
    targetOutcome: 'Develop responsive frontend interfaces and complete full stack web applications.',
    idealFor: 'Aspiring front-end & full stack developers',
  },
  {
    id: 'prog-dotnet',
    name: '.NET Development',
    slug: 'dotnet-development',
    category: 'Enterprise Engineering',
    level: 'Intermediate to Advanced',
    deliveryMode: 'Hands-on Lab & Mentorship',
    durationEstimate: 'Enterprise Track',
    shortDesc: 'C#, ASP.NET Core, MVC, EF Core, SQL Server',
    curriculumHighlights: [
      'C# Programming',
      'ASP.NET Core',
      'MVC Architecture',
      'Web API Development',
      'Entity Framework Core',
      'SQL Server',
      'Full Stack .NET Projects',
    ],
    targetOutcome: 'Build enterprise-grade web applications and APIs using the Microsoft .NET ecosystem.',
    idealFor: 'Developers targeting enterprise .NET roles',
  },
  {
    id: 'prog-data',
    name: 'Data Analytics & BI',
    slug: 'data-analytics-bi',
    category: 'Data & Analytics',
    level: 'Beginner to Advanced',
    deliveryMode: 'Hands-on Lab & Mentorship',
    durationEstimate: 'Analytics Track',
    shortDesc: 'Excel, SQL, Power BI, Python, Tableau',
    curriculumHighlights: [
      'Advanced Excel',
      'SQL & Database Concepts',
      'Power BI Desktop',
      'Data Modeling',
      'Dashboard Design',
      'Business Reporting Projects',
      'Data Analytics using Python',
      'Tableau',
    ],
    targetOutcome: 'Transform raw data into insightful, executive dashboards and business reports.',
    idealFor: 'Analysts & BI aspirants who love working with data',
  },
  {
    id: 'prog-ai',
    name: 'AI & Emerging Technologies',
    slug: 'ai-emerging-technologies',
    category: 'AI & Emerging',
    level: 'Intermediate to Advanced',
    deliveryMode: 'Hands-on Lab & Mentorship',
    durationEstimate: 'AI Specialization',
    shortDesc: 'Generative AI, Prompt Engineering, Agentic AI + RAG',
    curriculumHighlights: [
      'Generative AI',
      'Prompt Engineering',
      'Agentic AI + RAG',
      'AI Application Development',
      'N8N (Nodemation)',
    ],
    targetOutcome: 'Create intelligent AI applications using modern prompt engineering, RAG, and automation.',
    idealFor: 'Developers exploring applied AI & automation',
  },
  {
    id: 'prog-database',
    name: 'Database & Backend Technologies',
    slug: 'database-backend-technologies',
    category: 'Backend & Data',
    level: 'Intermediate',
    deliveryMode: 'Hands-on Lab & Mentorship',
    durationEstimate: 'Backend Track',
    shortDesc: 'SQL, MongoDB, database design',
    curriculumHighlights: [
      'SQL',
      'MongoDB',
      'Database Design',
      'Joins, Subqueries & Stored Procedures',
    ],
    targetOutcome: 'Design performant relational and document schemas for production applications.',
    idealFor: 'Backend & database-focused learners',
  },
  {
    id: 'prog-digital-marketing',
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    category: 'Digital & Growth',
    level: 'All Levels',
    deliveryMode: 'Instructor-Led Live',
    durationEstimate: 'Growth Track',
    shortDesc: 'SEO, Google Tag Manager',
    curriculumHighlights: [
      'SEO (Search Engine Optimization)',
      'Google Tag Manager (GTM)',
    ],
    targetOutcome: 'Implement high-impact organic search and analytics tag tracking strategies.',
    idealFor: 'Marketers, business owners & career switchers',
  },
  {
    id: 'prog-java',
    name: 'Java Programming',
    slug: 'java-programming',
    category: 'Software Engineering',
    level: 'Beginner to Advanced',
    deliveryMode: 'Instructor-Led Live',
    durationEstimate: 'Java Track',
    shortDesc: 'Core Java, Collections, Spring Boot, REST',
    curriculumHighlights: [
      'Java Fundamentals',
      'Methods & Recursion',
      'OOP',
      'Exception Handling',
      'Collections Framework',
      'Multithreading & Concurrency',
      'JDBC & Database Connectivity',
      'Spring Framework',
      'Spring Boot',
      'RESTful Web Services',
    ],
    targetOutcome: 'Build robust, scalable enterprise backends using Java and Spring Boot.',
    idealFor: 'Backend developers building with Java & Spring',
  },
  {
    id: 'prog-python',
    name: 'Python Programming',
    slug: 'python-programming',
    category: 'Core Programming',
    level: 'Beginner to Advanced',
    deliveryMode: 'Instructor-Led Live',
    durationEstimate: 'Python Track',
    shortDesc: 'Fundamentals through async IO & frameworks',
    curriculumHighlights: [
      'Python Fundamentals',
      'Python Data Model & Metaprogramming',
      'Advanced Control Flow & Memory Management',
      'Concurrency, Parallelism & Async IO',
      'Enterprise Design & Ecosystem Tools',
      'High-Level Framework Domains',
    ],
    targetOutcome: 'Write clean, modular Python software from foundational scripts to async frameworks.',
    idealFor: 'Python developers at any level, beginner to advanced',
  },
];

export const PROGRAMS_DATA: Program[] = RAW_PROGRAMS_DATA.map((p) => ({
  ...p,
  duration: p.durationEstimate,
  description: p.shortDesc,
  audience: p.idealFor,
  prerequisites: 'Foundational logical thinking',
}));

export const LEARNING_JOURNEY: LearningStep[] = [
  {
    step: '1',
    title: 'Enroll',
    description: 'Choose your program and get your access code from our team.',
  },
  {
    step: '2',
    title: 'Learn',
    description: 'Attend structured, instructor-led sessions built around real concepts.',
  },
  {
    step: '3',
    title: 'Practice',
    description: 'Apply what you\'ve learned through hands-on projects and assignments.',
  },
  {
    step: '4',
    title: 'Assess',
    description: 'Take your course assessment online using your access code.',
  },
  {
    step: '5',
    title: 'Get Certified',
    description: 'Earn a verifiable Skillthinker Solutions certificate on completion.',
  },
];

export const TRAINER_EXPECTATIONS = [
  'Clear and structured explanations',
  'Practical examples',
  'Hands-on guidance',
  'Project support',
  'Individual attention',
  'Career-oriented mentoring',
  'Encouragement to learn and improve',
];

export const FAQS_DATA: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Who can join these programs?',
    answer:
      'Our programs are open to students, fresh graduates, working professionals, and anyone looking to build practical, job-ready skills — regardless of your current background.',
  },
  {
    id: 'faq-2',
    question: 'Do I need prior experience to start?',
    answer:
      'Not for most programs. We structure our courses to build from fundamentals, so beginners are welcome. For more advanced or specialized tracks, our team can help you pick the right starting point.',
  },
  {
    id: 'faq-3',
    question: 'Will I receive a certificate after the course?',
    answer:
      'Yes. After completing a course, you take an online assessment through your access code and receive a Bronze, Silver, or Gold Skillthinker Solutions certificate based on your score — each with its own verifiable certificate ID.',
  },
  {
    id: 'faq-4',
    question: 'How can someone verify my certificate is genuine?',
    answer:
      'Every certificate includes a unique ID and a link to our certificate verification page (/verify), where anyone can confirm it\'s authentic.',
    linkText: 'certificate verification page',
    linkHref: '/verify',
  },
  {
    id: 'faq-5',
    question: 'How do I get an access code for the assessment?',
    answer:
      'Access codes are issued to learners after training, specific to your batch and course. If you haven\'t received yours, reach out to our team using the contact details below.',
  },
  {
    id: 'faq-6',
    question: 'What if I don\'t score well on the assessment?',
    answer:
      'Every completed assessment earns at least a Bronze certificate — there\'s no fail threshold. If you\'d like another attempt to aim for a higher tier, just reach out to your trainer about retaking it.',
  },
  {
    id: 'faq-7',
    question: 'How do I know which course is right for me?',
    answer:
      'Have a look at the Courses section above, or send us an enquiry with your goals — our team will help you pick the right fit.',
    linkText: 'Courses section',
    linkHref: '#courses',
  },
];

export const CERTIFICATE_TIERS = [
  {
    tier: 'Bronze',
    title: 'Bronze Certificate',
    criteria: 'Awarded upon course completion and verified assessment attempt.',
    badgeColor: 'border-amber-700/40 text-amber-800 bg-amber-50',
    description: 'Demonstrates consistent participation and foundational learning completion.',
  },
  {
    tier: 'Silver',
    title: 'Silver Certificate',
    criteria: 'Awarded for strong assessment performance and practical project implementation.',
    badgeColor: 'border-slate-400 text-slate-800 bg-slate-100',
    description: 'Validates independent problem-solving ability and applied technical competence.',
  },
  {
    tier: 'Gold',
    title: 'Gold Certificate',
    criteria: 'Awarded for top-tier assessment scores and exceptional project execution.',
    badgeColor: 'border-yellow-500/60 text-yellow-900 bg-yellow-50',
    description: 'Signifies advanced software capability, high rigor, and placement readiness.',
  },
];

// Compatibility exports for existing routes (/about, /resources)
export const FOUNDER_INFO = {
  name: 'Skillthinker Mentors',
  title: 'Experienced Trainers & Mentors',
  organization: 'Skillthinker Solutions',
  bio: 'A great learning experience starts with the right guidance. At Skillthinker Solutions, our trainers and mentors are committed to making learning practical, understandable, and engaging. They bring knowledge, experience, and a learner-focused approach to the classroom — encouraging questions, practical application, problem-solving, and continuous improvement.',
  trainingExpertise: [
    'Aptitude & Placement Training',
    'Programming Fundamentals (C, C++, C#, DSA, OOP)',
    'Web & Full Stack Development (React, Node, MongoDB)',
    'Enterprise .NET & Java Spring Boot',
    'Data Analytics & Power BI',
    'AI & Emerging Technologies (GenAI, RAG, Agentic AI)',
  ],
  pedagogyQuote: '“Learn from experts. Practice with guidance. Grow with confidence.”',
  editorNote: 'Official trainer ethos of Skillthinker Solutions, Trichy.',
};

export const RESOURCES_DATA = [
  {
    id: 'res-01',
    title: 'The right skills can transform your career.',
    slug: 'right-skills-transform-career',
    category: 'Career Growth',
    readTime: '4 min read',
    publishDate: 'Skillthinker Guide',
    excerpt: 'Our training programs are designed to help students, graduates, and working professionals develop practical, industry-relevant skills.',
    content: [
      'Skillthinker Solutions offers high-quality training programs that combine theoretical knowledge with practical, real-world application.',
      'From enrollment to certificate, step by step with experienced mentors.',
    ],
  },
];

export const EVENTS_DATA = [
  {
    id: 'evt-01',
    title: 'Web & Full Stack Development Batch',
    slug: 'web-full-stack-batch',
    category: 'Technical Workshop',
    date: 'Upcoming Batch Open',
    mode: 'Instructor-Led Live',
    location: 'Trichy Training Center / Online',
    targetAudience: 'Students & Graduates',
    description: 'HTML, CSS, JavaScript, React.js, and MongoDB with practical project development.',
    isUpcoming: true,
  },
];

export const IMPACT_STATISTICS = HERO_STATS.map((s) => ({
  ...s,
  note: 'Official Skillthinker Solutions benchmark',
}));

export const INSTITUTIONAL_SERVICES = [
  {
    title: 'Practical, Hands-on Training',
    description: 'Structured courses designed to build job-ready skills through real projects.',
    scope: 'Students & Working Professionals',
  },
];

export const INSTITUTION_PROCESS_STEPS = [
  { step: '01', title: 'Enroll', desc: 'Choose your program and get your access code.' },
  { step: '02', title: 'Learn', desc: 'Attend structured, instructor-led sessions.' },
  { step: '03', title: 'Practice', desc: 'Hands-on projects and assignments.' },
  { step: '04', title: 'Assess', desc: 'Take your course assessment online.' },
  { step: '05', title: 'Get Certified', desc: 'Earn a verifiable certificate.' },
];

export const TECHNOLOGY_DOMAINS = [
  {
    category: 'Courses',
    description: '10 Industry-relevant training programs',
    technologies: ['Full Stack Web', '.NET Core', 'Java & Spring', 'Python', 'Data Analytics', 'Generative AI', 'Databases', 'Digital Marketing'],
  },
];

export const TESTIMONIALS_DATA = [
  {
    id: 'test-01',
    quote: 'The right skills can transform your career. Practical training with real projects built my confidence.',
    author: 'Enrolled Learner',
    role: 'Software Developer Aspirant',
    institution: 'Skillthinker Solutions',
    badge: 'Verified Learner',
    isVerifiedPlaceholder: false,
  },
];

export const TRAINING_METHODOLOGY = LEARNING_JOURNEY.map((j) => ({
  number: '0' + j.step,
  name: j.title,
  summary: j.description,
}));

export const TRUST_PILLARS = TARGET_AUDIENCES.map((a) => ({
  title: a.title,
  description: a.description,
  badge: 'Audience Track',
}));

export const SERVICE_AREAS = RAW_PROGRAMS_DATA.slice(0, 4).map((p) => ({
  id: p.id,
  title: p.name,
  shortDesc: p.shortDesc,
  highlights: p.curriculumHighlights.slice(0, 3),
  href: '/#courses',
}));
export const NAVIGATION_LINKS = [
  { name: 'Home', href: '/' },
  { name: 'About', href: '/#about' },
  { name: 'Courses', href: '/#courses' },
  { name: 'Who We Serve', href: '/#who-we-serve' },
  { name: 'How It Works', href: '/#how-it-works' },
  { name: 'Trainers', href: '/#trainers' },
  { name: 'FAQ', href: '/#faq' },
  { name: 'Contact', href: '/#contact' },
];
