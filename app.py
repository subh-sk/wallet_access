import json
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, render_template, request
from web3 import Web3

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


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('NODE_ENV', 'development') == 'development'
    app.run(debug=debug, host='0.0.0.0', port=port)

