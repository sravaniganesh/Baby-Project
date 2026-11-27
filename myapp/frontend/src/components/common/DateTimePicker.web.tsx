import React from "react";

type Props = {
  value: Date;
  mode?: "date" | "time";
  minimumDate?: Date;
  maximumDate?: Date;
  onChange?: (
    event: { type: "set" | "dismissed" },
    selectedDate?: Date,
  ) => void;
};

const formatValue = (date: Date, mode: "date" | "time") => {
  const pad = (value: number) => String(value).padStart(2, "0");

  if (mode === "time") {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const DateTimePicker = ({
  value,
  mode = "date",
  minimumDate,
  maximumDate,
  onChange,
}: Props) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.value) {
      onChange?.({ type: "dismissed" });
      return;
    }

    const [year, month, dayOrHour, minute] = event.target.value
      .split(/[-:T]/)
      .map(Number);
    const selectedDate = new Date(value);

    if (mode === "time") {
      selectedDate.setHours(year, month, 0, 0);
    } else {
      selectedDate.setFullYear(year, month - 1, dayOrHour);
    }

    onChange?.({ type: "set" }, selectedDate);
  };

  return (
    <input
      type={mode}
      value={formatValue(value, mode)}
      min={minimumDate ? formatValue(minimumDate, mode) : undefined}
      max={maximumDate ? formatValue(maximumDate, mode) : undefined}
      onChange={handleChange}
    />
  );
};

export default DateTimePicker;
