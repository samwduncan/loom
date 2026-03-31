import { createTimelineStore } from '@loom/shared/stores/timeline';
import { createConnectionStore } from '@loom/shared/stores/connection';
import { createUIStore } from '@loom/shared/stores/ui';
import { createStreamStore } from '@loom/shared/stores/stream';
import { createFileStore } from '@loom/shared/stores/file';
import { mmkvStorage } from '../lib/storage-adapter';

export const useTimelineStore = createTimelineStore(mmkvStorage);
export const useConnectionStore = createConnectionStore(mmkvStorage);
export const useUIStore = createUIStore(mmkvStorage);
export const useStreamStore = createStreamStore();
export const useFileStore = createFileStore();
