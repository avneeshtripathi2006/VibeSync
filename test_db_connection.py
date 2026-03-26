#!/usr/bin/env python3
"""
Simple script to test Supabase PostgreSQL connection
"""

import socket
import time

# Database connection parameters
DB_HOST = 'db.flitvcxgxlfnikkysmkj.supabase.co'
DB_PORT = 5432

def test_tcp_connection(host, port, timeout=10):
    """Test basic TCP connectivity to host:port"""
    try:
        print(f"🔄 Testing TCP connection to {host}:{port}...")

        # Create socket
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)

        start_time = time.time()
        result = sock.connect_ex((host, port))
        end_time = time.time()

        sock.close()

        if result == 0:
            print("✅ TCP connection successful!")
            print(".2f")
            return True
        else:
            print("❌ TCP connection failed!")
            print(f"Error code: {result}")
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