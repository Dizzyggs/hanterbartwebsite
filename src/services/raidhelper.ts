import { serverId, channelId } from '../config/discord';

interface RaidHelperEvent {
  title: string;
  description: string;
  date: string;        // ISO format
  time: string;        // HH:mm format
  leaderId: string;    // Discord user ID
  templateId?: string; // Template ID for the event (e.g., "wowclassic")
  size?: number;       // Raid size
  roles?: {
    tank: number;
    healer: number;
    dps: number;
  };
}

class RaidHelperService {
  private readonly baseUrl = 'https://raid-helper.dev/api/v2';
  private readonly apiKey: string;

  constructor() {
    this.apiKey = process.env.REACT_APP_RAIDHELPER_API_KEY || '';
  }

  async createEvent(eventData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          ...eventData,
          serverId,
          channelId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create RaidHelper event');
      }

      return await response.json();
    } catch (error) {
      console.error('RaidHelper createEvent error:', error);
      throw error;
    }
  }

  async getEvent(eventId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch RaidHelper event');
      }

      return await response.json();
    } catch (error) {
      console.error('RaidHelper getEvent error:', error);
      throw error;
    }
  }

  async getServerEvents() {
    try {
      const response = await fetch(`${this.baseUrl}?action=listEvents`);

      if (!response.ok) {
        throw new Error(`RaidHelper API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch server events:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string) {
    try {
      const response = await fetch(`${this.baseUrl}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete RaidHelper event');
      }

      return true;
    } catch (error) {
      console.error('RaidHelper deleteEvent error:', error);
      throw error;
    }
  }
}

export const raidHelperService = new RaidHelperService(); 