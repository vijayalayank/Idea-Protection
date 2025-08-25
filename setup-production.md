# 🚀 Complete Production Setup Guide

## 📋 Prerequisites

1. **Node.js** (v18 or higher)
2. **MetaMask** wallet with some test tokens
3. **Pinata Account** (free tier available)
4. **Alchemy/Infura Account** (for RPC endpoints)

## 🔧 Step-by-Step Setup

### **1. Install Dependencies**

```bash
# Frontend dependencies
cd Idea-FrontEnd
cp package-blockchain.json package.json
npm install

# Backend dependencies (optional - frontend can work standalone)
cd ../Idea-Backend
npm install
```

### **2. Get Required API Keys**

#### **A. Pinata (IPFS Storage)**
1. Go to [pinata.cloud](https://pinata.cloud)
2. Create free account
3. Go to API Keys → Generate New Key
4. Copy the JWT token

#### **B. Alchemy (Blockchain RPC)**
1. Go to [alchemy.com](https://alchemy.com)
2. Create free account
3. Create new app for "Polygon Mumbai" (testnet)
4. Copy the HTTP URL

#### **C. PolygonScan (Block Explorer)**
1. Go to [polygonscan.com](https://polygonscan.com)
2. Create account → API Keys
3. Generate free API key

### **3. Configure Environment**

```bash
# In Idea-FrontEnd directory
cp .env.example .env
```

Edit `.env` file:
```env
# Blockchain Configuration
VITE_CONTRACT_ADDRESS=0x... # Will be filled after deployment
VITE_CHAIN_ID=80001
VITE_NETWORK_NAME=mumbai

# RPC URLs
MUMBAI_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_wallet_private_key_here

# IPFS Configuration
VITE_PINATA_JWT=your_pinata_jwt_token
VITE_PINATA_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Block Explorer
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

### **4. Get Test Tokens**

1. Go to [faucet.polygon.technology](https://faucet.polygon.technology)
2. Connect your MetaMask wallet
3. Switch to Mumbai Testnet
4. Request test MATIC tokens

### **5. Deploy Smart Contract**

```bash
# Compile contract
npm run compile

# Deploy to Mumbai testnet
npm run deploy:mumbai
```

After deployment, copy the contract address to your `.env` file:
```env
VITE_CONTRACT_ADDRESS=0xYourContractAddressHere
```

### **6. Start the Application**

```bash
# Start frontend
npm run dev
```

Visit `http://localhost:5173`

## 🧪 Testing the Complete Flow

### **1. Connect Wallet**
- Click "Connect Wallet" 
- Approve MetaMask connection
- Ensure you're on Mumbai testnet

### **2. Register an Idea**
- Go to Register page
- Fill out the form
- Upload supporting files (optional)
- Choose public/private visibility
- Submit and approve transaction

### **3. View in Registry**
- Go to Registry page
- See your idea listed with blockchain data
- Search and filter functionality

### **4. Verify on Blockchain**
- Click transaction hash links
- View on PolygonScan explorer
- Verify IPFS content

## 🌐 Network Configuration

### **Mumbai Testnet (Recommended for testing)**
- Chain ID: 80001
- RPC: https://rpc-mumbai.maticvigil.com/
- Explorer: https://mumbai.polygonscan.com/
- Faucet: https://faucet.polygon.technology/

### **Polygon Mainnet (Production)**
- Chain ID: 137
- RPC: https://polygon-rpc.com/
- Explorer: https://polygonscan.com/
- Note: Requires real MATIC tokens

## 🔍 Troubleshooting

### **Common Issues:**

1. **"Services not ready"**
   - Check wallet connection
   - Verify correct network
   - Check console for errors

2. **"IPFS upload failed"**
   - Verify Pinata JWT token
   - Check internet connection
   - Try smaller files

3. **"Transaction failed"**
   - Ensure sufficient MATIC balance
   - Check gas price settings
   - Verify contract address

4. **"Contract not found"**
   - Redeploy contract
   - Update contract address in .env
   - Check network configuration

### **Debug Mode:**
Open browser console (F12) to see detailed logs:
- ✅ Green: Success messages
- ❌ Red: Error messages
- 📖 Blue: Info messages

## 📊 Production Deployment

### **Frontend (Vercel/Netlify)**
```bash
npm run build
# Deploy dist/ folder
```

### **Custom Domain Setup**
1. Configure environment variables on hosting platform
2. Set up custom domain
3. Enable HTTPS

### **Mainnet Migration**
1. Deploy contract to Polygon mainnet
2. Update environment variables
3. Test with small amounts first

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Wallet Connection**: ✅ Green indicator
2. **Services Ready**: ✅ "Blockchain Mode" in Registry
3. **Registration**: Real transaction hashes
4. **IPFS Storage**: Accessible content URLs
5. **Explorer Links**: Working blockchain verification

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify all API keys are correct
3. Ensure sufficient test tokens
4. Try different browsers/devices

The DApp is now fully functional with real blockchain and IPFS integration! 🎉
