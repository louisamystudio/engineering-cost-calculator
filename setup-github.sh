#!/bin/bash

# GitHub Repository Setup Script
# This script will help you create and push your project to a private GitHub repository

echo "========================================="
echo "GitHub Repository Setup for Engineering Cost Calculator"
echo "========================================="
echo ""

# Instructions for creating the repository
echo "Step 1: Create a new private repository on GitHub"
echo "----------------------------------------"
echo "1. Go to https://github.com/new"
echo "2. Repository name: engineering-cost-calculator (or your preferred name)"
echo "3. Description: Comprehensive engineering cost calculator with budget analysis"
echo "4. Select 'Private' repository"
echo "5. Do NOT initialize with README, .gitignore, or license"
echo "6. Click 'Create repository'"
echo ""
echo "Press Enter when you've created the repository..."
read

echo ""
echo "Step 2: Enter your GitHub username:"
read GITHUB_USERNAME

echo ""
echo "Step 3: Enter the repository name you created:"
read REPO_NAME

echo ""
echo "Setting up git repository..."
echo "----------------------------------------"

# Initialize git if not already initialized
if [ ! -d .git ]; then
    git init
    echo "Git repository initialized"
else
    echo "Git repository already exists"
fi

# Add all files
echo "Adding files to git..."
git add .

# Create initial commit
echo "Creating initial commit..."
git commit -m "Initial commit: Engineering Cost Calculator application"

# Add remote origin
echo "Adding GitHub remote..."
git remote remove origin 2>/dev/null # Remove existing origin if it exists
git remote add origin "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

# Create and switch to main branch
git branch -M main

echo ""
echo "========================================="
echo "Ready to push to GitHub!"
echo "========================================="
echo ""
echo "To push your code to GitHub, run:"
echo ""
echo "  git push -u origin main"
echo ""
echo "You'll be prompted for your GitHub credentials."
echo "For authentication, you may need to use a Personal Access Token instead of your password."
echo ""
echo "To create a Personal Access Token:"
echo "1. Go to https://github.com/settings/tokens"
echo "2. Click 'Generate new token (classic)'"
echo "3. Give it a name and select 'repo' scope"
echo "4. Use the token as your password when pushing"
echo ""
echo "After pushing, your repository will be available at:"
echo "https://github.com/${GITHUB_USERNAME}/${REPO_NAME}"