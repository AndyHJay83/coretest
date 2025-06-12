// lengthFeature.js
// This file exports the LENGTH feature UI and logic.

export function createLengthFeature() {
  const container = document.createElement('div');
  container.className = 'length-feature-container';
  container.innerHTML = `
    <div class="length-feature-grid">
      <button data-length="3">3</button>
      <button data-length="4">4</button>
      <button data-length="5">5</button>
      <button data-length="6">6</button>
      <button data-length="7">7</button>
      <button data-length="8">8</button>
      <button data-length="9">9</button>
      <button data-length="10">10</button>
      <button data-length="11">11</button>
      <button data-length="12">12</button>
      <button data-length="13+">13+</button>
      <button data-length="skip">SKIP</button>
    </div>
  `;

  // Attach click handlers to filter the word list by length
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const length = button.getAttribute('data-length');
      if (length === 'skip') {
        // Skip filtering
        container.dispatchEvent(new Event('completed'));
        return;
      }
      // Filter the word list by length
      const wordList = document.getElementById('wordList');
      const words = wordList.textContent.split('\n');
      const filteredWords = words.filter(word => {
        if (length === '13+') {
          return word.length >= 13;
        }
        return word.length === parseInt(length, 10);
      });
      wordList.textContent = filteredWords.join('\n');
      container.dispatchEvent(new Event('completed'));
    });
  });

  return container;
}

export const lengthFeatureCSS = `
  .length-feature-container {
    display: flex;
    justify-content: center;
    margin: 20px 0;
  }
  .length-feature-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 400px;
  }
  .length-feature-grid button {
    padding: 10px;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    font-size: 16px;
    min-width: 60px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .length-feature-grid button:hover {
    background: #f0f0f0;
  }
  .length-feature-grid button.selected {
    background: green;
    color: white;
  }
`; 