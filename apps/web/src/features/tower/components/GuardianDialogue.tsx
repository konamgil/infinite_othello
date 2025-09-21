import React from 'react';
import { GuardianTypewriter } from './GuardianTypewriter';
import { CosmicGuardian } from './CosmicGuardian';

interface GuardianDialogueProps {
  messages: string[];
  className?: string;
}

export function GuardianDialogue({ messages, className = '' }: GuardianDialogueProps) {
  return (
    <div className={`guardian-dialogue ${className}`}>
      <div className="w-full max-w-sm mx-auto bg-black/20 backdrop-blur-md border border-white/10 rounded-xl p-2">
        <div className="flex items-center gap-2 h-12">
          <div className="w-12 h-12 flex-shrink-0">
            <CosmicGuardian className="w-full h-full" />
          </div>
          <div className="flex-grow h-12 flex items-center">
            <GuardianTypewriter
              messages={messages}
              typingSpeed={80}
              pauseDuration={4000}
              className="text-white/90 text-left text-xs leading-relaxed font-smooth"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .guardian-dialogue {
          /* 추후 가디언 대화만의 스타일 추가 가능 */
        }
      `}</style>
    </div>
  );
}