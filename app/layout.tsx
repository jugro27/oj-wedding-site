import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Olivia & Juliann | November 5, 2027",
  description:
    "Celebrate the wedding of Olivia and Juliann at Windemere Farms in San Marcos, Texas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
