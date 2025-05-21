import "./globals.css";
import "primeicons/primeicons.css";
import "../styles/themes/mytheme/theme.scss";
import { UserProvider } from "./context/UserContext";
import { LoadingSpinner } from "@/components/loading-spinner";

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
          <LoadingSpinner />
        </UserProvider>
      </body>
    </html>
  );
}
