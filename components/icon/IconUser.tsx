import Image from "next/image";

interface IconProps {
  className?: string;
  profilePhoto?: string | null;
}

export function IconUser({ className = "h-6 w-6", profilePhoto }: IconProps) {
  if (profilePhoto) {
    return (
      <Image
        src={profilePhoto}
        alt="Profile"
        className={`${className} rounded-full object-cover`}
      />
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="1.2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 6a3 3 0 11-6 0 3 3 0 016 0zM12 12a6 6 0 00-6 6h12a6 6 0 00-6-6z"
      />
    </svg>
  );
}
