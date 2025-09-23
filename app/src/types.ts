export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface SessionState {
  players: Player[];
  round: number;
  homes: HomeItem[];
  guesses: Record<string, string>;
  state: string;
}
export interface Address {
  streetAddress: string;
  city: string;
  state: string;
  zipcode: string;
}

export interface HomeItem {
  address: Address;
  yearBuilt: number;
  price: number;
  images: string[];
  latitude: number;
  longitude: number;
  // Add other fields as needed
}

export interface ZipMarker {
  zip: string;
  lat: number;
  lng: number;
}
