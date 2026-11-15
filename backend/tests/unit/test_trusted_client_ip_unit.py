"""
Unit tests for trusted client IP propagation and anti-spoofing logic.
"""
from unittest.mock import MagicMock, patch
import pytest
from starlette.datastructures import Headers

from backend.app.core.config import settings
from backend.app.core.security import get_trusted_client_ip


class TestTrustedClientIPUnit:
    def test_untrusted_peer_ignores_spoofed_x_forwarded_for(self):
        """When the direct connection is NOT from a trusted proxy, X-Forwarded-For must be ignored."""
        request = MagicMock()
        request.client = MagicMock()
        request.client.host = "203.0.113.195"  # Untrusted external IP
        request.headers = Headers({
            "x-forwarded-for": "10.0.0.1, 192.168.1.1",
            "x-real-ip": "10.0.0.1",
        })

        client_ip = get_trusted_client_ip(request)
        assert client_ip == "203.0.113.195", "Spoofed X-Forwarded-For should be rejected when client is untrusted"

    def test_trusted_proxy_extracts_client_ip(self):
        """When the connection arrives through configured trusted proxies, extract client IP."""
        request = MagicMock()
        request.client = MagicMock()
        request.client.host = "127.0.0.1"  # Localhost trusted proxy
        request.headers = Headers({
            "x-forwarded-for": "198.51.100.42, 10.0.0.2",
        })

        with patch.object(settings, "TRUSTED_PROXIES", "127.0.0.1,::1,localhost,10.0.0.2"):
            client_ip = get_trusted_client_ip(request)
            assert client_ip == "198.51.100.42", "Should extract untrusted client IP after skipping trusted proxies"

    def test_trusted_proxy_single_ip(self):
        """When a single client IP is forwarded by a trusted proxy."""
        request = MagicMock()
        request.client = MagicMock()
        request.client.host = "127.0.0.1"
        request.headers = Headers({
            "x-forwarded-for": "203.0.113.50",
        })

        client_ip = get_trusted_client_ip(request)
        assert client_ip == "203.0.113.50"

    def test_trusted_proxy_fallback_to_x_real_ip(self):
        """When X-Forwarded-For is missing but X-Real-IP is provided by trusted proxy."""
        request = MagicMock()
        request.client = MagicMock()
        request.client.host = "127.0.0.1"
        request.headers = Headers({
            "x-real-ip": "198.51.100.99",
        })

        client_ip = get_trusted_client_ip(request)
        assert client_ip == "198.51.100.99"

    def test_missing_client_peer_fallback(self):
        """When request.client is None, safely fall back to 127.0.0.1."""
        request = MagicMock()
        request.client = None
        request.headers = Headers({})

        client_ip = get_trusted_client_ip(request)
        assert client_ip == "127.0.0.1"

