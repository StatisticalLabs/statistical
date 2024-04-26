import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "../styles/globals.css";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/components/themes";
import Footer from "@/components/footer";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  metadataBase: new URL("https://statistical.vercel.app"),
  title: {
    default: "Statistical",
    template: "%s — Statistical",
  },
  description: "Track your favorite YouTube channels in realtime.",
  openGraph: {
    type: "website",
    url: "/",
    images: [
      {
        url: "https://statistical.vercel.app/statistical.png",
      },
    ],
  },
  twitter: {
    card: "summary",
    creator: "@ToastedDev",
    creatorId: "1145171094556426240",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(GeistSans.variable, GeistMono.variable)}>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
