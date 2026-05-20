import './globals.css';

export const metadata = {
  title: 'Gôndolas Suprema — Orçamentos',
  description: 'Sistema de orçamentos da Gôndolas Suprema',
};

// Viewport pra mobile (iOS/Android) — sem isso o navegador renderiza
// como desktop espremido, estourando a tela horizontalmente.
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A0E18',
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
