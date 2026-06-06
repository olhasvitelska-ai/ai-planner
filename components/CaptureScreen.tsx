"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  onCapture: (text: string) => void;
}

export default function CaptureScreen({ onCapture }: Props) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setSpeechSupported(
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window
    );
  }, []);

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "uk-UA";
    recognition.continuous = true;
    recognition.interimResults = true;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((r: any) => r[0].transcript)
        .join(" ");
      setText(transcript);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
  }

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onCapture(trimmed);
    setText("");
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100dvh-var(--tab-bar-height))] p-4 gap-4">
      <h1 className="text-2xl font-bold text-center pt-4 text-white">
        Що в голові?
      </h1>
      <p className="text-center text-gray-400 text-sm">
        Пиши або диктуй — AI впорядкує все
      </p>

      {/* Text area */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Зателефонувати Марині, здати звіт до п'ятниці, купити хліб..."
        className="flex-1 w-full bg-gray-900 border border-gray-700 rounded-2xl p-4 text-white text-lg placeholder-gray-600 resize-none focus:outline-none focus:border-sky-500 transition-colors"
        autoFocus
      />

      {/* Mic button */}
      {speechSupported && (
        <button
          onPointerDown={startListening}
          onPointerUp={stopListening}
          onPointerLeave={stopListening}
          className={`mx-auto flex items-center justify-center w-20 h-20 rounded-full text-4xl shadow-lg transition-all select-none ${
            listening
              ? "bg-red-500 scale-110 shadow-red-500/40"
              : "bg-gray-800 active:bg-gray-700"
          }`}
          aria-label={listening ? "Зупинити запис" : "Говорити"}
        >
          {listening ? "⏹" : "🎙️"}
        </button>
      )}

      {listening && (
        <p className="text-center text-red-400 text-sm animate-pulse">
          Слухаю…
        </p>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="w-full py-4 rounded-2xl bg-sky-500 text-white text-lg font-semibold disabled:opacity-30 disabled:cursor-not-allowed active:bg-sky-600 transition-colors"
      >
        Розібрати задачі →
      </button>
    </div>
  );
}
