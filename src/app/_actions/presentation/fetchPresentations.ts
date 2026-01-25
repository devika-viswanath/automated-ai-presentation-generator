import {
  listPresentations,
  type PresentationRecord,
} from "@/lib/presentation-store";

export type PresentationDocument = PresentationRecord;

const ITEMS_PER_PAGE = 10;

export async function fetchPresentations(page = 0) {
  const all = listPresentations();
  const start = page * ITEMS_PER_PAGE;
  const items = all.slice(start, start + ITEMS_PER_PAGE);
  const hasMore = start + ITEMS_PER_PAGE < all.length;

  return {
    items,
    hasMore,
  };
}

export async function fetchPublicPresentations(page = 0) {
  const all = listPresentations().filter((item) => item.isPublic);
  const start = page * ITEMS_PER_PAGE;
  const items = all.slice(start, start + ITEMS_PER_PAGE);
  const hasMore = start + ITEMS_PER_PAGE < all.length;

  return {
    items,
    hasMore,
  };
}

export async function fetchUserPresentations(_userId: string, page = 0) {
  const all = listPresentations();
  const start = page * ITEMS_PER_PAGE;
  const items = all.slice(start, start + ITEMS_PER_PAGE);
  const hasMore = start + ITEMS_PER_PAGE < all.length;

  return {
    items,
    hasMore,
  };
}
