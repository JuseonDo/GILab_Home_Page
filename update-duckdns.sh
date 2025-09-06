#!/bin/bash
# Duck DNS 업데이트 스크립트

DOMAIN="genailab"
TOKEN="b949285f-662e-4838-8041-919f81ac6989"
IP=$(curl -s ifconfig.me)

echo "Updating Duck DNS..."
echo "Domain: $DOMAIN.duckdns.org"
echo "IP: $IP"
echo "Token: ${TOKEN:0:8}..."

if [ -z "$TOKEN" ]; then
    echo "ERROR: TOKEN이 설정되지 않았습니다."
    exit 1
fi

# Duck DNS 업데이트
RESULT=$(curl -s "https://www.duckdns.org/update?domains=$DOMAIN&token=$TOKEN&ip=$IP")

if [ "$RESULT" = "OK" ]; then
    echo "✅ Duck DNS 업데이트 성공!"
else
    echo "❌ Duck DNS 업데이트 실패: $RESULT"
    exit 1
fi