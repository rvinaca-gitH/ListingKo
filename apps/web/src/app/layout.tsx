import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ListingKo - AI Product Launch Factory',
  description: 'Create complete ecommerce product launches in minutes',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}
