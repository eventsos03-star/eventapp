import type { GeocodingResult } from './location.types.js';

export interface GeocodingProvider {
  geocode(address: string): Promise<GeocodingResult[]>;
  reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<GeocodingResult | null>;
}
