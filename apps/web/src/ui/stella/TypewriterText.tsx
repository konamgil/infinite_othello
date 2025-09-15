import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  messages: string[];
  typingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export function TypewriterText({
  messages,
  typingSpeed = 50,
  pauseDuration = 3000,
  className = ''
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    if (messages.length === 0) return;

    const currentMessage = messages[currentMessageIndex];
    let currentIndex = 0;

    const typeInterval = setInterval(() => {
      if (currentIndex <= currentMessage.length) {
        setDisplayText(currentMessage.substring(0, currentIndex));
        currentIndex++;
      } else {
        // 타이핑 완료
        clearInterval(typeInterval);
        setIsTyping(false);

        // 잠시 대기 후 다음 메시지로
        setTimeout(() => {
          setIsTyping(true);
          setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
        }, pauseDuration);
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval);
  }, [currentMessageIndex, messages, typingSpeed, pauseDuration]);

  // 커서 깜빡임 효과
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className={`${className} h-16 flex items-start overflow-hidden`}>
      <span className="leading-relaxed">
        {displayText}
        <span className={`inline-block w-0.5 h-4 bg-current ml-1 transition-opacity ${
          showCursor ? 'opacity-100' : 'opacity-0'
        }`} />
      </span>
    </div>
  );
}