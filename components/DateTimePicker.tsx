import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import DatePicker from "react-multi-date-picker";
import weekends from "react-multi-date-picker/plugins/highlight_weekends";
import { Input } from "@/components/ui/input";
import jMoment from "jalali-moment";

interface DateObject {
  year: number;
  month: { number: number };
  day: number;
}

interface DateTimePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ",
  disabled = false,
  className = "",
}: DateTimePickerProps) {
  return (
    <DatePicker
      calendar={persian}
      format="YYYY/MM/DD"
      plugins={[weekends()]}
      locale={persian_fa}
      containerStyle={{
        width: "100%",
      }}
      digits={["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]}
      render={(dateValue: string, openCalendar: () => void) => {
        return (
          <Input
            type="text"
            onMouseDown={openCalendar}
            className={`!text-left disabled:cursor-not-allowed ${className}`}
            value={value || ""}
            placeholder={placeholder}
            disabled={disabled}
            readOnly
          />
        );
      }}
      numberOfMonths={1}
      highlightToday={true}
      editable={false}
      calendarPosition="bottom-right"
      value={value ? jMoment(value, "YYYY-MM-DD").format("jYYYY/jMM/jDD") : ""}
      onChange={(date: DateObject | null) => {
        if (date && onChange) {
          // Convert Persian date to Gregorian ISO format
          const gregorianDate = jMoment.from(
            `${date.year}/${date.month.number}/${date.day}`,
            "fa",
            "jYYYY/jMM/jDD"
          );
          onChange(gregorianDate.format("YYYY-MM-DD"));
        }
      }}
    />
  );
}
