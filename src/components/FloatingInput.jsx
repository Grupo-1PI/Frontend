function FloatingInput({
  label,
  type = "text",
  name,
  value,
  onChange,
  onBlur,
  disabled = false,
  error,
}) {
  return (
    <div className="relative w-full">
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder=" "
        className={`input-floating peer ${error ? "border-red-500" : ""}`}
      />

      <label htmlFor={name} className="label-floating">
        {label}
      </label>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default FloatingInput;
