-- Add GO_TO_CLIENT status to existing enum in deployed databases.
alter type presence.presence_status add value if not exists 'GO_TO_CLIENT';
