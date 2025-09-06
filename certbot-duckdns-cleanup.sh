#!/bin/bash
# Duck DNS cleanup hook for certbot
DOMAIN="genailab"
TOKEN="b949285f-662e-4838-8041-919f81ac6989"

echo "Cleaning up TXT record for $CERTBOT_DOMAIN"

# Clear the TXT record
curl -s "https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN&txt=removed&clear=true" | grep -q "OK"

if [ $? -eq 0 ]; then
    echo "TXT record cleared successfully"
else
    echo "Failed to clear TXT record"
fi