import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import AppLayout from "@/components/AppLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://zerogravity.vercel.app"),
  title: "zeroGravity",
  description: "Goals without gravity",
  openGraph: {
    title: "zeroGravity",
    description: "Goals without gravity",
    url: "https://zerogravity.vercel.app",
    siteName: "zeroGravity",
  },
  twitter: {
    card: "summary_large_image",
    title: "zeroGravity",
    description: "Goals without gravity",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Get Google Client ID from environment variables
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

if (!googleClientId) {
  console.error(
    "WARNING: NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in environment variables. Google OAuth will not work.",
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  if (savedTheme === 'light' || savedTheme === 'dark') {
                    if (savedTheme === 'dark') {
                      document.documentElement.classList.add('dark');
                      document.documentElement.style.backgroundColor = '#0a0a0a';
                      document.body.style.backgroundColor = '#0a0a0a';
                    } else {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.style.backgroundColor = '#ffffff';
                      document.body.style.backgroundColor = '#ffffff';
                    }
                  } else {
                    // Default to light theme if nothing is stored
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.backgroundColor = '#ffffff';
                    document.body.style.backgroundColor = '#ffffff';
                    localStorage.setItem('theme', 'light');
                  }
                } catch (e) {
                  // If localStorage fails, default to light
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.backgroundColor = '#ffffff';
                  document.body.style.backgroundColor = '#ffffff';
                }
              })();
            `,
          }}
        />
        <Providers googleClientId={googleClientId}>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
