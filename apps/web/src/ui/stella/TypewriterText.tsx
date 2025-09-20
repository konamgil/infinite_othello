import React, { useState, useEffect } from 'react';

/**
 * @interface TypewriterTextProps
 * `TypewriterText` 컴포넌트의 props를 정의합니다.
 */
interface TypewriterTextProps {
  /** @property {string[]} messages - 순서대로 표시할 메시지 문자열의 배열. */
  messages: string[];
  /** @property {number} [typingSpeed=60] - 타이핑 속도 (밀리초). 숫자가 작을수록 빠릅니다. */
  typingSpeed?: number;
  /** @property {number} [pauseDuration=5000] - 한 메시지가 완료된 후 다음 메시지로 넘어가기 전까지의 대기 시간 (밀리초). */
  pauseDuration?: number;
  /** @property {string} [className] - 컴포넌트의 최상위 `div` 요소에 적용할 추가 CSS 클래스. */
  className?: string;
}

/**
 * 텍스트를 타자기처럼 한 글자씩 순서대로 표시하는 효과를 주는 컴포넌트입니다.
 * 여러 메시지를 순환하며 표시할 수 있으며, 깜빡이는 커서 효과를 포함합니다.
 * @param {TypewriterTextProps} props - 컴포넌트 props.
 * @returns {JSX.Element} 타이핑 효과가 적용된 텍스트 UI.
 */
export function TypewriterText({
  messages,
  typingSpeed = 60,
  pauseDuration = 5000,
  className = ''
}: TypewriterTextProps) {
  /** @state {string} displayText - 현재 화면에 표시되고 있는 텍스트. */
  const [displayText, setDisplayText] = useState('');
  /** @state {number} currentMessageIndex - `messages` 배열에서 현재 표시 중인 메시지의 인덱스. */
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  /** @state {boolean} showCursor - 깜빡이는 커서의 현재 표시 여부. */
  const [showCursor, setShowCursor] = useState(true);

  /**
   * 메인 타이핑 로직을 처리하는 `useEffect` 훅입니다.
   * 1. 한 글자씩 텍스트를 타이핑합니다.
   * 2. 메시지가 완료되면 일정 시간 대기합니다.
   * 3. 텍스트를 지우고 다음 메시지로 넘어갑니다 (메시지가 여러 개일 경우).
   * 이 효과는 `currentMessageIndex`가 변경될 때마다 다시 시작됩니다.
   */
  useEffect(() => {
    if (messages.length === 0) return;

    const currentMessage = messages[currentMessageIndex];
    let currentIndex = 0;
    setDisplayText(''); // 새 메시지를 위해 초기화

    const typeInterval = setInterval(() => {
      if (currentIndex < currentMessage.length) {
        setDisplayText(currentMessage.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval); // 타이핑 완료

        // 메시지가 여러 개일 경우, 잠시 후 다음 메시지로 넘어가는 로직
        if (messages.length > 1) {
          setTimeout(() => {
            setDisplayText(''); // 텍스트 지우기
            setTimeout(() => {
              setCurrentMessageIndex((prev) => (prev + 1) % messages.length); // 다음 메시지 인덱스로 업데이트
            }, 200);
          }, pauseDuration);
        }
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval); // 컴포넌트 언마운트 또는 재실행 시 인터벌 정리
  }, [currentMessageIndex, messages, typingSpeed, pauseDuration]);

  /**
   * 커서의 깜빡임 효과를 처리하는 `useEffect` 훅입니다.
   * 500ms마다 커서의 표시 여부를 토글합니다.
   */
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