
import React from "react";
type Props = {
  time: string;
  setTime: (val: string) => void;
  disabled: boolean;
  error: string | null;
};
export const StartTimeStep: React.FC<Props> = ({ time, setTime, disabled, error }) => (
  <div>
    <div className="font-semibold text-sm mb-2 mt-1">3. Start Time</div>
    <input
      type="time"
      className="block w-40 px-2 py-1 rounded border bg-background"
      value={time}
      min="00:00"
      max="23:00"
      step={60 * 15}
      onChange={e => setTime(e.target.value)}
      required
      disabled={disabled}
    />
    {error && (
      <div className="text-red-600 text-xs mt-2">{error}</div>
    )}
  </div>
);
