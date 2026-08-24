import './globals.css';
import React from 'react';

export const metadata = {
  title: 'SARWIN HRPAYROLL | Enterprise HR & Payroll Platform',
  description: 'Enterprise HR & Payroll Platform for Indian Businesses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet" />
        <style dangerouslySetInnerHTML={{ __html: `
          body { font-family: 'Plus Jakarta Sans', sans-serif !important; }
          .font-mono { font-family: 'JetBrains Mono', monospace !important; }
        `}} />
      </head>
      <body className="bg-slate-900 text-slate-100 antialiased">{children}</body>
    </html>
  );
}
