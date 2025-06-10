// LENGTH Feature Module
// This module provides the LENGTH feature for filtering words by length in workflows.
// It does not modify any existing features or files.

// CSS styles for the length feature
export const lengthFeatureCSS = `
    .length-feature {
        padding: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .length-button-grid {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 20px 0;
    }

    .length-btn-row {
        display: flex;
        gap: 10px;
        justify-content: center;
    }

    .length-btn {
        padding: 12px 20px;
        font-size: 1.1em;
        border: 2px solid #1B5E20;
        border-radius: 8px;
        background: #fff;
        color: #1B5E20;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.2s, color 0.2s;
        outline: none;
    }

    .length-btn.selected,
    .length-btn:active {
        background: #1B5E20;
        color: #fff;
    }

    .length-btn:focus {
        box-shadow: 0 0 0 2px #4CAF50;
    }
`;

// Function to create the length feature UI
export function createLengthFeature({ onComplete, getCurrentWords }) {
    // Create the main container
    const div = document.createElement('div');
    div.id = 'lengthFeature';
    div.className = 'feature-section';

    // Title
    const title = document.createElement('h2');
    title.className = 'feature-title';
    title.textContent = 'LENGTH';
    div.appendChild(title);

    // Button grid
    const buttonGrid = document.createElement('div');
    buttonGrid.className = 'length-button-grid';
    div.appendChild(buttonGrid);

    // Button labels
    const buttonRows = [
        [3, 4, 5, 6],
        [7, 8, 9, 10],
        [11, 12, '13+', 'SKIP']
    ];

    // Helper to create a button
    function createButton(label) {
        const btn = document.createElement('button');
        btn.className = 'length-btn';
        btn.textContent = label;
        btn.setAttribute('type', 'button');
        btn.tabIndex = 0;
        return btn;
    }

    // Add buttons to grid
    buttonRows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'length-btn-row';
        row.forEach(label => {
            const btn = createButton(label);
            rowDiv.appendChild(btn);
        });
        buttonGrid.appendChild(rowDiv);
    });

    // Button click handler
    function handleButtonClick(e) {
        const btn = e.target.closest('.length-btn');
        if (!btn) return;
        
        // Visually highlight
        div.querySelectorAll('.length-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        
        // Filtering logic
        const label = btn.textContent;
        let filtered = getCurrentWords();
        
        if (label === 'SKIP') {
            // Do not filter, just proceed
            onComplete(filtered);
            return;
        } else if (label === '13+') {
            filtered = filtered.filter(word => word.length >= 13);
        } else {
            const len = parseInt(label, 10);
            filtered = filtered.filter(word => word.length === len);
        }
        
        onComplete(filtered);
    }

    // Attach event listeners
    div.addEventListener('click', handleButtonClick);
    div.addEventListener('touchstart', handleButtonClick, { passive: false });

    // Accessibility: allow keyboard selection
    div.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const btn = document.activeElement;
            if (btn && btn.classList.contains('length-btn')) {
                btn.click();
            }
        }
    });

    return div;
} 