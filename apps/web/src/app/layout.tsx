export const metadata = {
  title: 'Payroll SaaS Platform',
  description: 'Enterprise Indian Payroll Engine',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
