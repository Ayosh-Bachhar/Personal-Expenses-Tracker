function SelectDropdownField({
    label,
    name,
    value,
    onChange,
    options,
    required = false,
    placeholder = 'Select an option',
  }) {
    function getOptionLabel(option) {
      if (option === '__CUSTOM_TAG__') {
        return '+ Add New Tag';
      }
  
      return option;
    }
  
    return (
      <label className="block">
        <span className="text-sm font-bold text-slate-300">
          {label}
          {required ? <span className="text-rose-400"> *</span> : null}
        </span>
  
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">{placeholder}</option>
  
          {options.map((option) => (
            <option key={option} value={option}>
              {getOptionLabel(option)}
            </option>
          ))}
        </select>
      </label>
    );
  }
  
  export default SelectDropdownField;