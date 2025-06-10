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

    .length-inputs {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 15px;
    }

    .length-input {
        width: 60px;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        text-align: center;
    }

    .length-label {
        font-weight: bold;
        color: #333;
    }

    .length-error {
        color: #ff0000;
        font-size: 0.9em;
        margin-top: 5px;
        display: none;
    }
`;

// Function to create the length feature UI
export function createLengthFeature() {
    const featureDiv = document.createElement('div');
    featureDiv.className = 'length-feature';
    featureDiv.innerHTML = `
        <div class="length-inputs">
            <div>
                <label class="length-label">Min Length:</label>
                <input type="number" class="length-input" id="minLength" min="1" max="20" value="1">
            </div>
            <div>
                <label class="length-label">Max Length:</label>
                <input type="number" class="length-input" id="maxLength" min="1" max="20" value="20">
            </div>
        </div>
        <div class="length-error" id="lengthError"></div>
    `;

    // Add event listeners for the inputs
    const minLengthInput = featureDiv.querySelector('#minLength');
    const maxLengthInput = featureDiv.querySelector('#maxLength');
    const errorDiv = featureDiv.querySelector('#lengthError');

    function validateLengths() {
        const min = parseInt(minLengthInput.value);
        const max = parseInt(maxLengthInput.value);
        
        if (min > max) {
            errorDiv.textContent = 'Minimum length cannot be greater than maximum length';
            errorDiv.style.display = 'block';
            return false;
        }
        
        errorDiv.style.display = 'none';
        return true;
    }

    minLengthInput.addEventListener('change', validateLengths);
    maxLengthInput.addEventListener('change', validateLengths);

    // Function to filter words based on length
    function filterWordsByLength(words) {
        if (!validateLengths()) return words;
        
        const min = parseInt(minLengthInput.value);
        const max = parseInt(maxLengthInput.value);
        
        return words.filter(word => {
            const length = word.length;
            return length >= min && length <= max;
        });
    }

    // Return the feature object
    return {
        element: featureDiv,
        filterWords: filterWordsByLength,
        getSettings: () => ({
            minLength: parseInt(minLengthInput.value),
            maxLength: parseInt(maxLengthInput.value)
        }),
        setSettings: (settings) => {
            if (settings.minLength) minLengthInput.value = settings.minLength;
            if (settings.maxLength) maxLengthInput.value = settings.maxLength;
            validateLengths();
        }
    };
} 