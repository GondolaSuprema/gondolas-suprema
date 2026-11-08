// O WhatsApp monta a prévia do link com isto. Ele lê só o HTML, sem rodar o JavaScript,
// então a prévia não gasta o link: quem gasta é a página aberta no aparelho do cliente.
export const metadata = {
  metadataBase: new URL('https://gondolas-suprema.vercel.app'),
  title: 'Seu projeto em 3D · Gôndolas Suprema',
  description: 'Veja como vai ficar o seu projeto. Link exclusivo, abre uma vez só.',
  openGraph: {
    title: 'Veja como vai ficar o seu projeto',
    description: 'Projeto em 3D preparado pela Gôndolas Suprema. Link exclusivo, abre uma vez só.',
    // Fundo claro de propósito: a logo com fundo transparente sumia no WhatsApp com tema escuro.
    images: [{ url: '/og-projeto.jpg', width: 1200, height: 630, alt: 'Gôndolas Suprema' }],
    locale: 'pt_BR',
    type: 'website',
  },
  robots: { index: false, follow: false },
};

export const viewport = { themeColor: '#f3f5f9' };

// O fundo do sistema é preto (globals.css). Aqui ele já sai claro no HTML: o Safari do iPhone pinta a faixa
// do relógio e a da barra de endereço com essa cor, e antes ela ficava preta até o JavaScript carregar.
const FUNDO_CLARO = 'html,body{background:#f3f5f9}';

export default function LayoutProjeto({ children }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: FUNDO_CLARO }} />
      {children}
    </>
  );
}
