interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  size?: "sm" | "lg";
  variant?: "default" | "destructive";
}

export function Button({
  className = "",
  fullWidth = false,
  size = "lg",
  variant = "default",
  children,
  ...props
}: ButtonProps) {
  const variantClasses = {
    default: "bg-[#001F4D] hover:bg-[#001F4D]/90",
    destructive: "bg-red-600 hover:bg-red-700"
  };

  return (
    <button
      className={`rounded-md font-semibold text-white focus:outline-none ${
        size === "sm" ? "px-4 py-2 text-sm" : "px-4 py-2.5 text-sm"
      } ${fullWidth ? "w-full" : ""} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
