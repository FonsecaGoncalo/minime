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

    const enqueue = useCallback((turnId, b64Mp3) => {
        if (turnIdRef.current !== turnId) {
            queueRef.current = [];
            cleanupCurrent();
            turnIdRef.current = turnId;
            setActiveTurnId(turnId);
        }
        if (b64Mp3) {
            queueRef.current.push(base64ToBlob(b64Mp3));
            if (!currentAudioRef.current) {
                setPlaying(true);
                playNext();
            }
        }
    }, [playNext]);

    const stop = useCallback(() => {
        queueRef.current = [];
        cleanupCurrent();
        turnIdRef.current = null;
        setActiveTurnId(null);
        setPlaying(false);
    }, []);

    useEffect(() => () => stop(), [stop]);

    return { playing, activeTurnId, enqueue, stop };
}
