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
  console.log('Function invoked with event:', {
    httpMethod: event.httpMethod,
    path: event.path,
    queryStringParameters: event.queryStringParameters,
    body: event.body ? JSON.parse(event.body) : null
  });
  
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

  const apiKey = process.env.RAID_HELPER_API_KEY;
  const serverId = process.env.RAID_HELPER_SERVER_ID;
  const channelId = process.env.RAID_HELPER_CHANNEL_ID;

  console.log('Environment variables check:', { 
    hasApiKey: !!apiKey, 
    hasServerId: !!serverId, 
    hasChannelId: !!channelId,
    nodeEnv: process.env.NODE_ENV
  });

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

        console.log('Attempting to delete RaidHelper event:', eventId);
        
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
        console.log('RaidHelper API delete response:', responseText);

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
        
        console.log('Creating event with data (before stringify):', eventData);
        const requestBody = JSON.stringify(eventData);
        console.log('Request body after stringify:', requestBody);
        
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
        console.log('RaidHelper API raw response:', responseText);
        
        let data: RaidHelperResponse;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse RaidHelper API response:', e);
          throw new Error('Invalid response from RaidHelper API');
        }

        console.log('RaidHelper API parsed response:', data);

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
