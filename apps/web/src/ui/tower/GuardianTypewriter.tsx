import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * @interface GuardianTypewriterProps
 * `GuardianTypewriter` 컴포넌트의 props를 정의합니다.
 */
interface GuardianTypewriterProps {
  /** @property {string[]} messages - 순환하며 표시할 메시지 목록입니다. */
  messages: string[];
  /** @property {number} [typingSpeed=10] - 글자가 타이핑되는 속도 (밀리초). 숫자가 작을수록 빠릅니다. */
  typingSpeed?: number;
  /** @property {number} [pauseDuration=5000] - 한 메시지가 완료된 후 다음 메시지로 넘어가기 전까지의 대기 시간 (밀리초). */
  pauseDuration?: number;
  /** @property {string} [className] - 컴포넌트의 최상위 `<div>` 요소에 적용할 추가 CSS 클래스입니다. */
  className?: string;
}

/**
 * 주어진 메시지 목록을 하나씩 타이핑 효과로 보여주는 컴포넌트입니다.
 * 메시지 사이에는 지정된 시간만큼 멈추며, 깜빡이는 커서 효과를 포함합니다.
 * @param {GuardianTypewriterProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 타이핑 효과가 적용된 텍스트와 커서를 포함하는 UI.
 */
export function GuardianTypewriter({
  messages,
  typingSpeed = 10,
  pauseDuration = 5000,
  className = ''
}: GuardianTypewriterProps) {
  // --- State ---
  /** @state {string} displayText - 현재 화면에 표시되는 텍스트입니다. */
  const [displayText, setDisplayText] = useState('');
  /** @state {number} currentMessageIndex - `messages` 배열에서 현재 표시 중인 메시지의 인덱스입니다. */
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  /** @state {boolean} showCursor - 깜빡이는 커서의 현재 표시 여부입니다. */
  const [showCursor, setShowCursor] = useState(true);
  /** @state {boolean} isTyping - 현재 타이핑 애니메이션이 진행 중인지 여부입니다. */
  const [isTyping, setIsTyping] = useState(false);

  // --- Refs ---
  /** @ref {NodeJS.Timeout | null} intervalRef - 타이핑 효과(문자 추가)에 사용되는 `setTimeout`의 ID를 저장합니다. */
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  /** @ref {NodeJS.Timeout | null} timeoutRef - 메시지 사이의 일시정지에 사용되는 `setTimeout`의 ID를 저장합니다. */
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  /** @ref {boolean} isActiveRef - 컴포넌트가 마운트된 상태인지 추적합니다. 비동기 작업 후 상태 업데이트를 방지하기 위해 사용됩니다. */
  const isActiveRef = useRef(true);

  /**
   * 단일 메시지를 한 글자씩 타이핑하는 함수입니다.
   * `useCallback`으로 감싸져 `useEffect`의 의존성 배열에서 안정적으로 사용됩니다.
   * @param {string} message - 타이핑할 전체 메시지.
   * @param {number} speed - 타이핑 속도.
   * @param {() => void} [onComplete] - 타이핑이 완료되었을 때 호출될 콜백 함수.
   */
  const typeMessage = useCallback((message: string, speed: number, onComplete?: () => void) => {
    let index = 0;
    setDisplayText('');
    setIsTyping(true);

    const typeChar = () => {
      // 컴포넌트가 언마운트된 경우, 더 이상 진행하지 않습니다.
      if (!isActiveRef.current) return;

      if (index < message.length) {
        setDisplayText(message.substring(0, index + 1));
        index++;
        // 재귀적으로 다음 문자를 타이핑하도록 예약합니다.
        intervalRef.current = setTimeout(typeChar, speed);
      } else {
        setIsTyping(false);
        if (onComplete) onComplete(); // 타이핑 완료 후 콜백 실행
      }
    };

    typeChar();
  }, []);

  /**
   * 메시지 시퀀스를 관리하는 메인 `useEffect` 훅입니다.
   * `currentMessageIndex`가 변경될 때마다 새로운 타이핑 시퀀스를 시작합니다.
   */
  useEffect(() => {
    if (messages.length === 0) return;

    isActiveRef.current = true;
    const currentMessage = messages[currentMessageIndex];

    // 현재 메시지 타이핑 시작
    typeMessage(currentMessage, typingSpeed, () => {
      // 메시지가 여러 개일 경우, 다음 메시지로 넘어가는 로직을 예약합니다.
      if (messages.length > 1) {
        timeoutRef.current = setTimeout(() => {
          if (!isActiveRef.current) return;
          setDisplayText(''); // 텍스트 지우기 (사라지는 효과)
          setTimeout(() => {
            if (!isActiveRef.current) return;
            // 다음 메시지 인덱스로 업데이트 (배열의 끝에 도달하면 처음으로 돌아감)
            setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
          }, 300); // 텍스트가 완전히 사라진 후 다음으로 넘어갈 시간
        }, pauseDuration);
      }
    });

    // 클린업 함수: 컴포넌트가 언마운트되거나 의존성이 변경되기 전에 실행됩니다.
    // 모든 예약된 타이머를 제거하여 메모리 누수를 방지합니다.
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
  }, [currentMessageIndex, messages, pauseDuration, typingSpeed, typeMessage]);

  /**
   * 컴포넌트가 완전히 언마운트될 때 모든 타이머를 확실히 정리하기 위한 최종 안전장치입니다.
   */
  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) clearTimeout(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  /**
   * 커서의 깜빡임 효과를 관리하는 `useEffect` 훅입니다.
   * 타이핑 중일 때는 커서가 항상 켜져 있고, 멈췄을 때만 깜빡입니다.
   */
  useEffect(() => {
    if (isTyping) {
      setShowCursor(true);
      return; // 타이핑 중에는 깜빡임 로직을 실행하지 않음
    }

    const cursorInterval = setInterval(() => {
      if (!isActiveRef.current) return;
      setShowCursor(prev => !prev);
    }, 500); // 0.5초마다 커서 표시 상태를 토글

    return () => clearInterval(cursorInterval);
  }, [isTyping]);

  return (
    <div className={className}>
      <span>
        {displayText}
        {/* 깜빡이는 커서 역할을 하는 span 요소 */}
        <span className={`inline-block w-0.5 h-4 bg-purple-300 ml-1 transition-opacity ${
          showCursor ? 'opacity-100' : 'opacity-0'
        }`} />
      </span>
    </div>
  );
}