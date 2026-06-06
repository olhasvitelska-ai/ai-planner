"use client";

import { useEffect, useRef, useState } from "react";
import { dayMidnight } from "@/lib/store";

const S = {
  overlay:  "rgba(0,0,0,0.60)",
  sheet:    "#222631",
  surface:  "#3B404C",
  border:   "rgba(255,255,255,0.08)",
  text:     "rgba(255,255,255,0.95)",
  muted:    "rgba(255,255,255,0.50)",
  red:      "#FD3433",
};

interface Props {
  onConfirm: (deadline: number) => void;
  onCancel: () => void;
}

interface Option {
  label: string;
  sub: string;
  offset: number | null; // null = custom
}

function nextWeekday(weekday: number): number {
  // 0=Sun, 1=Mon … 6=Sat
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = (weekday - today.getDay() + 7) % 7 || 7;
  today.setDate(today.getDate() + diff);
  return today.getTime();
}

function dateLabel(ts: number): string {
  return new Date(ts).toLocaleDateString("uk-UA", { weekday: "short", day: "numeric", month: "short" });
}

export default function LaterSheet({ onConfirm, onCancel }: Props) {
  const [customDate, setCustomDate] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCustom) inputRef.current?.focus();
  }, [showCustom]);

  const options: Option[] = [
    { label: "Завтра",          sub: dateLabel(dayMidnight(1)),     offset: 1 },
    { label: "Через 2 дні",     sub: dateLabel(dayMidnight(2)),     offset: 2 },
    { label: "На вихідних",     sub: dateLabel(nextWeekday(6)),     offset: null },
    { label: "Наступний тиждень", sub: dateLabel(nextWeekday(1)),   offset: null },
    { label: "Через 2 тижні",   sub: dateLabel(dayMidnight(14)),    offset: 14 },
    { label: "Наступний місяць", sub: dateLabel(dayMidnight(30)),   offset: 30 },
  ];

  function pick(opt: Option) {
    if (opt.offset !== null) {
      onConfirm(dayMidnight(opt.offset));
    } else {
      // weekend or next week — calculate exact ts
      const label = opt.label;
      if (label === "На вихідних") onConfirm(nextWeekday(6));
      else onConfirm(nextWeekday(1));
    }
  }

  function confirmCustom() {
    if (!customDate) return;
    const m = customDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    d.setHours(0, 0, 0, 0);
    onConfirm(d.getTime());
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      style={{ backgroundColor: S.overlay }}
      onClick={onCancel}
    >
      {/* Sheet */}
      <div
        className="rounded-t-2xl px-4 pt-4 pb-8 flex flex-col gap-2 max-w-lg mx-auto w-full"
        style={{ backgroundColor: S.sheet }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="mx-auto w-10 h-1 rounded-full mb-2" style={{ backgroundColor: "rgba(255,255,255,0.15)" }} />

        <p className="text-base font-medium mb-1" style={{ color: S.text, letterSpacing: "-0.01em" }}>
          Перенести на пізніше
        </p>

        {/* Quick options */}
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={() => pick(opt)}
              className="flex flex-col items-start px-4 py-3 rounded-lg transition-colors text-left"
              style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}
            >
              <span className="text-sm font-medium" style={{ color: S.text }}>{opt.label}</span>
              <span className="text-xs mt-0.5" style={{ color: S.muted }}>{opt.sub}</span>
            </button>
          ))}
        </div>

        {/* Custom date */}
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="w-full py-3 rounded-lg text-sm font-medium mt-1"
            style={{ backgroundColor: S.surface, color: S.muted, border: `1px solid ${S.border}` }}
          >
            📅 Вибрати дату вручну
          </button>
        ) : (
          <div className="flex gap-2 mt-1">
            <input
              ref={inputRef}
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="flex-1 rounded-lg px-3 py-3 text-sm focus:outline-none"
              style={{ backgroundColor: S.surface, color: S.text, border: `1px solid ${S.red}`, colorScheme: "dark" }}
            />
            <button
              onClick={confirmCustom}
              disabled={!customDate}
              className="px-5 rounded-lg text-sm font-medium"
              style={{ backgroundColor: customDate ? S.red : S.surface, color: "#fff" }}
            >
              ОК
            </button>
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full py-3 text-sm"
          style={{ color: S.muted }}
        >
          Скасувати
        </button>
      </div>
    </div>
  );
}
