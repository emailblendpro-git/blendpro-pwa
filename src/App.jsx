import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PortalCliente from './pages/PortalCliente';
import Maquinas from './pages/Maquinas';
import Clientes from './pages/Clientes';
import Usuarios from './pages/Usuarios';
import Chamados from './pages/Chamados';
import Produtos from './pages/Produtos';
import Relatorios from './pages/Relatorios';
import Vendedores from './pages/Vendedores';
import Abastecer from './pages/Abastecer';
import Prestadores from './pages/Prestadores';
import Agente from './pages/Agente';
import AgenteMaster from './pages/AgenteMaster';
import RegistrosOperacionais from './pages/RegistrosOperacionais';
import ComprovanteAbastecimento from './pages/ComprovanteAbastecimento';
import LancamentosFaturamento from './pages/LancamentosFaturamento';
import { useUsuario } from './hooks/useUsuario';

function RotaProtegida({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    const destino = window.location.pathname;
    return <Navigate to={`/?redirect=${encodeURIComponent(destino)}`} />;
  }
  return children;
}

function RotaRestrita({ children, perfisPermitidos }) {
  const { perfil } = useUsuario();
  if (!perfil) return <Navigate to="/" />;
  if (!perfisPermitidos.includes(perfil)) {
    // Clientes têm seu próprio portal
    if (perfil === 'cliente') return <Navigate to="/portal-cliente" />;
    return <Navigate to="/dashboard" />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/dashboard" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno', 'operador_externo']}>
              <Dashboard />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/maquinas" element={
          <RotaProtegida><Maquinas /></RotaProtegida>
        } />

        <Route path="/clientes" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno']}>
              <Clientes />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/usuarios" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno']}>
              <Usuarios />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/chamados" element={
          <RotaProtegida><Chamados /></RotaProtegida>
        } />

        <Route path="/produtos" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno']}>
              <Produtos />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/relatorios" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno']}>
              <Relatorios />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/vendedores" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno']}>
              <Vendedores />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/prestadores" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno']}>
              <Prestadores />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/abastecer/:serial" element={
          <RotaProtegida><Abastecer /></RotaProtegida>
        } />

        <Route path="/maquinas/:serial/comprovante" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno', 'operador_externo']}>
              <ComprovanteAbastecimento />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/operacoes" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno', 'operador_externo']}>
              <RegistrosOperacionais />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/faturamento/lancamentos" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master', 'operador_interno']}>
              <LancamentosFaturamento />
            </RotaRestrita>
          </RotaProtegida>
        } />

        <Route path="/agente" element={
          <RotaProtegida><Agente /></RotaProtegida>
        } />

        <Route path="/agente-master" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['master']}>
              <AgenteMaster />
            </RotaRestrita>
          </RotaProtegida>
        } />

<Route path="/portal-cliente" element={
          <RotaProtegida>
            <RotaRestrita perfisPermitidos={['cliente']}>
              <PortalCliente />
            </RotaRestrita>
          </RotaProtegida>
        } />

      </Routes>
    </BrowserRouter>
  );
}