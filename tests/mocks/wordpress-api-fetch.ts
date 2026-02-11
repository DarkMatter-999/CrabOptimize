import { vi } from 'vitest';

const apiFetch = vi.fn();
// @ts-ignore
apiFetch.use = vi.fn();

export default apiFetch;
