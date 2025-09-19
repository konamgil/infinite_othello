import React, { useState, useEffect } from 'react';

interface TypewriterTextProps {
  messages: string[];
  typingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export function TypewriterText({
  messages,
  typingSpeed = 60,
  pauseDuration = 5000,
  className = ''
}: TypewriterTextProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  // 메인 타이핑 로직
  useEffect(() => {
    if (messages.length === 0) return;

    const currentMessage = messages[currentMessageIndex];
    let currentIndex = 0;
    setDisplayText(''); // 초기화

    // 1단계: 타이핑
    const typeInterval = setInterval(() => {
      if (currentIndex < currentMessage.length) {
        setDisplayText(currentMessage.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        // 타이핑 완료
        clearInterval(typeInterval);

        // 2단계: 대기 후 지우기 (메시지가 여러 개일 때만)
        if (messages.length > 1) {
          setTimeout(() => {
            setDisplayText('');

            // 3단계: 다음 메시지로
            setTimeout(() => {
              setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
            }, 200);
          }, pauseDuration);
        }
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval);
  }, [currentMessageIndex, messages, typingSpeed, pauseDuration]);

  // 커서 깜빡임
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className={className}>
      <span>
        {displayText}
        <span className={`inline-block w-0.5 h-4 bg-current ml-1 transition-opacity ${
          showCursor ? 'opacity-100' : 'opacity-0'
        }`} />
      </span>
    </div>
  );
}