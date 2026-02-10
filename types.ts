export interface LocationData {
  name: string;
  lat: number;
  lng: number;
  significance: string;
  type: 'origin' | 'usage' | 'cultural';
}

export interface EtymologyData {
  name: string;
  meaning: string;
  gender: string;
  originRoots: string[];
  locations: LocationData[];
  history: string;
  culturalSignificance: string;
  relatedNames: string[];
  funFact: string;
}

export interface SearchState {
  query: string;
  isLoading: boolean;
  error: string | null;
  data: EtymologyData | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}