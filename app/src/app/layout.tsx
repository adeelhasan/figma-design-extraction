import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Design System Demo",
  description: "Demo app using Figma-extracted design system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
