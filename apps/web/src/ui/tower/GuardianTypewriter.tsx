import React, { useState, useEffect, useRef, useCallback } from 'react';

interface GuardianTypewriterProps {
  messages: string[];
  typingSpeed?: number;
  pauseDuration?: number;
  className?: string;
}

export function GuardianTypewriter({
  messages,
  typingSpeed = 10,
  pauseDuration = 5000,
  className = ''
}: GuardianTypewriterProps) {
  const [displayText, setDisplayText] = useState('');
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [showCursor, setShowCursor] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(true);

  // 타이핑 함수
  const typeMessage = useCallback((message: string, speed: number, onComplete?: () => void) => {
    let index = 0;
    setDisplayText('');
    setIsTyping(true);

    const typeChar = () => {
      if (!isActiveRef.current) return;

      if (index < message.length) {
        setDisplayText(message.substring(0, index + 1));
        index++;
        intervalRef.current = setTimeout(typeChar, speed);
      } else {
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    };

    typeChar();
  }, []);

  // 메시지 시퀀스 관리
  useEffect(() => {
    if (messages.length === 0) return;

    isActiveRef.current = true;
    const currentMessage = messages[currentMessageIndex];

    typeMessage(currentMessage, typingSpeed, () => {
      if (messages.length > 1) {
        timeoutRef.current = setTimeout(() => {
          if (!isActiveRef.current) return;
          setDisplayText('');
          setTimeout(() => {
            if (!isActiveRef.current) return;
            setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
          }, 300);
        }, pauseDuration);
      }
    });

    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [currentMessageIndex, typeMessage]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // 커서 깜빡임
  useEffect(() => {
    if (isTyping) {
      setShowCursor(true);
      return;
    }

    const cursorInterval = setInterval(() => {
      if (!isActiveRef.current) return;
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, [isTyping]);

  return (
    <div className={className}>
      <span>
        {displayText}
        <span className={`inline-block w-0.5 h-4 bg-purple-300 ml-1 transition-opacity ${
          showCursor ? 'opacity-100' : 'opacity-0'
        }`} />
      </span>
    </div>
  );
}