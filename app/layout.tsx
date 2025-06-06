import "./globals.css";
import "primeicons/primeicons.css";
import { UserProvider } from "./context/UserContext";
import { LoadingSpinner } from "@/components/loading-spinner";
import { Suspense } from "react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          {children}
          <Suspense fallback={null}>
            <LoadingSpinner />
          </Suspense>
        </UserProvider>
      </body>
    </html>
  );
}
