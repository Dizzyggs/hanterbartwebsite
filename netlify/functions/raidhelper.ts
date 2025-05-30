import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';

interface RaidHelperEvent {
  title: string;
  description: string;
  date: string;
  time: string;
  leaderId: string;  // Discord user ID of the raid leader
  templateId?: string;  // Changed back to templateId
  size?: number;
  roles?: {
    tank: number;
    healer: number;
    dps: number;
  };
}

interface RaidHelperResponse {
  message?: string;
  error?: string;
  [key: string]: any;
}

export const handler: Handler = async (event, context) => {
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  const apiKey = process.env.RAIDHELPER_API_KEY;
  const serverId = process.env.DISCORD_SERVER_ID;
  
  // Parse the event data from the request body
  const eventData = JSON.parse(event.body || '{}');
  
  // Get the channel ID based on the event's selected Discord channel
  const channelId = eventData.discordChannel === 'events' 
    ? process.env.DISCORD_EVENTSCHANNEL_ID 
    : process.env.DISCORD_CHANNEL_ID;

  if (!apiKey || !serverId || !channelId) {
    console.error('Missing required environment variables');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Missing configuration',
        details: {
          hasApiKey: !!apiKey,
          hasServerId: !!serverId,
          hasChannelId: !!channelId
        }
      }),
    };
  }

  try {
    switch (event.httpMethod) {
      case 'DELETE': {
        const { eventId } = event.queryStringParameters || {};
        if (!eventId) {
          throw new Error('Event ID is required for deletion');
        }

        
        const response = await fetch(
          `https://raid-helper.dev/api/v2/events/${eventId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': apiKey,
            },
          }
        );

        const responseText = await response.text();

        if (!response.ok) {
          console.error('Failed to delete event:', responseText);
          throw new Error(`Failed to delete event: ${responseText}`);
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Event deleted successfully' }),
        };
      }

      case 'POST':
        // Handle event creation
        const parsedBody = JSON.parse(event.body || '{}');
        const eventData: RaidHelperEvent = {
          title: parsedBody.title,
          description: parsedBody.description,
          date: parsedBody.date,
          time: parsedBody.time,
          leaderId: parsedBody.leaderId,
          size: parsedBody.size,
          roles: parsedBody.roles,
          templateId: "wowclassic"  // Changed back to templateId
        };
        
        const requestBody = JSON.stringify(eventData);
        
        const response = await fetch(
          `https://raid-helper.dev/api/v2/servers/${serverId}/channels/${channelId}/event`,
          {
            method: 'POST',
            headers: {
              'Authorization': apiKey,
              'Content-Type': 'application/json',
            },
            body: requestBody,
          }
        );

        const responseText = await response.text();
        
        let data: RaidHelperResponse;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse RaidHelper API response:', e);
          throw new Error('Invalid response from RaidHelper API');
        }


        if (!response.ok) {
          throw new Error(data.error || data.message || `Failed to create event: ${response.statusText}`);
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(data),
        };

      default:
        const { eventId, action } = event.queryStringParameters || {};
        
        if (eventId) {
          // Get single event
          const eventResponse = await fetch(
            `https://raid-helper.dev/api/v2/events/${eventId}`,
            {
              headers: {
                'Authorization': apiKey,
              },
            }
          );

          const eventData = await eventResponse.json() as RaidHelperResponse;

          if (!eventResponse.ok) {
            throw new Error(eventData.error || eventData.message || 'Failed to fetch event');
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(eventData),
          };
        } else if (action === 'listEvents') {
          // Get all events
          const eventsResponse = await fetch(
            `https://raid-helper.dev/api/v2/servers/${serverId}/events`,
            {
              headers: {
                'Authorization': apiKey,
              },
            }
          );

          const eventsData = await eventsResponse.json() as RaidHelperResponse;

          if (!eventsResponse.ok) {
            throw new Error(eventsData.error || eventsData.message || 'Failed to fetch events');
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(eventsData),
          };
        }

        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Not found' }),
        };
    }
  } catch (error) {
    console.error('RaidHelper error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
    };
  }
};
