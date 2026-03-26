#!/usr/bin/env python3
"""
Simple script to test Supabase PostgreSQL connection
"""

import socket
import time

# Database connection parameters
DB_HOST = 'db.gqneuzzwldinlnndhmbw.supabase.co'
DB_PORT = 5432

def test_tcp_connection(host, port, timeout=10):
    """Test basic TCP connectivity to host:port"""
    try:
        print(f"🔄 Testing TCP connection to {host}:{port}...")

        # Get address info for both IPv4 and IPv6
        addrinfo = socket.getaddrinfo(host, port, socket.AF_UNSPEC, socket.SOCK_STREAM)
        
        if not addrinfo:
            print("❌ No address info found!")
            return False

        # Try each address
        for family, socktype, proto, canonname, sockaddr in addrinfo:
            try:
                print(f"🔄 Trying {sockaddr[0]}...")
                sock = socket.socket(family, socktype, proto)
                sock.settimeout(timeout)
                
                start_time = time.time()
                result = sock.connect_ex(sockaddr)
                end_time = time.time()
                
                sock.close()
                
                if result == 0:
                    print("✅ TCP connection successful!")
                    print(".2f")
                    return True
                else:
                    print(f"❌ Connection failed to {sockaddr[0]} (error: {result})")
            except Exception as e:
                print(f"❌ Failed to connect to {sockaddr[0]}: {e}")
                continue

        print("❌ All connection attempts failed!")
        return False

    except socket.gaierror as e:
        print("❌ DNS resolution failed!")
        print(f"Error: {e}")
        return False
    except Exception as e:
        print("❌ Unexpected error during TCP test!")
        print(f"Error: {e}")
        return False

def test_database_credentials():
    """Display the credentials that should work"""
    print("\n📋 Database Credentials to verify:")
    print("=" * 50)
    print(f"Host: {DB_HOST}")
    print(f"Port: {DB_PORT}")
    print("Database: postgres")
    print("Username: postgres")
    print("Password: Avneesh@2006")
    print()
    print("JDBC URL for Spring Boot:")
    print(f"jdbc:postgresql://{DB_HOST}:{DB_PORT}/postgres")
    print("=" * 50)

if __name__ == "__main__":
    print("🧪 Supabase Database Connectivity Test")
    print("=" * 50)

    # Test basic connectivity
    tcp_success = test_tcp_connection(DB_HOST, DB_PORT)

    # Show credentials
    test_database_credentials()

    if tcp_success:
        print("\n✅ Basic connectivity test passed!")
        print("📝 Next: Test with your Spring Boot application")
        print("   - Set environment variables in Render Dashboard")
        print("   - Force redeploy")
        print("   - Check logs for successful database connection")
    else:
        print("\n❌ Basic connectivity test failed!")
        print("🔍 Possible issues:")
        print("   - Network/firewall blocking connection")
        print("   - Supabase service down")
        print("   - DNS resolution issues")
        print("   - Check Supabase dashboard for service status")