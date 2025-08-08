import React, { useMemo, useState, useEffect } from 'react';
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

export default function FlyingLogos({ className = '' }) {
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

  // Precompute logo configs so they don't change on re-render
  const logoConfigs = useMemo(
    () =>
      logos.map((Icon) => {
        const depth = Math.random();
        return {
          Icon,
          depth,
          size: baseSize * (0.6 + Math.random() * 1.1),
          opacity: 0.06 + depth * 0.22,
          startX: rand(-20, 120),
          startY: rand(-20, 120),
          driftX: rand(15, 40) * (Math.random() < 0.5 ? -1 : 1),
          driftY: rand(10, 30) * (Math.random() < 0.5 ? -1 : 1),
          durationX: rand(18, 35), // seconds
          durationY: rand(20, 38), // seconds
          delay: rand(0, 8),
          wobble: rand(2, 6)
        };
      }),
    [logos, baseSize]
  );

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {logoConfigs.map((cfg, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            fontSize: cfg.size,
            color: 'white',
            opacity: cfg.opacity,
            willChange: 'transform'
          }}
          initial={{
            x: `${cfg.startX}vw`,
            y: `${cfg.startY}vh`,
            rotate: 0,
            scale: 1 - cfg.depth * 0.05
          }}
          animate={{
            x: [
              `${cfg.startX}vw`,
              `${cfg.startX + cfg.driftX}vw`,
              `${cfg.startX}vw`
            ],
            y: [
              `${cfg.startY}vh`,
              `${cfg.startY + cfg.driftY}vh`,
              `${cfg.startY}vh`
            ],
            rotate: [-cfg.wobble, cfg.wobble, -cfg.wobble],
            scale: [1, 1 + (0.02 + cfg.depth * 0.03), 1],
          }}
          transition={{
            x: {
              duration: cfg.durationX,
              ease: 'linear',
              repeat: Infinity,
              repeatType: 'mirror',
              delay: cfg.delay
            },
            y: {
              duration: cfg.durationY,
              ease: 'linear',
              repeat: Infinity,
              repeatType: 'mirror',
              delay: cfg.delay * 0.7
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
          <cfg.Icon />
        </motion.div>
      ))}
    </div>
  );
}
