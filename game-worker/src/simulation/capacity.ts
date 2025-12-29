import { Architecture } from './schema';

export function computeCapacity(arch: Architecture): number {
  const basePerInstance = 100;

  const typeMultiplier =
    arch.compute.type === 'stateless' ? 1.0 : 0.6;

  return arch.compute.instances * basePerInstance * typeMultiplier;
}

export function databaseCapacity(arch: Architecture): number {
  if (arch.database.type === 'single') {
    return 300;
  }

  // replicated
  return arch.database.consistency === 'strong' ? 500 : 800;
}

export function cacheHitRate(arch: Architecture): number {
  switch (arch.cache.strategy) {
    case 'read_through':
      return 0.6;
    case 'write_through':
      return 0.75;
    default:
      return 0;
  }
}
