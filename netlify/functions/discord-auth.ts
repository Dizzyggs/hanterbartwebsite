import { Handler } from '@netlify/functions';
import fetch from 'node-fetch';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar?: string;
}

const handler: Handler = async (event) => {
  const { code, state } = event.queryStringParameters || {};
  
  // If no code is present, redirect to Discord OAuthx
  if (!code) {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const baseUrl = process.env.URL || 'http://localhost:8888';
    const redirectUri = `${baseUrl}/.netlify/functions/discord-auth`;
    const scope = 'identify';
    
    // Validate required environment variables
    if (!clientId) {
      console.error('Missing DISCORD_CLIENT_ID environment variable');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Discord client ID not configured' }),
      };
    }
    
    // Generate state parameter to prevent CSRF
    const state = Math.random().toString(36).substring(7);

    // Ensure the redirect URI is properly encoded
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    
    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&response_type=code&scope=${scope}&state=${state}`;
    
    console.log('Discord auth configuration:', {
      clientId: clientId.substring(0, 4) + '...',  // Log only first 4 chars for security
      baseUrl,
      redirectUri,
      hasCode: !!code,
      hasState: !!state,
      authUrl: discordAuthUrl
    });
    
    return {
      statusCode: 302,
      headers: {
        Location: discordAuthUrl,
        'Cache-Control': 'no-cache',
      },
    };
  }

  try {
    console.log('Received callback with code:', code);
    const baseUrl = process.env.URL || 'http://localhost:8888';
    const redirectUri = `${baseUrl}/.netlify/functions/discord-auth`;
    
    // Validate required environment variables
    const clientId = process.env.DISCORD_CLIENT_ID;
    const clientSecret = process.env.DISCORD_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Missing required Discord credentials:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret
      });
      throw new Error('Discord credentials not configured');
    }
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Discord token error:', errorData);
      throw new Error('Failed to get access token');
    }

    const tokenData: DiscordTokenResponse = await tokenResponse.json();

    // Get user info from Discord
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.text();
      console.error('Discord user info error:', errorData);
      throw new Error('Failed to get user info');
    }

    const discordUser: DiscordUser = await userResponse.json();
    console.log('Got Discord user:', discordUser);

    // Update user in Firestore with Discord info
    const redirectUrl = new URL('/profile', baseUrl);
    redirectUrl.searchParams.set('discord_id', discordUser.id);
    redirectUrl.searchParams.set('discord_username', discordUser.username);
    
    console.log('Redirecting to:', redirectUrl.toString());
    
    return {
      statusCode: 302,
      headers: {
        Location: redirectUrl.toString(),
        'Cache-Control': 'no-cache',
      },
    };
  } catch (error) {
    console.error('Discord auth error:', error);
    const baseUrl = process.env.URL || 'http://localhost:8888';
    const errorUrl = new URL('/profile', baseUrl);
    errorUrl.searchParams.set('error', 'discord_auth_failed');
    
    return {
      statusCode: 302,
      headers: {
        Location: errorUrl.toString(),
        'Cache-Control': 'no-cache',
      },
    };
  }
};

export { handler }; 