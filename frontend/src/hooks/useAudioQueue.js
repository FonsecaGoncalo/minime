import { useCallback, useEffect, useRef, useState } from 'react';

const base64ToBlob = (b64) => {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: 'audio/mpeg' });
};

export default function useAudioQueue() {
    const [playing, setPlaying] = useState(false);
    const [activeTurnId, setActiveTurnId] = useState(null);

    const queueRef = useRef([]);
    const currentAudioRef = useRef(null);
    const currentUrlRef = useRef(null);
    const turnIdRef = useRef(null);
    const pendingPartsRef = useRef([]);

    const cleanupCurrent = () => {
        const audio = currentAudioRef.current;
        if (audio) {
            audio.onended = null;
            audio.onerror = null;
            audio.pause();
            audio.src = '';
        }
        if (currentUrlRef.current) {
            URL.revokeObjectURL(currentUrlRef.current);
            currentUrlRef.current = null;
        }
        currentAudioRef.current = null;
    };

    const playNext = useCallback(() => {
        const next = queueRef.current.shift();
        if (!next) {
            cleanupCurrent();
            setPlaying(false);
            return;
        }
        const url = URL.createObjectURL(next);
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        currentUrlRef.current = url;
        audio.onended = () => {
            cleanupCurrent();
            playNext();
        };
        audio.onerror = () => {
            cleanupCurrent();
            playNext();
        };
        audio.play().catch(() => {
            cleanupCurrent();
            playNext();
        });
    }, []);

    const enqueue = useCallback((turnId, b64Part, eos, final) => {
        if (turnIdRef.current !== turnId) {
            queueRef.current = [];
            pendingPartsRef.current = [];
            cleanupCurrent();
            turnIdRef.current = turnId;
            setActiveTurnId(turnId);
        }
        if (final) return;
        if (b64Part) pendingPartsRef.current.push(b64Part);
        if (eos) {
            const full = pendingPartsRef.current.join('');
            pendingPartsRef.current = [];
            if (!full) return;
            queueRef.current.push(base64ToBlob(full));
            if (!currentAudioRef.current) {
                setPlaying(true);
                playNext();
            }
        }
    }, [playNext]);

    const stop = useCallback(() => {
        queueRef.current = [];
        pendingPartsRef.current = [];
        cleanupCurrent();
        turnIdRef.current = null;
        setActiveTurnId(null);
        setPlaying(false);
    }, []);

    useEffect(() => () => stop(), [stop]);

    return { playing, activeTurnId, enqueue, stop };
}
