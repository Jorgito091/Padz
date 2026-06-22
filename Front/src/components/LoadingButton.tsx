import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  isLoading: boolean;
};

export const LoadingButton: React.FC<Props> = ({ isLoading, children, disabled, ...rest }) => (
  <button
    disabled={isLoading || disabled}
    className={`relative flex items-center justify-center rounded-lg bg-[#111111] px-4 py-2 text-white transition-colors hover:bg-black disabled:opacity-50 ${isLoading ? "cursor-wait" : ""}`}
    {...rest}
  >
    {isLoading && (
      <svg
        className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
    )}
    {children}
  </button>
);
