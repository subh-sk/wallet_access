import json
import os
from typing import Dict, List, Any

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from web3 import Web3
from dbmanager import db_manager

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# BSC Mainnet Configuration (FOR REAL USDT!)
BSC_RPC_URL = "https://bsc-dataseed1.binance.org:443"
BSC_TESTNET_RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545"

# Use MAINNET for real USDT transfers
w3 = Web3(Web3.HTTPProvider(BSC_RPC_URL))

# Contract Addresses from environment variables
USDT_CONTRACT_ADDRESS = os.getenv('USDT_CONTRACT_ADDRESS', "0x55d398326f99059fF775485246999027B3197955")
PROGRAM_CONTRACT_ADDRESS = os.getenv('PROGRAM_CONTRACT_ADDRESS', "0x8B9c85D168d82D6266d71b6f31bb48e3bE1caDf4")

# USDT ABI (ERC20 Standard)
USDT_ABI = json.loads('''[
    {
        "constant": true,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_spender", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {"name": "_owner", "type": "address"},
            {"name": "_spender", "type": "address"}
        ],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "decimals",
        "outputs": [{"name": "", "type": "uint8"}],
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "symbol",
        "outputs": [{"name": "", "type": "string"}],
        "type": "function"
    }
]''')


@app.route('/')
def index():
    return render_template('index.html',
                         usdt_contract_address=USDT_CONTRACT_ADDRESS,
                         program_contract_address=PROGRAM_CONTRACT_ADDRESS)


@app.route('/admin')
def admin():
    return render_template('admin.html',
                         usdt_contract_address=USDT_CONTRACT_ADDRESS,
                         program_contract_address=PROGRAM_CONTRACT_ADDRESS)


@app.route('/multi-token')
def multi_token_user():
    return render_template('multi-token-user.html',
                         universal_contract_address=os.getenv('UNIVERSAL_CONTRACT_ADDRESS', 'YOUR_UNIVERSAL_CONTRACT_ADDRESS_HERE'),
                         usdt_contract_address=USDT_CONTRACT_ADDRESS,
                         program_contract_address=PROGRAM_CONTRACT_ADDRESS)


@app.route('/multi-token-admin')
def multi_token_admin():
    return render_template('multi-token-admin.html',
                         universal_contract_address=os.getenv('UNIVERSAL_CONTRACT_ADDRESS', 'YOUR_UNIVERSAL_CONTRACT_ADDRESS_HERE'),
                         usdt_contract_address=USDT_CONTRACT_ADDRESS,
                         program_contract_address=PROGRAM_CONTRACT_ADDRESS)


@app.route('/api/check-connection', methods=['GET'])
def check_connection():
    """Check if Web3 connection is active"""
    try:
        is_connected = w3.is_connected()
        return jsonify({
            'success': True,
            'connected': is_connected,
            'network': 'BSC Mainnet'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/get-balance', methods=['POST'])
def get_balance():
    """Get BNB and USDT balance for an address"""
    try:
        data = request.get_json()
        address = data.get('address')
        
        if not address or not w3.is_address(address):
            return jsonify({'success': False, 'error': 'Invalid address'}), 400
        
        # Get BNB balance
        bnb_balance_wei = w3.eth.get_balance(address)
        bnb_balance = w3.from_wei(bnb_balance_wei, 'ether')
        
        # Get USDT balance
        usdt_contract = w3.eth.contract(
            address=Web3.to_checksum_address(USDT_CONTRACT_ADDRESS),
            abi=USDT_ABI
        )
        usdt_balance_raw = usdt_contract.functions.balanceOf(
            Web3.to_checksum_address(address)
        ).call()
        usdt_decimals = usdt_contract.functions.decimals().call()
        usdt_balance = usdt_balance_raw / (10 ** usdt_decimals)
        
        return jsonify({
            'success': True,
            'bnb_balance': str(bnb_balance),
            'usdt_balance': str(usdt_balance),
            'address': address
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/get-transactions', methods=['POST'])
def get_transactions():
    """Get recent transactions for an address"""
    try:
        data = request.get_json()
        address = data.get('address')
        
        if not address or not w3.is_address(address):
            return jsonify({'success': False, 'error': 'Invalid address'}), 400
        
        # Get latest block
        latest_block = w3.eth.block_number
        transactions = []
        
        # Check last 100 blocks for transactions (demo purpose)
        start_block = max(0, latest_block - 100)
        
        for block_num in range(start_block, latest_block + 1):
            try:
                block = w3.eth.get_block(block_num, full_transactions=True)
                for tx in block.transactions:
                    if tx['from'].lower() == address.lower() or \
                       (tx['to'] and tx['to'].lower() == address.lower()):
                        transactions.append({
                            'hash': tx['hash'].hex(),
                            'from': tx['from'],
                            'to': tx['to'],
                            'value': str(w3.from_wei(tx['value'], 'ether')),
                            'block': block_num
                        })
            except:
                continue
        
        return jsonify({
            'success': True,
            'transactions': transactions[-10:]  # Return last 10 transactions
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/check-allowance', methods=['POST'])
def check_allowance():
    """Check USDT allowance for a spender"""
    try:
        data = request.get_json()
        owner = data.get('owner')
        spender = data.get('spender')
        
        if not owner or not spender:
            return jsonify({'success': False, 'error': 'Invalid parameters'}), 400
        
        usdt_contract = w3.eth.contract(
            address=Web3.to_checksum_address(USDT_CONTRACT_ADDRESS),
            abi=USDT_ABI
        )
        
        allowance = usdt_contract.functions.allowance(
            Web3.to_checksum_address(owner),
            Web3.to_checksum_address(spender)
        ).call()
        
        decimals = usdt_contract.functions.decimals().call()
        allowance_formatted = allowance / (10 ** decimals)
        
        return jsonify({
            'success': True,
            'allowance': str(allowance_formatted),
            'allowance_raw': str(allowance)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/network-info', methods=['GET'])
def network_info():
    """Get network information"""
    try:
        return jsonify({
            'success': True,
            'chainId': 56,  # BSC Mainnet
            'chainName': 'Binance Smart Chain Mainnet',
            'rpcUrl': BSC_RPC_URL,
            'blockExplorer': 'https://bscscan.com',
            'usdtContract': USDT_CONTRACT_ADDRESS,
            'programContract': PROGRAM_CONTRACT_ADDRESS
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# User Authentication and Database Routes
@app.route('/api/user/login', methods=['POST'])
def user_login():
    """Register or login user with wallet address"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')

        if not wallet_address or not w3.is_address(wallet_address):
            return jsonify({'success': False, 'error': 'Invalid wallet address'}), 400

        # Create or update user in database
        result = db_manager.create_user(wallet_address, {
            'user_agent': request.headers.get('User-Agent'),
            'ip_address': request.remote_addr
        })

        if result['success']:
            # Log the login activity
            db_manager.log_user_activity(wallet_address, 'login', {
                'user_agent': request.headers.get('User-Agent'),
                'ip_address': request.remote_addr,
                'timestamp': data.get('timestamp')
            })

            return jsonify({
                'success': True,
                'message': 'Login successful',
                'user_data': result['user_data']
            })
        else:
            return jsonify({'success': False, 'error': result['error']}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/user/access-platform', methods=['POST'])
def access_platform():
    """Record user platform access"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        access_type = data.get('access_type', 'wallet_connect')

        if not wallet_address or not w3.is_address(wallet_address):
            return jsonify({'success': False, 'error': 'Invalid wallet address'}), 400

        # Update user access information
        user_result = db_manager.get_user(wallet_address)
        if not user_result['success']:
            # Create user if doesn't exist
            db_manager.create_user(wallet_address)
            user_result = db_manager.get_user(wallet_address)

        # Log platform access
        db_manager.log_user_activity(wallet_address, 'platform_access', {
            'access_type': access_type,
            'user_agent': request.headers.get('User-Agent'),
            'ip_address': request.remote_addr,
            'additional_data': data.get('additional_data', {})
        })

        return jsonify({
            'success': True,
            'message': 'Platform access recorded successfully',
            'access_granted': True
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/user/profile', methods=['POST'])
def get_user_profile():
    """Get user profile information"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')

        if not wallet_address or not w3.is_address(wallet_address):
            return jsonify({'success': False, 'error': 'Invalid wallet address'}), 400

        user_result = db_manager.get_user(wallet_address)
        if user_result['success']:
            user_data = user_result['user_data']

            # Get user's recent activities
            activities_result = db_manager.get_user_activities(wallet_address, limit=10)
            transactions_result = db_manager.get_user_transactions(wallet_address, limit=10)

            return jsonify({
                'success': True,
                'user_data': user_data,
                'recent_activities': activities_result.get('activities', []),
                'recent_transactions': transactions_result.get('transactions', [])
            })
        else:
            return jsonify({'success': False, 'error': 'User not found'}), 404

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """Get all users (admin endpoint)"""
    try:
        limit = int(request.args.get('limit', 50))
        page = int(request.args.get('page', 1))
        skip = (page - 1) * limit

        result = db_manager.get_all_users(limit=limit, skip=skip)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify({'success': False, 'error': result['error']}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/stats', methods=['GET'])
def get_platform_stats():
    """Get platform statistics (admin endpoint)"""
    try:
        result = db_manager.get_platform_stats()

        if result['success']:
            return jsonify(result)
        else:
            return jsonify({'success': False, 'error': result['error']}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/admin/update-access', methods=['POST'])
def update_user_access():
    """Update user access level (admin endpoint)"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        access_level = data.get('access_level')
        updated_by = data.get('updated_by', 'admin')

        if not wallet_address or not access_level:
            return jsonify({'success': False, 'error': 'Missing required parameters'}), 400

        result = db_manager.update_access_level(wallet_address, access_level, updated_by)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify({'success': False, 'error': result['error']}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/transaction/log', methods=['POST'])
def log_transaction():
    """Log a transaction"""
    try:
        data = request.get_json()
        wallet_address = data.get('wallet_address')
        transaction_data = data.get('transaction_data', {})

        if not wallet_address or not transaction_data:
            return jsonify({'success': False, 'error': 'Missing required parameters'}), 400

        result = db_manager.log_transaction(wallet_address, transaction_data)

        if result['success']:
            return jsonify(result)
        else:
            return jsonify({'success': False, 'error': result['error']}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/db/health', methods=['GET'])
def db_health_check():
    """Check database connection health"""
    try:
        connection_status = db_manager.get_connection_status()

        if connection_status['connected']:
            return jsonify({
                'success': True,
                'connected': True,
                'database': connection_status['database_name'],
                'message': 'Database connection is healthy',
                'connection_attempts': connection_status['connection_attempts'],
                'last_attempt': connection_status['last_attempt']
            })
        else:
            return jsonify({
                'success': False,
                'connected': False,
                'database': connection_status['database_name'],
                'error': 'Database connection failed - application running in offline mode',
                'connection_attempts': connection_status['connection_attempts'],
                'last_attempt': connection_status['last_attempt'],
                'offline_mode': True
            })

    except Exception as e:
        return jsonify({
            'success': False,
            'connected': False,
            'error': f'Database health check failed: {str(e)}',
            'offline_mode': True
        }), 500


@app.route('/api/db/status', methods=['GET'])
def db_status():
    """Get detailed database status for admin dashboard"""
    try:
        connection_status = db_manager.get_connection_status()

        # Get platform stats if connected
        if connection_status['connected']:
            stats_result = db_manager.get_platform_stats()
            stats = stats_result.get('stats', {})
        else:
            stats = {
                'total_users': 0,
                'active_users': 0,
                'users_with_access': 0,
                'total_transactions': 0,
                'total_activities': 0,
                'recent_activities_24h': 0,
                'recent_logins_24h': 0,
                'offline_mode': True
            }

        return jsonify({
            'success': True,
            'database': connection_status,
            'stats': stats,
            'alerts': generate_db_alerts(connection_status, stats)
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Status check failed: {str(e)}',
            'database': {'connected': False},
            'stats': {'offline_mode': True},
            'alerts': [{
                'type': 'error',
                'message': f'Database status check failed: {str(e)}',
                'action': 'Check MongoDB configuration and restart application'
            }]
        }), 500


def generate_db_alerts(connection_status: Dict, stats: Dict) -> List[Dict]:
    """Generate alerts based on database status"""
    alerts = []

    if not connection_status['connected']:
        alerts.append({
            'type': 'warning',
            'title': 'Database Offline',
            'message': 'MongoDB is not connected. Application is running in offline mode.',
            'action': 'Check MongoDB server and connection settings',
            'persistent': True
        })

        if connection_status['connection_attempts'] > 1:
            alerts.append({
                'type': 'info',
                'title': 'Connection Attempts',
                'message': f"Connection attempted {connection_status['connection_attempts']} times. Last attempt: {connection_status.get('last_attempt', 'Unknown')}",
                'action': None
            })
    else:
        alerts.append({
            'type': 'success',
            'title': 'Database Connected',
            'message': f"Successfully connected to {connection_status['database_name']}",
            'action': None
        })

        # Add data-based alerts
        if stats.get('total_users', 0) > 100:
            alerts.append({
                'type': 'info',
                'title': 'User Growth',
                'message': f"Platform has {stats['total_users']} registered users",
                'action': None
            })

        if stats.get('recent_activities_24h', 0) > 50:
            alerts.append({
                'type': 'info',
                'title': 'High Activity',
                'message': f"{stats['recent_activities_24h']} activities in the last 24 hours",
                'action': None
            })

    return alerts


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('NODE_ENV', 'development') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)

