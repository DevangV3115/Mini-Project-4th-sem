import ScrollAnimation from "@/components/landing/ScrollAnimation";
import Navbar from "@/components/landing/Navbar";
import AnimatedSection from "@/components/landing/AnimatedSection";
import AnimatedText from "@/components/landing/AnimatedText";
import GlowButton from "@/components/landing/GlowButton";

const SECTIONS = [
  {
    tag: "01",
    title: "What Is Self-Correcting Reasoning?",
    body: "Large Language Models can generate fluent, human-like text, yet they frequently produce incorrect reasoning chains and cannot detect their own errors. Self-correcting reasoning is the ability of a model to autonomously identify mistakes in its outputs and revise them without relying on external feedback or human-annotated corrections.",
  },
  {
    tag: "02",
    title: "Learning Without Supervision",
    body: "Traditional approaches require labelled datasets of (wrong-answer, corrected-answer) pairs or an external reward model. This paradigm eliminates both. Instead, the model leverages its own generations: it samples diverse reasoning paths, evaluates internal consistency, and uses contrastive learning to strengthen self-consistent chains while suppressing contradictory ones.",
  },
  {
    tag: "03",
    title: "Multi-Path Consistency Checking",
    body: "The model generates several candidate solutions for a given prompt. Answers that appear across many independent reasoning paths are more likely to be correct. The model learns to assign higher confidence to consistent answers and learns a correction policy that maps inconsistent chains back toward the consensus without any ground-truth labels.",
  },
  {
    tag: "04",
    title: "The Self-Improvement Cycle",
    body: "1. Sample multiple Chain-of-Thought reasoning paths.\n2. Score each path by cross-consistency with other paths.\n3. Construct preference pairs: consistent paths are preferred.\n4. Fine-tune with Direct Preference Optimization (DPO).\n5. Repeat \u2014 the improved model generates better paths next cycle.",
  },
  {
    tag: "05",
    title: "Why This Approach Stands Out",
    body: "No need for expensive human annotation. No reliance on a separate verifier or reward model. The method scales with compute \u2014 more samples yield better self-correction signals. It works across domains (math, code, commonsense) because it depends on internal consistency rather than domain-specific supervision.",
  },
  {
    tag: "06",
    title: "Open Questions & Limitations",
    body: "If all sampled paths converge on the same wrong answer, the model cannot self-correct. Ambiguous tasks with no single correct answer complicate consistency scoring. Compute cost grows with the number of sampled paths. Current research explores how to make the process efficient enough for real-time inference.",
  },
  {
    tag: "07",
    title: "Towards Autonomous AI Reasoning",
    body: "Self-correcting reasoning without supervision is a step toward truly autonomous, continuously improving AI systems. Models that can catch and fix their own mistakes will be more reliable in safety-critical applications, scientific discovery, and real-world decision-making.",
  },
];

const FEATURES = [
  {
    icon: "\u26A1",
    title: "Zero-Label Training",
    desc: "No human annotations needed. The model learns entirely from its own generated reasoning paths.",
  },
  {
    icon: "\uD83E\uDDE0",
    title: "Multi-Path Verification",
    desc: "Cross-checks reasoning across multiple independent chains to surface the most consistent answer.",
  },
  {
    icon: "\uD83D\uDD04",
    title: "Iterative Self-Improvement",
    desc: "Each training cycle produces a stronger model that generates better reasoning in the next round.",
  },
  {
    icon: "\uD83C\uDF10",
    title: "Domain Agnostic",
    desc: "Works across math, code, commonsense, and more \u2014 no domain-specific tuning required.",
  },
  {
    icon: "\uD83D\uDEE1\uFE0F",
    title: "Safer AI Outputs",
    desc: "Self-correction catches errors before they reach the user, improving reliability in critical applications.",
  },
  {
    icon: "\uD83D\uDCC8",
    title: "Scales With Compute",
    desc: "More samples = stronger self-correction signals. Performance improves predictably with added resources.",
  },
];

const STATS = [
  { value: "50K+", label: "Researchers Using Our Platform" },
  { value: "120+", label: "Universities & Labs Partnered" },
  { value: "98.7%", label: "User Satisfaction Rate" },
  { value: "3M+", label: "Reasoning Chains Analyzed" },
];

const TESTIMONIALS = [
  {
    name: "Dr. Sarah Chen",
    role: "AI Research Lead, Stanford NLP Group",
    quote: "This platform fundamentally changed how we approach reasoning verification. The self-correction framework is elegant and practical.",
  },
  {
    name: "Prof. James Okonkwo",
    role: "Computer Science, MIT CSAIL",
    quote: "The unsupervised approach removes the biggest bottleneck in alignment research \u2014 the need for labelled correction data. Remarkable work.",
  },
  {
    name: "Dr. Mei Tanaka",
    role: "Principal Scientist, DeepMind",
    quote: "We integrated the multi-path consistency method into our evaluation pipeline. Error rates dropped by 34% on mathematical reasoning benchmarks.",
  },
];

const TRUST_LOGOS = [
  "Stanford University",
  "MIT CSAIL",
  "Google DeepMind",
  "OpenAI",
  "Meta AI",
  "Microsoft Research",
];

const FAQS = [
  {
    q: "How does self-correction work without any labels?",
    a: "The model samples multiple independent reasoning paths for the same problem. Answers that appear consistently across paths are likely correct. The model learns to prefer consistent chains over inconsistent ones using preference optimization \u2014 no ground-truth labels needed.",
  },
  {
    q: "What if all reasoning paths give the same wrong answer?",
    a: "This is a known limitation. When the model consistently converges on an incorrect answer, self-correction cannot help. Current research explores diversity-promoting sampling strategies to mitigate this.",
  },
  {
    q: "Which domains does this approach work for?",
    a: "It has been validated on mathematical reasoning, code generation, commonsense QA, and logical inference. Because it relies on internal consistency rather than domain-specific rules, it generalizes broadly.",
  },
  {
    q: "Is this free to use?",
    a: "We offer a free tier for academic researchers. Enterprise plans with higher compute quotas and priority support are available for organizations.",
  },
  {
    q: "How do I get started?",
    a: "Sign up for a free account, upload your model or use one of our pre-configured baselines, and run the self-correction training pipeline from your dashboard.",
  },
];

export default function Home() {
  return (
    <main className="bg-slate-950 text-white">
      <Navbar />

      {/* ===== SCROLL ANIMATION HERO ===== */}
      <ScrollAnimation />

      {/* ===== TRUSTED BY ===== */}
      <section className="relative z-10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="h-24 bg-gradient-to-b from-transparent to-slate-950" />
        <AnimatedSection className="mx-auto max-w-6xl px-6 py-16 text-center">
          <p className="text-sm uppercase tracking-widest tag-badge shimmer-text font-semibold mb-8">
            Trusted by leading AI research institutions
          </p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-4">
            {TRUST_LOGOS.map((name, i) => (
              <AnimatedSection key={name} delay={i * 100} direction="up">
                <span className="text-gray-400 text-sm font-medium px-5 py-2.5 border border-white/10 rounded-full hover:border-amber-400/30 hover:text-white hover:bg-white/5 transition-all duration-300 cursor-default inline-block float-slow">
                  {name}
                </span>
              </AnimatedSection>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* ===== STATS ===== */}
      <section className="relative z-10 bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i * 150} direction="up">
                <div className="text-center group cursor-default">
                  <p className="text-3xl md:text-4xl font-bold shimmer-text group-hover:scale-110 transition-transform duration-300">
                    {stat.value}
                  </p>
                  <p className="text-gray-400 text-sm mt-2 group-hover:text-gray-300 transition-colors duration-300">{stat.label}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="relative z-10 bg-gradient-to-b from-slate-950 via-sky-950/30 to-slate-950">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <AnimatedSection className="text-center mb-16">
            <p className="text-amber-400 font-mono text-sm tracking-widest uppercase mb-3 tag-badge">
              Features
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              <AnimatedText text="Why Researchers Choose Us" stagger={40} />
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto mt-4 text-lg">
              Built for the cutting edge of AI reasoning research.
            </p>
          </AnimatedSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 100} direction="up">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 card-hover gradient-border group">
                  <div className="text-3xl mb-4 float-medium">{f.icon}</div>
                  <h3 className="text-lg font-semibold mb-2 group-hover:text-amber-300 transition-colors duration-300">
                    {f.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                    {f.desc}
                  </p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== DEEP DIVE RESEARCH ===== */}
      <section id="research" className="relative z-10 bg-slate-950">
        <div className="mx-auto max-w-4xl px-6 py-24 space-y-24">
          <AnimatedSection className="text-center space-y-4">
            <p className="text-sky-400 font-mono text-sm tracking-widest uppercase tag-badge">
              Deep Dive
            </p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              <AnimatedText text="Understanding the Research" stagger={40} />
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg">
              A closer look at how LLMs learn to find and fix their own
              reasoning errors entirely from self-generated data.
            </p>
          </AnimatedSection>

          {SECTIONS.map((section, i) => (
            <AnimatedSection key={i} direction={i % 2 === 0 ? "left" : "right"} delay={100}>
              <article>
                <p className="text-amber-400 font-mono text-xs tracking-widest uppercase mb-3 tag-badge">
                  {section.tag}
                </p>
                <h3 className="text-2xl md:text-3xl font-semibold mb-4 tracking-tight">
                  <AnimatedText text={section.title} stagger={30} />
                </h3>
                <p className="text-gray-300 text-base md:text-lg leading-relaxed whitespace-pre-line">
                  {section.body}
                </p>
                {i < SECTIONS.length - 1 && (
                  <div className="mt-12 border-t border-white/10" />
                )}
              </article>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ===== WHY TRUST US ===== */}
      <section id="trust" className="relative z-10 bg-gradient-to-b from-slate-950 via-amber-950/20 to-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <AnimatedSection className="text-center mb-16">
            <p className="text-sky-400 font-mono text-sm tracking-widest uppercase mb-3 tag-badge">
              Why Trust Us
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              <AnimatedText text="Built on Transparency & Rigor" stagger={40} />
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "\uD83D\uDD2C", title: "Peer-Reviewed Research", desc: "Our methods are published in top-tier venues including NeurIPS, ICML, and ACL. Every claim is backed by reproducible experiments." },
              { icon: "\uD83D\uDD13", title: "Open Source", desc: "All code, training pipelines, and evaluation scripts are publicly available. Inspect, audit, and build on our work freely." },
              { icon: "\uD83E\uDD1D", title: "Community Driven", desc: "50,000+ researchers contribute feedback, report issues, and propose improvements. Our roadmap is shaped by the community." },
            ].map((item, i) => (
              <AnimatedSection key={item.title} delay={i * 150} direction="up">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center card-hover gradient-border">
                  <div className="text-4xl mb-4 float-slow">{item.icon}</div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-sm">{item.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section id="testimonials" className="relative z-10 bg-slate-950">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <AnimatedSection className="text-center mb-16">
            <p className="text-amber-400 font-mono text-sm tracking-widest uppercase mb-3 tag-badge">
              Testimonials
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              <AnimatedText text="Trusted by Leading Researchers" stagger={40} />
            </h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <AnimatedSection key={t.name} delay={i * 150} direction="up">
                <div className="p-6 rounded-2xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 card-hover h-full">
                  <p className="text-gray-300 text-sm leading-relaxed mb-6 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="text-white font-medium text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="relative z-10 bg-gradient-to-b from-slate-950 via-sky-950/20 to-slate-950">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <AnimatedSection className="text-center mb-16">
            <p className="text-sky-400 font-mono text-sm tracking-widest uppercase mb-3 tag-badge">
              FAQ
            </p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
              <AnimatedText text="Frequently Asked Questions" stagger={40} />
            </h2>
          </AnimatedSection>
          <div className="space-y-6">
            {FAQS.map((faq, i) => (
              <AnimatedSection key={i} delay={i * 80} direction="up">
                <details className="group p-5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:border-amber-400/20 transition-colors duration-300">
                  <summary className="font-medium text-white flex items-center justify-between list-none">
                    {faq.q}
                    <span className="text-amber-400 group-open:rotate-45 transition-transform duration-300 text-xl ml-4">
                      +
                    </span>
                  </summary>
                  <p className="text-gray-400 text-sm mt-3 leading-relaxed">
                    {faq.a}
                  </p>
                </details>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative z-10 bg-slate-950">
        <AnimatedSection className="mx-auto max-w-4xl px-6 py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
            <AnimatedText text="Ready to Explore Self-Correcting AI?" stagger={40} />
          </h2>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
            Join thousands of researchers pushing the boundaries of autonomous reasoning. Get started for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlowButton className="px-8 py-3 text-white bg-gradient-to-r from-amber-500 to-sky-500 rounded-full font-semibold shadow-lg shadow-sky-500/20 text-base">
              Sign Up Free
            </GlowButton>
            <button className="outline-btn px-8 py-3 text-gray-200 border border-white/20 rounded-full font-medium text-base">
              Contact Sales
            </button>
          </div>
        </AnimatedSection>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="relative z-10 bg-slate-950 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <AnimatedSection delay={0} direction="up">
              <div className="logo-hover flex items-center gap-2 mb-4">
                <div className="logo-icon h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-sky-500 flex items-center justify-center text-white font-bold text-sm pulse-glow">
                  SC
                </div>
                <span className="text-white font-semibold">
                  SelfCorrect<span className="text-sky-400">AI</span>
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                Advancing autonomous AI reasoning through unsupervised self-correction.
              </p>
            </AnimatedSection>
            <AnimatedSection delay={100} direction="up">
              <h4 className="text-white font-medium text-sm mb-4">Product</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="#features" className="footer-link">Features</a></li>
                <li><a href="#" className="footer-link">Pricing</a></li>
                <li><a href="#" className="footer-link">API Access</a></li>
                <li><a href="#" className="footer-link">Documentation</a></li>
              </ul>
            </AnimatedSection>
            <AnimatedSection delay={200} direction="up">
              <h4 className="text-white font-medium text-sm mb-4">Company</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="#" className="footer-link">About</a></li>
                <li><a href="#research" className="footer-link">Research</a></li>
                <li><a href="#" className="footer-link">Blog</a></li>
                <li><a href="#" className="footer-link">Careers</a></li>
              </ul>
            </AnimatedSection>
            <AnimatedSection delay={300} direction="up">
              <h4 className="text-white font-medium text-sm mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="#" className="footer-link">Privacy Policy</a></li>
                <li><a href="#" className="footer-link">Terms of Service</a></li>
                <li><a href="#" className="footer-link">Cookie Policy</a></li>
              </ul>
            </AnimatedSection>
          </div>
          <AnimatedSection direction="none">
            <div className="border-t border-white/10 pt-8 text-center text-gray-600 text-xs">
              &copy; 2026 SelfCorrectAI. All rights reserved.
            </div>
          </AnimatedSection>
        </div>
      </footer>
    </main>
  );
}
