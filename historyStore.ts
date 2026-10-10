import { File, Paths } from 'expo-file-system';
import type { Album } from './albums';
import { History, parseHistory } from './history';

// A fresh File each call: rename() repoints the instance it is called on
const historyFile = () => new File(Paths.document, 'history.json');

export function loadHistory(): History {
  const file = historyFile();
  if (!file.exists) return {};
  const h = parseHistory(file.textSync());
  if (h) return h;
  // Keep unreadable data instead of overwriting it with {}
  file.rename(`history.corrupt-${Date.now()}.json`);
  return {};
}

// Exporting again on the same day replaces that day's entry.
export function saveDay(key: string, albums: Album[]) {
  const h = loadHistory();
  h[key] = albums;
  // ponytail: write is not atomic; a crash mid-write leaves a corrupt file that loadHistory sets aside. Write a temp file and swap it in if that ever happens.
  historyFile().write(JSON.stringify(h));
}
