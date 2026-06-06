"use client";

const DAY_LETTERS = ["Нд", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

interface Props {
  selectedDate: number | null;
  onSelect: (ts: number) => void;
}

export default function WeekStrip({ selectedDate, onSelect }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTs = today.getTime();

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(todayTs + i * 86400000);
    return { ts: d.getTime(), day: d.getDate(), label: DAY_LETTERS[d.getDay()] };
  });

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-none px-4 py-3">
      {days.map(({ ts, day, label }) => {
        const isToday = ts === todayTs;
        const isSelected = selectedDate === ts;

        let bgColor = "transparent";
        let textColor = "rgba(255,255,255,0.50)";
        let dayNumColor = "rgba(255,255,255,0.95)";

        if (isSelected) {
          bgColor = "#FD3433";
          textColor = "rgba(255,255,255,0.80)";
          dayNumColor = "#FFFFFF";
        } else if (isToday) {
          bgColor = "rgba(253,52,51,0.12)";
          textColor = "#FD3433";
          dayNumColor = "#FD3433";
        }

        return (
          <button
            key={ts}
            onClick={() => onSelect(isSelected ? -1 : ts)}
            className="flex flex-col items-center shrink-0 w-11 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: bgColor, borderRadius: "10px" }}
          >
            <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: textColor }}>
              {label}
            </span>
            <span className="text-base font-medium mt-0.5" style={{ color: dayNumColor, letterSpacing: "-0.01em" }}>
              {day}
            </span>
          </button>
        );
      })}
    </div>
  );
}
