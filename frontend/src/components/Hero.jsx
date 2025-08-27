import React, {useCallback, useState} from 'react';
import SplitText from './SplitText';
import ChatInput from './ChatInput';
import SocialNetworkBadge from './SocialNetworkBadge';
import RollingPrompts from './RollingPrompts';

const PROMPTS = [
    'Do you have any pets?',
    'What’s a side project you’re proud of?',
    'Can I schedule a meeting with you?',
    'What technologies have you worked with?',
    'Tell me something fun about yourself!',
    'How did you design your disaster recovery strategy?',
    'Show me your modular monolith work.',
    'What’s your stack for side projects?',
    'What was the odds-publishing service you built?',
    'What were your main responsibilities at Paytient?',
    'How did you design a pilot-light disaster recovery architecture?',
    'How did you migrate a monolith into a modular monolith?',
    'Do you have experience with event-driven architectures?',
    'How have you used AWS EventBridge in production?',
    'What is Minime and how does it work on this website?',
    'How does your AWS Runner Fleet provision GitHub runners?',
    'Why did you experiment with building "containish"?',
    'How did you get into software engineering?',
    'What’s your educational background?',
    'Tell me about your trips.',
    'Do you practice any sports?',
    'What is the analytics assistant?',
    'Do you have experience managing container orchestrators?',
    'How have you managed secrets in the past?',
    'How do you document technical decisions?',
    'Tell me about a time you improved the performance of a process.',
    'Have you ever used Infrastructure as Code?',
    'Do you have experience managing payment systems?',
    'Tell me about your career.',
    'Do you have experience with LLMs?'
];


export default function Hero({onSend, value, setValue, disabled, rightExtras}) {
    const [titleReady, setTitleReady] = useState(false);
    const onTitleDone = useCallback(() => setTitleReady(true), []);

    return (
        <div className="w-full max-w-6xl px-4 mx-auto flex flex-col items-center min-h-[100svh] relative z-10">
            {/* Top block centered vertically within available space above prompts */}
            <div
                className="flex-1 w-full flex flex-col items-center justify-center translate-y-4 sm:translate-y-6 md:translate-y-10">
                {/* Heading */}
                <div className="w-[92vw] max-w-[980px] mx-auto">
                    <div className="text-ink text-center">
                        <div className="md:max-w-[980px] mx-auto">
                            <h1 className="font-semibold text-[28px] leading-8 md:text-5xl md:leading-[1.15] md:text-balance">
                                <span className="inline-flex items-center gap-2 align-baseline">
                                  <span>Hi!</span>
                                  <span
                                    className={`inline-block align-baseline leading-none relative top-[-0.18em] ${titleReady ? 'wave-once' : ''}`}
                                  >
                                    👋
                                  </span>
                                </span>
                                <br/>
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
                <div className="mt-10 sm:mt-12 mb-2">
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
