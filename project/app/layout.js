import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Garage Management System',
  description: 'Professional Garage Management System with 6 Specialized Interfaces',
  icons: {
    icon: '/photo_1_2025-06-05_14-37-50.jpg', // or your custom path
  },
};


export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          {children}
        </div>
      </body>
    </html>
  );
}