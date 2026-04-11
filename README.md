# 🐱 냥냥 메모리 (Memo Cats)

A cute and fun memory card matching game designed for elementary school children (ages 7-13).

## 🎮 Play Now

👉 **[Play Memo Cats](https://iwanjin.github.io/easygo-catmemories/)**

> 🌐 Direct access to the live game on GitHub Pages

## ✨ Features

- 🟢🟡🔴 **3 Difficulty Levels** - Easy (12 cards), Medium (16 cards), Hard (24 cards)
- 💾 **Auto-Save High Scores** - Your best scores are saved in browser storage
- 🎵 **Sound Effects** - Click feedback and celebration sounds (can be muted)
- 🎊 **Confetti Celebration** - Colorful falling confetti when you win!
- 📱 **Mobile-Responsive** - Works perfectly on phones, tablets, and desktops
- 🐱 **Cute Animal Theme** - Adorable emoji-based card designs

## 🕹️ How to Play

1. **Select a difficulty level** - Choose Easy, Medium, or Hard
2. **Click cards to flip them** - Reveal the cute animal emojis
3. **Find matching pairs** - Match two cards with the same animal
4. **Complete the board** - Keep playing until all pairs are matched
5. **Beat your high score** - Try to get the highest score possible!

### Scoring
- ✨ **Match**: +100 points
- ❌ **Mismatch**: -10 points (minimum 0)
- ⏱️ **Time Bonus**: Remaining time × 2 points when you win

## 🛠️ Tech Stack

- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Storage**: LocalStorage API (browser-based, no server needed)
- **Deployment**: GitHub Pages (free hosting)
- **No Dependencies**: Pure JavaScript, no frameworks or libraries

## 📁 Project Structure

```
web_game/
├── index.html              # Game HTML structure (Team B)
├── css/
│   └── style.css           # Game styling & animations (Team B)
├── js/
│   ├── game.js             # Game engine & logic (Team A)
│   ├── cards.js            # Card management (Team A)
│   ├── ui.js               # UI controller & screen management (Team B)
│   ├── sound.js            # Sound effects system (Team C)
│   ├── storage.js          # LocalStorage wrapper (Team C)
│   ├── difficulty.js       # Difficulty configuration (Team C)
│   └── confetti.js         # Celebration confetti effect (Team C)
├── assets/
│   └── sounds/             # Game sound effects (MP3 files)
├── plan/                   # Development planning documents
│   ├── 00-overview.md
│   ├── 01-team-a-core-logic.md
│   ├── 02-team-b-design.md
│   └── 03-team-c-features.md
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

## 🚀 Deployment Guide

### Deploy to GitHub Pages

1. **Create a new GitHub repository**
   - Go to https://github.com/new
   - Name it `web_game`
   - Make it public
   - Don't initialize with README (we have one)

2. **Push code to GitHub**
   ```bash
   cd /path/to/web_game
   git remote add origin https://github.com/YOUR_USERNAME/web_game.git
   git branch -M main
   git add .
   git commit -m "Initial commit: Memo Cats game"
   git push -u origin main
   ```

3. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings** tab
   - Scroll down to **Pages** section
   - Under "Source", select `main` branch and `/ (root)`
   - Click **Save**

4. **Wait and verify**
   - GitHub will build your site (takes ~1-2 minutes)
   - Visit `https://YOUR_USERNAME.github.io/web_game/`
   - Your game is live! 🎉

5. **Update README**
   - Replace `YOUR_USERNAME` with your actual GitHub username in the Play Now link
   - Commit and push the update

## 👥 Development Team

This project was developed using parallel team-based development:

- **Team A (Core Logic)**: Game engine, card logic, game flow
- **Team B (Design & UI)**: HTML structure, CSS styling, animations, UI management
- **Team C (Features & Deployment)**: Sound effects, high score saving, celebration effects, deployment

## 🎮 Game Rules

### Objective
Match all pairs of cards in the fewest moves and shortest time to achieve the highest score.

### Basic Flow
1. Cards start face-down and shuffled
2. Click two cards in sequence to flip them
3. If they match: ✨ Cards stay face-up, you gain 100 points
4. If they don't match: ❌ They flip back after 1 second, you lose 10 points
5. Win when all pairs are matched

### Difficulty Settings

| Level | Size | Cards | Pairs | Time Limit | Est. Duration |
|:---:|:---:|:---:|:---:|:---:|:---:|
| 🟢 Easy | 4×3 | 12 | 6 | 2 min | 1-2 min |
| 🟡 Medium | 4×4 | 16 | 8 | 3 min | 2-4 min |
| 🔴 Hard | 6×4 | 24 | 12 | 4 min | 4-7 min |

## 🔧 Development Tips

### Adding New Sounds

1. Download free sound effects from:
   - [Mixkit](https://mixkit.co/free-sound-effects/game)
   - [Freesound](https://freesound.org)
   - [Zapsplat](https://zapsplat.com)

2. Place MP3 files in `assets/sounds/` directory:
   - `flip.mp3` - Card flip sound
   - `match.mp3` - Successful match sound
   - `mismatch.mp3` - Failed match sound
   - `win.mp3` - Victory celebration sound

3. Keep file sizes under 100KB for fast loading

### Customizing Difficulty

Edit `js/difficulty.js`:
- Change emoji sets in the `animalEmojis` array
- Adjust `timeLimit` values (in seconds)
- Modify `rows` and `cols` for board dimensions

### Debugging

Press F12 to open Developer Tools and check the Console for any errors. All game state information is logged for debugging purposes.

## 📱 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 License

This project is open source and available for educational purposes.

## 🎯 Future Enhancements

- Two-player mode (take turns)
- Leaderboard (via server)
- More emoji themes (food, space, animals)
- Sound equalizer and music options
- Game statistics (best time, win streak)
- Dark mode

## 🙋 Support

If you encounter any issues:
1. Check the Browser Console (F12) for error messages
2. Clear browser cache and reload
3. Try a different browser
4. Create an issue on GitHub with details

---

**Made with ❤️ by Team A, B, and C**

Happy playing! 🐱🐶🐰🐻
