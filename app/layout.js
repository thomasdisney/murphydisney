import './globals.css';

export const metadata = {
  title: 'MurphyDisney.com',
  description: 'A forever message wall for friends and family.'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
