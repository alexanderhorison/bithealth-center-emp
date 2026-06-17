-- Add WFH status to existing enum in deployed databases.
alter type presence.presence_status add value if not exists 'WFH';
