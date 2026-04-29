import './globals.css';
import { Inter } from 'next/font/google';
import LayoutWrapper from './LayoutWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'TIPICO - Football',
  description: 'Football Data Platform cloned matching ChampX',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </body>
    </html>
  );
}
