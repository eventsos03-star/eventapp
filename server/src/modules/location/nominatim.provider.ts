import type { GeocodingProvider } from './geocoding.interface.js';
import type { GeocodingResult } from './location.types.js';

interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: Record<string, string>;
  boundingbox: string[];
}

export class NominatimProvider implements GeocodingProvider {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';
  private readonly userAgent: string;

  constructor(userAgent = 'EventOS/1.0') {
    this.userAgent = userAgent;
  }

  async geocode(address: string): Promise<GeocodingResult[]> {
    if (!address.trim()) return [];

    const params = new URLSearchParams({
      q: address.trim(),
      format: 'json',
      limit: '5',
      addressdetails: '1',
    });

    const res = await fetch(`${this.baseUrl}/search?${params}`, {
      headers: { 'User-Agent': this.userAgent },
    });

    if (!res.ok) {
      throw new Error(`Geocoding request failed: ${res.status}`);
    }

    const data = (await res.json()) as NominatimResult[];

    return data.map((item) => this.parseResult(item));
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return null;
    }

    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: 'json',
      addressdetails: '1',
    });

    const res = await fetch(`${this.baseUrl}/reverse?${params}`, {
      headers: { 'User-Agent': this.userAgent },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Reverse geocoding failed: ${res.status}`);
    }

    const data = (await res.json()) as NominatimResult;

    return this.parseResult(data);
  }

  private parseResult(item: NominatimResult): GeocodingResult {
    const addr = item.address || {};
    return {
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      address: [addr.house_number, addr.road].filter(Boolean).join(' ') || '',
      city: addr.city || addr.town || addr.village || addr.county || '',
      state: addr.state || '',
      country: addr.country || '',
      postalCode: addr.postcode || '',
      formattedAddress: item.display_name || '',
    };
  }
}
