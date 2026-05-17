import { useCallback, useEffect, useRef, useState } from 'react';

const SILENCE_MS = 1200;

const getRecognition = () => {
    const Ctor =
        typeof window !== 'undefined' &&
        (window.SpeechRecognition || window.webkitSpeechRecognition);
    return Ctor ? new Ctor() : null;
};

export const isSpeechRecognitionSupported = () => {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};

export default function useSpeechRecognition({ onFinal } = {}) {
    const [listening, setListening] = useState(false);
    const [interim, setInterim] = useState('');
    const recognitionRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const finalTextRef = useRef('');
    const onFinalRef = useRef(onFinal);

    useEffect(() => {
        onFinalRef.current = onFinal;
    }, [onFinal]);

    const clearSilenceTimer = () => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = null;
        }
    };

    const stop = useCallback(() => {
        clearSilenceTimer();
        const rec = recognitionRef.current;
        if (rec) {
            try { rec.stop(); } catch { /* noop */ }
        }
    }, []);

    const start = useCallback(() => {
        if (!isSpeechRecognitionSupported()) return false;
        if (recognitionRef.current) return false;

        const rec = getRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        finalTextRef.current = '';
        setInterim('');

        rec.onresult = (event) => {
            let interimText = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                const transcript = result[0].transcript;
                if (result.isFinal) {
                    finalTextRef.current = (finalTextRef.current + ' ' + transcript).trim();
                } else {
                    interimText += transcript;
                }
            }
            setInterim(interimText);

            clearSilenceTimer();
            silenceTimerRef.current = setTimeout(() => stop(), SILENCE_MS);
        };

        rec.onerror = () => stop();

        rec.onend = () => {
            clearSilenceTimer();
            recognitionRef.current = null;
            setListening(false);
            const text = (finalTextRef.current + ' ' + interim).trim();
            setInterim('');
            if (text && onFinalRef.current) onFinalRef.current(text);
        };

        recognitionRef.current = rec;
        try {
            rec.start();
            setListening(true);
            return true;
        } catch {
            recognitionRef.current = null;
            return false;
        }
    }, [stop, interim]);

    const cancel = useCallback(() => {
        clearSilenceTimer();
        const rec = recognitionRef.current;
        if (rec) {
            rec.onresult = null;
            rec.onerror = null;
            rec.onend = null;
            try { rec.stop(); } catch { /* noop */ }
            recognitionRef.current = null;
        }
        finalTextRef.current = '';
        setInterim('');
        setListening(false);
    }, []);

    useEffect(() => () => cancel(), [cancel]);

    return { listening, interim, start, stop, cancel };
}
