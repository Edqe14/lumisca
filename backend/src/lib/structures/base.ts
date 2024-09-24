export type BaseStructureEvents = {
  pull: () => void;
  sync: () => void;
  delete: () => void;
  created: () => void;
};

export interface BaseStructure {
  pull(): Promise<boolean>;
  sync(): Promise<boolean>;
  delete(): Promise<void>;
  toJSON(): Record<string, any>;
}
