import { HomeItem, ZipMarker } from './types';

export function getUniqueZips(items: HomeItem[]): ZipMarker[] {
  const zipMap = new Map<string, { lat: number; lng: number }>();
  items.forEach(item => {
    const zip = item.address.zipcode;
    if (zip && !zipMap.has(zip)) {
      zipMap.set(zip, { lat: item.latitude, lng: item.longitude });
    }
  });
  return Array.from(zipMap.entries()).map(([zip, coords]) => ({ zip, ...coords }));
}
