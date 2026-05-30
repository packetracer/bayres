import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bayhouse Reservations",
  description: "Reservation management for Bayhouse"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
