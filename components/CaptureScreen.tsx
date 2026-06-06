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
    recognition.continuous = false; // Safari iOS doesn't support continuous
    recognition.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setText((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onend = () => {
      setListening(false);
    };
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
      <h1 className="text-2xl font-bold text-center pt-4 text-white">Що в голові?</h1>
      <p className="text-center text-gray-400 text-sm">Пиши або диктуй — AI впорядкує все</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Зателефонувати Марині, здати звіт до п'ятниці, купити хліб..."
        disabled={parsing}
        className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white text-lg placeholder-gray-600 resize-none focus:outline-none focus:border-sky-500 transition-colors disabled:opacity-50"
        autoFocus
      />

      {speechSupported && !parsing && (
        <button
          onClick={listening ? stopListening : startListening}
          className={`mx-auto flex items-center justify-center w-20 h-20 rounded-full text-4xl shadow-lg transition-all select-none ${
            listening ? "bg-red-500 scale-110 shadow-red-500/40" : "bg-gray-800 active:bg-gray-700"
          }`}
          aria-label={listening ? "Зупинити запис" : "Говорити"}
        >
          {listening ? "⏹" : "🎙️"}
        </button>
      )}

      {listening && <p className="text-center text-red-400 text-sm animate-pulse">Слухаю…</p>}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full py-4 rounded-2xl bg-sky-500 text-white text-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed active:bg-sky-600 transition-colors"
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
