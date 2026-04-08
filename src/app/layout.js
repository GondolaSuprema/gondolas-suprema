import './globals.css';

export const metadata = {
  title: 'Gôndolas Suprema — Orçamentos',
  description: 'Sistema de orçamentos da Gôndolas Suprema',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
