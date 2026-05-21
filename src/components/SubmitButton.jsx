function SubmitButton({
    children,
    disabled = false,
    loading = false,
    loadingText = 'Saving...',
  }) {
    return (
      <button
        type="submit"
        disabled={disabled || loading}
        className={`w-full rounded-2xl px-5 py-4 text-base font-black transition ${
          disabled || loading
            ? 'cursor-not-allowed bg-slate-700 text-slate-400'
            : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-[0.99]'
        }`}
      >
        {loading ? loadingText : children}
      </button>
    );
  }
  
  export default SubmitButton;