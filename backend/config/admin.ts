import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'test-admin-jwt-secret'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'test-api-token-salt'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'test-transfer-token-salt'),
    },
  },
  secrets: {
    encryptionKey: env('ENCRYPTION_KEY'), // Optional usually
  },
  flags: {
    nps: env.bool('FLAG_NPS', true),
    promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    docLinks: env.bool('FLAG_DOC_LINKS', true),
  },
});

export default config;
