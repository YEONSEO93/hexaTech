import "./globals.css";
import "primeicons/primeicons.css";
import "../styles/themes/mytheme/theme.scss";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    );
}
