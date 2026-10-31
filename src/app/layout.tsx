import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque/standard.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://atul-saini-portfolio.vercel.app"
  ),
  title: "Atul Saini – Full-stack developer and AI engineer",
  description: "Atul Saini builds AI products end to end, from the database to the last pixel of motion.",
  applicationName: "Atul Saini Portfolio",
  authors: [{ name: "Atul Saini", url: "https://github.com/Atulsaini24" }],
  keywords: [
    "Atul Saini",
    "Full-Stack Developer",
    "AI Engineer",
    "Next.js",
    "React",
    "TypeScript",
    "Three.js",
    "WebGL",
    "Portfolio"
  ],
  icons: {
    icon: "/assets/raven.png",
    apple: "/assets/raven.png",
  },
  openGraph: {
    title: "Atul Saini – Full-stack developer and AI engineer",
    description: "AI products built end to end, from the database to the last pixel of motion.",
    type: "website",
    siteName: "Atul Saini Portfolio",
    locale: "en_US",
    images: [
      {
        url: "/assets/portrait-particles.png",
        width: 1200,
        height: 630,
        alt: "Atul Saini – Particle Portrait and Interactive Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Atul Saini – Full-stack developer and AI engineer",
    description: "AI products built end to end, from the database to the last pixel of motion.",
    images: ["/assets/portrait-particles.png"],
    creator: "@Atulsaini24",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#1E3422",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="is-locked">
      <body>{children}</body>
    </html>
  );
}
