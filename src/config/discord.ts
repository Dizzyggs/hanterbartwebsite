interface DiscordConfig {
  serverId: string;
  channelId: string;
}

const developmentConfig: DiscordConfig = {
  serverId: '1359614378881581189',
  channelId: '1359614410985046347'
};

const productionConfig: DiscordConfig = {
  serverId: '589204970826629141',
  channelId: '1362088756110164008'
};

// Determine if we're in production based on environment variable or deployment URL
const isProduction = process.env.NODE_ENV === 'production' || 
                    window.location.hostname === 'your-production-domain.com';

export const discordConfig: DiscordConfig = isProduction ? productionConfig : developmentConfig;

// Helper function to get current environment name
export const getEnvironmentName = () => isProduction ? 'production' : 'development';

// Export individual values for convenience
export const { serverId, channelId } = discordConfig; 