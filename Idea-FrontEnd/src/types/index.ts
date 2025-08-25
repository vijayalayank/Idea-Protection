// Types for the blockchain-based idea protection platform

export interface Idea {
  id: string;
  title: string;
  description: string;
  hash: string;
  timestamp: number;
  owner: string;
  ipfsHash?: string;
}

export interface User {
  address: string;
  ideas: Idea[];
}

export interface RegistryEntry {
  id: string;
  title: string;
  hash: string;
  timestamp: number;
  owner: string;
  verified: boolean;
}
