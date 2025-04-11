import Link from "next/link";

interface NavItem {
  href: string;
  label: string;
}

interface SettingsLayoutProps {
  children: React.ReactNode;
  currentPath: "profile" | "account";
}

const navItems: NavItem[] = [
  { href: "/setting", label: "Edit Profile" },
  { href: "/setting/account", label: "Account" },
];

export function SettingsLayout({ children, currentPath }: SettingsLayoutProps) {
  return (
    <div className="mt-8 flex gap-12">
      {/* Navigation */}
      <div className="w-56 pl-8">
        <nav className="flex flex-col space-y-1 bg-white rounded-lg shadow-sm">
          {navItems.map((item) => {
            const isActive =
              (currentPath === "profile" && item.href === "/setting") ||
              (currentPath === "account" && item.href === "/setting/account");

            return isActive ? (
              <div
                key={item.href}
                className="bg-gray-100 text-gray-900 px-3 py-2 rounded-md font-medium"
              >
                {item.label}
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-md"
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-3xl">
        <div className="bg-white rounded-lg p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
