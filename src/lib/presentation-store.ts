type PresentationContent = {
  slides: unknown[];
  config?: Record<string, unknown>;
};

export type PresentationRecord = {
  id: string;
  title: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  presentation: {
    id: string;
    content: PresentationContent;
    theme?: string;
    outline?: string[];
    searchResults?: Array<{ query: string; results: unknown[] }>;
    imageSource?: string;
    presentationStyle?: string;
    language?: string;
    prompt?: string;
  };
};

const STORE_KEY = "presentation_store_v1";

type SerializedPresentation = Omit<PresentationRecord, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

function getMemoryStore(): PresentationRecord[] {
  const globalForStore = globalThis as unknown as {
    __presentationStore?: PresentationRecord[];
  };
  if (!globalForStore.__presentationStore) {
    globalForStore.__presentationStore = [];
  }
  return globalForStore.__presentationStore;
}

function reviveRecord(record: SerializedPresentation): PresentationRecord {
  return {
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  };
}

function loadStore(): PresentationRecord[] {
  if (typeof window === "undefined") {
    return getMemoryStore();
  }

  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SerializedPresentation[];
    return parsed.map(reviveRecord);
  } catch {
    return [];
  }
}

function persistStore(records: PresentationRecord[]): void {
  if (typeof window === "undefined") {
    const store = getMemoryStore();
    store.splice(0, store.length, ...records);
    return;
  }

  const serialized: SerializedPresentation[] = records.map((record) => ({
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }));
  window.localStorage.setItem(STORE_KEY, JSON.stringify(serialized));
}

export function listPresentations(): PresentationRecord[] {
  return loadStore().sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
}

export function getPresentationById(id: string): PresentationRecord | undefined {
  return loadStore().find((record) => record.id === id);
}

export function savePresentation(record: PresentationRecord): void {
  const records = loadStore();
  const index = records.findIndex((item) => item.id === record.id);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  persistStore(records);
}

export function deletePresentationById(id: string): void {
  const records = loadStore().filter((item) => item.id !== id);
  persistStore(records);
}
