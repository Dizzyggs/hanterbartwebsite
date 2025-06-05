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
  discordChannel: 'main-raids' | 'events';
}

class RaidHelperService {
  private baseUrl: string;
  private maxRetries = 2;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.baseUrl = '/.netlify/functions/raidhelper';
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async retryRequest<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          // Only retry on network errors or 5xx server errors
          if (error instanceof TypeError || (error as any)?.status >= 500) {
            console.warn(`Attempt ${attempt + 1} failed, retrying in ${this.retryDelay}ms...`, error);
            await this.delay(this.retryDelay * (attempt + 1)); // Exponential backoff
            continue;
          }
        }
        
        throw error;
      }
    }
    
    throw lastError!;
  }

  async createEvent(event: RaidHelperEvent) {
    return this.retryRequest(async () => {
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
          const error = new Error(`RaidHelper API error: ${response.statusText || errorText}`);
          (error as any).status = response.status;
          throw error;
        }

        return await response.json();
      } catch (error) {
        console.error('Failed to create RaidHelper event:', error);
        throw error;
      }
    });
  }

  async getEvent(eventId: string) {
    return this.retryRequest(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(`${this.baseUrl}?eventId=${eventId}`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = new Error(`RaidHelper API error: ${response.statusText}`);
          (error as any).status = response.status;
          throw error;
        }

        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        console.error('Failed to fetch RaidHelper event:', error);
        throw error;
      }
    });
  }

  async getServerEvents() {
    return this.retryRequest(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(`${this.baseUrl}?action=listEvents`, {
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = new Error(`RaidHelper API error: ${response.statusText}`);
          (error as any).status = response.status;
          throw error;
        }

        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        console.error('Failed to fetch server events:', error);
        throw error;
      }
    });
  }

  async deleteEvent(eventId: string) {
    return this.retryRequest(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(`${this.baseUrl}?action=deleteEvent&eventId=${eventId}`, {
          method: 'DELETE',
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('RaidHelper API error response:', errorText);
          const error = new Error(`RaidHelper API error: ${errorText || response.statusText}`);
          (error as any).status = response.status;
          throw error;
        }

        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        console.error('Failed to delete RaidHelper event:', error);
        throw error;
      }
    });
  }
}

export const raidHelperService = new RaidHelperService(); 