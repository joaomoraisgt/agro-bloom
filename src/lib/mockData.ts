// Mock data store for the entire platform
// Trees: 7 sectors, alphabetical rows (A..Z, AA..AZ...), trees per row

export type TreeState = "alive" | "dead" | "sick";
export type TreeGraft = "bravo" | "grafted" | "martainha" | "espanhol";
export interface Tree {
  code: string; // e.g., 1L56
  sector: number;
  row: string;
  index: number;
  state: TreeState;
  graft: TreeGraft;
  producing: boolean;
  history: TreeRecord[];
}
export interface TreeRecord {
  id: string;
  date: string;
  category: "podra" | "rega" | "tratamento" | "colheita" | "enxertia" | "observacao";
  note: string;
}

const SECTORS = 7;
const ROWS_PER_SECTOR = 16; // ~A..P
const TREES_PER_ROW = 55; // -> ~7 * 16 * 55 = 6160 trees

function rowLabel(i: number): string {
  // 0->A, 25->Z, 26->AA
  let s = "";
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

const RNG = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

const rng = RNG(42);

function pickGraft(): TreeGraft {
  const r = rng();
  if (r < 0.25) return "bravo";
  if (r < 0.65) return "grafted";
  if (r < 0.85) return "martainha";
  return "espanhol";
}
function pickState(): TreeState {
  const r = rng();
  if (r < 0.86) return "alive";
  if (r < 0.94) return "sick";
  return "dead";
}

const sampleNotes: Record<TreeRecord["category"], string[]> = {
  podra: ["Poda de formação", "Poda de limpeza", "Remoção de ramos secos"],
  rega: ["Rega manual", "Rega por gota", "Reforço de água"],
  tratamento: ["Aplicação fungicida", "Tratamento contra vespa", "Adubação foliar"],
  colheita: ["Colheita inicial", "Recolha de ouriços", "Pesagem registada"],
  enxertia: ["Enxerto Martainha", "Enxerto Longal", "Verificação de pega"],
  observacao: ["Folhagem amarelada", "Bom vigor", "Detetado cancro", "Crescimento normal"],
};

function buildHistory(seedKey: string): TreeRecord[] {
  const local = RNG([...seedKey].reduce((a, c) => a + c.charCodeAt(0), 0));
  const count = Math.floor(local() * 5);
  const out: TreeRecord[] = [];
  const cats = Object.keys(sampleNotes) as TreeRecord["category"][];
  for (let i = 0; i < count; i++) {
    const cat = cats[Math.floor(local() * cats.length)];
    const notes = sampleNotes[cat];
    const daysAgo = Math.floor(local() * 720);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    out.push({
      id: `${seedKey}-${i}`,
      date: d.toISOString(),
      category: cat,
      note: notes[Math.floor(local() * notes.length)],
    });
  }
  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

let _trees: Tree[] | null = null;
export function getAllTrees(): Tree[] {
  if (_trees) return _trees;
  const arr: Tree[] = [];
  for (let s = 1; s <= SECTORS; s++) {
    for (let r = 0; r < ROWS_PER_SECTOR; r++) {
      const row = rowLabel(r);
      for (let t = 1; t <= TREES_PER_ROW; t++) {
        const code = `${s}${row}${t}`;
        const state = pickState();
        const graft = pickGraft();
        const producing = state === "alive" && graft !== "bravo" && rng() > 0.25;
        arr.push({
          code, sector: s, row, index: t,
          state, graft, producing,
          history: [], // lazy
        });
      }
    }
  }
  _trees = arr;
  return arr;
}

export function getTree(code: string): Tree | undefined {
  const t = getAllTrees().find((x) => x.code.toUpperCase() === code.toUpperCase());
  if (t && t.history.length === 0) t.history = buildHistory(t.code);
  return t;
}

export const SECTOR_COUNT = SECTORS;
export const ROWS_COUNT = ROWS_PER_SECTOR;
export const TREES_PER_ROW_COUNT = TREES_PER_ROW;
export { rowLabel };

// ---------- Finance ----------
export type FinanceCategory =
  | "Colheita" | "Mel" | "Subsídios" | "Vendas diversas"
  | "Salários" | "Combustível" | "Tratamentos" | "Equipamento" | "Manutenção" | "Outros";
export interface FinanceEntry {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: FinanceCategory;
  date: string;
  description: string;
}

const incomeCats: FinanceCategory[] = ["Colheita", "Mel", "Subsídios", "Vendas diversas"];
const expenseCats: FinanceCategory[] = ["Salários", "Combustível", "Tratamentos", "Equipamento", "Manutenção", "Outros"];
const finRng = RNG(7);
function buildFinance(): FinanceEntry[] {
  const out: FinanceEntry[] = [];
  for (let i = 0; i < 60; i++) {
    const isIncome = finRng() > 0.55;
    const cat = (isIncome ? incomeCats : expenseCats)[Math.floor(finRng() * (isIncome ? incomeCats.length : expenseCats.length))];
    const days = Math.floor(finRng() * 240);
    const d = new Date(); d.setDate(d.getDate() - days);
    out.push({
      id: `f-${i}`,
      type: isIncome ? "income" : "expense",
      amount: Math.round((isIncome ? 200 + finRng() * 4500 : 80 + finRng() * 1800) * 100) / 100,
      category: cat,
      date: d.toISOString(),
      description: isIncome
        ? cat === "Mel" ? "Venda lote mel multifloral" : cat === "Colheita" ? "Venda castanha calibre 5" : cat === "Subsídios" ? "Pagamento PAC" : "Vendas diretas"
        : cat === "Salários" ? "Jornal trabalhador" : cat === "Combustível" ? "Gasóleo agrícola" : cat === "Tratamentos" ? "Fungicida + adjuvante" : cat === "Equipamento" ? "Peças trator" : "Manutenção geral",
    });
  }
  return out.sort((a, b) => +new Date(b.date) - +new Date(a.date));
}
export const financeEntries: FinanceEntry[] = buildFinance();

// ---------- Tasks ----------
export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";
export interface Task {
  id: string;
  title: string;
  date: string; // ISO
  done: boolean;
  recurrence: Recurrence;
  notes?: string;
}

const taskRng = RNG(11);
const sampleTasks = [
  "Podar fila G setor 3", "Verificar colmeias", "Rega gota a gota setor 5",
  "Tratamento contra vespa", "Pesagem castanha", "Manutenção trator",
  "Enxertia setor 2 fila C", "Recolha ouriços setor 4", "Reunião fornecedor mel",
  "Limpeza mato setor 6", "Inspeção castanheiros doentes", "Carregar camião",
];
function buildTasks(): Task[] {
  const out: Task[] = [];
  for (let i = 0; i < 35; i++) {
    const offset = Math.floor(taskRng() * 90) - 30;
    const d = new Date(); d.setDate(d.getDate() + offset); d.setHours(7 + Math.floor(taskRng() * 10), 0, 0, 0);
    const recs: Recurrence[] = ["none","none","none","weekly","monthly"];
    out.push({
      id: `t-${i}`,
      title: sampleTasks[Math.floor(taskRng() * sampleTasks.length)],
      date: d.toISOString(),
      done: offset < 0 && taskRng() > 0.3,
      recurrence: recs[Math.floor(taskRng() * recs.length)],
    });
  }
  return out;
}
export const tasksMock: Task[] = buildTasks();
