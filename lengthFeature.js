// LENGTH Feature Module
// This module provides the LENGTH feature for filtering words by length in workflows.
// It does not modify any existing features or files.

// CSS styles for the length feature
export const lengthFeatureCSS = `
    .length-feature {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
        padding: 20px;
        max-width: 600px;
        margin: 0 auto;
    }

    .length-button {
        padding: 15px;
        border: 2px solid #4CAF50;
        background: white;
        color: #4CAF50;
        font-size: 1.2em;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.3s ease;
        border-radius: 5px;
    }

    .length-button:hover {
        background: #4CAF50;
        color: white;
    }

    .length-button.selected {
        background: #4CAF50;
        color: white;
    }

    .length-button:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
    }
`;

// Function to create the length feature UI
export function createLengthFeature() {
    const container = document.createElement('div');
    container.className = 'length-feature';
    container.id = 'lengthFeature';

    // Create the grid of buttons
    const lengths = [
        ['3', '4', '5', '6'],
        ['7', '8', '9', '10'],
        ['11', '12', '13+', 'SKIP']
    ];

    lengths.forEach(row => {
        row.forEach(length => {
            const button = document.createElement('button');
            button.className = 'length-button';
            button.textContent = length;
            button.setAttribute('tabindex', '0');
            button.setAttribute('role', 'button');
            button.setAttribute('aria-label', `Filter ${length}-letter words`);

            // Add click handler
            button.addEventListener('click', () => handleLengthSelection(length, button));
            
            // Add keyboard support
            button.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleLengthSelection(length, button);
                }
            });

            container.appendChild(button);
        });
    });

    return container;
}

// Function to handle length selection
function handleLengthSelection(length, selectedButton) {
    // Remove selected class from all buttons
    document.querySelectorAll('.length-button').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Add selected class to clicked button
    selectedButton.classList.add('selected');

    // Get the current word list
    const currentWords = window.currentFilteredWords.length > 0 
        ? window.currentFilteredWords 
        : window.wordList;

    // Filter words based on length
    let filteredWords;
    if (length === 'SKIP') {
        filteredWords = currentWords;
    } else if (length === '13+') {
        filteredWords = currentWords.filter(word => word.length >= 13);
    } else {
        const targetLength = parseInt(length);
        filteredWords = currentWords.filter(word => word.length === targetLength);
    }

    // Update the word list and count
    window.currentFilteredWords = filteredWords;
    window.displayResults(filteredWords);
    window.updateWordCount(filteredWords.length);

    // Move to next feature after a short delay
    setTimeout(() => {
        window.showNextFeature();
    }, 500);
} 