import axios from 'axios';
import type { User, Message, AuthResponse } from './types';

const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3001';
const CHAT_SERVICE_URL = import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:3002';

// Get token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Auth & User Service
  async register(username: string, password: string, displayName: string): Promise<User> {
    const response = await axios.post(`${USER_SERVICE_URL}/users/register`, {
      username,
      password,
      displayName,
    });
    return response.data;
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await axios.post(`${USER_SERVICE_URL}/auth/login`, {
      username,
      password,
    });
    return response.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await axios.get(`${USER_SERVICE_URL}/users`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getUser(id: string): Promise<User> {
    const response = await axios.get(`${USER_SERVICE_URL}/users/${id}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Chat Service
  async getMessages(chatId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const response = await axios.get(`${CHAT_SERVICE_URL}/messages`, {
      params: { chatId, limit, offset },
      headers: getAuthHeader(),
    });
    return response.data;
  },

  async getMessageCount(chatId: string): Promise<number> {
    const response = await axios.get(`${CHAT_SERVICE_URL}/messages/count`, {
      params: { chatId },
      headers: getAuthHeader(),
    });
    return response.data.count;
  },
};