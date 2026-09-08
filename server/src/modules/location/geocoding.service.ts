import type { GeocodingProvider } from './geocoding.interface.js';
import type { GeocodingResult } from './location.types.js';
import { NominatimProvider } from './nominatim.provider.js';

let provider: GeocodingProvider = new NominatimProvider();

export function setGeocodingProvider(p: GeocodingProvider): void {
  provider = p;
}

export function getGeocodingProvider(): GeocodingProvider {
  return provider;
}

export async function geocode(address: string): Promise<GeocodingResult[]> {
  return provider.geocode(address);
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeocodingResult | null> {
  return provider.reverseGeocode(latitude, longitude);
}
