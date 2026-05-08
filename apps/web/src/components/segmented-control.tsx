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
  return (
    <fieldset className="field-group">
      <legend>{label}</legend>
      <div className="segmented-control">
        {options.map((option) => (
          <button
            className={option.value === value ? "is-selected" : ""}
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
