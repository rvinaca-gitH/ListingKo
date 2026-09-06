import type { Metadata } from 'next';

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
      <body>{children}</body>
    </html>
  );
}
