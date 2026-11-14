'use client';

import React, { useState } from 'react';
import { ArrowRight, Laptop, Clock, CheckCircle2, Award, MessageCircle, Sparkles, Terminal, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { useAdvisorModal } from '@/components/ui/AdvisorModal';
import TechLogo from '@/components/ui/TechLogos';

interface MasterTrack {
  id: string;
  number: string;
  name: string;
  shortName: string;
  category: string;
  logoKey: string;
  duration: string;
  mode: string;
  tagline: string;
  description: string;
  codeFilename: string;
  codeSnippet: string;
  deliverables: string[];
  techStack: string[];
  idealFor: string;
}

const MASTER_TRACKS: MasterTrack[] = [
  {
    id: 'prog-java',
    number: '01',
    name: 'Java Programming',
    shortName: 'Java',
    category: 'Enterprise Engineering',
    logoKey: 'java',
    duration: '8–12 Weeks',
    mode: 'Instructor-Led Live & Lab',
    tagline: 'Enterprise Backend & Microservices Architecture',
    description:
      'Engineer robust, scalable backends using modern Java and Spring Boot. Learn multi-threading, concurrency, Spring Data JPA, Hibernate, and containerized microservice architectures built for enterprise production.',
    codeFilename: 'OrderServiceController.java',
    codeSnippet: `@RestController
@RequestMapping("/api/v1/orders")
public class OrderServiceController {

  @Autowired
  private OrderService orderService;

  @PostMapping("/checkout")
  @ResponseStatus(HttpStatus.CREATED)
  public CompletableFuture<OrderReceipt> processOrder(
      @Valid @RequestBody CheckoutPayload payload) {
    return orderService.executeTransactionalOrder(payload)
      .thenApply(OrderReceipt::fromEntity);
  }
}`,
    deliverables: [
      'Spring Boot RESTful microservices with JWT auth',
      'Hibernate ORM & relational SQL persistence',
      'Multi-threaded concurrent task executors',
    ],
    techStack: ['Java 21', 'Spring Boot', 'Hibernate', 'REST APIs', 'JDBC', 'Maven', 'Docker'],
    idealFor: 'Developers aiming for senior enterprise Java backend roles.',
  },
  {
    id: 'prog-python',
    number: '02',
    name: 'Python Programming',
    shortName: 'Python',
    category: 'Core Programming',
    logoKey: 'python',
    duration: '8–12 Weeks',
    mode: 'Instructor-Led Live & Lab',
    tagline: 'Advanced Python, Async IO & Software Engineering',
    description:
      'From foundational scripting to advanced asynchronous frameworks, OOP metaprogramming, and automated workflows. Write idiomatic, production-grade Python that powers modern backends and data pipelines.',
    codeFilename: 'async_worker.py',
    codeSnippet: `import asyncio
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel

app = FastAPI(title="Skillthinker Pipeline")

class TaskPayload(BaseModel):
    task_id: str
    priority: int = 1

@app.post("/tasks/execute")
async def run_pipeline(payload: TaskPayload):
    # Asynchronous non-blocking worker queue
    result = await asyncio.gather(
        fetch_remote_data(payload.task_id),
        execute_data_transform(payload.priority)
    )
    return {"status": "success", "metrics": result}`,
    deliverables: [
      'Asynchronous web backends with FastAPI & AsyncIO',
      'Advanced OOP, dunder protocols & decorators',
      'Automated data ingestion and API pipelines',
    ],
    techStack: ['Python 3', 'Async IO', 'FastAPI', 'OOP Models', 'Decorators', 'Pydantic'],
    idealFor: 'Students & engineers seeking deep Python fluency.',
  },
  {
    id: 'prog-web',
    number: '03',
    name: 'Web & Full Stack Development',
    shortName: 'Full Stack',
    category: 'Software Engineering',
    logoKey: 'fullstack',
    duration: '10–14 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    tagline: 'Modern Reactive UIs & Cloud-Native Backends',
    description:
      'Master the entire modern web development lifecycle. Build high-performance frontend interfaces in React.js and connect them to scalable Node.js backends and MongoDB databases with clean REST architecture.',
    codeFilename: 'DashboardView.tsx',
    codeSnippet: `'use client';
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function AnalyticsDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['campus-metrics'],
    queryFn: () => fetch('/api/metrics').then(r => r.json())
  });

  return (
    <div className="grid grid-cols-3 gap-6 p-8">
      {data?.map(metric => (
        <MetricCard key={metric.id} {...metric} />
      ))}
    </div>
  );
}`,
    deliverables: [
      'Component-driven UIs with React and Tailwind',
      'Node.js RESTful API architectures & middleware',
      'End-to-end full stack deployment on cloud platforms',
    ],
    techStack: ['React.js', 'JavaScript (ES6+)', 'Node.js', 'MongoDB', 'REST APIs', 'Git'],
    idealFor: 'Aspiring full stack web engineers building modern products.',
  },
  {
    id: 'prog-dotnet',
    number: '04',
    name: '.NET Development',
    shortName: '.NET',
    category: 'Software Engineering',
    logoKey: 'dotnet',
    duration: '10–12 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    tagline: 'Microsoft Enterprise Architecture & Cloud Services',
    description:
      'Build enterprise software and mission-critical cloud APIs with C#, ASP.NET Core, and Entity Framework Core. Learn enterprise architectural patterns, MVC, dependency injection, and SQL Server optimization.',
    codeFilename: 'OrderController.cs',
    codeSnippet: `[ApiController]
[Route("api/[controller]")]
public class EnrollmentController : ControllerBase
{
    private readonly IStudentRepository _repo;

    public EnrollmentController(IStudentRepository repo) {
        _repo = repo;
    }

    [HttpPost("register")]
    public async Task<IActionResult> RegisterAsync([FromBody] StudentDto dto) {
        var student = await _repo.CreateStudentProfileAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = student.Id }, student);
    }
}`,
    deliverables: [
      'Enterprise ASP.NET Core APIs with JWT security',
      'Entity Framework Core code-first database migrations',
      'Clean architecture & dependency injection design',
    ],
    techStack: ['C#', 'ASP.NET Core', 'EF Core', 'SQL Server', 'Web API', 'LINQ'],
    idealFor: 'Developers preparing for Microsoft .NET engineering positions.',
  },
  {
    id: 'prog-analytics',
    number: '05',
    name: 'Data Analytics & BI',
    shortName: 'Analytics',
    category: 'Data & Analytics',
    logoKey: 'analytics',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    tagline: 'Relational Intelligence & Executive Decision Dashboards',
    description:
      'Transform unstructured raw enterprise data into automated executive dashboards. Master complex SQL queries, star schemas, Power BI DAX formulas, Python analytics, and business intelligence reporting.',
    codeFilename: 'revenue_intelligence.sql',
    codeSnippet: `WITH MonthlyAggregates AS (
  SELECT 
    DATE_TRUNC('month', order_date) AS reporting_month,
    program_track,
    COUNT(student_id) AS total_enrolled,
    SUM(course_fee) AS gross_revenue,
    RANK() OVER (PARTITION BY DATE_TRUNC('month', order_date) 
                 ORDER BY SUM(course_fee) DESC) as track_rank
  FROM institutional_enrollments
  GROUP BY 1, 2
)
SELECT * FROM MonthlyAggregates WHERE track_rank <= 3;`,
    deliverables: [
      'Interactive executive dashboards in Power BI Desktop',
      'Advanced SQL joins, CTEs, and window functions',
      'Python data manipulation with Pandas & visualization',
    ],
    techStack: ['Power BI Desktop', 'SQL Queries', 'Python Analytics', 'Advanced Excel', 'DAX'],
    idealFor: 'Data analysts, BI specialists, and quantitative decision makers.',
  },
  {
    id: 'prog-ai',
    number: '06',
    name: 'AI & Emerging Technologies',
    shortName: 'AI & RAG',
    category: 'AI & Emerging',
    logoKey: 'ai',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    tagline: 'Generative AI, Agentic Workflows & Production RAG',
    description:
      'Build applied AI applications using foundational models, vector embeddings, semantic retrieval, and agentic tool workflows. Learn to automate complex business workflows with n8n and modern AI frameworks.',
    codeFilename: 'agentic_rag.py',
    codeSnippet: `from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_community.vectorstores import Chroma

# Vector Search Retrieval Augmented Generation
retriever = Chroma(embedding_function=OpenAIEmbeddings()).as_retriever()
tools = [create_retriever_tool(retriever, "campus_kb", "Search Skillthinker")]

agent = create_tool_calling_agent(llm, tools, prompt_template)
executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

response = executor.invoke({"input": "Summarize Java certification eligibility"})`,
    deliverables: [
      'Document RAG pipelines with vector databases',
      'Autonomous multi-step AI agents using n8n and APIs',
      'Prompt engineering standards and model evaluation',
    ],
    techStack: ['Generative AI', 'Agentic RAG', 'Prompt Engineering', 'n8n Automation', 'Vector DB'],
    idealFor: 'Engineers and founders building applied generative AI software.',
  },
  {
    id: 'prog-backend',
    number: '07',
    name: 'Database & Backend Tech',
    shortName: 'Databases',
    category: 'Backend & Data',
    logoKey: 'database',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    tagline: 'High-Throughput Relational & NoSQL Architecture',
    description:
      'Master schema normalization, B-Tree indexing, subqueries, ACID transactions, and document data models in MongoDB. Design robust databases capable of handling heavy concurrent write and read operations.',
    codeFilename: 'schema_optimization.sql',
    codeSnippet: `CREATE TABLE institutional_records (
  record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES student_profiles(id),
  batch_id UUID NOT NULL REFERENCES batch_schedules(id),
  merit_tier VARCHAR(16) CHECK (merit_tier IN ('Gold', 'Silver', 'Bronze')),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_student_batch UNIQUE (student_id, batch_id)
);
-- Optimized B-Tree index for instant verification lookups
CREATE INDEX idx_records_lookup ON institutional_records (batch_id, merit_tier);`,
    deliverables: [
      'Relational schema design with foreign key constraints',
      'Complex query optimization, indexing, and EXPLAIN plans',
      'MongoDB aggregation pipelines and document architecture',
    ],
    techStack: ['SQL Architecture', 'MongoDB', 'PostgreSQL', 'Indexing', 'Stored Procedures'],
    idealFor: 'Backend developers and database engineers optimizing storage layers.',
  },
  {
    id: 'prog-programming',
    number: '08',
    name: 'Programming Fundamentals',
    shortName: 'C & C++',
    category: 'Core Programming',
    logoKey: 'cpp',
    duration: '8–10 Weeks',
    mode: 'Hands-on Lab & Mentorship',
    tagline: 'Algorithmic Thinking, Pointers & Memory Models',
    description:
      'Build an ironclad foundation in computational logic and memory models. Master procedural programming, pointers, memory allocation, and object-oriented principles in C, C++, and modern data structures.',
    codeFilename: 'linked_list_dsa.cpp',
    codeSnippet: `#include <iostream>
#include <memory>

template <typename T>
class Node {
public:
    T data;
    std::shared_ptr<Node<T>> next;
    Node(T val) : data(val), next(nullptr) {}
};

template <typename T>
void reverseList(std::shared_ptr<Node<T>>& head) {
    std::shared_ptr<Node<T>> prev = nullptr, curr = head, next = nullptr;
    while (curr != nullptr) {
        next = curr->next;
        curr->next = prev;
        prev = curr;
        curr = next;
    }
    head = prev;
}`,
    deliverables: [
      'Pointers, memory addresses, and dynamic memory allocation',
      'Classic data structures: Stacks, Queues, Trees, and Graphs',
      'Object-oriented principles: Polymorphism, Inheritance, STL',
    ],
    techStack: ['C Programming', 'C++', 'C#', 'Data Structures', 'Algorithms', 'Memory Models'],
    idealFor: 'Beginners and computer science students building core coding ability.',
  },
  {
    id: 'prog-aptitude',
    number: '09',
    name: 'Aptitude & Placement Training',
    shortName: 'Placement Prep',
    category: 'Placement & Career',
    logoKey: 'aptitude',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    tagline: 'Quantitative Reasoning, Logic & Technical Mock Interviews',
    description:
      'Comprehensive placement readiness for IT services and product company campus drives. Master speed math, quantitative aptitude, syllogisms, reading comprehension, and simulate 1-on-1 technical and HR interviews.',
    codeFilename: 'PlacementMatrix.ts',
    codeSnippet: `// Skillthinker Campus Recruitment Evaluation Matrix
interface PlacementMetrics {
  quantitativeAptitude: "Percentages | Speed Math | Permutations";
  logicalReasoning: "Syllogisms | Coding-Decoding | Puzzles";
  verbalAbility: "Grammar | Reading Comprehension | Vocabulary";
  technicalRounds: "Data Structures | OOP Logic | Problem Solving";
  hrEvaluation: "Behavioral Questions | Communication | GD";
}
// Goal: 100% Student Screening Clearance Rate`,
    deliverables: [
      'Speed math techniques & shortcut formulas',
      'Logical puzzle solving & analytical deduction',
      'Realistic 1-on-1 mock interviews and constructive feedback',
    ],
    techStack: ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Mock Interviews', 'GD'],
    idealFor: 'Final-year college students preparing for campus hiring drives.',
  },
  {
    id: 'prog-marketing',
    number: '10',
    name: 'Digital Marketing',
    shortName: 'Growth Marketing',
    category: 'Digital & Growth',
    logoKey: 'marketing',
    duration: '6–8 Weeks',
    mode: 'Instructor-Led Live & Lab',
    tagline: 'Technical SEO, Tag Management & User Acquisition',
    description:
      'Execute high-impact organic search optimization, tag management, and conversion analytics. Learn technical site audits, Google Tag Manager event tracking, Search Console analysis, and growth analytics.',
    codeFilename: 'gtm_datalayer.js',
    codeSnippet: `// Skillthinker Conversion Event Tracking
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'course_syllabus_inquiry',
  program_name: 'Java Programming',
  lead_source: 'organic_search',
  campus_location: 'Trichy_Anna_Nagar',
  timestamp: new Date().toISOString()
});
console.log('Conversion telemetry dispatched.');`,
    deliverables: [
      'Technical SEO audits, Core Web Vitals, and crawl optimization',
      'Google Tag Manager custom triggers and conversion events',
      'Audience conversion funnels and executive analytics reporting',
    ],
    techStack: ['Technical SEO', 'Google Tag Manager', 'Search Console', 'Analytics', 'Conversion Funnels'],
    idealFor: 'Marketing professionals, entrepreneurs, and career switchers.',
  },
];

export default function ProgramsSection() {
  const { openModal } = useAdvisorModal();
  const [activeIdx, setActiveIdx] = useState(0);

  const active = MASTER_TRACKS[activeIdx];

  const handlePrev = () => {
    setActiveIdx((prev) => (prev === 0 ? MASTER_TRACKS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIdx((prev) => (prev === MASTER_TRACKS.length - 1 ? 0 : prev + 1));
  };

  return (
    <section id="programs" className="relative py-20 lg:py-28 bg-[#041427] text-white overflow-hidden select-none">
      <div id="courses" className="absolute -top-24 left-0 pointer-events-none" />
      
      {/* Subtle Background Ambience */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#0A3A7A]/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#FCAF0A]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-tech-grid opacity-15 pointer-events-none" />

      <div className="container-custom relative z-10">
        
        {/* Section Header: Luxurious Editorial Presentation */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FCAF0A]" />
            <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#FCAF0A]">
              Academic Curriculum
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-[-0.03em] leading-[1.12]">
            Choose the right <span className="text-[#FCAF0A]">learning path.</span>
          </h2>

          <p className="text-slate-300 text-sm sm:text-base mt-3 max-w-2xl font-normal leading-relaxed">
            10 specialized technical curricula structured from absolute fundamentals to production execution. Every track includes real lab projects, mentor evaluations, and a verifiable digital credential.
          </p>
        </div>

        {/* ── LUXURY FLOATING TECH DOCK (HORIZONTAL 10-TRACK CAROUSEL SELECTOR) ── */}
        <div className="mb-8">
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex items-center gap-2.5 min-w-max pb-2">
              {MASTER_TRACKS.map((track, idx) => {
                const isActive = idx === activeIdx;

                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => setActiveIdx(idx)}
                    className={`group relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer border ${
                      isActive
                        ? 'bg-white text-[#041427] border-white shadow-lg scale-105'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white border-white/10'
                    }`}
                  >
                    <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                      <TechLogo name={track.logoKey} size={22} />
                    </div>

                    <span className="text-xs font-bold tracking-tight whitespace-nowrap">
                      {track.shortName}
                    </span>

                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                        isActive ? 'bg-[#041427] text-white font-bold' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {track.number}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── MASTER CURRICULUM STUDIO (SINGLE HIGH-IMPACT COMMAND STAGE) ── */}
        <div className="relative rounded-3xl bg-gradient-to-br from-[#06203D] via-[#051C38] to-[#041427] border border-white/15 shadow-2xl p-6 sm:p-8 lg:p-12 overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            {/* Left Column: Master Course Details & Actions (6 cols) */}
            <div className="lg:col-span-6 space-y-6">
              
              {/* Badge Strip */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCAF0A]/15 border border-[#FCAF0A]/30 text-[#FCAF0A] text-xs font-bold uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FCAF0A]" />
                  <span>Track {active.number} • {active.category}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{active.duration}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Laptop className="w-3.5 h-3.5 text-slate-400" />
                    <span>{active.mode}</span>
                  </span>
                </div>
              </div>

              {/* Master Headline */}
              <div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  {active.name}
                </h3>
                <div className="text-sm font-semibold text-[#FCAF0A] mt-1.5">
                  {active.tagline}
                </div>
              </div>

              {/* Narrative Description */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                {active.description}
              </p>

              {/* Core Deliverables Checklist */}
              <div className="space-y-2.5 pt-2">
                {active.deliverables.map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                    <CheckCircle2 className="w-4 h-4 text-[#FCAF0A] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              {/* Tech Stack Badges */}
              <div className="pt-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Tooling &amp; Frameworks Covered:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {active.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-white text-xs font-medium transition-colors"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons & Steppers */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openModal(active.name)}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FCAF0A] hover:bg-[#F5A800] text-[#041427] font-extrabold text-xs sm:text-sm transition-all shadow-md cursor-pointer"
                  >
                    <span>Enquire for this Track</span>
                    <ArrowRight className="w-4 h-4 text-[#041427]" />
                  </button>

                  <a
                    href={`https://wa.me/919442605096?text=Hi%2C%20I%20am%20interested%20in%20the%20${encodeURIComponent(active.name)}%20curriculum%20syllabus.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <span>WhatsApp Syllabus</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Track Steppers */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    aria-label="Previous track"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-300 px-1">
                    {activeIdx + 1} / {MASTER_TRACKS.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleNext}
                    aria-label="Next track"
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Authentic Live Code & Architecture Terminal (6 cols) */}
            <div className="lg:col-span-6 relative">
              <div className="rounded-2xl bg-[#031122]/95 border border-white/20 shadow-2xl overflow-hidden backdrop-blur-xl">
                
                {/* Terminal Header */}
                <div className="px-4 py-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="text-xs font-mono text-slate-300 ml-2 font-medium">
                      {active.codeFilename}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                    <Terminal className="w-3 h-3 text-[#FCAF0A]" />
                    <span>Trichy Live Lab</span>
                  </div>
                </div>

                {/* Real Syntax Code Body */}
                <div className="p-5 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed overflow-x-auto no-scrollbar">
                  <pre className="text-emerald-300/90 font-mono">
                    <code>{active.codeSnippet}</code>
                  </pre>
                </div>

                {/* Terminal Footer Strip */}
                <div className="px-5 py-3 bg-white/[0.03] border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#FCAF0A]" />
                    <span>Project Evaluated &amp; Merit Certified</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#FCAF0A] uppercase tracking-wider">
                    Hands-On Lab
                  </span>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Global Admissions Advisor Banner */}
        <div className="mt-12 p-6 sm:p-7 rounded-2xl bg-white/[0.04] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 backdrop-blur-md">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-[#FCAF0A]/10 border border-[#FCAF0A]/20 flex items-center justify-center text-[#FCAF0A] shrink-0">
              <HelpCircle className="w-5 h-5 text-[#FCAF0A]" />
            </div>
            <div>
              <div className="text-sm sm:text-base font-bold text-white">
                Unsure which program fits your background?
              </div>
              <div className="text-xs sm:text-sm text-slate-300 font-normal mt-0.5">
                Our admissions advisors in Trichy can evaluate your academic background and recommend the ideal track.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openModal()}
            className="px-6 py-3 rounded-xl bg-[#FCAF0A] hover:bg-[#F5A800] text-[#041427] font-extrabold text-xs sm:text-sm shrink-0 transition-colors cursor-pointer shadow-md"
          >
            Get Free Career Assessment
          </button>
        </div>

      </div>
    </section>
  );
}
