import React from 'react';

const EXPERIENCE = [
    {
        company: 'Paytient',
        role: 'Senior Software Engineer II (promoted from Senior Software Engineer I)',
        period: '2021 — Nov 2025',
        industry: 'Healthcare/Fintech startup',
        location: 'Remote (USA)',
        summary:
            "Joined as 2nd engineer; owned payments end-to-end and built much of the platform's foundational infrastructure; platform available to 10M+ eligible members through employer and health-plan partners.",
        bullets: [
            'Redesigned the member-eligibility ingestion pipeline that processes records for 10M+ members (S3, SQS, AWS Batch, Athena), cutting runtime 98% (6h → 5m) and adding auditing workflows that let Support resolve issues without engineering involvement.',
            'Designed and shipped an idempotent retry pipeline for failed financial transactions, with configurable retry policies and deterministic cancellation under upstream state changes — recovering 20% of previously-failed scheduled charges.',
            'Owned the design and scaling of payment and transaction flows across all core revenue paths, sustaining 99.9%+ availability and PCI-aligned compliance.',
            'Led the refactor of the monolith into a modular architecture, establishing the default pattern for new domain services across 6 product teams and improving ownership and observability boundaries between them.',
            'Architected disaster recovery using a pilot-light pattern (Aurora Global Database, Route 53 failover, RTO < 30m), meeting enterprise SLA requirements and unlocking enterprise customer contracts.',
            'Established multi-account AWS architecture with Control Tower, Elastic Beanstalk → ECS migration, and Terraform standardization — cutting deployment time 80% (50m → 10m), giving teams reproducible environments, and strengthening audit posture for regulated workloads.',
            'Authored RFCs, led design reviews, and rolled out structured logging and distributed tracing (Datadog) across 6 product teams, reducing MTTR ~40%.',
            '2024 "Bias for Action" Award — peer- and leadership-voted recognition for high-impact contributions.',
        ],
    },
    {
        company: 'Mindera',
        role: 'Software Engineer',
        period: '2018 — 2021',
        industry: 'Software consultancy',
        location: 'Porto, Portugal',
        bullets: [
            'Led development of the global shipment platform for Net-a-Porter / YOOX — distributed Java microservices on Kubernetes (AWS), reducing response times ~70% on business-critical logistics flows.',
            'Migrated the Waitrose CMS platform to AWS managed services, authoring the performance test suite that verified services met SLOs under production-level load.',
            'Built a real-time odds publishing service for Solverde as sole developer — low-latency Java service running on GCP (Kubernetes/Docker) supporting live betting updates.',
        ],
    },
    {
        company: 'Natixis',
        role: 'Full Stack Engineer',
        period: '2017 — 2018',
        industry: 'Investment banking',
        location: 'Porto, Portugal',
        bullets: [
            'Built a Java-based contract and document generation system for investment banking operations — automating template-driven document workflows across compliance-sensitive business processes and reducing manual effort across teams.',
        ],
    },
];

const SKILLS = [
    {
        group: 'Languages & Frameworks',
        items: ['Java', 'Spring Boot', 'Vert.x', 'jOOQ', 'RxJava', 'SQL', 'Python'],
    },
    {
        group: 'Data & Messaging',
        items: ['PostgreSQL', 'MySQL', 'DynamoDB', 'Redis', 'Kafka', 'SQS', 'EventBridge', 'S3', 'Athena'],
    },
    {
        group: 'Cloud & Platform',
        items: ['AWS (ECS, Lambda, API Gateway, Control Tower)', 'Kubernetes', 'Terraform', 'Docker'],
    },
    {
        group: 'Architecture',
        items: ['REST APIs', 'Microservices', 'System design', 'Distributed systems', 'Event-driven architecture', 'Idempotent design', 'Fault tolerance', 'Modular monoliths'],
    },
    {
        group: 'Practices',
        items: ['CI/CD', 'IaC', 'Observability (Datadog, OpenTelemetry)', 'RFC authorship', 'Mentorship'],
    },
];

const EDUCATION = [
    {degree: 'B.Sc. Computer Science (part-time)', school: 'ISEP', period: '2017 — 2019'},
    {degree: 'M.Sc. Materials Engineering', school: 'FEUP', period: '2017'},
];

function SectionLabel({children}) {
    return (
        <div className="flex items-center gap-3">
            <span
                className="font-sans text-[11px] font-medium uppercase text-amber"
                style={{letterSpacing: '2px'}}
            >
                {children}
            </span>
            <span className="flex-1 h-px bg-[rgba(243,233,211,0.14)]"/>
        </div>
    );
}

function NavLink({href, children, aria, icon}) {
    const inner = icon ? <Icon kind={icon}/> : children;
    return (
        <a
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={aria}
            title={aria}
            className={`inline-flex items-center justify-center font-sans text-[13px] transition-colors duration-150 text-cream-soft hover:text-cream ${
                icon ? 'rounded-[14px] hover:bg-[rgba(243,233,211,0.07)]' : 'nav-link'
            }`}
            style={{padding: icon ? 8 : '6px 10px'}}
        >
            {inner}
        </a>
    );
}

function Icon({kind}) {
    if (kind === 'gh') {
        return (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path
                    d="M8 0a8 8 0 00-2.5 15.6c.4.1.5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.4.7.1-.5.3-.9.5-1.1-1.8-.2-3.7-.9-3.7-4 0-.9.3-1.6.8-2.2-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.6 7.6 0 014 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.2 0 3.1-1.9 3.8-3.7 4 .3.3.6.8.6 1.6v2.3c0 .2.1.5.5.4A8 8 0 008 0z"/>
            </svg>
        );
    }
    if (kind === 'li') {
        return (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path
                    d="M13.6 13.6h-2.4V9.9c0-.9 0-2-1.2-2s-1.4 1-1.4 2v3.7H6.2V6h2.3v1c.3-.6 1.1-1.2 2.3-1.2 2.5 0 2.9 1.6 2.9 3.7v4.1zM3.5 5a1.4 1.4 0 110-2.8 1.4 1.4 0 010 2.8zm1.2 8.6H2.3V6h2.4v7.6z"/>
            </svg>
        );
    }
    return null;
}

function Job({company, role, period, industry, location, summary, bullets}) {
    return (
        <article>
            <header
                className="flex justify-between items-baseline gap-4"
                style={{marginBottom: 4}}
            >
                <h3
                    className="m-0 font-serif font-normal text-cream leading-[1.2]"
                    style={{fontSize: 24, letterSpacing: '-0.01em'}}
                >
                    {company}
                </h3>
                <span
                    className="font-mono whitespace-nowrap text-[12px] text-[rgba(243,233,211,0.55)]"
                    style={{letterSpacing: '0.4px'}}
                >
                    {period}
                </span>
            </header>
            <div className="text-[14px] text-cream-soft leading-[1.4]">
                {role}
            </div>
            <div
                className="text-[13px] text-[rgba(243,233,211,0.55)] leading-[1.4] mb-[14px]"
                style={{marginTop: 2}}
            >
                {industry}
                <span style={{padding: '0 8px'}}>·</span>
                {location}
            </div>
            {summary && (
                <p className="m-0 mb-[14px] text-[14px] leading-[1.55] text-cream-soft">
                    {summary}
                </p>
            )}
            <ul className="m-0 p-0 list-none flex flex-col gap-2">
                {bullets.map((b, i) => (
                    <li
                        key={i}
                        className="relative text-cream-soft leading-[1.55]"
                        style={{fontSize: 13.5, paddingLeft: 18}}
                    >
                        <span
                            className="absolute bg-amber"
                            style={{left: 0, top: 9, width: 6, height: 1.5}}
                        />
                        {b}
                    </li>
                ))}
            </ul>
        </article>
    );
}

function SkillGroup({group, items}) {
    return (
        <div>
            <div
                className="text-[11px] uppercase text-[rgba(243,233,211,0.55)]"
                style={{letterSpacing: '1.5px', marginBottom: 8}}
            >
                {group}
            </div>
            <div className="flex flex-wrap gap-1.5">
                {items.map((s) => (
                    <span
                        key={s}
                        className="text-[13px] text-cream-soft rounded-full"
                        style={{
                            padding: '5px 11px',
                            border: '1px solid rgba(243,233,211,0.14)',
                            background: 'rgba(243,233,211,0.04)',
                        }}
                    >
                        {s}
                    </span>
                ))}
            </div>
        </div>
    );
}

export default function RightPanel() {
    return (
        <section
            className="sp-side rounded-pane text-cream overflow-y-auto cv-scroll"
            style={{
                background: 'linear-gradient(180deg, #1e3447 0%, #152333 100%)',
            }}
        >
            <header
                className="sticky top-0 z-10 flex justify-end items-center px-9 py-7 max-[980px]:px-5 max-[980px]:py-5"
                style={{
                    background:
                        'linear-gradient(180deg, #1e3447 70%, rgba(30,52,71,0) 100%)',
                }}
            >
                <nav className="flex items-center gap-1.5">
                    <NavLink href="mailto:goncalofnsc@gmail.com">goncalofnsc@gmail.com</NavLink>
                    <span
                        className="bg-[rgba(243,233,211,0.14)]"
                        style={{width: 1, height: 14, margin: '0 6px'}}
                    />
                    <NavLink
                        href="https://github.com/FonsecaGoncalo"
                        aria="GitHub"
                        icon="gh"
                    />
                    <NavLink
                        href="https://linkedin.com/in/goncalo-fonseca"
                        aria="LinkedIn"
                        icon="li"
                    />
                </nav>
            </header>

            <div
                className="px-11 pb-14 max-[980px]:px-5 max-[980px]:pb-10"
                style={{maxWidth: 880}}
            >
                <div style={{marginBottom: 56}}>
                    <SectionLabel>About</SectionLabel>
                    <p
                        className="m-0 font-serif font-normal text-cream"
                        style={{
                            marginTop: 14,
                            fontSize: 28,
                            lineHeight: 1.35,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Software engineer, based in Porto, Portugal. I enjoy working at the intersection of product and platform — building products that make users' lives easier.
                    </p>
                </div>

                <section style={{marginBottom: 56}}>
                    <SectionLabel>Experience</SectionLabel>
                    <div className="flex flex-col" style={{marginTop: 24, gap: 36}}>
                        {EXPERIENCE.map((job) => (
                            <Job key={job.company} {...job} />
                        ))}
                    </div>
                </section>

                <section style={{marginBottom: 56}}>
                    <SectionLabel>Stack</SectionLabel>
                    <div
                        className="flex flex-col"
                        style={{marginTop: 22, gap: 18}}
                    >
                        {SKILLS.map((g) => (
                            <SkillGroup key={g.group} {...g} />
                        ))}
                    </div>
                </section>

                <section style={{marginBottom: 56}}>
                    <div
                        className="grid"
                        style={{gridTemplateColumns: '1fr 1fr', gap: 36}}
                    >
                        <div>
                            <SectionLabel>Education</SectionLabel>
                            <div
                                className="flex flex-col"
                                style={{marginTop: 22, gap: 16}}
                            >
                                {EDUCATION.map((e) => (
                                    <div key={e.degree}>
                                        <div className="text-[15px] text-cream leading-[1.35]">
                                            {e.degree}
                                        </div>
                                        <div
                                            className="text-[13px] text-[rgba(243,233,211,0.55)]"
                                            style={{marginTop: 3}}
                                        >
                                            {e.school} · {e.period}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <SectionLabel>Award</SectionLabel>
                            <div style={{marginTop: 22}}>
                                <div className="text-[15px] text-cream leading-[1.4]">
                                    "Bias for Action" Award
                                </div>
                                <div
                                    className="text-[13px] text-[rgba(243,233,211,0.55)]"
                                    style={{marginTop: 3}}
                                >
                                    Paytient · 2024 · peer- and leadership-voted
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div
                    className="flex justify-between text-[11px] text-[rgba(243,233,211,0.55)]"
                    style={{
                        paddingTop: 24,
                        borderTop: '1px solid rgba(243,233,211,0.14)',
                        letterSpacing: '0.6px',
                    }}
                >
                    <span>Porto, PT · Open to new roles</span>
                    <span>© 2026 · gfonseca.io</span>
                </div>
            </div>
        </section>
    );
}
