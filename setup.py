"""
Setup script for Crypto Wallet USDT Transfer Demo
This script helps set up the environment and dependencies
"""
import os
import sys
import subprocess
import platform

def print_header(text):
    """Print formatted header"""
    print("\n" + "="*60)
    print(f"  {text}")
    print("="*60 + "\n")

def run_command(command, description):
    """Run a command and handle errors"""
    print(f"➤ {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"  ✅ {description} completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"  ❌ {description} failed: {e}")
        if e.output:
            print(f"  Error: {e.output}")
        return False

def check_python_version():
    """Check if Python version is compatible"""
    print_header("Checking Python Version")
    version = sys.version_info
    print(f"  Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("  ❌ Python 3.8 or higher is required")
        return False
    
    print("  ✅ Python version is compatible")
    return True

def create_virtual_env():
    """Create virtual environment"""
    print_header("Creating Virtual Environment")
    
    if os.path.exists('venv'):
        print("  ℹ️  Virtual environment already exists")
        return True
    
    return run_command('python -m venv venv', "Creating virtual environment")

def install_requirements():
    """Install Python requirements"""
    print_header("Installing Python Dependencies")
    
    # Determine pip command based on OS and venv
    if platform.system() == 'Windows':
        pip_cmd = 'venv\\Scripts\\pip.exe'
    else:
        pip_cmd = 'venv/bin/pip'
    
    return run_command(f'{pip_cmd} install -r requirements.txt', "Installing dependencies")

def create_env_file():
    """Create .env file from template"""
    print_header("Creating Environment Configuration")
    
    if os.path.exists('.env'):
        print("  ℹ️  .env file already exists")
        response = input("  Do you want to overwrite it? (y/N): ")
        if response.lower() != 'y':
            return True
    
    if os.path.exists('.env.template'):
        try:
            with open('.env.template', 'r') as template:
                content = template.read()
            
            with open('.env', 'w') as env_file:
                env_file.write(content)
            
            print("  ✅ .env file created successfully")
            print("  ⚠️  Please edit .env file and configure your settings")
            return True
        except Exception as e:
            print(f"  ❌ Failed to create .env file: {e}")
            return False
    else:
        print("  ⚠️  .env.template not found, skipping")
        return True

def create_directories():
    """Create necessary directories"""
    print_header("Creating Directories")
    
    directories = ['templates', 'static', 'static/css', 'static/js', 'contracts']
    
    for directory in directories:
        if not os.path.exists(directory):
            try:
                os.makedirs(directory)
                print(f"  ✅ Created directory: {directory}")
            except Exception as e:
                print(f"  ❌ Failed to create directory {directory}: {e}")
                return False
        else:
            print(f"  ℹ️  Directory already exists: {directory}")
    
    return True

def print_next_steps():
    """Print next steps for the user"""
    print_header("Setup Complete! 🎉")
    
    print("Next steps:\n")
    
    print("1. Activate the virtual environment:")
    if platform.system() == 'Windows':
        print("   venv\\Scripts\\activate\n")
    else:
        print("   source venv/bin/activate\n")
    
    print("2. Edit the .env file with your configuration:")
    print("   - Set your SECRET_KEY")
    print("   - Choose network (testnet/mainnet)")
    print("   - Configure contract addresses\n")
    
    print("3. Deploy smart contracts (see contracts/README.md):\n")
    
    print("4. Run the application:")
    print("   python app.py\n")
    
    print("5. Open your browser and visit:")
    print("   http://localhost:5000\n")
    
    print("6. Connect your MetaMask or Trust Wallet and start testing!\n")
    
    print("📚 For more information, read README.md")
    print("🔧 For contract deployment, read contracts/README.md")
    print("\n⚠️  IMPORTANT: Test on BSC Testnet before using mainnet!\n")

def main():
    """Main setup function"""
    print_header("Crypto Wallet USDT Transfer - Setup")
    print("This script will set up your development environment.\n")
    
    # Check Python version
    if not check_python_version():
        sys.exit(1)
    
    # Create directories
    if not create_directories():
        print("\n❌ Setup failed: Could not create directories")
        sys.exit(1)
    
    # Create virtual environment
    if not create_virtual_env():
        print("\n❌ Setup failed: Could not create virtual environment")
        sys.exit(1)
    
    # Install requirements
    if not install_requirements():
        print("\n❌ Setup failed: Could not install dependencies")
        sys.exit(1)
    
    # Create .env file
    if not create_env_file():
        print("\n⚠️  Warning: .env file was not created")
    
    # Print next steps
    print_next_steps()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Setup failed with error: {e}")
        sys.exit(1)

