import React, {useCallback, useState} from 'react';
import SplitText from './SplitText';
import ChatInput from './ChatInput';
import SocialNetworkBadge from './SocialNetworkBadge';
import RollingPrompts from './RollingPrompts';

const PROMPTS = [
    'Do you have any pets?',
    'What’s a side project you’re proud of?',
    'Can I schedule a meeting with you?',
    'What technologies do you work with?',
    'Tell me something fun about yourself!',
    'How did you design your DR strategy?',
    'Show me your modular monolith work',
    'How do you approach system design interviews?',
    'What’s your stack for side projects?',
    'How do you monitor production systems?',
    'Share a debugging story you’re proud of',
    'How do you structure React apps?',
    'What CI/CD practices do you recommend?',
    'How would you shard a database?',
    'What are your favorite developer tools?',
    'How do you handle on-call rotations?',
    'Can you help design a DR strategy?',
    'Show me infra-as-code examples you built',
    'What’s your experience with Kubernetes?',
    'How do you design reliable APIs?',
];

export default function Hero({onSend, value, setValue, disabled, rightExtras}) {
    const [titleReady, setTitleReady] = useState(false);
    const onTitleDone = useCallback(() => setTitleReady(true), []);

    return (
        <div className="w-full max-w-6xl px-4 mx-auto flex flex-col items-center min-h-[100svh] relative z-10">
          {/* Top block centered vertically within available space above prompts */}
          <div className="flex-1 w-full flex flex-col items-center justify-center translate-y-4 sm:translate-y-6 md:translate-y-10">
            {/* Heading */}
            <div className="w-[92vw] max-w-[980px] mx-auto">
              <div className="text-ink text-center">
          <div className="md:max-w-[760px] mx-auto">
            <h1 className="font-medium text-[22px] leading-7 md:text-2xl md:leading-8 whitespace-nowrap mb-1 sm:mb-2">
              <SplitText text="Hi!" as="span" />
              <span className={`inline-block align-baseline leading-none ml-2 relative top-[-0.18em] ${titleReady ? 'wave-once' : ''}`}>👋</span>
            </h1>
          </div>
          <div className="md:max-w-[980px] mx-auto">
            <h1 className="font-semibold text-[28px] leading-8 md:text-5xl md:leading-[1.15] md:text-balance">
              <SplitText
                text={"I'm Gonçalo, a Software Engineer"}
                as="span"
                delay={0.12}
                highlightWords={["Gonçalo"]}
                highlightClass="highlight-name"
                onComplete={onTitleDone}
              />
            </h1>
          </div>
              </div>
            </div>

            {/* Chat input */}
            <div className="mt-4 sm:mt-5 mb-2">
              <ChatInput
                landing
                value={value}
                setValue={setValue}
                onSend={onSend}
                disabled={!!disabled}
                rightExtras={rightExtras}
              />
            </div>

          </div>

          {/* Rolling Prompts - full bleed at the bottom */}
          <div
            className="relative mb-14 sm:mb-16 md:mb-20"
            style={{
              width: '100vw',
              maxWidth: '100vw',
              marginLeft: 'calc(50% - 50vw)',
              marginRight: 'calc(50% - 50vw)',
              overflow: 'hidden',
              paddingBottom: 'env(safe-area-inset-bottom)'
            }}
          >
            <RollingPrompts
              prompts={PROMPTS}
              durationSec={80}
              rows={3}
              onSelect={(p) => onSend(p)}
              className="w-full"
            />
          </div>

          {/* Social icons footer below prompts */}
          <div className="w-full mb-6 sm:mb-8 md:mb-10 px-4">
            <div className="max-w-6xl mx-auto text-center">
              <div className="flex items-center justify-center gap-5">
                <SocialNetworkBadge
                  url="https://github.com/FonsecaGoncalo"
                  icon="github"
                  size={22}
                  className="text-muted hover:text-brand"
                />
                <SocialNetworkBadge
                  url="https://www.linkedin.com/in/goncalo-fonseca"
                  icon="linkedin"
                  size={22}
                  className="text-muted hover:text-brand"
                />
              </div>
            </div>
          </div>
        </div>
    );
}
