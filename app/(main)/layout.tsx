import { DashboardLayout } from "@/components/layouts/DashboardLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DashboardLayout children />
      </body>
    </html>
  );
}
