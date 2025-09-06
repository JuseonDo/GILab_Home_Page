#!/bin/bash
# Duck DNS authentication hook for certbot
DOMAIN="genailab"
TOKEN="b949285f-662e-4838-8041-919f81ac6989"

# Extract the challenge token from certbot environment
CHALLENGE_TOKEN="$CERTBOT_VALIDATION"

echo "Setting TXT record for $CERTBOT_DOMAIN with value: $CHALLENGE_TOKEN"

# Update Duck DNS with TXT record
curl -s "https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN&txt=$CHALLENGE_TOKEN" | grep -q "OK"

if [ $? -eq 0 ]; then
    echo "TXT record set successfully"
    # Wait for DNS propagation
    sleep 30
else
    echo "Failed to set TXT record"
    exit 1
fi