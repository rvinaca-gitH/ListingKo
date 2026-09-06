export const metadata = {
  title: 'ListingKo API',
  description: 'API for ListingKo - AI Ecommerce Product Launch Factory',
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
