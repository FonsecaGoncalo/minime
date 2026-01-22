import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, EnvelopeIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import SocialNetworkBadge from './SocialNetworkBadge';

const ExperienceItem = ({ company, role, period, location, description, bullets, onDiscuss }) => (
    <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12 last:mb-0"
    >
        <div className="flex flex-row items-baseline justify-between mb-2 gap-4">
            <h3 className="text-2xl font-medium text-ink">{company}</h3>
            <span className="text-sm font-mono text-ink-light bg-surface px-3 py-1 rounded-full border border-border-light whitespace-nowrap">{period}</span>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
            <span className="text-lg text-ink-light">{role}</span>
            <span className="text-border-DEFAULT">•</span>
            <span className="text-sm text-ink-lighter">{location}</span>
        </div>
        {description && <p className="text-ink-light leading-relaxed mb-6 font-light">{description}</p>}
        <ul className="space-y-1">
            {bullets.map((item, i) => (
                <li
                    key={i}
                    onClick={() => onDiscuss(`Tell me more about your work at ${company}: "${item}"`)}
                    className="flex items-start gap-4 text-ink-light leading-relaxed group cursor-pointer hover:bg-surface-alt/50 -ml-4 pl-4 pr-4 py-3 rounded-2xl transition-all duration-200"
                >
                    <span className="mt-[0.6rem] w-3 h-1 rounded-full bg-border-DEFAULT group-hover:bg-brand-DEFAULT transition-colors duration-300 flex-shrink-0" />
                    <span className="group-hover:text-ink transition-colors duration-300 flex-1 pr-4">{item}</span>
                    <ChatBubbleLeftRightIcon className="w-5 h-5 text-brand-DEFAULT opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 flex-shrink-0 mt-0.5" />
                </li>
            ))}
        </ul>
    </motion.div>
);

const SkillGroup = ({ title, skills }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
    >
        <h4 className="text-sm uppercase tracking-widest text-ink-lighter font-bold mb-4">{title}</h4>
        <div className="flex flex-wrap gap-2">
            {skills.map((skill, i) => (
                <span key={i} className="px-3 py-1.5 rounded-pill bg-surface border border-border-light text-sm text-ink-light hover:border-brand-light hover:text-ink transition-colors cursor-default">
                    {skill}
                </span>
            ))}
        </div>
    </motion.div>
);

export default function Resume({ onDiscuss }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen w-full pt-12 pb-12 sm:pt-24 sm:pb-24"
        >
            <div className="max-w-4xl mx-auto px-6 md:px-12">
                {/* Name & Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-12 sm:mb-24"
                >
                    <h1 className="font-sans font-medium text-5xl sm:text-7xl md:text-8xl tracking-tight text-ink mb-8">
                        Gonçalo<br />Fonseca
                    </h1>
                    <p className="text-xl sm:text-2xl text-ink-light leading-relaxed max-w-2xl font-light">
                        Engineer with experience across backend and infrastructure.
                        Led architecture and platform modernization as the team scaled 2 to 40+,
                        raising standards in reliability, observability, and incident response.
                    </p>
                </motion.div>

                {/* Experience Section */}
                <section className="mb-12 sm:mb-24">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl font-medium text-ink mb-12 flex items-center gap-4"
                    >
                        Experience
                        <span className="h-px flex-1 bg-border-light"></span>
                    </motion.h2>

                    <ExperienceItem
                        company="Paytient"
                        role="Senior Software Engineer II / I"
                        period="2021 — 2025"
                        location="Remote (USA)"
                        description="Joined as one of the first engineers; promoted twice as the team scaled from 2 to 40+. Drove architecture and infrastructure decisions that enabled Paytient's growth."
                        onDiscuss={onDiscuss}
                        bullets={[
                            "Designed and scaled payment systems (Stripe, Dwolla, Plaid, Galileo) that handled core revenue flows, ensuring PCI compliance and high reliability.",
                            "Migrated platform from Elastic Beanstalk to ECS, cutting CI/CD time by 80% (50m to 10m), enabling faster iteration and unblocking delivery speed.",
                            "Built secure multi-account AWS architecture (Control Tower), reducing blast radius and ensuring regulatory compliance.",
                            "Delivered disaster recovery with pilot-light architecture (RTO < 30m), unlocking enterprise contracts with strict SLAs.",
                            "Cut census ingestion pipeline runtime by 98% (6h to 5m) using S3, SQS, Batch, and Athena.",
                            "Authored RFCs, mentored engineers, and reviewed designs, driving adoption of observability and architecture standards across teams.",
                            "Led the refactor of the monolith into a modular architecture, improving ownership and observability, enabling future microservices.",
                            "Standardized infrastructure with Terraform IaC, enabling reproducible environments and consistent cloud provisioning.",
                            "Introduced structured logging and distributed tracing (Datadog), reducing MTTR across the organization."
                        ]}
                    />

                    <ExperienceItem
                        company="Mindera"
                        role="Software Engineer"
                        period="2018 — 2021"
                        location="Porto, Portugal"
                        onDiscuss={onDiscuss}
                        bullets={[
                            "YNAP (2018–2020): Lead developer on global shipment platform for Net-a-Porter; built distributed microservices in Java (Spring Boot, Vert.x, RxJava) on AWS, cutting response times by ~70%.",
                            "Waitrose (2020): Migrated CMS to AWS managed compute (Lambda, EKS, S3, SQS); validated SLAs with Scala/Gatling performance tests.",
                            "Solverde (2020–2021): Sole developer of real-time odds-publishing service (Java WebFlux, Docker, Kubernetes on GCP). Designed in-memory tree for ultra-low-latency odds delivery."
                        ]}
                    />

                    <ExperienceItem
                        company="Natixis"
                        role="Full Stack Engineer"
                        period="2017 — 2018"
                        location="Porto, Portugal"
                        onDiscuss={onDiscuss}
                        bullets={[
                            "Developed Java system for contract and document generation in investment banking, automating workflows for internal teams."
                        ]}
                    />
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Skills */}
                    <section>
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl font-medium text-ink mb-12 flex items-center gap-4"
                        >
                            Skills
                            <span className="h-px flex-1 bg-border-light"></span>
                        </motion.h2>
                        <SkillGroup
                            title="Languages & Frameworks"
                            skills={["Java", "Spring Boot", "Vert.x", "RxJava", "SQL", "JavaScript", "React"]}
                        />
                        <SkillGroup
                            title="Cloud & Infra"
                            skills={["AWS (ECS, Lambda, DynamoDB)", "Terraform", "Kubernetes", "Docker", "GCP"]}
                        />
                        <SkillGroup
                            title="Practices"
                            skills={["Distributed Systems", "Event-driven Arch", "Modular Monoliths", "Observability", "CI/CD", "IaC"]}
                        />
                    </section>

                    {/* Education & Awards */}
                    <section>
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-4xl font-medium text-ink mb-12 flex items-center gap-4"
                        >
                            Education
                            <span className="h-px flex-1 bg-border-light"></span>
                        </motion.h2>
                        <div className="mb-8">
                            <h3 className="text-xl font-medium text-ink">M.Sc. Materials Engineering</h3>
                            <p className="text-ink-light">FEUP (2017)</p>
                        </div>
                        <div className="mb-12">
                            <h3 className="text-xl font-medium text-ink">B.Sc. Computer Science</h3>
                            <p className="text-ink-light">ISEP (2017 — 2019)</p>
                        </div>

                        <h2 className="text-4xl font-medium text-ink mb-12 flex items-center gap-4">
                            Awards
                            <span className="h-px flex-1 bg-border-light"></span>
                        </h2>
                        <div>
                            <h3 className="text-xl font-medium text-ink">“Live the Mission” Award (2024)</h3>
                            <p className="text-ink-light">Paytient — Company-wide recognition for high-impact contributions.</p>
                        </div>
                    </section>
                </div>

            </div>
        </motion.div>
    );
}
