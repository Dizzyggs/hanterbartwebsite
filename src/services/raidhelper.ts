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
  private baseUrl: string;

  constructor() {
    // Use port 8888 for Netlify Functions in development
    this.baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8888/.netlify/functions/raidhelper'
      : '/.netlify/functions/raidhelper';
  }

  async createEvent(event: RaidHelperEvent) {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`RaidHelper API error: ${response.statusText || errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create RaidHelper event:', error);
      throw error;
    }
  }

  async getEvent(eventId: string) {
    try {
      const response = await fetch(`${this.baseUrl}?eventId=${eventId}`);

      if (!response.ok) {
        throw new Error(`RaidHelper API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch RaidHelper event:', error);
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
      const response = await fetch(`${this.baseUrl}?action=deleteEvent&eventId=${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('RaidHelper API error response:', errorText);
        throw new Error(`RaidHelper API error: ${errorText || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to delete RaidHelper event:', error);
      throw error;
    }
  }
}

export const raidHelperService = new RaidHelperService(); 