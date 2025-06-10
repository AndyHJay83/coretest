// lengthFeature.js

// CSS for the LENGTH feature
export const lengthFeatureCSS = `
.length-feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 12px;
  margin: 20px 0;
}
.length-feature-btn {
  border: 2px solid #1B5E20;
  background: #fff;
  color: #1B5E20;
  font-size: 1.2em;
  font-weight: bold;
  border-radius: 8px;
  padding: 16px 0;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  outline: none;
  min-width: 60px;
  min-height: 44px;
  user-select: none;
}
.length-feature-btn.selected, .length-feature-btn:focus {
  background: #1B5E20;
  color: #fff;
  border-color: #1B5E20;
}
.length-feature-btn.skip {
  border: 2px solid #888;
  color: #888;
  background: #fff;
}
.length-feature-btn.skip.selected, .length-feature-btn.skip:focus {
  background: #888;
  color: #fff;
  border-color: #888;
}
`;

// Helper: filter words by length
function filterWordsByLength(words, length) {
  if (length === '13+') {
    return words.filter(word => word.length >= 13);
  }
  const n = parseInt(length, 10);
  return words.filter(word => word.length === n);
}

// createLengthFeature: returns a DOM element for the LENGTH feature
export function createLengthFeature({
  onComplete, // callback(filteredWords) when a button is selected
  getCurrentWords, // function to get the current filtered word list
  updateWordCount, // function to update the word count display
}) {
  // Create container
  const container = document.createElement('div');
  container.className = 'feature-section length-feature-section';

  // Title
  const title = document.createElement('h2');
  title.className = 'feature-title';
  title.textContent = 'LENGTH';
  container.appendChild(title);

  // Button grid
  const grid = document.createElement('div');
  grid.className = 'length-feature-grid';
  container.appendChild(grid);

  // Button labels
  const rows = [
    ['3', '4', '5', '6'],
    ['7', '8', '9', '10'],
    ['11', '12', '13+', 'SKIP']
  ];

  // Track selected button
  let selectedBtn = null;

  // Button creation helper
  function makeBtn(label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'length-feature-btn' + (label === 'SKIP' ? ' skip' : '');
    btn.textContent = label;
    btn.tabIndex = 0;
    btn.setAttribute('aria-label', label === '13+' ? '13 or more letters' : (label === 'SKIP' ? 'Skip length filter' : `${label} letters`));
    btn.addEventListener('click', () => {
      if (selectedBtn) selectedBtn.classList.remove('selected');
      btn.classList.add('selected');
      selectedBtn = btn;
      let filteredWords;
      if (label === 'SKIP') {
        filteredWords = getCurrentWords();
      } else {
        filteredWords = filterWordsByLength(getCurrentWords(), label);
      }
      if (updateWordCount) updateWordCount(filteredWords.length);
      if (onComplete) onComplete(filteredWords);
    });
    // Keyboard accessibility
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
    return btn;
  }

  // Add buttons to grid
  rows.forEach(row => {
    row.forEach(label => {
      grid.appendChild(makeBtn(label));
    });
  });

  return container;
} 