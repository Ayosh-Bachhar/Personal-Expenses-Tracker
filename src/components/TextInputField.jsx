function TextInputField({
    label,
    name,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    required = false,
    textarea = false,
    maxLength,
  }) {
    const inputClassName =
      'mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
  
    return (
      <label className="block">
        <span className="text-sm font-bold text-slate-300">
          {label}
          {required ? <span className="text-rose-400"> *</span> : null}
        </span>
  
        {textarea ? (
          <textarea
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={4}
            className={`${inputClassName} resize-none`}
          />
        ) : (
          <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            className={inputClassName}
          />
        )}
      </label>
    );
  }
  
  export default TextInputField;