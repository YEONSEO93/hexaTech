interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  size?: "sm" | "lg";
}

export function Button({
  className = "",
  fullWidth = false,
  size = "lg",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-md bg-[#001F4D] font-semibold text-white hover:bg-[#001F4D]/90 focus:outline-none ${
        size === "sm" ? "px-4 py-2 text-sm" : "px-4 py-2.5 text-sm"
      } ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
