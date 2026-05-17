import { useCallback, useEffect, useRef, useState } from 'react';

const base64ToArrayBuffer = (b64) => {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
};

export default function useAudioQueue() {
    const [playing, setPlaying] = useState(false);
    const [activeTurnId, setActiveTurnId] = useState(null);

    const queueRef = useRef([]);
    const ctxRef = useRef(null);
    const currentSourceRef = useRef(null);
    const turnIdRef = useRef(null);
    const pendingPartsRef = useRef([]);
    const isPlayingRef = useRef(false);

    const ensureCtx = () => {
        if (ctxRef.current) return ctxRef.current;
        const Ctor =
            typeof window !== 'undefined' &&
            (window.AudioContext || window.webkitAudioContext);
        if (!Ctor) return null;
        ctxRef.current = new Ctor();
        return ctxRef.current;
    };

    const stopCurrent = () => {
        const src = currentSourceRef.current;
        if (src) {
            try { src.onended = null; src.stop(); } catch { /* noop */ }
            try { src.disconnect(); } catch { /* noop */ }
        }
        currentSourceRef.current = null;
    };

    const playNext = useCallback(() => {
        const ctx = ensureCtx();
        if (!ctx) {
            isPlayingRef.current = false;
            setPlaying(false);
            return;
        }
        const next = queueRef.current.shift();
        if (!next) {
            isPlayingRef.current = false;
            setPlaying(false);
            return;
        }
        // Slice to a detached ArrayBuffer — decodeAudioData detaches its input.
        const buf = next.slice(0);
        ctx.decodeAudioData(
            buf,
            (audioBuffer) => {
                const src = ctx.createBufferSource();
                src.buffer = audioBuffer;
                src.connect(ctx.destination);
                src.onended = () => {
                    if (currentSourceRef.current === src) currentSourceRef.current = null;
                    playNext();
                };
                currentSourceRef.current = src;
                try { src.start(); } catch { playNext(); }
            },
            () => playNext()
        );
    }, []);

    // Must be called from within a user-gesture handler (tap/click).
    // iOS Safari will not produce audio later unless the AudioContext was
    // resumed during a gesture.
    const prime = useCallback(() => {
        const ctx = ensureCtx();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        try {
            const buffer = ctx.createBuffer(1, 1, 22050);
            const src = ctx.createBufferSource();
            src.buffer = buffer;
            src.connect(ctx.destination);
            src.start(0);
        } catch { /* noop */ }
    }, []);

    const enqueue = useCallback((turnId, b64Part, eos, final) => {
        if (turnIdRef.current !== turnId) {
            queueRef.current = [];
            pendingPartsRef.current = [];
            stopCurrent();
            turnIdRef.current = turnId;
            setActiveTurnId(turnId);
        }
        if (final) return;
        if (b64Part) pendingPartsRef.current.push(b64Part);
        if (eos) {
            const full = pendingPartsRef.current.join('');
            pendingPartsRef.current = [];
            if (!full) return;
            queueRef.current.push(base64ToArrayBuffer(full));
            const ctx = ensureCtx();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }
            if (!isPlayingRef.current) {
                isPlayingRef.current = true;
                setPlaying(true);
                playNext();
            }
        }
    }, [playNext]);

    const stop = useCallback(() => {
        queueRef.current = [];
        pendingPartsRef.current = [];
        stopCurrent();
        turnIdRef.current = null;
        setActiveTurnId(null);
        isPlayingRef.current = false;
        setPlaying(false);
    }, []);

    useEffect(() => () => stop(), [stop]);

    return { playing, activeTurnId, enqueue, stop, prime };
}
