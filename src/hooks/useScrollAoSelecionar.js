import { useEffect, useRef } from 'react';

// Ao selecionar um item da lista (chave muda para um valor não vazio), rola até o painel de detalhes.
// Uso: const painelRef = useScrollAoSelecionar(selecionado?.id); <div ref={painelRef}>...
export function useScrollAoSelecionar(chave) {
  const ref = useRef(null);
  useEffect(() => {
    if (chave) {
      // instantâneo e após o render: rolagem suave é cancelada pelos recarregamentos em seguida
      requestAnimationFrame(() => ref.current?.scrollIntoView({ block: 'start' }));
    }
  }, [chave]);
  return ref;
}
