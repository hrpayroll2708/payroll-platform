import './globals.css';

export const metadata = {
  title: 'SARWIN HRPAYROLL | Enterprise HR & Payroll Platform',
  description: 'Enterprise-grade statutory payroll, attendance, and compliance platform for Indian businesses.',
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
