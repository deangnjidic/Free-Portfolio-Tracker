# 🤝 Contributing to Free Portfolio Tracker

First off, thank you for considering contributing to Free Portfolio Tracker! It's people like you that make this project better for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Enhancements](#suggesting-enhancements)

---

## 📜 Code of Conduct

This project and everyone participating in it is governed by basic principles of respect and professionalism. By participating, you are expected to uphold this code:

- **Be respectful** - Treat everyone with respect and consideration
- **Be collaborative** - Work together and help each other
- **Be inclusive** - Welcome newcomers and diverse perspectives
- **Be constructive** - Provide helpful feedback and solutions

---

## 🎯 How Can I Contribute?

### 🐛 Reporting Bugs

Before creating bug reports, please check the [existing issues](https://github.com/deangnjidic/Personal-Portfolio-Tracker/issues) to avoid duplicates.

**When creating a bug report, include:**
- Clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs. actual behavior
- Screenshots (if applicable)
- Browser and OS information
- Console errors (if any)

**Example:**
```markdown
**Bug:** Price refresh fails for crypto assets

**Steps to Reproduce:**
1. Add Bitcoin (BINANCE:BTCUSDT)
2. Click "Refresh Prices"
3. See error in console

**Expected:** Prices update successfully
**Actual:** Console shows "401 Unauthorized"

**Browser:** Chrome 120, Windows 11
**Console Error:** API error: 401
```

### 💡 Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- Use a clear, descriptive title
- Provide detailed description of the proposed feature
- Explain why this enhancement would be useful
- Include mockups or examples (if applicable)

### 🔧 Code Contributions

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Make your changes**
4. **Test thoroughly**
5. **Commit with clear messages** (`git commit -m 'Add AmazingFeature'`)
6. **Push to your fork** (`git push origin feature/AmazingFeature`)
7. **Open a Pull Request**

---

## 🛠️ Development Setup

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Text editor (VS Code, Sublime, etc.)
- Python 3 or Node.js (for local server)
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/deangnjidic/Personal-Portfolio-Tracker.git
   cd Personal-Portfolio-Tracker
   ```

2. **Create config.js**
   ```bash
   cp config.example.js config.js
   ```

3. **Add your API keys** (for testing)
   - Get free Finnhub key: https://finnhub.io/register
   - Get free Metals.dev key: https://metals.dev/
   - Update `config.js` with your keys

4. **Start local server**
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Or using Node.js
   npx http-server -p 8000
   ```

5. **Open in browser**
   - Navigate to `http://localhost:8000`

### Project Structure

```
Personal-Portfolio-Tracker/
├── index.html          # Landing page
├── app.html            # Main portfolio dashboard
├── guide.html          # User guide
├── privacy.html        # Privacy policy
├── history.html        # Portfolio history
├── import-csv.html     # CSV import utility
├── app.js              # Core application logic
├── history.js          # History page functionality
├── style.css           # All styling
├── config.example.js   # API key template
└── config.js           # Your API keys (gitignored)
```

---

## 🔀 Pull Request Process

1. **Update documentation** - Update README.md if you change functionality
2. **Follow coding standards** - See section below
3. **Test thoroughly** - Test in multiple browsers if possible
4. **Update CHANGELOG.md** - Add your changes under "Unreleased"
5. **Create detailed PR description**:
   - What changes were made
   - Why these changes are needed
   - How to test the changes
   - Screenshots (if UI changes)

### PR Review Criteria

- ✅ Code follows project standards
- ✅ No breaking changes (or clearly documented)
- ✅ Privacy-first principles maintained
- ✅ Works in major browsers
- ✅ No new dependencies (vanilla JS only)
- ✅ localStorage remains the only storage method
- ✅ API keys not committed to repo

---

## 📝 Coding Standards

### JavaScript

- **Vanilla JavaScript only** - No frameworks or libraries
- **ES6+ syntax** - Use modern JavaScript features
- **Clear variable names** - Descriptive, not abbreviated
- **Comments** - Explain "why", not "what"
- **Function size** - Keep functions small and focused
- **Error handling** - Use try-catch for async operations

**Example:**
```javascript
// Good ✅
async function fetchStockPrice(symbol) {
    try {
        const response = await fetch(`https://api.../quote?symbol=${symbol}`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Price fetch failed:', error);
        return null;
    }
}

// Bad ❌
async function fsp(s) {
    let r = await fetch(`https://api.../quote?symbol=${s}`);
    return await r.json();
}
```

### HTML

- **Semantic HTML** - Use appropriate tags (`<section>`, `<article>`, etc.)
- **Accessibility** - Include ARIA labels where needed
- **Indentation** - 4 spaces
- **Comments** - Section comments for major blocks

### CSS

- **Mobile-first** - Design for mobile, enhance for desktop
- **BEM-like naming** - Descriptive class names
- **CSS Grid/Flexbox** - Use modern layout techniques
- **No inline styles** - Keep styles in `style.css` (except rare exceptions)

### Security

- **XSS Prevention** - Always escape user input (use `escapeHtml()` function)
- **API keys** - Never commit `config.js`
- **Input validation** - Validate all user inputs
- **No eval()** - Never use eval or similar functions

---

## 🐞 Reporting Bugs

### Before Submitting

1. **Check existing issues** - May already be reported
2. **Try latest version** - Bug may be fixed
3. **Reproduce in clean state** - Clear localStorage and try again
4. **Check browser console** - Look for errors

### Bug Report Template

```markdown
## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. See error

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Screenshots
[If applicable]

## Environment
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Device: [e.g., Desktop]

## Console Errors
```
[Paste any console errors]
```

## Additional Context
[Any other relevant information]
```

---

## 💡 Suggesting Enhancements

### Enhancement Template

```markdown
## Feature Description
[Clear description of the proposed feature]

## Problem it Solves
[What problem does this address?]

## Proposed Solution
[How would it work?]

## Alternatives Considered
[Other approaches you thought about]

## Mockups/Examples
[If applicable, include visual examples]

## Implementation Notes
[Technical considerations, if any]
```

---

## 🏆 Recognition

Contributors will be:
- Listed in the README.md contributors section
- Credited in CHANGELOG.md for their contributions
- Appreciated forever! 🎉

---

## 📄 License

By contributing, you agree that your contributions will be licensed under the CC BY-NC-SA 4.0 License. This means:
- ✅ You retain copyright to your contributions
- ✅ Contributions can be used in this project
- ❌ Contributions cannot be used commercially without permission
- ✅ Derivative works must use the same license

---

## ❓ Questions?

- Open an issue for discussion
- Check existing issues for similar questions
- Review the [README.md](README.md) and [User Guide](guide.html)

---

## 🙏 Thank You!

Every contribution, no matter how small, helps make this project better. Whether it's:
- Fixing a typo
- Reporting a bug
- Suggesting a feature
- Writing documentation
- Contributing code

**You're awesome!** 🌟

---

**Happy Contributing!** 🚀
