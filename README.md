# BELAL-BOTX666-MAX
2026 Advanced Messenger Chatbot by Bela



name: BELAL BOT

on:
  workflow_dispatch:
  push:
    branches: [main]

jobs:
  bot:
    runs-on: ubuntu-latest
    timeout-minutes: 360
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - run: sudo apt-get update -qq && sudo apt-get install -y ffmpeg --fix-missing || true

      - name: Inject API keys into config.json
        run: |
          node -e "
          const fs=require('fs');
          const c=JSON.parse(fs.readFileSync('config.json','utf-8'));
          c.APIKEYS.GROQ=process.env.GROQ_KEY||c.APIKEYS.GROQ;
          fs.writeFileSync('config.json',JSON.stringify(c,null,2));
          "
        env:
          GROQ_KEY: ${{ secrets.GROQ_KEY }}

      - run: npm install --legacy-peer-deps

      - name: Run Bot
        run: node index.js
        timeout-minutes: 350
        env:
          NODE_ENV: production
          TZ: Asia/Dhaka
          GROQ_KEY: ${{ secrets.GROQ_KEY }}
          
