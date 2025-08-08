import {useEffect, useRef, memo} from 'react';

const svgCache = new Map();

function Mermaid({chart}) {
    const ref = useRef(null);

    useEffect(() => {
        let cancelled = false;

        async function run() {
            if (!chart || !ref.current) return;

            // Cache hit ➜ inject and bail
            if (svgCache.has(chart)) {
                if (ref.current) {
                    // no clear → avoids flash
                    ref.current.innerHTML = svgCache.get(chart);
                }
            }

            try {
                const m = await import('mermaid');
                const mermaid = m.default || m;

                try {
                    mermaid.parseError = () => {
                    };
                } catch {
                }
                mermaid.initialize({

                    startOnLoad: false,
                    theme: 'dark',
                    securityLevel: 'loose',
                    loadExternalDiagrams: false,
                    logLevel: 'fatal'
                });

                const id = 'm-' + Math.random().toString(36).slice(2);
                const {svg} = await mermaid.render(id, chart);

                if (!cancelled && ref.current) {
                    svgCache.set(chart, svg);
                    // fade-in to hide any late paint
                    ref.current.style.opacity = '0';
                    ref.current.innerHTML = svg;
                    requestAnimationFrame(() => {
                        if (ref.current) ref.current.style.opacity = '1';
                    });

                }
            } catch {
                if (ref.current) ref.current.textContent = 'Mermaid render error.';
            }
        }

        run();

        return () => {
            cancelled = true;
        };
    }, [chart]);

    return (
        <div
            ref={ref}
            className="mermaid-svg"
            style={{ width: '100%', overflowX: 'auto', transition: 'opacity 120ms ease-out' }}
            aria-live="polite"
        />
    );
}

export default memo(Mermaid);
