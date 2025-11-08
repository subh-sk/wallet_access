#!/usr/bin/env python3
"""
Test script for MongoDB Database Manager
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dbmanager import DBManager
import json

def test_database_connection():
    """Test basic database connection and operations"""
    print("Testing MongoDB Database Manager...")
    print("=" * 50)

    # Initialize DB Manager
    db = DBManager()

    # Test connection
    print("1. Testing database connection...")
    if db.is_connected():
        print("✅ Database connection successful")
    else:
        print("❌ Database connection failed")
        return False

    # Test user creation
    print("\n2. Testing user creation...")
    test_wallet = "0x1234567890123456789012345678901234567890"
    result = db.create_user(test_wallet, {
        'test_mode': True,
        'user_agent': 'Test Script'
    })

    if result['success']:
        print("✅ User creation successful")
        print(f"   User ID: {result['user_data']['_id']}")
        print(f"   Wallet: {result['user_data']['wallet_address']}")
        print(f"   Login Count: {result['user_data']['login_count']}")
    else:
        print(f"❌ User creation failed: {result['error']}")
        return False

    # Test user retrieval
    print("\n3. Testing user retrieval...")
    result = db.get_user(test_wallet)
    if result['success']:
        print("✅ User retrieval successful")
        print(f"   Found user: {result['user_data']['wallet_address']}")
    else:
        print(f"❌ User retrieval failed: {result['error']}")
        return False

    # Test activity logging
    print("\n4. Testing activity logging...")
    result = db.log_user_activity(test_wallet, 'test_activity', {
        'test_data': 'This is a test activity',
        'timestamp': '2024-01-01T00:00:00Z'
    })

    if result['success']:
        print("✅ Activity logging successful")
        print(f"   Activity ID: {result['activity_data']['_id']}")
    else:
        print(f"❌ Activity logging failed: {result['error']}")
        return False

    # Test transaction logging
    print("\n5. Testing transaction logging...")
    test_tx = {
        'hash': '0xabcdef1234567890',
        'type': 'test_transaction',
        'amount': '1.5',
        'token': 'USDT',
        'from': '0x1111111111111111111111111111111111111111',
        'to': '0x2222222222222222222222222222222222222222',
        'block': 12345,
        'status': 'completed'
    }

    result = db.log_transaction(test_wallet, test_tx)
    if result['success']:
        print("✅ Transaction logging successful")
        print(f"   Transaction ID: {result['transaction_data']['_id']}")
    else:
        print(f"❌ Transaction logging failed: {result['error']}")
        return False

    # Test platform stats
    print("\n6. Testing platform statistics...")
    result = db.get_platform_stats()
    if result['success']:
        print("✅ Platform statistics successful")
        stats = result['stats']
        print(f"   Total Users: {stats['total_users']}")
        print(f"   Active Users: {stats['active_users']}")
        print(f"   Total Transactions: {stats['total_transactions']}")
        print(f"   Total Activities: {stats['total_activities']}")
    else:
        print(f"❌ Platform statistics failed: {result['error']}")
        return False

    # Test user activities retrieval
    print("\n7. Testing user activities retrieval...")
    result = db.get_user_activities(test_wallet, limit=5)
    if result['success']:
        print("✅ User activities retrieval successful")
        print(f"   Found {len(result['activities'])} activities")
        for activity in result['activities']:
            print(f"   - {activity['activity_type']}: {activity['timestamp']}")
    else:
        print(f"❌ User activities retrieval failed: {result['error']}")
        return False

    # Test user transactions retrieval
    print("\n8. Testing user transactions retrieval...")
    result = db.get_user_transactions(test_wallet, limit=5)
    if result['success']:
        print("✅ User transactions retrieval successful")
        print(f"   Found {len(result['transactions'])} transactions")
        for tx in result['transactions']:
            print(f"   - {tx['transaction_type']}: {tx['amount']} {tx['token']}")
    else:
        print(f"❌ User transactions retrieval failed: {result['error']}")
        return False

    # Cleanup test data
    print("\n9. Cleaning up test data...")
    try:
        db.db.users.delete_one({'wallet_address': test_wallet.lower()})
        db.db.user_activities.delete_many({'wallet_address': test_wallet.lower()})
        db.db.transactions.delete_many({'wallet_address': test_wallet.lower()})
        print("✅ Test data cleaned up")
    except Exception as e:
        print(f"⚠️  Cleanup warning: {e}")

    # Close connection
    db.close()
    print("\n" + "=" * 50)
    print("🎉 All tests passed successfully!")
    return True

def test_collections_structure():
    """Test and display the collections structure"""
    print("\nTesting Collections Structure...")
    print("=" * 30)

    db = DBManager()

    if not db.is_connected():
        print("❌ Cannot connect to database")
        return False

    # List all collections
    collections = db.db.list_collection_names()
    print(f"Existing collections: {collections}")

    # Check if our required collections exist
    required_collections = ['users', 'user_activities', 'transactions']
    for collection in required_collections:
        if collection in collections:
            count = db.db[collection].count_documents({})
            print(f"✅ '{collection}' collection exists ({count} documents)")
        else:
            print(f"⚠️  '{collection}' collection doesn't exist yet")

    db.close()
    return True

if __name__ == "__main__":
    print("MongoDB Database Manager Test Suite")
    print("=" * 50)

    try:
        # Test collections structure
        test_collections_structure()

        # Test database operations
        success = test_database_connection()

        if success:
            print("\n🎉 All database tests completed successfully!")
            sys.exit(0)
        else:
            print("\n❌ Some tests failed. Please check your MongoDB configuration.")
            sys.exit(1)

    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)