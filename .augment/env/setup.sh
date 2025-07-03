#!/bin/bash
set -e

echo "Setting up Twenty CRM development environment..."

# Update package lists
sudo apt-get update

# Install Node.js 22 (required by package.json engines)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js version
node --version
npm --version

# Enable corepack for Yarn management
sudo corepack enable

# Install the specific Yarn version from package.json (4.4.0)
# First check if .yarnrc.yml exists to get the correct version
if [ -f ".yarnrc.yml" ]; then
    echo "Found .yarnrc.yml, using corepack to install correct Yarn version..."
    corepack install
else
    echo "Installing Yarn 4.x..."
    corepack prepare yarn@4.4.0 --activate
fi

# Verify Yarn version
yarn --version

# Install dependencies
echo "Installing dependencies..."
yarn install

# Build shared packages first (required for tests)
echo "Building shared packages..."
yarn nx build twenty-shared
yarn nx build twenty-ui

# Set up environment variables for tests
export NODE_ENV=test
export TZ=GMT
export LC_ALL=en_US.UTF-8

# Add environment variables to profile
echo 'export NODE_ENV=test' >> $HOME/.profile
echo 'export TZ=GMT' >> $HOME/.profile
echo 'export LC_ALL=en_US.UTF-8' >> $HOME/.profile

echo "Setup completed successfully!"