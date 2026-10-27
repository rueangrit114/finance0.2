export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  user_id: string;
  type: TxType;
  amount: number;
  category: string;
  note: string | null;
  created_at: string;
}

export interface Envelope {
  id: string;
  user_id: string;
  name: string;
  budget: number;
  icon: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
}
