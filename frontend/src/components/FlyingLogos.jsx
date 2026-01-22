import React, { useMemo, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    SiOpenjdk, SiPython, SiTerraform, SiAmazonwebservices, SiAmazonrds, SiKubernetes,
    SiAwslambda, SiAwsfargate, SiCircleci, SiGithubactions, SiAwssecretsmanager,
    SiPostgresql, SiMysql, SiSpringboot, SiPulumi, SiAmazondynamodb, SiDatadog,
    SiStripe, SiPagerduty, SiJenkins, SiDocker, SiIntellijidea, SiNotion, SiConfluence,
    SiJira, SiBitbucket, SiGithub, SiBruno, SiAmazonsqs, SiAmazons3, SiAmazonroute53,
    SiJavascript, SiGo, SiGit, SiGooglecloud, SiGradle, SiKotlin, SiPostman,
    SiRenovate, SiSonarqube, SiSwagger, SiTravisci, SiPodman, SiVagrant
} from 'react-icons/si';

const rand = (min, max) => min + Math.random() * (max - min);

// Google/Antigravity inspired vibrant palette
const VIBRANT_PALETTE = [
    '#4285F4', // Google Blue
    '#DB4437', // Google Red
    '#F4B400', // Google Yellow
    '#0F9D58', // Google Green
    '#AB47BC', // Purple
    '#00ACC1', // Cyan
    '#FF7043', // Orange
];

const easeInOutSine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

function FlyingLogos({ className = '' }) {
    const containerRef = useRef(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const getBaseIconSize = () =>
        typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 20;

    const [baseSize, setBaseSize] = useState(getBaseIconSize());

    useEffect(() => {
        const setProperty = (name, value) => {
            if (containerRef.current) {
                containerRef.current.style.setProperty(name, value);
            }
        };

        const updatePos = (x, y) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setProperty('--mouse-x', `${x - rect.left}px`);
                setProperty('--mouse-y', `${y - rect.top}px`);
            }
        };

        const onResize = () => {
            setBaseSize(getBaseIconSize());
            const isMobile = window.innerWidth < 640;
            setProperty('--mask-radius', isMobile ? '120px' : '350px');
        };

        const onMouseMove = (e) => updatePos(e.clientX, e.clientY);
        const onTouchMove = (e) => updatePos(e.touches[0].clientX, e.touches[0].clientY);

        window.addEventListener('resize', onResize);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('touchmove', onTouchMove);
        window.addEventListener('touchstart', onTouchMove);

        // Initial setup
        onResize();
        setProperty('--mouse-x', '-1000px'); // Start hidden
        setProperty('--mouse-y', '-1000px');

        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('touchmove', onTouchMove);
            window.removeEventListener('touchstart', onTouchMove);
        };
    }, []);

    const logos = useMemo(
        () => [
            SiVagrant, SiPodman, SiTravisci, SiSwagger, SiSonarqube, SiRenovate, SiPostman, SiKotlin, SiGradle,
            SiGooglecloud, SiGit, SiDocker, SiIntellijidea, SiNotion, SiConfluence, SiJira, SiBitbucket, SiGithub,
            SiBruno, SiAmazonsqs, SiAmazons3, SiAmazonroute53, SiJavascript, SiGo, SiGit, SiGooglecloud, SiGradle,
            SiDatadog, SiAmazondynamodb, SiPulumi, SiSpringboot, SiMysql, SiPostgresql, SiAwssecretsmanager,
            SiGithubactions, SiCircleci, SiAwsfargate, SiAwslambda, SiKubernetes, SiOpenjdk, SiPython, SiTerraform,
            SiAmazonwebservices, SiAmazonrds
        ],
        []
    );

    const logoConfigs = useMemo(
        () =>
            logos.map((Icon, i) => {
                const depth = Math.random();
                const color = VIBRANT_PALETTE[Math.floor(Math.random() * VIBRANT_PALETTE.length)];

                return {
                    Icon,
                    depth,
                    size: baseSize * (0.5 + depth * 1.5),
                    color, // Store the vibrant color

                    // Initial Position
                    startX: rand(0, 100),
                    startY: rand(0, 100),

                    // Floating Animation
                    duration: rand(15, 30), // Much faster: 15-30s instead of 20-60s
                    yOffset: rand(40, 120) * (Math.random() > 0.5 ? 1 : -1), // Move further vertically
                    xOffset: rand(30, 80) * (Math.random() > 0.5 ? 1 : -1), // Add horizontal drift

                    rotateDuration: rand(30, 80),
                    rotateDir: Math.random() > 0.5 ? 1 : -1,

                    delay: rand(0, -20)
                };
            }),
        [logos, baseSize]
    );

    return (
        <div
            ref={containerRef}
            className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
        >
            {/* Layer 1: Grayscale Background */}
            {logoConfigs.map((cfg, i) => (
                <LogoItem key={`bg-${i}`} cfg={cfg} isColored={false} />
            ))}

            {/* Layer 2: Colorful Reveal (Masked) */}
            <div
                className="absolute inset-0"
                style={{
                    maskImage: 'radial-gradient(var(--mask-radius, 350px) circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), black, transparent)',
                    WebkitMaskImage: 'radial-gradient(var(--mask-radius, 350px) circle at var(--mouse-x, -1000px) var(--mouse-y, -1000px), black, transparent)',
                }}
            >
                {logoConfigs.map((cfg, i) => (
                    <LogoItem key={`fg-${i}`} cfg={cfg} isColored={true} />
                ))}
            </div>

            {/* Overlay Gradient to fade edges slightly */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-white/10 pointer-events-none" />
        </div>
    );
}

const LogoItem = React.memo(({ cfg, isColored }) => (
    <motion.div
        className="absolute will-change-transform"
        style={{
            fontSize: cfg.size,
            // If isColored, usage actual vibrant color. If not, use dark gray.
            color: isColored ? cfg.color : '#121317',
            // If isColored, fully opaque. If not, faint.
            opacity: isColored ? 0.8 : (cfg.depth > 0.7 ? 0.03 : (0.05 + Math.random() * 0.05)),
            // Only blur the background (non-colored) ones to make the colored ones pop sharp
            filter: !isColored && cfg.depth > 0.8 ? `blur(${rand(1, 3)}px)` : 'none',
            left: `${cfg.startX}%`,
            top: `${cfg.startY}%`,
        }}
        animate={{
            y: [0, cfg.yOffset, 0],
            x: [0, cfg.xOffset, 0],
            rotate: [0, 360 * cfg.rotateDir],
        }}
        transition={{
            y: {
                duration: cfg.duration,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
                delay: cfg.delay
            },
            x: {
                duration: cfg.duration * 1.2, // Slightly offset timing for organic feel
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "mirror",
                delay: cfg.delay
            },
            rotate: {
                duration: cfg.rotateDuration,
                ease: "linear",
                repeat: Infinity
            }
        }}
    >
        <cfg.Icon />
    </motion.div>
));

export default React.memo(FlyingLogos);
