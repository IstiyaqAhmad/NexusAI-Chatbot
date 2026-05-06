export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4 message-enter">
      <div className="max-w-[85%] sm:max-w-[75%]">
        {/* Avatar + Name */}
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold-500 to-yellow-600 flex items-center justify-center animate-pulse">
            <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <span className="text-[10px] text-gray-500 font-mono">
            NexusAI is thinking...
          </span>
        </div>

        {/* Typing Bubble */}
        <div className="bot-bubble px-5 py-4 inline-flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-gold-500 typing-dot" />
          <div className="w-2 h-2 rounded-full bg-gold-500 typing-dot" />
          <div className="w-2 h-2 rounded-full bg-gold-500 typing-dot" />
        </div>
      </div>
    </div>
  )
}
