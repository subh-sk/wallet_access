import os
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from pymongo import MongoClient, DESCENDING
from pymongo.errors import ConnectionFailure, PyMongoError
from dotenv import load_dotenv

load_dotenv()

class DBManager:
    """Database Manager for MongoDB operations with graceful fallback"""

    def __init__(self):
        self.db_name = "web_wallet_access"
        self.client = None
        self.db = None
        self.mongodb_uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
        self.connection_attempts = 0
        self.max_connection_attempts = 3
        self.last_connection_attempt = None
        self._connection_status = False
        self.connect()

    def connect(self) -> bool:
        """Establish MongoDB connection with retry logic"""
        self.connection_attempts += 1
        self.last_connection_attempt = datetime.now(timezone.utc)

        try:
            self.client = MongoClient(
                self.mongodb_uri,
                serverSelectionTimeoutMS=3000,  # Faster timeout for web applications
                connectTimeoutMS=3000,
                socketTimeoutMS=3000
            )
            self.client.admin.command('ping')
            self.db = self.client[self.db_name]
            self._connection_status = True
            print(f"[SUCCESS] Connected to MongoDB: {self.db_name}")
            return True
        except ConnectionFailure as e:
            self._connection_status = False
            print(f"[WARNING] MongoDB connection failed: {e}")
            print("[INFO] Application will continue working without database storage")
            return False
        except Exception as e:
            self._connection_status = False
            print(f"[WARNING] Unexpected error connecting to MongoDB: {e}")
            print("[INFO] Application will continue working without database storage")
            return False

    def is_connected(self) -> bool:
        """Check if MongoDB is connected"""
        if not self._connection_status or not self.client:
            return False
        try:
            self.client.admin.command('ping')
            return True
        except:
            self._connection_status = False
            return False

    def get_connection_status(self) -> Dict[str, Any]:
        """Get detailed connection status"""
        return {
            'connected': self.is_connected(),
            'connection_attempts': self.connection_attempts,
            'last_attempt': self.last_connection_attempt.isoformat() if self.last_connection_attempt else None,
            'database_name': self.db_name,
            'uri': self.mongodb_uri.replace('mongodb://', 'mongodb://***:***@') if '@' in self.mongodb_uri else self.mongodb_uri
        }

    def _ensure_connection(self) -> bool:
        """Ensure database connection, reconnect if needed"""
        if not self.is_connected() and self.connection_attempts < self.max_connection_attempts:
            print("[INFO] Attempting to reconnect to MongoDB...")
            return self.connect()
        return self.is_connected()

    def _safe_operation(self, fallback_data: Any = None, fallback_success: bool = False) -> Dict[str, Any]:
        """Safe operation wrapper for database calls"""
        if not self._ensure_connection():
            return {
                "success": fallback_success,
                "error": "Database not available - running in offline mode",
                "fallback_data": fallback_data,
                "offline_mode": True
            }
        return {"success": True, "offline_mode": False}

    # User Collection Operations
    def create_user(self, wallet_address: str, additional_data: Optional[Dict] = None) -> Dict[str, Any]:
        """Create a new user record"""
        safe_check = self._safe_operation()
        if safe_check.get('offline_mode'):
            # Return mock user data for offline mode
            mock_user_data = {
                'wallet_address': wallet_address.lower(),
                'created_at': datetime.now(timezone.utc).isoformat(),
                'last_login': datetime.now(timezone.utc).isoformat(),
                'login_count': 1,
                'is_active': True,
                'access_level': 'user',
                'platform_access': {
                    'has_access': True,
                    'access_granted_at': datetime.now(timezone.utc).isoformat(),
                    'access_method': 'wallet_connect'
                }
            }
            if additional_data:
                mock_user_data.update(additional_data)
            return {"success": True, "user_data": mock_user_data, "offline_mode": True}

        try:
            user_data = {
                'wallet_address': wallet_address.lower(),
                'created_at': datetime.now(timezone.utc),
                'last_login': datetime.now(timezone.utc),
                'login_count': 1,
                'is_active': True,
                'access_level': 'user',
                'platform_access': {
                    'has_access': True,
                    'access_granted_at': datetime.now(timezone.utc),
                    'access_method': 'wallet_connect'
                }
            }

            if additional_data:
                user_data.update(additional_data)

            # Check if user already exists
            existing_user = self.db.users.find_one({'wallet_address': wallet_address.lower()})
            if existing_user:
                return self.update_user_login(wallet_address.lower())

            result = self.db.users.insert_one(user_data)
            user_data['_id'] = result.inserted_id
            return {"success": True, "user_data": user_data}

        except PyMongoError as e:
            return {"success": False, "error": f"Database error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    def update_user_login(self, wallet_address: str) -> Dict[str, Any]:
        """Update user login information"""
        try:
            update_data = {
                '$set': {
                    'last_login': datetime.now(timezone.utc),
                    'platform_access.has_access': True,
                    'platform_access.last_access': datetime.now(timezone.utc)
                },
                '$inc': {
                    'login_count': 1
                }
            }

            result = self.db.users.update_one(
                {'wallet_address': wallet_address.lower()},
                update_data
            )

            if result.matched_count > 0:
                user_data = self.db.users.find_one({'wallet_address': wallet_address.lower()})
                return {"success": True, "user_data": user_data}
            else:
                return {"success": False, "error": "User not found"}

        except PyMongoError as e:
            return {"success": False, "error": f"Database error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    def get_user(self, wallet_address: str) -> Dict[str, Any]:
        """Get user information by wallet address"""
        safe_check = self._safe_operation()
        if safe_check.get('offline_mode'):
            # Return mock user data for offline mode
            mock_user_data = {
                'wallet_address': wallet_address.lower(),
                'created_at': datetime.now(timezone.utc).isoformat(),
                'last_login': datetime.now(timezone.utc).isoformat(),
                'login_count': 1,
                'is_active': True,
                'access_level': 'user',
                'platform_access': {
                    'has_access': True,
                    'access_granted_at': datetime.now(timezone.utc).isoformat(),
                    'access_method': 'wallet_connect'
                }
            }
            return {"success": True, "user_data": mock_user_data, "offline_mode": True}

        try:
            user_data = self.db.users.find_one({'wallet_address': wallet_address.lower()})
            if user_data:
                return {"success": True, "user_data": user_data}
            else:
                return {"success": False, "error": "User not found"}

        except PyMongoError as e:
            return {"success": False, "error": f"Database error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    def get_all_users(self, limit: int = 100, skip: int = 0) -> Dict[str, Any]:
        """Get all users with pagination"""
        try:
            users = list(self.db.users.find({})
                         .sort('created_at', DESCENDING)
                         .skip(skip)
                         .limit(limit))

            # Convert ObjectId to string for JSON serialization
            for user in users:
                user['_id'] = str(user['_id'])
                if 'created_at' in user:
                    user['created_at'] = user['created_at'].isoformat()
                if 'last_login' in user:
                    user['last_login'] = user['last_login'].isoformat()
                if 'access_granted_at' in user.get('platform_access', {}):
                    user['platform_access']['access_granted_at'] = user['platform_access']['access_granted_at'].isoformat()

            total_users = self.db.users.count_documents({})

            return {
                "success": True,
                "users": users,
                "total_count": total_users,
                "page": skip // limit + 1,
                "per_page": limit
            }

        except PyMongoError as e:
            return {"success": False, "error": f"Database error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    # User Activity Collection Operations
    def log_user_activity(self, wallet_address: str, activity_type: str, details: Optional[Dict] = None) -> Dict[str, Any]:
        """Log user activity"""
        safe_check = self._safe_operation()
        if safe_check.get('offline_mode'):
            # Return mock activity data for offline mode
            mock_activity_data = {
                'wallet_address': wallet_address.lower(),
                'activity_type': activity_type,
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'details': details or {}
            }
            return {"success": True, "activity_data": mock_activity_data, "offline_mode": True}

        try:
            activity_data = {
                'wallet_address': wallet_address.lower(),
                'activity_type': activity_type,
                'timestamp': datetime.now(timezone.utc),
                'details': details or {}
            }

            result = self.db.user_activities.insert_one(activity_data)
            activity_data['_id'] = result.inserted_id
            return {"success": True, "activity_data": activity_data}

        except PyMongoError as e:
            return {"success": False, "error": f"Database error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    def get_user_activities(self, wallet_address: str, limit: int = 50) -> Dict[str, Any]:
        """Get user activity history"""
        try:
            activities = list(self.db.user_activities.find({'wallet_address': wallet_address.lower()})
                             .sort('timestamp', DESCENDING)
                             .limit(limit))

            # Convert ObjectId to string and datetime to isoformat
            for activity in activities:
                activity['_id'] = str(activity['_id'])
                activity['timestamp'] = activity['timestamp'].isoformat()

            return {"success": True, "activities": activities}

        except PyMongoError as e:
            return {"success": False, "error": f"Database error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    # Transaction Collection Operations
    def log_transaction(self, wallet_address: str, transaction_data: Dict) -> Dict[str, Any]:
        """Log transaction details"""
        try:
            tx_data = {
                'wallet_address': wallet_address.lower(),
                'transaction_hash': transaction_data.get('hash'),
                'transaction_type': transaction_data.get('type', 'unknown'),
                'amount': transaction_data.get('amount'),
                'token': transaction_data.get('token', 'BNB'),
                'from_address': transaction_data.get('from'),
                'to_address': transaction_data.get('to'),
                'block_number': transaction_data.get('block'),
                'timestamp': datetime.now(timezone.utc),
                'status': transaction_data.get('status', 'pending'),
                'details': transaction_data
            }

            result = self.db.transactions.insert_one(tx_data)
            tx_data['_id'] = result.inserted_id
            return {"success": True, "transaction_data": tx_data}

        except PyMongoError as e:
            return {"success": False, "error": f"Database error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    def get_user_transactions(self, wallet_address: str, limit: int = 50) -> Dict[str, Any]:
        """Get user transaction history"""
        try:
            transactions = list(self.db.transactions.find({'wallet_address': wallet_address.lower()})
                                .sort('timestamp', DESCENDING)
                                .limit(limit))

            # Convert ObjectId to string and datetime to isoformat
            for tx in transactions:
                tx['_id'] = str(tx['_id'])
                tx['timestamp'] = tx['timestamp'].isoformat()

            return {"success": True, "transactions": transactions}

        except PyMongoError as e:
            return {"success": False, "error": f"Database error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    # Access Control Operations
    def update_access_level(self, wallet_address: str, access_level: str, updated_by: Optional[str] = None) -> Dict[str, Any]:
        """Update user access level"""
        try:
            update_data = {
                '$set': {
                    'access_level': access_level,
                    'platform_access.access_granted_at': datetime.now(timezone.utc),
                    'platform_access.updated_by': updated_by
                }
            }

            result = self.db.users.update_one(
                {'wallet_address': wallet_address.lower()},
                update_data
            )

            if result.matched_count > 0:
                # Log the access change
                self.log_user_activity(
                    wallet_address,
                    'access_level_updated',
                    {
                        'new_access_level': access_level,
                        'updated_by': updated_by,
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    }
                )
                return {"success": True, "message": "Access level updated successfully"}
            else:
                return {"success": False, "error": "User not found"}

        except PyMongoError as e:
            return {"success": False, "error": f"Database error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    def revoke_access(self, wallet_address: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """Revoke user access"""
        try:
            update_data = {
                '$set': {
                    'platform_access.has_access': False,
                    'platform_access.revoked_at': datetime.now(timezone.utc),
                    'platform_access.revocation_reason': reason,
                    'is_active': False
                }
            }

            result = self.db.users.update_one(
                {'wallet_address': wallet_address.lower()},
                update_data
            )

            if result.matched_count > 0:
                # Log the revocation
                self.log_user_activity(
                    wallet_address,
                    'access_revoked',
                    {
                        'reason': reason,
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    }
                )
                return {"success": True, "message": "Access revoked successfully"}
            else:
                return {"success": False, "error": "User not found"}

        except PyMongoError as e:
            return {"success": False, "error": f"Database error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    # Analytics Operations
    def get_platform_stats(self) -> Dict[str, Any]:
        """Get platform statistics"""
        safe_check = self._safe_operation()
        if safe_check.get('offline_mode'):
            # Return mock statistics for offline mode
            return {
                "success": True,
                "stats": {
                    "total_users": 0,
                    "active_users": 0,
                    "users_with_access": 0,
                    "total_transactions": 0,
                    "total_activities": 0,
                    "recent_activities_24h": 0,
                    "recent_logins_24h": 0,
                    "offline_mode": True
                },
                "offline_mode": True
            }

        try:
            total_users = self.db.users.count_documents({})
            active_users = self.db.users.count_documents({'is_active': True})
            users_with_access = self.db.users.count_documents({'platform_access.has_access': True})
            total_transactions = self.db.transactions.count_documents({})
            total_activities = self.db.user_activities.count_documents({})

            # Recent activity (last 24 hours)
            from datetime import timedelta
            yesterday = datetime.now(timezone.utc) - timedelta(days=1)
            recent_activities = self.db.user_activities.count_documents({
                'timestamp': {'$gte': yesterday}
            })
            recent_logins = self.db.user_activities.count_documents({
                'activity_type': 'login',
                'timestamp': {'$gte': yesterday}
            })

            return {
                "success": True,
                "stats": {
                    "total_users": total_users,
                    "active_users": active_users,
                    "users_with_access": users_with_access,
                    "total_transactions": total_transactions,
                    "total_activities": total_activities,
                    "recent_activities_24h": recent_activities,
                    "recent_logins_24h": recent_logins
                }
            }

        except PyMongoError as e:
            return {"success": False, "error": f"Database error: {str(e)}"}
        except Exception as e:
            return {"success": False, "error": f"Unexpected error: {str(e)}"}

    def close(self):
        """Close MongoDB connection"""
        if self.client:
            self.client.close()

# Global DB Manager instance
db_manager = DBManager()