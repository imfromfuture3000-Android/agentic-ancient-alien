import { useState, useEffect } from "react";

interface GlitchTextProps {
  text: string;
  className?: string;
}

export function GlitchText({ text, className = "" }: GlitchTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Randomly glitch the text occasionally
    const triggerGlitch = () => {
      let iterations = 0;
      clearInterval(interval);
      
      interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, index) => {
              if (index < iterations) {
                return text[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("")
        );

        if (iterations >= text.length) {
          clearInterval(interval);
        }

        iterations += 1 / 3;
      }, 30);
    };

    // Initial glitch on mount
    triggerGlitch();

    // Random glitch effect every few seconds
    const loop = setInterval(() => {
      if (Math.random() > 0.8) triggerGlitch();
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(loop);
    };
  }, [text]);

  return <span className={className}>{displayText}</span>;
}
