import type { Metadata, Viewport } from "next";
import "@fontsource-variable/bricolage-grotesque/standard.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Atul Saini – Full-stack developer and AI engineer",
  description: "Atul Saini builds AI products end to end, from the database to the last pixel of motion.",
  applicationName: "Atul Saini",
  icons: { icon: "/assets/raven.png" },
  openGraph: {
    title: "Atul Saini – Full-stack developer and AI engineer",
    description: "AI products built end to end, from the database to the last pixel of motion.",
    type: "website",
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
