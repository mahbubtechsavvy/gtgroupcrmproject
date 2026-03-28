import '@/styles/globals.css';
import { Inter } from 'next/font/google';
import AppLayout from '@/components/layout/AppLayout';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
});

export const metadata = {
  title: 'GT Group CRM — Study Abroad Management',
  description: 'GT Group Study Abroad Consultancy — CRM system for managing student leads, applications, and pipeline across all offices.',
  keywords: 'CRM, study abroad, students, GT Group, Bangladesh, Korea, Sri Lanka, Vietnam',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AppLayout>
          {children}
        </AppLayout>
      </body>
    </html>
  );
}

