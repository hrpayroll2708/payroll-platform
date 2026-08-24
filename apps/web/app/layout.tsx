import './globals.css';

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
          * { box-sizing: border-box; }
          body { font-family: 'Plus Jakarta Sans', sans-serif !important; margin: 0; padding: 0; background-color: #0F172A; color: #F8FAFC; }
          .font-mono { font-family: 'JetBrains Mono', monospace !important; }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  );
}
