import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {useMMKVString} from 'react-native-mmkv';
import {DEFAULT_SEMESTRE} from '../helpers/Util';

interface SemestreContextData {
  /** Semestre atual no formato "YYYY.P" (ex: "2025.1") */
  semestre: string;
  /** Ano letivo atual */
  ano: string;
  /** Período letivo atual (1 ou 2) */
  periodo: string;
  /** Atualiza o semestre atual */
  setSemestre: (semestre: string) => void;
  /** Lista de semestres disponíveis */
  semestresDisponiveis: string[];
}

const SemestreContext = createContext<SemestreContextData>(
  {} as SemestreContextData,
);

interface SemestreProviderProps {
  children: ReactNode;
}

// Gera lista de semestres disponíveis (últimos 4 anos)
function gerarSemestresDisponiveis(): string[] {
  const anoAtual = new Date().getFullYear();
  const semestres: string[] = [];

  for (let ano = anoAtual; ano >= anoAtual - 3; ano--) {
    semestres.push(`${ano}.2`);
    semestres.push(`${ano}.1`);
  }

  return semestres;
}

export function SemestreProvider({children}: SemestreProviderProps) {
  const [semestreMMKV, setSemestreMMKV] = useMMKVString('current');

  // Garante que sempre há um semestre válido
  const semestre = semestreMMKV || DEFAULT_SEMESTRE;

  // Extrai ano e período do semestre
  const {ano, periodo} = useMemo(() => {
    const partes = semestre.split('.');
    return {
      ano: partes[0] || new Date().getFullYear().toString(),
      periodo: partes[1] || '1',
    };
  }, [semestre]);

  // Lista de semestres disponíveis
  const semestresDisponiveis = useMemo(() => gerarSemestresDisponiveis(), []);

  // Função para atualizar o semestre
  const setSemestre = useCallback(
    (novoSemestre: string) => {
      if (novoSemestre && /^\d{4}\.[12]$/.test(novoSemestre)) {
        setSemestreMMKV(novoSemestre);
      }
    },
    [setSemestreMMKV],
  );

  const value = useMemo(
    () => ({
      semestre,
      ano,
      periodo,
      setSemestre,
      semestresDisponiveis,
    }),
    [semestre, ano, periodo, setSemestre, semestresDisponiveis],
  );

  return (
    <SemestreContext.Provider value={value}>
      {children}
    </SemestreContext.Provider>
  );
}

/**
 * Hook para acessar o contexto do semestre
 * @example
 * const { semestre, ano, periodo, setSemestre } = useSemestre();
 */
export function useSemestre(): SemestreContextData {
  const context = useContext(SemestreContext);

  if (!context || Object.keys(context).length === 0) {
    throw new Error('useSemestre deve ser usado dentro de um SemestreProvider');
  }

  return context;
}

export default SemestreContext;
