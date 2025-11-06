"""
Configuration file for the USDT Transfer Web Application
"""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = False
    TESTING = False
    
    # BSC Network Configuration
    BSC_MAINNET_RPC = os.getenv('BSC_MAINNET_RPC', 'https://bsc-dataseed1.binance.org:443')
    BSC_TESTNET_RPC = os.getenv('BSC_TESTNET_RPC', 'https://data-seed-prebsc-1-s1.binance.org:8545')
    
    # Contract Addresses
    USDT_MAINNET_ADDRESS = os.getenv('USDT_MAINNET_ADDRESS', '0x55d398326f99059fF775485246999027B3197955')
    USDT_TESTNET_ADDRESS = os.getenv('USDT_TESTNET_ADDRESS', '')
    
    # Network Selection (testnet/mainnet)
    NETWORK = os.getenv('NETWORK', 'testnet')
    
    # Chain IDs
    BSC_MAINNET_CHAIN_ID = 56
    BSC_TESTNET_CHAIN_ID = 97
    
    # Block Explorer URLs
    BSC_MAINNET_EXPLORER = 'https://bscscan.com'
    BSC_TESTNET_EXPLORER = 'https://testnet.bscscan.com'
    
    # API Configuration
    API_RATE_LIMIT = '100 per hour'
    
    @property
    def RPC_URL(self):
        """Get RPC URL based on selected network"""
        return self.BSC_TESTNET_RPC if self.NETWORK == 'testnet' else self.BSC_MAINNET_RPC
    
    @property
    def USDT_ADDRESS(self):
        """Get USDT contract address based on selected network"""
        return self.USDT_TESTNET_ADDRESS if self.NETWORK == 'testnet' else self.USDT_MAINNET_ADDRESS
    
    @property
    def CHAIN_ID(self):
        """Get Chain ID based on selected network"""
        return self.BSC_TESTNET_CHAIN_ID if self.NETWORK == 'testnet' else self.BSC_MAINNET_CHAIN_ID
    
    @property
    def EXPLORER_URL(self):
        """Get block explorer URL based on selected network"""
        return self.BSC_TESTNET_EXPLORER if self.NETWORK == 'testnet' else self.BSC_MAINNET_EXPLORER


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    NETWORK = 'testnet'


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

