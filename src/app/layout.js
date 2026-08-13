import './globals.css';

export const metadata = {
  title: 'Gôndolas Suprema — Orçamentos',
  description: 'Sistema de orçamentos da Gôndolas Suprema',
  applicationName: 'Suprema',
  manifest: '/manifest.json',
  // Vira "app" na tela de início do iPhone: ícone próprio, nome curto e tela cheia.
  appleWebApp: {
    capable: true,
    title: 'Suprema',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
};

// Viewport pra mobile (iOS/Android) — sem isso o navegador renderiza
// como desktop espremido, estourando a tela horizontalmente.
// viewportFit: cover deixa o app usar a tela toda (com safe-area no CSS).
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0A0E18',
  viewportFit: 'cover',
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
