export function useUsuario() {
    const raw = localStorage.getItem('usuario');
    const usuario = raw ? JSON.parse(raw) : null;

    const perfil = usuario?.perfil || null;

    const isMaster          = perfil === 'master';
    const isOperadorInterno = perfil === 'operador_interno';
    const isOperadorExterno = perfil === 'operador_externo';
    const isCliente         = perfil === 'cliente';

    // Pode ver tudo de gestão
    const podeGerenciar = isMaster || isOperadorInterno;

    // Pode ver apenas manutenções e chamados
    const podeManutencao = isMaster || isOperadorInterno || isOperadorExterno;

    return {
        usuario,
        perfil,
        isMaster,
        isOperadorInterno,
        isOperadorExterno,
        isCliente,
        podeGerenciar,
        podeManutencao,
    };
}