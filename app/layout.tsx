import "./globals.css";
import "primeicons/primeicons.css";
import "../styles/themes/mytheme/theme.scss";
import { UserProvider } from "./context/UserContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
