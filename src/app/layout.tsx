import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import AppLayout from "@/components/AppLayout";
import ScrollRestoration from "@/components/ScrollRestoration";

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
  title: {
    default: "zeroGravity - Goals without gravity",
    template: "%s | zeroGravity",
  },
  description: "zeroGravity is a platform that empowers students to achieve their academic goals without boundaries. Track progress, take quizzes, and join the community.",
  keywords: ["education", "goals", "quizzes", "students", "learning", "zeroGravity", "academic", "study planner"],
  authors: [{ name: "zeroGravity Team" }],
  creator: "zeroGravity",
  publisher: "zeroGravity",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "zeroGravity - Goals without gravity",
    description: "zeroGravity is a platform that empowers students to achieve their academic goals without boundaries.",
    url: "https://zerogravity.vercel.app",
    siteName: "zeroGravity",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "zeroGravity - Goals without gravity",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "zeroGravity - Goals without gravity",
    description: "zeroGravity is a platform that empowers students to achieve their academic goals without boundaries.",
    creator: "@zeroGravity",
    images: ["/opengraph-image"],
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
                      document.documentElement.style.colorScheme = 'dark';
                      document.documentElement.style.backgroundColor = '#111116';
                      document.body.style.backgroundColor = '#111116';
                      document.documentElement.style.setProperty('--scrollbar-thumb', 'rgba(75, 85, 99, 0.4)');
                    } else {
                      document.documentElement.classList.remove('dark');
                      document.documentElement.style.colorScheme = 'light';
                      document.documentElement.style.backgroundColor = '#ffffff';
                      document.body.style.backgroundColor = '#ffffff';
                      document.documentElement.style.setProperty('--scrollbar-thumb', 'rgba(156, 163, 175, 0.3)');
                    }
                  } else {
                    // Default to dark theme if nothing is stored
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                    document.documentElement.style.backgroundColor = '#111116';
                    document.body.style.backgroundColor = '#111116';
                    document.documentElement.style.setProperty('--scrollbar-thumb', 'rgba(75, 85, 99, 0.4)');
                    localStorage.setItem('theme', 'dark');
                  }
                } catch (e) {
                  // If localStorage fails, default to dark
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                  document.documentElement.style.backgroundColor = '#111116';
                  document.body.style.backgroundColor = '#111116';
                  document.documentElement.style.setProperty('--scrollbar-thumb', 'rgba(75, 85, 99, 0.4)');
                }
              })();
            `,
          }}
        />
        <Providers googleClientId={googleClientId}>
          <ScrollRestoration />
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  );
}
