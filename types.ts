
export type AppCategory = 'All' | 'Fun' | 'Business' | 'Hobby' | 'Learning' | 'General';

export interface AppLink {
  id: string;
  name: string;
  url: string;
  icon: string; // Base64 or external URL
  category: AppCategory;
  createdAt: number;
}

export interface AppState {
  apps: AppLink[];
  isAdmin: boolean;
  searchQuery: string;
  activeCategory: AppCategory;
}
