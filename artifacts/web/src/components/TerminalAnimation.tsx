import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const commands = [
  { cmd: "npx -y @smallchat/core@^1 compile --source ~/.mcp.json", out: "Embedding 3 tools...\nOutput: tools.toolkit.json\n  - format 1.0, content hash 9c41e07a2b6d13f0…" },
  { cmd: "npx -y @smallchat/core@^1 inspect tools.toolkit.json --selectors", out: "Selectors:\n  github.search_code → github/search_code\n  github.create_issue → github/create_issue" },
  { cmd: "npx -y @smallchat/core@^1 resolve tools.toolkit.json \"search for code\"", out: "Outcome: resolved (tier HIGH, decision ranked)\nChosen: github/search_code  (serve name: github__search_code)\nProof digest: 5e0c9a…" }
];

export function TerminalAnimation() {
  const [step, setStep] = useState(0);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    if (step >= commands.length) return;

    const currentCmd = commands[step].cmd;
    
    if (isTyping) {
      if (text.length < currentCmd.length) {
        const timeout = setTimeout(() => {
          setText(currentCmd.slice(0, text.length + 1));
        }, 30 + Math.random() * 40);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setIsTyping(false);
        }, 400);
        return () => clearTimeout(timeout);
      }
    } else {
      const timeout = setTimeout(() => {
        setStep(s => s + 1);
        setText("");
        setIsTyping(true);
      }, 2500);
      return () => clearTimeout(timeout);
    }
  }, [text, isTyping, step]);

  return (
    <div className="rounded-xl overflow-hidden glass-panel border-white/10 w-full max-w-2xl mx-auto shadow-2xl">
      <div className="flex items-center px-4 py-3 border-b border-white/5 bg-black/40">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
          <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
          <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
        </div>
        <div className="mx-auto text-xs text-muted-foreground font-mono">bash</div>
      </div>
      <div className="p-5 font-mono text-sm sm:text-base h-[280px] bg-[#0d0d0d] overflow-hidden flex flex-col justify-end">
        <div className="space-y-4">
          {commands.slice(0, step).map((c, i) => (
            <div key={i} className="space-y-1">
              <div className="flex text-gray-300">
                <span className="text-primary mr-2">❯</span>
                <span>{c.cmd}</span>
              </div>
              <div className="text-muted-foreground whitespace-pre-wrap">{c.out}</div>
            </div>
          ))}
          {step < commands.length && (
            <div className="flex text-gray-300">
              <span className="text-primary mr-2">❯</span>
              <span>{text}</span>
              <motion.span 
                animate={{ opacity: [1, 0] }} 
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-2 h-5 bg-white ml-1 inline-block align-middle"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
