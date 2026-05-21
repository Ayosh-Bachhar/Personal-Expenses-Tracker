function PageTitleBar({ title, subtitle }) {
    return (
      <div className="mb-6">
        <h1 className="text-3xl font-black tracking-tight text-slate-100 sm:text-4xl">
          {title}
        </h1>
  
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
    );
  }
  
  export default PageTitleBar;