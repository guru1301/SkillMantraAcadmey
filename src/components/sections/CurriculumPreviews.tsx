'use client';

import React from 'react';
import { Terminal, Database, Cpu, BarChart3, Globe, ShieldCheck, GitBranch, ArrowRight, Layers, CheckCircle } from 'lucide-react';

interface PreviewProps {
  trackId: string;
}

export default function CurriculumPreview({ trackId }: PreviewProps) {
  switch (trackId) {
    case 'prog-java':
      return (
        <div className="rounded-xl bg-[#07182B] border border-white/10 overflow-hidden text-xs font-mono">
          <div className="px-3.5 py-2.5 bg-[#0D233B] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <span className="text-[#B8C6D8] ml-2 text-[11px]">OrderServiceController.java</span>
            </div>
            <span className="text-[10px] text-[#FFB000] font-sans font-semibold">Spring Boot 3.2</span>
          </div>
          <div className="p-4 leading-relaxed text-[#B8C6D8] space-y-1 overflow-x-auto no-scrollbar">
            <div><span className="text-amber-400">@RestController</span></div>
            <div><span className="text-amber-400">@RequestMapping</span>(<span className="text-emerald-300">"/api/v1/orders"</span>)</div>
            <div><span className="text-blue-400">public class</span> <span className="text-white font-bold">OrderServiceController</span> {'{'}</div>
            <div className="pl-4"><span className="text-amber-400">@PostMapping</span>(<span className="text-emerald-300">"/checkout"</span>)</div>
            <div className="pl-4"><span className="text-blue-400">public</span> <span className="text-purple-300">ResponseEntity&lt;OrderReceipt&gt;</span> <span className="text-sky-300">processOrder</span>(</div>
            <div className="pl-8"><span className="text-amber-400">@Valid</span> <span className="text-amber-400">@RequestBody</span> <span className="text-white">OrderDto</span> payload) {'{'}</div>
            <div className="pl-8 text-slate-400">// Transactional persistence &amp; JWT auth</div>
            <div className="pl-8"><span className="text-blue-400">return</span> ResponseEntity.<span className="text-sky-300">ok</span>(orderService.<span className="text-sky-300">execute</span>(payload));</div>
            <div className="pl-4">{'}'}</div>
            <div>{'}'}</div>
          </div>
          <div className="px-3.5 py-2 bg-[#07182B]/80 border-t border-white/10 flex items-center justify-between text-[11px] text-[#B8C6D8]">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              HTTP 201 Created • REST API Endpoint
            </span>
            <span className="text-slate-400">Spring Data JPA</span>
          </div>
        </div>
      );

    case 'prog-python':
      return (
        <div className="rounded-xl bg-[#07182B] border border-white/10 overflow-hidden text-xs font-mono">
          <div className="px-3.5 py-2.5 bg-[#0D233B] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <span className="text-[#B8C6D8] ml-2 text-[11px]">pipeline_worker.py</span>
            </div>
            <span className="text-[10px] text-[#FFB000] font-sans font-semibold">FastAPI AsyncIO</span>
          </div>
          <div className="p-4 leading-relaxed text-[#B8C6D8] space-y-1 overflow-x-auto no-scrollbar">
            <div><span className="text-blue-400">import</span> asyncio</div>
            <div><span className="text-blue-400">from</span> fastapi <span className="text-blue-400">import</span> FastAPI, BackgroundTasks</div>
            <div className="pt-1">app = <span className="text-sky-300">FastAPI</span>(title=<span className="text-emerald-300">"DataPipeline"</span>)</div>
            <div className="pt-1"><span className="text-amber-400">@app.post</span>(<span className="text-emerald-300">"/tasks/execute"</span>)</div>
            <div><span className="text-blue-400">async def</span> <span className="text-sky-300">run_worker</span>(task: <span className="text-white">TaskPayload</span>):</div>
            <div className="pl-4 text-slate-400"># Non-blocking concurrent execution</div>
            <div className="pl-4">results = <span className="text-blue-400">await</span> asyncio.<span className="text-sky-300">gather</span>(</div>
            <div className="pl-8">fetch_remote_stream(task.id),</div>
            <div className="pl-8">transform_records(task.priority)</div>
            <div className="pl-4">)</div>
            <div className="pl-4"><span className="text-blue-400">return</span> {'{'}<span className="text-emerald-300">"status"</span>: <span className="text-emerald-300">"dispatched"</span>, <span className="text-emerald-300">"metrics"</span>: results{'}'}</div>
          </div>
          <div className="px-3.5 py-2 bg-[#07182B]/80 border-t border-white/10 flex items-center justify-between text-[11px] text-[#B8C6D8]">
            <span className="text-sky-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Async Worker Event Loop • Non-blocking I/O
            </span>
            <span className="text-slate-400">Pydantic v2</span>
          </div>
        </div>
      );

    case 'prog-web':
      return (
        <div className="rounded-xl bg-[#07182B] border border-white/10 overflow-hidden text-xs">
          {/* Miniature Browser Frame */}
          <div className="px-3.5 py-2.5 bg-[#0D233B] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <div className="ml-2 px-2.5 py-0.5 rounded bg-black/30 text-[10px] text-slate-400 font-mono flex items-center gap-1.5">
                <Globe className="w-2.5 h-2.5 text-slate-400" />
                <span>localhost:3000/app/dashboard</span>
              </div>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono font-semibold">React 18 + Tailwind</span>
          </div>
          {/* Miniature UI Wireframe with Real Hierarchy */}
          <div className="p-4 space-y-3 font-sans">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded bg-cyan-400" />
                <span className="text-white font-bold text-xs">&lt;AppLayout header="Sticky" /&gt;</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/40">
                200 OK • TanStack Query
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-[#102A45] border border-white/10">
                <div className="text-[10px] text-slate-400">Component</div>
                <div className="text-white font-bold text-xs mt-0.5">&lt;Sidebar /&gt;</div>
                <div className="text-[9px] text-cyan-400 mt-1">Client State</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#102A45] border border-white/10">
                <div className="text-[10px] text-slate-400">Data Feed</div>
                <div className="text-white font-bold text-xs mt-0.5">&lt;AnalyticsFeed /&gt;</div>
                <div className="text-[9px] text-emerald-400 mt-1">WebSocket Live</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#102A45] border border-white/10">
                <div className="text-[10px] text-slate-400">Database</div>
                <div className="text-white font-bold text-xs mt-0.5">MongoDB Atlas</div>
                <div className="text-[9px] text-amber-400 mt-1">REST API Sync</div>
              </div>
            </div>
          </div>
          <div className="px-3.5 py-2 bg-[#07182B]/80 border-t border-white/10 flex items-center justify-between text-[11px] text-[#B8C6D8] font-mono">
            <span>Responsive Layout &bull; SSR Hydration</span>
            <span className="text-slate-400">Node.js Express Backend</span>
          </div>
        </div>
      );

    case 'prog-dotnet':
      return (
        <div className="rounded-xl bg-[#07182B] border border-white/10 overflow-hidden text-xs font-mono">
          <div className="px-3.5 py-2.5 bg-[#0D233B] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
              <span className="text-[#B8C6D8] ml-2 text-[11px]">EnrollmentController.cs</span>
            </div>
            <span className="text-[10px] text-purple-400 font-sans font-semibold">.NET 8 Web API</span>
          </div>
          <div className="p-4 leading-relaxed text-[#B8C6D8] space-y-1 overflow-x-auto no-scrollbar">
            <div><span className="text-blue-400">[ApiController]</span></div>
            <div><span className="text-blue-400">[Route]</span>(<span className="text-emerald-300">"api/[controller]"</span>)</div>
            <div><span className="text-blue-400">public class</span> <span className="text-white font-bold">EnrollmentController</span> : <span className="text-purple-300">ControllerBase</span> {'{'}</div>
            <div className="pl-4"><span className="text-blue-400">private readonly</span> <span className="text-purple-300">IStudentRepository</span> _repo;</div>
            <div className="pl-4"><span className="text-blue-400">public</span> <span className="text-sky-300">EnrollmentController</span>(<span className="text-purple-300">IStudentRepository</span> repo) {'{'} _repo = repo; {'}'}</div>
            <div className="pl-4 pt-1"><span className="text-blue-400">[HttpPost("register")]</span></div>
            <div className="pl-4"><span className="text-blue-400">public async</span> <span className="text-purple-300">Task&lt;IActionResult&gt;</span> <span className="text-sky-300">RegisterAsync</span>(<span className="text-white">StudentDto</span> dto) {'{'}</div>
            <div className="pl-8"><span className="text-blue-400">var</span> student = <span className="text-blue-400">await</span> _repo.<span className="text-sky-300">CreateProfileAsync</span>(dto);</div>
            <div className="pl-8"><span className="text-blue-400">return</span> <span className="text-sky-300">CreatedAtAction</span>(<span className="text-blue-400">nameof</span>(GetById), student);</div>
            <div className="pl-4">{'}'}</div>
            <div>{'}'}</div>
          </div>
          <div className="px-3.5 py-2 bg-[#07182B]/80 border-t border-white/10 flex items-center justify-between text-[11px] text-[#B8C6D8]">
            <span className="text-purple-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              Entity Framework Core • SQL Server DI
            </span>
            <span className="text-slate-400">C# 12 Architecture</span>
          </div>
        </div>
      );

    case 'prog-analytics':
      return (
        <div className="rounded-xl bg-[#07182B] border border-white/10 overflow-hidden text-xs">
          <div className="px-3.5 py-2.5 bg-[#0D233B] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-[#FFB000]" />
              <span className="text-[#B8C6D8] text-[11px] font-sans font-semibold">Executive BI Telemetry</span>
            </div>
            <span className="text-[10px] text-[#FFB000] font-mono">Power BI DAX + SQL</span>
          </div>
          <div className="p-4 space-y-3 font-sans">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-[#102A45] border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Gross Cohort Completion</div>
                <div className="text-xl font-extrabold text-white mt-0.5">94.8%</div>
                <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">&uarr; +4.2% vs Benchmark</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#102A45] border border-white/10">
                <div className="text-[10px] text-slate-400 uppercase font-mono">Verifiable Records</div>
                <div className="text-xl font-extrabold text-[#FFB000] mt-0.5">1,840</div>
                <div className="text-[10px] text-slate-300 mt-0.5 font-medium">SQL Index Verified</div>
              </div>
            </div>
            {/* Miniature Analytical Bar Visualization */}
            <div className="p-3 rounded-lg bg-[#102A45]/60 border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-300 font-mono">
                <span>Placement Trajectory by Quarter</span>
                <span className="text-[#FFB000]">Q1 - Q4 2026</span>
              </div>
              <div className="flex items-end gap-2 h-14 pt-2">
                <div className="flex-1 bg-slate-700/60 rounded-t h-[40%]" />
                <div className="flex-1 bg-slate-700/60 rounded-t h-[55%]" />
                <div className="flex-1 bg-[#1769D2]/70 rounded-t h-[75%]" />
                <div className="flex-1 bg-[#FFB000] rounded-t h-[95%]" />
              </div>
            </div>
          </div>
          <div className="px-3.5 py-2 bg-[#07182B]/80 border-t border-white/10 flex items-center justify-between text-[11px] text-[#B8C6D8] font-mono">
            <span>DAX Measure: CALCULATE(SUM(Score))</span>
            <span className="text-slate-400">Pandas Engine</span>
          </div>
        </div>
      );

    case 'prog-ai':
      return (
        <div className="rounded-xl bg-[#07182B] border border-white/10 overflow-hidden text-xs">
          <div className="px-3.5 py-2.5 bg-[#0D233B] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[#B8C6D8] text-[11px] font-sans font-semibold">Production RAG &amp; Agent Pipeline</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-semibold">LangChain + Chroma</span>
          </div>
          <div className="p-4 space-y-3 font-sans">
            {/* RAG Workflow Visual Diagram */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1.5 rounded-md bg-[#102A45] border border-white/10 text-[10px] font-mono text-white shrink-0">
                  User Query
                </div>
                <ArrowRight className="w-3 h-3 text-[#FFB000] shrink-0" />
                <div className="px-2.5 py-1.5 rounded-md bg-[#102A45] border border-white/10 text-[10px] font-mono text-white shrink-0">
                  Vector Embeddings
                </div>
                <ArrowRight className="w-3 h-3 text-[#FFB000] shrink-0" />
                <div className="px-2.5 py-1.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 shrink-0">
                  ChromaDB
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#102A45]/80 border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Context Synthesis &bull; GPT-4o / Claude 3.5</span>
                  <span className="text-emerald-400">Cosine Match: 0.94</span>
                </div>
                <div className="text-[11px] text-slate-200 leading-snug">
                  &ldquo;Retrieved 3 syllabus chunks. Synthesizing prerequisite roadmap for student.&rdquo;
                </div>
              </div>
            </div>
          </div>
          <div className="px-3.5 py-2 bg-[#07182B]/80 border-t border-white/10 flex items-center justify-between text-[11px] text-[#B8C6D8] font-mono">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Autonomous Agent Tools &bull; n8n Automation
            </span>
            <span className="text-slate-400">Latency: 142ms</span>
          </div>
        </div>
      );

    case 'prog-backend':
      return (
        <div className="rounded-xl bg-[#07182B] border border-white/10 overflow-hidden text-xs font-mono">
          <div className="px-3.5 py-2.5 bg-[#0D233B] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[#B8C6D8] text-[11px] font-sans font-semibold">PostgreSQL Relational Schema</span>
            </div>
            <span className="text-[10px] text-sky-400 font-mono">B-Tree Indexing</span>
          </div>
          <div className="p-4 space-y-2 text-[#B8C6D8]">
            <div className="text-slate-400">// Normalized Relational DDL Architecture</div>
            <div className="text-sky-300 font-bold">CREATE TABLE institutional_records (</div>
            <div className="pl-4 text-[11px] space-y-0.5">
              <div>record_id <span className="text-amber-400">UUID PRIMARY KEY</span>,</div>
              <div>student_id <span className="text-blue-300">UUID REFERENCES</span> students(id),</div>
              <div>batch_id <span className="text-blue-300">UUID REFERENCES</span> batches(id),</div>
              <div>merit_tier <span className="text-purple-300">VARCHAR(16)</span> <span className="text-blue-300">CHECK</span> (tier <span className="text-blue-300">IN</span> ('Gold', 'Silver', 'Bronze'))</div>
            </div>
            <div className="text-sky-300 font-bold">);</div>
            <div className="pt-1 text-emerald-400">
              CREATE INDEX idx_lookup ON institutional_records (batch_id, merit_tier);
            </div>
          </div>
          <div className="px-3.5 py-2 bg-[#07182B]/80 border-t border-white/10 flex items-center justify-between text-[11px] text-[#B8C6D8]">
            <span className="text-sky-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              Index Scan Cost: 0.08ms &bull; ACID Transactions
            </span>
            <span className="text-slate-400">MongoDB Hybrid</span>
          </div>
        </div>
      );

    case 'prog-programming':
      return (
        <div className="rounded-xl bg-[#07182B] border border-white/10 overflow-hidden text-xs">
          <div className="px-3.5 py-2.5 bg-[#0D233B] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[#B8C6D8] text-[11px] font-sans font-semibold">Data Structures: Linked Node Memory Flow</span>
            </div>
            <span className="text-[10px] text-blue-400 font-mono">C++ STL &bull; O(1)</span>
          </div>
          <div className="p-4 space-y-3 font-mono">
            {/* Memory Pointer Chain Visualization */}
            <div className="space-y-2">
              <div className="text-[11px] text-slate-400">Pointer References &amp; Dynamic Allocation:</div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <div className="p-2 rounded bg-[#102A45] border border-white/10 text-center shrink-0">
                  <div className="text-[9px] text-[#FFB000]">0x7ffd01</div>
                  <div className="text-white font-bold text-xs mt-0.5">Node(12)</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">*next &rarr;</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="p-2 rounded bg-[#102A45] border border-white/10 text-center shrink-0">
                  <div className="text-[9px] text-[#FFB000]">0x7ffd08</div>
                  <div className="text-white font-bold text-xs mt-0.5">Node(48)</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">*next &rarr;</div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="p-2 rounded bg-[#102A45] border border-blue-400/30 text-center shrink-0">
                  <div className="text-[9px] text-blue-400">0x7ffd16</div>
                  <div className="text-white font-bold text-xs mt-0.5">Node(96)</div>
                  <div className="text-[9px] text-rose-400 mt-0.5">NULL</div>
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-300 pt-1">
              Time Complexity: <span className="text-emerald-400 font-bold">O(1) Insertion</span> &bull; Space: <span className="text-[#FFB000]">O(n)</span>
            </div>
          </div>
          <div className="px-3.5 py-2 bg-[#07182B]/80 border-t border-white/10 flex items-center justify-between text-[11px] text-[#B8C6D8] font-mono">
            <span>Algorithmic Optimization &bull; Heap vs Stack</span>
            <span className="text-slate-400">C/C++ Standards</span>
          </div>
        </div>
      );

    case 'prog-aptitude':
      return (
        <div className="rounded-xl bg-[#07182B] border border-white/10 overflow-hidden text-xs">
          <div className="px-3.5 py-2.5 bg-[#0D233B] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FFB000]" />
              <span className="text-[#B8C6D8] text-[11px] font-sans font-semibold">Campus Recruitment Screening Diagnostic</span>
            </div>
            <span className="text-[10px] text-[#FFB000] font-mono">Assessment Engine</span>
          </div>
          <div className="p-4 space-y-3 font-sans">
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <span>Quantitative Aptitude &bull; Speed Math</span>
                  <span className="text-emerald-400 font-mono font-bold">42 / 45 (93%)</span>
                </div>
                <div className="w-full bg-[#102A45] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '93%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <span>Logical Reasoning &bull; Syllogisms &amp; Puzzles</span>
                  <span className="text-emerald-400 font-mono font-bold">38 / 40 (95%)</span>
                </div>
                <div className="w-full bg-[#102A45] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full rounded-full" style={{ width: '95%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-300 mb-1">
                  <span>Verbal Ability &amp; Technical Communication</span>
                  <span className="text-[#FFB000] font-mono font-bold">35 / 40 (88%)</span>
                </div>
                <div className="w-full bg-[#102A45] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#FFB000] h-full rounded-full" style={{ width: '88%' }} />
                </div>
              </div>
            </div>
          </div>
          <div className="px-3.5 py-2 bg-[#07182B]/80 border-t border-white/10 flex items-center justify-between text-[11px] text-[#B8C6D8] font-mono">
            <span className="text-emerald-400 font-semibold">Tier-1 Corporate Cutoff Cleared</span>
            <span className="text-slate-400">Mock Interview Simulation</span>
          </div>
        </div>
      );

    case 'prog-marketing':
      return (
        <div className="rounded-xl bg-[#07182B] border border-white/10 overflow-hidden text-xs">
          <div className="px-3.5 py-2.5 bg-[#0D233B] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[#B8C6D8] text-[11px] font-sans font-semibold">Organic Growth &amp; Attribution Funnel</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">GTM DataLayer</span>
          </div>
          <div className="p-4 space-y-2.5 font-sans">
            {/* Conversion Funnel Bar View */}
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className="flex items-center justify-between p-1.5 rounded bg-[#102A45] border border-white/5">
                <span className="text-slate-300">1. Search Impressions</span>
                <span className="text-white font-bold">128,400</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#102A45] border border-white/5">
                <span className="text-slate-300">2. Organic Clicks (CTR 8.4%)</span>
                <span className="text-sky-300 font-bold">10,780</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-[#102A45] border border-white/5">
                <span className="text-slate-300">3. Engaged Leads (Session &gt; 2m)</span>
                <span className="text-amber-300 font-bold">2,640</span>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded bg-emerald-950/60 border border-emerald-500/20">
                <span className="text-emerald-200">4. Program Enrollments</span>
                <span className="text-emerald-400 font-bold">410 (15.5%)</span>
              </div>
            </div>
          </div>
          <div className="px-3.5 py-2 bg-[#07182B]/80 border-t border-white/10 flex items-center justify-between text-[11px] text-[#B8C6D8] font-mono">
            <span>Core Web Vitals: LCP 1.1s &bull; CLS 0.0</span>
            <span className="text-slate-400">Google Search Console</span>
          </div>
        </div>
      );

    default:
      return null;
  }
}
