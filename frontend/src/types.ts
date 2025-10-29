export interface User {
  id: string;
  username: string;
  displayName: string;
  createdAt?: string;
}

export interface Message {
  id: string;
  chatId: string;
  userId: string;
  username: string;
  displayName: string;
  content: string;
  sequence: number;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}