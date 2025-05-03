import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <DashboardLayout children={children} />
    </div>
  );
}
