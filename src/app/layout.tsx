import type { Metadata } from "next";
import "./globals.css";
import { productOffer } from "@/lib/baerskin-content";

export const metadata: Metadata = {
  title: `${productOffer.productName} | Interactive Product Reveal`,
  description:
    "An interactive scrollytelling product reveal for the BÆRSkin Heavy-Storm Waterproof Rain Jacket 2.0.",
  openGraph: {
    title: productOffer.productName,
    description: "A scroll-controlled product rig for the BÆRSkin Heavy-Storm Waterproof Rain Jacket 2.0.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
