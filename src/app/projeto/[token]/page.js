'use client';
// Link que o consultor manda ao cliente pela aba Projeto: abre uma vez só.
import ProjetoCliente from '../../../components/ProjetoCliente';
export default function PaginaProjeto({ params }) {
  return <ProjetoCliente token={params.token} />;
}
