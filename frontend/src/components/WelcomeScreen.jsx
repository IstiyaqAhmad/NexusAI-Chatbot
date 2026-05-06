export default function WelcomeScreen({ onQuickQuestion }) {
  const quickQuestions = [
    {
      icon: '🧠',
      text: 'What is artificial intelligence?',
      category: 'AI Fundamentals'
    },
    {
      icon: '🤖',
      text: 'How do neural networks work?',
      category: 'Deep Learning'
    },
    {
      icon: '📊',
      text: 'What is TF-IDF?',
      category: 'NLP'
    },
    {
      icon: '🔮',
      text: 'What is a transformer model?',
      category: 'Deep Learning'
    },
    {
      icon: '⚡',
      text: 'What is the difference between AI and machine learning?',
      category: 'AI Fundamentals'
    },
    {
      icon: '🎯',
      text: 'What is temperature in language models?',
      category: 'LLM'
    },
  ]

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 overflow-y-auto">
      <div className="max-w-2xl w-full space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          {/* Animated Logo */}
          <div className="relative inline-flex">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gold-500 to-yellow-600 flex items-center justify-center shadow-gold-xl animate-float">
              <svg className="w-10 h-10 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
            </div>
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-2xl animate-glow-pulse" />
          </div>

          <div>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-white mb-2">
              Nexus<span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-500 to-yellow-500">AI</span>
            </h1>
            <p className="text-gray-400 text-sm sm:text-base font-body max-w-md mx-auto">
              Your premium AI-powered technology assistant. Powered by local machine learning — 
              <span className="text-gold-500/80"> no API keys required</span>.
            </p>
          </div>

          {/* Tech badges */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {['TF-IDF', 'Cosine Similarity', 'NLP', 'Local ML', 'Session Memory'].map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-1 rounded-full text-[10px] font-mono text-gold-500/60 bg-gold-500/5 border border-gold-500/10"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Quick Questions Grid */}
        <div className="space-y-3">
          <p className="text-center text-xs text-gray-500 font-mono uppercase tracking-widest">
            Try asking
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                id={`quick-q-${i}`}
                onClick={() => onQuickQuestion(q.text)}
                className="group glass-gold rounded-xl p-3.5 text-left hover-lift hover:border-gold-500/30 transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5 group-hover:scale-110 transition-transform">{q.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300 group-hover:text-white transition-colors line-clamp-2">
                      {q.text}
                    </p>
                    <span className="text-[9px] text-gold-500/40 font-mono uppercase tracking-wider mt-1 block">
                      {q.category}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-gold-500/20 group-hover:text-gold-500/60 transition-colors shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Data Flow Diagram */}
        <div className="glass-gold rounded-xl p-4">
          <p className="text-[10px] text-gold-500/50 font-mono uppercase tracking-wider text-center mb-3">
            Data Flow Pipeline
          </p>
          <div className="flex items-center justify-center gap-1 flex-wrap text-[10px] font-mono">
            <FlowStep label="User Input" icon="💬" />
            <FlowArrow />
            <FlowStep label="Preprocessing" icon="⚙️" />
            <FlowArrow />
            <FlowStep label="TF-IDF Vector" icon="📊" />
            <FlowArrow />
            <FlowStep label="Similarity" icon="🔍" />
            <FlowArrow />
            <FlowStep label="Response" icon="✨" />
          </div>
        </div>
      </div>
    </div>
  )
}

function FlowStep({ label, icon }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white/[0.03] border border-gold-500/10">
      <span className="text-sm">{icon}</span>
      <span className="text-gold-500/70 whitespace-nowrap">{label}</span>
    </div>
  )
}

function FlowArrow() {
  return (
    <svg className="w-4 h-4 text-gold-500/30 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}
