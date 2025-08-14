#!/bin/bash

# Script to populate drug interactions database
# Usage: ./populate-interactions.sh [drug_name]

set -e

echo "🚀 SuppleMate Drug Interactions Database Population"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    exit 1
fi

# Install Python dependencies if needed
echo "📦 Checking Python dependencies..."
if [ -f "webscraper/requirements.txt" ]; then
    pip3 install -q -r webscraper/requirements.txt
    echo "✅ Python dependencies installed"
fi

# Install Node.js dependencies if needed
echo "📦 Checking Node.js dependencies..."
cd api
npm install --silent
cd ..
echo "✅ Node.js dependencies installed"

# Test the Python webscraper first
echo "🧪 Testing Python webscraper..."
cd webscraper
python3 main.py "warfarin" '["ibuprofen"]' > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Python webscraper is working"
else
    echo "❌ Python webscraper test failed"
    exit 1
fi
cd ..

# Run the population script
echo "🔄 Running population script..."
cd api

if [ $# -eq 0 ]; then
    echo "ℹ️  Populating entire database (this may take a while)..."
    node ../scripts/populate-interactions-database.js
else
    echo "ℹ️  Populating interactions for drug: $1"
    node ../scripts/populate-interactions-database.js --drug="$1"
fi

cd ..

echo "🎉 Population complete!"
echo ""
echo "💡 Tips:"
echo "  - Run './populate-interactions.sh warfarin' to populate for a specific drug"
echo "  - Check the database for results"
echo "  - Use the test script: cd scripts && node test-database-only-api.js"
