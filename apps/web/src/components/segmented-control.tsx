import { Crosshair, Eye, ShieldQuestion } from "lucide-react";

interface SegmentedControlProps<TValue extends string> {
  label: string;
  value: TValue;
  options: readonly { label: string; value: TValue }[];
  onChange: (value: TValue) => void;
}

export function SegmentedControl<TValue extends string>({
  label,
  value,
  options,
  onChange
}: SegmentedControlProps<TValue>) {
  const isModePicker = label.toLowerCase() === "game mode";
  const modeIcon = (value: string) => {
    if (value === "accusation") {
      return <Crosshair size={34} strokeWidth={2.5} />;
    }

    if (value === "suspicion") {
      return <Eye size={34} strokeWidth={2.5} />;
    }

    return <ShieldQuestion size={34} strokeWidth={2.5} />;
  };

  return (
    <fieldset className={isModePicker ? "field-group mode-field-group" : "field-group"}>
      <legend>{label}</legend>
      <div className={isModePicker ? "segmented-control mode-card-group" : "segmented-control"}>
        {options.map((option) => (
          <button
            aria-pressed={option.value === value}
            className={option.value === value ? "is-selected" : ""}
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {isModePicker ? (
              <>
                <span className={`mode-card-icon is-${option.value}`} aria-hidden="true">
                  {modeIcon(option.value)}
                </span>
                <strong>{option.label}</strong>
                <span>
                  {option.value === "accusation"
                    ? "Find the impostor by direct accusation."
                    : "Gather clues and vote out suspects."}
                </span>
              </>
            ) : (
              option.label
            )}
          </button>
        ))}
        {isModePicker ? (
          <button aria-disabled="true" className="is-disabled" disabled type="button">
            <span className="mode-card-icon is-reverse" aria-hidden="true">
              {modeIcon("reverse")}
            </span>
            <strong>Reverse Psychology</strong>
            <span>Coming soon. The impostor knows the word.</span>
          </button>
        ) : null}
      </div>
    </fieldset>
  );
}
