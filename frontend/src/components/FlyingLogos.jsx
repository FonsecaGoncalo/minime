import React, {useMemo, useState, useEffect} from 'react';
import {motion} from 'framer-motion';
import {
    SiOpenjdk,
    SiPython,
    SiTerraform,
    SiAmazonwebservices,
    SiAmazonrds,
    SiKubernetes,
    SiAwslambda,
    SiAwsfargate,
    SiCircleci,
    SiGithubactions,
    SiAwssecretsmanager,
    SiPostgresql,
    SiMysql,
    SiSpringboot,
    SiPulumi,
    SiAmazondynamodb,
    SiDatadog,
    SiStripe,
    SiPagerduty,
    SiJenkins,
    SiDocker,
    SiIntellijidea,
    SiNotion,
    SiConfluence,
    SiJira,
    SiBitbucket,
    SiGithub,
    SiBruno,
    SiAmazonsqs,
    SiAmazons3,
    SiAmazonroute53,
    SiJavascript,
    SiGo,
    SiGit,
    SiGooglecloud,
    SiGradle,
    SiKotlin,
    SiPostman,
    SiRenovate,
    SiSonarqube,
    SiSwagger,
    SiTravisci,
    SiPodman,
    SiVagrant
} from 'react-icons/si';

export default function FlyingLogos() {
    const getIconSize = () => (typeof window !== 'undefined' && window.innerWidth < 640 ? '1rem' : '3rem');
    const [iconSize, setIconSize] = useState(getIconSize());

    useEffect(() => {
        const handleResize = () => setIconSize(getIconSize());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const logos = useMemo(() => [SiVagrant, SiPodman, SiTravisci, SiSwagger, SiSonarqube, SiRenovate, SiPostman, SiKotlin, SiGradle, SiGooglecloud, SiGit, SiDocker, SiIntellijidea, SiNotion, SiConfluence, SiJira, SiBitbucket, SiGithub, SiBruno, SiAmazonsqs, SiAmazons3, SiAmazonroute53, SiJavascript, SiGo, SiJenkins, SiPagerduty, SiStripe, SiDatadog, SiAmazondynamodb, SiPulumi, SiSpringboot, SiMysql, SiPostgresql, SiAwssecretsmanager, SiAwssecretsmanager, SiGithubactions, SiCircleci, SiAwsfargate, SiAwslambda, SiKubernetes, SiOpenjdk, SiPython, SiTerraform, SiAmazonwebservices, SiAmazonrds], []);

    const positions = useMemo(
        () =>
            logos.map(() => {
                const xDir = Math.random() < 0.5 ? -1 : 1;
                const yDir = Math.random() < 0.5 ? -1 : 1;

                const startX = Math.random() * 180;
                const startY = Math.random() * 180;
                const endX = startX + xDir * 120;
                const endY = startY + yDir * 120;

                return {
                    start: {
                        x: `${startX}vw`,
                        y: `${startY}vh`,
                        rotate: Math.random() * 360,
                    },
                    end: {
                        x: `${endX}vw`,
                        y: `${endY}vh`,
                        rotate: Math.random() * 360,
                    },
                };
            }),
        [logos]
    );

    return (
        <div className="fixed inset-0 -z-10 pointer-events-none overflow-hidden">
            {logos.map((Icon, i) => (
                <motion.div
                    key={i}
                    className="absolute text-white/20"
                    style={{fontSize: iconSize}}
                    initial={positions[i].start}
                    animate={{
                        ...positions[i].end,
                        transition: {
                            duration: 60,
                            repeat: Infinity,
                            repeatType: 'mirror',
                            ease: 'linear',
                        },
                    }}
                >
                    <Icon/>
                </motion.div>
            ))}
        </div>
    );
}