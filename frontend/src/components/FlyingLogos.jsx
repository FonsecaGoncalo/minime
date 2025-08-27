import React, {useMemo, useState, useEffect} from 'react';
import {motion} from 'framer-motion';
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

/* Smooth deceleration/acceleration at the ends (no snap on reverse) */
const easeInOutSine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

export default function FlyingLogos({className = ''}) {
    const getBaseIconSize = () =>
        typeof window !== 'undefined' && window.innerWidth < 640 ? 10 : 26;

    const [baseSize, setBaseSize] = useState(getBaseIconSize());
    useEffect(() => {
        const onResize = () => setBaseSize(getBaseIconSize());
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const logos = useMemo(
        () => [
            SiVagrant, SiPodman, SiTravisci, SiSwagger, SiSonarqube, SiRenovate, SiPostman, SiKotlin, SiGradle,
            SiGooglecloud, SiGit, SiDocker, SiIntellijidea, SiNotion, SiConfluence, SiJira, SiBitbucket, SiGithub,
            SiBruno, SiAmazonsqs, SiAmazons3, SiAmazonroute53, SiJavascript, SiGo, SiJenkins, SiPagerduty, SiStripe,
            SiDatadog, SiAmazondynamodb, SiPulumi, SiSpringboot, SiMysql, SiPostgresql, SiAwssecretsmanager,
            SiGithubactions, SiCircleci, SiAwsfargate, SiAwslambda, SiKubernetes, SiOpenjdk, SiPython, SiTerraform,
            SiAmazonwebservices, SiAmazonrds
        ],
        []
    );

    const logoConfigs = useMemo(
        () =>
            logos.map((Icon) => {
                const palette = [
                    '#E7F5FD', // light teal wash
                    '#D9EEF8', // soft teal
                    '#EEF2F6', // cool gray
                    '#F5F5F3', // neutral alt surface
                    '#CFEAF7'  // pale teal
                ];
                const depth = Math.random();
                return {
                    Icon,
                    depth,
                    size: baseSize * (0.7 + Math.random() * 1.2),
                    color: palette[Math.floor(Math.random() * palette.length)],
                    opacity: 0.06 + depth * 0.18,
                    startX: rand(-20, 120),
                    startY: rand(-20, 120),
                    driftX: rand(15, 40) * (Math.random() < 0.5 ? -1 : 1),
                    driftY: rand(10, 30) * (Math.random() < 0.5 ? -1 : 1),
                    durationX: rand(18, 35),
                    durationY: rand(20, 38),
                    delay: rand(0, 8),
                    wobble: rand(2, 6)
                };
            }),
        [logos, baseSize]
    );

    return (
        <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
            {logoConfigs.map((cfg, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{
                        fontSize: cfg.size,
                        color: cfg.color,
                        opacity: cfg.opacity,
                        mixBlendMode: 'multiply',
                        willChange: 'transform'
                    }}
                    initial={{
                        x: `${cfg.startX}vw`,
                        y: `${cfg.startY}vh`,
                        rotate: 0,
                        scale: 1 - cfg.depth * 0.05
                    }}
                    animate={{
                        x: [`${cfg.startX}vw`, `${cfg.startX + cfg.driftX}vw`, `${cfg.startX}vw`],
                        y: [`${cfg.startY}vh`, `${cfg.startY + cfg.driftY}vh`, `${cfg.startY}vh`],
                        rotate: [-cfg.wobble, cfg.wobble, -cfg.wobble],
                        scale: [1, 1 + (0.02 + cfg.depth * 0.03), 1],
                    }}
                    transition={{
                        /* Smooth out the reversals: use sine easing per segment */
                        x: {
                            duration: cfg.durationX,
                            ease: [easeInOutSine, easeInOutSine],
                            times: [0, 0.5, 1],
                            repeat: Infinity,
                            repeatType: 'mirror',
                            delay: cfg.delay,
                            type: 'tween'
                        },
                        y: {
                            duration: cfg.durationY,
                            ease: [easeInOutSine, easeInOutSine],
                            times: [0, 0.5, 1],
                            repeat: Infinity,
                            repeatType: 'mirror',
                            delay: cfg.delay * 0.7,
                            type: 'tween'
                        },
                        rotate: {
                            duration: cfg.durationX * 0.9,
                            ease: 'easeInOut',
                            repeat: Infinity,
                            repeatType: 'mirror'
                        },
                        scale: {
                            duration: cfg.durationY * 0.8,
                            ease: 'easeInOut',
                            repeat: Infinity,
                            repeatType: 'mirror'
                        }
                    }}
                >
                    <cfg.Icon/>
                </motion.div>
            ))}
        </div>
    );
}
