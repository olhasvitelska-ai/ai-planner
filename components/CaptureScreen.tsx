"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  onCapture: (text: string) => void;
  parsing?: boolean;
}

export default function CaptureScreen({ onCapture, parsing = false }: Props) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setSpeechSupported(!!(w.SpeechRecognition ?? w.webkitSpeechRecognition));
  }, []);

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "uk-UA";
    recognition.continuous = false;
    recognition.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setText((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed || parsing) return;
    onCapture(trimmed);
    setText("");
  }

  const canSubmit = !!text.trim() && !parsing;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-72px)] p-4 gap-4">
      {/* Header */}
      <div className="pt-6 pb-2">
        <h1
          className="text-2xl font-medium text-center"
          style={{ color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em" }}
        >
          Що в голові?
        </h1>
        <p className="text-center text-sm mt-1" style={{ color: "rgba(255,255,255,0.50)" }}>
          Пиши або диктуй — AI впорядкує все
        </p>
      </div>

      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Зателефонувати Марині, здати звіт до п'ятниці, купити хліб..."
        disabled={parsing}
        className="flex-1 w-full rounded-lg p-4 text-base resize-none focus:outline-none transition-colors disabled:opacity-40"
        style={{
          backgroundColor: "#3B404C",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.95)",
          caretColor: "#FD3433",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "1rem",
        }}
        autoFocus
      />

      {/* Mic button */}
      {speechSupported && !parsing && (
        <button
          onClick={listening ? stopListening : startListening}
          className="mx-auto flex items-center justify-center w-16 h-16 rounded-full text-3xl transition-all select-none"
          style={{
            backgroundColor: listening ? "#FD3433" : "#3B404C",
            border: "1px solid rgba(255,255,255,0.08)",
            transform: listening ? "scale(1.1)" : "scale(1)",
          }}
          aria-label={listening ? "Зупинити запис" : "Говорити"}
        >
          {listening ? "⏹" : "🎙️"}
        </button>
      )}

      {listening && (
        <p className="text-center text-sm animate-pulse" style={{ color: "#FD3433" }}>
          Слухаю…
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-4 rounded-md font-medium text-base transition-all"
        style={{
          backgroundColor: canSubmit ? "#FD3433" : "rgba(253,52,51,0.3)",
          color: "#FFFFFF",
          borderRadius: "12px",
          letterSpacing: "-0.01em",
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
      >
        {parsing ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            AI розбирає…
          </span>
        ) : (
          "Розібрати задачі →"
        )}
      </button>
    </div>
  );
}
