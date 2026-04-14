export const QUEUE_NAMES = {
  EMAIL_NOTIFICATIONS: 'email-notifications-queue',
  CRM_SYNC: 'crm-sync-queue',
  AUDIT_EVENTS: 'audit-events-queue',
} as const;

export const EXCHANGE_NAMES = {
  NOTIFICATIONS: 'notifications',
  INTEGRATION: 'integration',
  AUDIT: 'audit',
} as const;

export const ROUTING_KEYS = {
  EMAIL_NOTIFICATIONS: 'email.notifications',
  CRM_SYNC: 'crm.sync',
  AUDIT_EVENTS: 'audit.events',
} as const;

export const CONSUMER_IDS = {
  EMAIL_NOTIFICATION: 'email-notification-consumer',
  CRM_SYNC: 'crm-sync-consumer',
  AUDIT_EVENT: 'audit-event-consumer',
} as const;
