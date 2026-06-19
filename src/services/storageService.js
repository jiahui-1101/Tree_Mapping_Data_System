export const STORAGE_KEYS = Object.freeze({
  COLLECTION: "tbj.visitor.collection",
  LANGUAGE: "tbj.visitor.language",
});

function getStorage(storage) {
  if (storage) return storage;
  if (typeof window !== "undefined") return window.localStorage;
  return null;
}

export function loadCollection(storage) {
  const source = getStorage(storage);
  if (!source) return [];
  try {
    return JSON.parse(source.getItem(STORAGE_KEYS.COLLECTION) || "[]");
  } catch {
    return [];
  }
}

export function saveCollection(collection, storage) {
  const target = getStorage(storage);
  if (target) target.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify(collection));
  return collection;
}

export function addCollectedTree(treeId, storage) {
  const collection = loadCollection(storage);
  const updated = collection.includes(treeId) ? collection : [...collection, treeId];
  return saveCollection(updated, storage);
}

export function addCollectedTreeWithStatus(treeId, storage) {
  const collection = loadCollection(storage);
  const isNew = !collection.includes(treeId);
  const updated = isNew ? [...collection, treeId] : collection;
  saveCollection(updated, storage);
  return { collection: updated, isNew };
}

export function loadLanguage(storage) {
  return getStorage(storage)?.getItem(STORAGE_KEYS.LANGUAGE) || "en";
}

export function saveLanguage(language, storage) {
  getStorage(storage)?.setItem(STORAGE_KEYS.LANGUAGE, language);
  return language;
}

