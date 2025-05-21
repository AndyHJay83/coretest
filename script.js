let wordList = [];
let totalWords = 0;
let isNewMode = true;
let isColour3Mode = true;
let isVowelMode = true;
let isShapeMode = true;
let currentFilteredWords = [];
let currentPosition = 0;
let currentPosition2 = -1;
let currentVowelIndex = 0;
let uniqueVowels = [];
let currentFilteredWordsForVowels = [];
let originalFilteredWords = [];
let hasAdjacentConsonants = null;
let hasO = null;
let selectedCurvedLetter = null;
let eeeCompleted = false;
let lexiconCompleted = false;
let originalLexCompleted = false;
let originalLexPosition = -1;

// Workflow Management
let workflows = JSON.parse(localStorage.getItem('workflows')) || [];
let currentWorkflow = null;

// DOM Elements
const createWorkflowButton = document.getElementById('createWorkflowButton');
const cancelWorkflowButton = document.getElementById('cancelWorkflowButton');
const saveWorkflowButton = document.getElementById('saveWorkflowButton');
const backToHomeButton = document.getElementById('backToHomeButton');
const workflowName = document.getElementById('workflowName');
const selectedFeaturesList = document.getElementById('selectedFeaturesList');
const workflowSelect = document.getElementById('workflowSelect');
const performButton = document.getElementById('performButton');

// Show workflow creation page
function showWorkflowCreation() {
    document.getElementById('homepage').style.display = 'none';
    document.getElementById('workflowCreation').style.display = 'block';
    document.getElementById('workflowExecution').style.display = 'none';
}

// Hide workflow creation page
function hideWorkflowCreation() {
    document.getElementById('homepage').style.display = 'block';
    document.getElementById('workflowCreation').style.display = 'none';
    document.getElementById('workflowExecution').style.display = 'none';
}

// Initialize workflow creation
createWorkflowButton.addEventListener('click', showWorkflowCreation);
cancelWorkflowButton.addEventListener('click', hideWorkflowCreation);
saveWorkflowButton.addEventListener('click', saveWorkflow);

// Make feature buttons draggable
document.querySelectorAll('.feature-button').forEach(button => {
    button.setAttribute('draggable', 'true');
    
    button.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', button.dataset.feature);
        button.classList.add('dragging');
    });
    
    button.addEventListener('dragend', () => {
        button.classList.remove('dragging');
    });
});

// Add drag and drop event listeners
selectedFeaturesList.addEventListener('dragover', (e) => {
    e.preventDefault();
    selectedFeaturesList.classList.add('drag-over');
});

selectedFeaturesList.addEventListener('dragleave', () => {
    selectedFeaturesList.classList.remove('drag-over');
});

selectedFeaturesList.addEventListener('drop', (e) => {
    e.preventDefault();
    selectedFeaturesList.classList.remove('drag-over');
    
    const feature = e.dataTransfer.getData('text/plain');
    const featureButton = document.querySelector(`.feature-button[data-feature="${feature}"]`);
    const featureName = featureButton.textContent;
    
    // Check if feature is already selected
    if (!document.querySelector(`.selected-feature-item[data-feature="${feature}"]`)) {
        const featureItem = document.createElement('div');
        featureItem.className = 'selected-feature-item';
        featureItem.dataset.feature = feature;
        featureItem.innerHTML = `
            <span>${featureName}</span>
            <button class="remove-feature" data-feature="${feature}">&times;</button>
        `;
        
        // Add remove button functionality
        featureItem.querySelector('.remove-feature').addEventListener('click', function() {
            featureItem.remove();
        });
        
        selectedFeaturesList.appendChild(featureItem);
    }
});

// Save workflow function
function saveWorkflow() {
    const workflowNameValue = workflowName.value.trim();
    if (!workflowNameValue) {
        alert('Please enter a workflow name');
        return;
    }

    // Get selected features in order
    const selectedFeatures = Array.from(document.querySelectorAll('.selected-feature-item'))
        .map(item => item.dataset.feature);

    if (selectedFeatures.length === 0) {
        alert('Please select at least one feature');
        return;
    }

    // Create new workflow
    const newWorkflow = {
        name: workflowNameValue,
        steps: selectedFeatures
    };

    // Add to workflows array
    workflows.push(newWorkflow);

    // Update workflow select dropdown
    const option = document.createElement('option');
    option.value = workflowNameValue;
    option.textContent = workflowNameValue;
    workflowSelect.insertBefore(option, workflowSelect.lastElementChild);

    // Reset and hide workflow creation
    workflowName.value = '';
    selectedFeaturesList.innerHTML = '';
    hideWorkflowCreation();
}

// Event Listeners
saveWorkflowButton.addEventListener('click', saveWorkflow);
if (backToHomeButton) {
    backToHomeButton.addEventListener('click', hideWorkflowCreation);
}

// Initialize
initializeWorkflowDropdown();

// Perform workflow
performButton.addEventListener('click', async () => {
    const workflowSelect = document.getElementById('workflowSelect');
    const selectedWorkflow = workflowSelect.value;
    
    if (!selectedWorkflow) {
        alert('Please select a workflow first');
        return;
    }
    
    try {
        // Get the workflow steps - find by name instead of id
        const workflow = workflows.find(w => w.name === selectedWorkflow);
        if (!workflow) {
            throw new Error('Selected workflow not found');
        }
        
        // Show the workflow execution area
        document.getElementById('workflowExecution').style.display = 'block';
        
        // Execute the workflow
        await executeWorkflow(workflow.steps);
    } catch (error) {
        console.error('Error executing workflow:', error);
        alert('Error executing workflow: ' + error.message);
    }
});

// Execute workflow steps
async function executeWorkflow(steps) {
    try {
        // Load the wordlist first
        await loadWordList();
        let currentWordlist = [...wordList]; // Start with the full wordlist
        
        // Hide all features initially
        const allFeatures = [
            'originalLexFeature',
            'eeeFeature',
            'lexiconFeature',
            'consonantQuestion',
            'position1Feature',
            'vowelFeature',
            'colour3Feature',
            'shapeFeature',
            'oFeature',
            'curvedFeature'
        ];
        
        allFeatures.forEach(featureId => {
            document.getElementById(featureId).style.display = 'none';
        });

        // Execute each step in sequence
        for (const step of steps) {
            console.log('Executing step:', step);
            
            // Show the appropriate feature
            const featureElement = document.getElementById(`${step.feature}Feature`);
            if (featureElement) {
                featureElement.style.display = 'block';
                
                // Set up event listeners for this feature
                setupFeatureListeners(step.feature, (filteredWords) => {
                    currentWordlist = filteredWords;
                    displayResults(currentWordlist);
                });
            }
        }
    } catch (error) {
        console.error('Error executing workflow:', error);
        alert('Error executing workflow: ' + error.message);
    }
}

// Function to set up feature listeners
function setupFeatureListeners(feature, callback) {
    switch (feature) {
        case 'eee':
            document.getElementById('eeeButton').onclick = () => {
                const filteredWords = filterWordsByEee(currentFilteredWords, 'E');
                callback(filteredWords);
            };
            document.getElementById('eeeYesBtn').onclick = () => {
                const filteredWords = filterWordsByEee(currentFilteredWords, 'YES');
                callback(filteredWords);
            };
            document.getElementById('eeeNoBtn').onclick = () => {
                const filteredWords = filterWordsByEee(currentFilteredWords, 'NO');
                callback(filteredWords);
            };
            break;
            
        case 'o':
            document.getElementById('oYesBtn').onclick = () => {
                const filteredWords = filterWordsByO(currentFilteredWords, true);
                callback(filteredWords);
            };
            document.getElementById('oNoBtn').onclick = () => {
                const filteredWords = filterWordsByO(currentFilteredWords, false);
                callback(filteredWords);
            };
            document.getElementById('oSkipBtn').onclick = () => {
                callback(currentFilteredWords);
            };
            break;
            
        case 'curved':
            const curvedButtons = document.querySelectorAll('.curved-btn');
            curvedButtons.forEach(button => {
                button.onclick = () => {
                    const letter = button.textContent;
                    const filteredWords = filterWordsByCurvedPositions(currentFilteredWords, letter);
                    callback(filteredWords);
                };
            });
            document.getElementById('curvedSkipBtn').onclick = () => {
                callback(currentFilteredWords);
            };
            break;
            
        case 'colour3':
            document.getElementById('colour3YesBtn').onclick = () => {
                const filteredWords = filterWordsByColour3(currentFilteredWords);
                callback(filteredWords);
            };
            document.getElementById('colour3SkipButton').onclick = () => {
                callback(currentFilteredWords);
            };
            break;
            
        case 'lexicon':
            document.getElementById('lexiconButton').onclick = () => {
                const input = document.getElementById('lexiconInput').value.trim();
                if (input) {
                    const filteredWords = filterWordsByLexicon(currentFilteredWords, input);
                    callback(filteredWords);
                }
            };
            document.getElementById('lexiconSkipButton').onclick = () => {
                callback(currentFilteredWords);
            };
            break;
            
        case 'consonant':
            document.getElementById('consonantYesBtn').onclick = () => {
                const filteredWords = currentFilteredWords.filter(word => hasWordAdjacentConsonants(word));
                callback(filteredWords);
            };
            document.getElementById('consonantNoBtn').onclick = () => {
                const filteredWords = currentFilteredWords.filter(word => !hasWordAdjacentConsonants(word));
                callback(filteredWords);
            };
            break;
            
        case 'position1':
            document.getElementById('position1Button').onclick = () => {
                const input = document.getElementById('position1Input').value.trim();
                if (input) {
                    const consonants = getConsonantsInOrder(input);
                    if (consonants.length >= 2) {
                        const filteredWords = filterWordsByPosition1(currentFilteredWords, consonants);
                        callback(filteredWords);
                    }
                }
            };
            document.getElementById('position1DoneButton').onclick = () => {
                callback(currentFilteredWords);
            };
            break;
            
        case 'vowel':
            document.querySelector('#vowelFeature .yes-btn').onclick = () => {
                handleVowelSelection(true);
                callback(currentFilteredWordsForVowels);
            };
            document.querySelector('#vowelFeature .no-btn').onclick = () => {
                handleVowelSelection(false);
                callback(currentFilteredWordsForVowels);
            };
            break;
            
        case 'shape':
            const categoryButtons = document.querySelectorAll('.category-button');
            categoryButtons.forEach(button => {
                button.onclick = () => {
                    const category = button.textContent.split(' ')[0].toLowerCase();
                    const filteredWords = filterWordsByShape(currentFilteredWords, currentPosition, category);
                    callback(filteredWords);
                };
            });
            break;
    }
}

// Function to filter words by Position 1
function filterWordsByPosition1(words, consonants) {
    return words.filter(word => {
        const wordLower = word.toLowerCase();
        for (let i = 0; i < consonants.length - 1; i++) {
            const pair = consonants[i] + consonants[i + 1];
            if (wordLower.includes(pair)) {
                return true;
            }
        }
        return false;
    });
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    await loadWordList();
    initializeWorkflowDropdown();
    
    // Initialize perform button
    if (performButton) {
        performButton.addEventListener('click', async () => {
            const selectedWorkflow = workflowSelect.value;
            
            if (!selectedWorkflow) {
                alert('Please select a workflow first');
                return;
            }
            
            try {
                // Get the workflow steps - find by name instead of id
                const workflow = workflows.find(w => w.name === selectedWorkflow);
                if (!workflow) {
                    throw new Error('Selected workflow not found');
                }
                
                // Show the workflow execution area
                document.getElementById('workflowExecution').style.display = 'block';
                
                // Execute the workflow
                await executeWorkflow(workflow.steps);
            } catch (error) {
                console.error('Error executing workflow:', error);
                alert('Error executing workflow: ' + error.message);
            }
        });
    } else {
        console.error('Perform button not found!');
    }
    
    // Mark CURVED feature as completed by default
    document.getElementById('curvedFeature').classList.add('completed');
    
    // Hide all features initially except Consonants Together
    const allFeatures = [
        'originalLexFeature',
        'eeeFeature',
        'lexiconFeature',
        'position1Feature',
        'vowelFeature',
        'colour3Feature',
        'shapeFeature',
        'oFeature',
        'curvedFeature'
    ];
    
    allFeatures.forEach(featureId => {
        document.getElementById(featureId).style.display = 'none';
    });
    
    // Show Consonants Together first
    document.getElementById('consonantQuestion').style.display = 'block';
    
    // Reset states
    originalLexCompleted = false;
    eeeCompleted = false;
    lexiconCompleted = false;
    originalLexPosition = -1;
    hasAdjacentConsonants = null;
    
    // Consonant question buttons
    const consonantYesBtn = document.getElementById('consonantYesBtn');
    const consonantNoBtn = document.getElementById('consonantNoBtn');
    
    console.log('Setting up consonant question buttons');
    console.log('consonantYesBtn:', consonantYesBtn);
    console.log('consonantNoBtn:', consonantNoBtn);
    
    if (consonantYesBtn) {
        consonantYesBtn.addEventListener('click', () => {
            console.log('Consonant question: YES button clicked');
            console.log('Current word list length:', currentFilteredWords.length);
            hasAdjacentConsonants = true;
            
            // Filter to keep ONLY words that have adjacent consonants
            const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
            const filteredWords = currentFilteredWords.filter(word => {
                const wordLower = word.toLowerCase();
                for (let i = 0; i < wordLower.length - 1; i++) {
                    const currentChar = wordLower[i];
                    const nextChar = wordLower[i + 1];
                    if (!vowels.has(currentChar) && !vowels.has(nextChar)) {
                        console.log(`Keeping word "${word}" - has adjacent consonants "${currentChar}${nextChar}"`);
                        return true;
                    }
                }
                console.log(`Removing word "${word}" - no adjacent consonants`);
                return false;
            });
            
            console.log('Before filtering:', currentFilteredWords.length, 'words');
            currentFilteredWords = filteredWords;
            console.log('After filtering (keeping only words with adjacent consonants):', currentFilteredWords.length, 'words');
            
            // Update the display immediately
            displayResults(currentFilteredWords);
            
            // Hide consonant question and show Position 1
            document.getElementById('consonantQuestion').style.display = 'none';
            document.getElementById('position1Feature').style.display = 'block';
        });
    } else {
        console.error('Consonant YES button not found!');
    }

    if (consonantNoBtn) {
        consonantNoBtn.addEventListener('click', () => {
            console.log('Consonant question: NO button clicked');
            console.log('Current word list length:', currentFilteredWords.length);
            hasAdjacentConsonants = false;
            
            // Filter to keep ONLY words that do NOT have adjacent consonants
            const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
            const filteredWords = currentFilteredWords.filter(word => {
                const wordLower = word.toLowerCase();
                let hasAdjacent = false;
                
                for (let i = 0; i < wordLower.length - 1; i++) {
                    const currentChar = wordLower[i];
                    const nextChar = wordLower[i + 1];
                    if (!vowels.has(currentChar) && !vowels.has(nextChar)) {
                        hasAdjacent = true;
                        break;
                    }
                }
                
                if (!hasAdjacent) {
                    console.log(`Keeping word "${word}" - no adjacent consonants`);
                    return true;
                } else {
                    console.log(`Removing word "${word}" - has adjacent consonants`);
                    return false;
                }
            });
            
            console.log('Before filtering:', currentFilteredWords.length, 'words');
            currentFilteredWords = filteredWords;
            console.log('After filtering (keeping only words without adjacent consonants):', currentFilteredWords.length, 'words');
            
            // Update the display immediately
            displayResults(currentFilteredWords);
            
            // Hide consonant question and show Position 1
            document.getElementById('consonantQuestion').style.display = 'none';
            document.getElementById('position1Feature').style.display = 'block';
        });
    } else {
        console.error('Consonant NO button not found!');
    }

    // ORIGINAL LEX feature
    document.getElementById('originalLexButton').addEventListener('click', function() {
        const input = document.getElementById('originalLexInput').value.trim();
        if (input) {
            console.log('ORIGINAL LEX input:', input);
            const firstLetter = input[0].toUpperCase();
            console.log('Using first letter:', firstLetter, 'for position:', originalLexPosition + 1);
            
            const filteredWords = filterWordsByOriginalLex(currentFilteredWords, originalLexPosition, firstLetter);
            originalLexCompleted = true;
            displayResults(filteredWords);
            
            // Hide ORIGINAL LEX and show EEE?
            document.getElementById('originalLexFeature').style.display = 'none';
            document.getElementById('eeeFeature').style.display = 'block';
        }
    });
    
    document.getElementById('originalLexSkipButton').addEventListener('click', () => {
        console.log('ORIGINAL LEX SKIP selected');
        originalLexCompleted = true;
        // Hide ORIGINAL LEX and show EEE?
        document.getElementById('originalLexFeature').style.display = 'none';
        document.getElementById('eeeFeature').style.display = 'block';
    });
    
    document.getElementById('originalLexInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('originalLexButton').click();
        }
    });
    
    // EEE? feature buttons
    document.getElementById('eeeButton').addEventListener('click', () => {
        console.log('EEE? E button clicked');
        const filteredWords = filterWordsByEee(currentFilteredWords, 'E');
        eeeCompleted = true;
        displayResults(filteredWords);
        // Hide EEE? and show LEXICON
        document.getElementById('eeeFeature').style.display = 'none';
        document.getElementById('lexiconFeature').style.display = 'block';
    });
    
    document.getElementById('eeeYesBtn').addEventListener('click', () => {
        console.log('EEE? YES button clicked');
        const filteredWords = filterWordsByEee(currentFilteredWords, 'YES');
        eeeCompleted = true;
        displayResults(filteredWords);
        // Hide EEE? and show LEXICON
        document.getElementById('eeeFeature').style.display = 'none';
        document.getElementById('lexiconFeature').style.display = 'block';
    });
    
    document.getElementById('eeeNoBtn').addEventListener('click', () => {
        console.log('EEE? NO button clicked');
        const filteredWords = filterWordsByEee(currentFilteredWords, 'NO');
        eeeCompleted = true;
        displayResults(filteredWords);
        // Hide EEE? and show LEXICON
        document.getElementById('eeeFeature').style.display = 'none';
        document.getElementById('lexiconFeature').style.display = 'block';
    });
    
    // Share button listener
    document.getElementById('shareButton').addEventListener('click', exportWordlist);
    
    // COLOUR3 feature
    document.getElementById('colour3YesBtn').addEventListener('click', () => {
        console.log('COLOUR3 YES selected');
        const filteredWords = filterWordsByColour3(currentFilteredWords);
        document.getElementById('colour3Feature').classList.add('completed');
        displayResults(filteredWords);
        showNextFeature();
    });
    
    document.getElementById('colour3SkipButton').addEventListener('click', () => {
        console.log('COLOUR3 SKIP selected');
        document.getElementById('colour3Feature').classList.add('completed');
        showNextFeature();
    });

    // Position 1 feature
    document.getElementById('position1Button').addEventListener('click', () => {
        const input = document.getElementById('position1Input').value.trim();
        if (input) {
            const consonants = getConsonantsInOrder(input);
            console.log('Processing Position 1 input:', input);
            console.log('Found consonants:', consonants);
            
            if (consonants.length >= 2) {
                let filteredWords;
                
                if (hasAdjacentConsonants) {
                    // YES to Consonants Together: look for the specific consonant pairs together
                    filteredWords = currentFilteredWords.filter(word => {
                        const wordLower = word.toLowerCase();
                        
                        // Create all possible pairs of consonants from the input word
                        const consonantPairs = [];
                        for (let i = 0; i < consonants.length; i++) {
                            for (let j = i + 1; j < consonants.length; j++) {
                                consonantPairs.push([consonants[i], consonants[j]]);
                            }
                        }
                        
                        console.log(`Checking word "${wordLower}" for consonant pairs:`, consonantPairs);
                        
                        // Check if any of the consonant pairs appear together in the word
                        for (const [con1, con2] of consonantPairs) {
                            const pair1 = con1 + con2;
                            const pair2 = con2 + con1;
                            if (wordLower.includes(pair1) || wordLower.includes(pair2)) {
                                console.log(`Word "${wordLower}" accepted: found consonant pair "${pair1}" or "${pair2}"`);
                                return true;
                            }
                        }
                        
                        console.log(`Word "${wordLower}" rejected: no matching consonant pairs found`);
                        return false;
                    });
                } else {
                    // NO to Consonants Together: look for ANY pair of consonants in middle 5/6 characters
                    filteredWords = currentFilteredWords.filter(word => {
                        const wordLower = word.toLowerCase();
                        const wordLength = wordLower.length;
                        
                        // Determine middle section length (5 for odd, 6 for even)
                        const middleLength = wordLength % 2 === 0 ? 6 : 5;
                        const startPos = Math.floor((wordLength - middleLength) / 2);
                        const middleSection = wordLower.slice(startPos, startPos + middleLength);
                        
                        console.log(`Word "${wordLower}": middle section "${middleSection}"`);
                        
                        // Create all possible pairs of consonants from the input word
                        const consonantPairs = [];
                        for (let i = 0; i < consonants.length; i++) {
                            for (let j = i + 1; j < consonants.length; j++) {
                                consonantPairs.push([consonants[i], consonants[j]]);
                            }
                        }
                        
                        // Check if ANY pair of consonants appears in the middle section
                        for (const [con1, con2] of consonantPairs) {
                            if (middleSection.includes(con1) && middleSection.includes(con2)) {
                                console.log(`Word "${wordLower}" accepted: found consonants "${con1}" and "${con2}" in middle section`);
                                return true;
                            }
                        }
                        
                        console.log(`Word "${wordLower}" rejected: no consonant pairs found in middle section`);
                        return false;
                    });
                }
                
                console.log('Filtered words count:', filteredWords.length);
                
                // Update the current filtered words
                currentFilteredWords = filteredWords;
                
                // Mark Position 1 as completed and update the display
                document.getElementById('position1Feature').classList.add('completed');
                document.getElementById('position1Feature').style.display = 'none';
                displayResults(filteredWords);
                
                // Get vowels from the input word in left-to-right order
                const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
                const inputLower = input.toLowerCase();
                uniqueVowels = [];
                
                // Collect vowels in order of appearance
                for (let i = 0; i < inputLower.length; i++) {
                    const char = inputLower[i];
                    if (vowels.has(char)) {
                        uniqueVowels.push(char);
                    }
                }
                
                console.log('Input word:', input);
                console.log('Vowels collected in order:', uniqueVowels);
                
                // Initialize vowel processing with the filtered words
                currentFilteredWordsForVowels = [...filteredWords];
                originalFilteredWords = [...filteredWords];
                currentVowelIndex = 0;
                
                // Move to VOWEL feature
                console.log('Moving to VOWEL feature');
                const vowelFeature = document.getElementById('vowelFeature');
                vowelFeature.style.display = 'block';
                
                // Set up the vowel display
                const vowelLetter = vowelFeature.querySelector('.vowel-letter');
                if (uniqueVowels.length > 0) {
                    console.log('Setting first vowel letter to:', uniqueVowels[0].toUpperCase());
                    vowelLetter.textContent = uniqueVowels[0].toUpperCase();
                    vowelLetter.style.display = 'inline-block';
                }
            } else {
                console.log('Not enough consonants found in input');
            }
        } else {
            // If no input, just move to VOWEL feature
            console.log('No input provided, moving to VOWEL feature');
            document.getElementById('position1Feature').classList.add('completed');
            document.getElementById('position1Feature').style.display = 'none';
            
            // Move to VOWEL feature
            const vowelFeature = document.getElementById('vowelFeature');
            vowelFeature.style.display = 'block';
            
            // Initialize vowel processing with current words
            currentFilteredWordsForVowels = [...currentFilteredWords];
            originalFilteredWords = [...currentFilteredWords];
            currentVowelIndex = 0;
            
            // Get unique vowels from current word list
            const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
            uniqueVowels = Array.from(new Set(
                currentFilteredWords.join('').toLowerCase().split('')
                    .filter(char => vowels.has(char))
            ));
            
            // Set up the vowel display
            const vowelLetter = vowelFeature.querySelector('.vowel-letter');
            if (uniqueVowels.length > 0) {
                console.log('Setting first vowel letter to:', uniqueVowels[0].toUpperCase());
                vowelLetter.textContent = uniqueVowels[0].toUpperCase();
                vowelLetter.style.display = 'inline-block';
            }
        }
    });

    // Position 1 DONE button
    document.getElementById('position1DoneButton').addEventListener('click', () => {
        console.log('Position 1 DONE button clicked');
        // Mark Position 1 as completed
        document.getElementById('position1Feature').classList.add('completed');
        document.getElementById('position1Feature').style.display = 'none';
        
        // Move to VOWEL feature
        console.log('Moving to VOWEL feature');
        const vowelFeature = document.getElementById('vowelFeature');
        vowelFeature.style.display = 'block';
        
        // Initialize vowel processing with current words
        currentFilteredWordsForVowels = [...currentFilteredWords];
        originalFilteredWords = [...currentFilteredWords];
        currentVowelIndex = 0;
        
        // Get unique vowels from current word list
        const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
        uniqueVowels = Array.from(new Set(
            currentFilteredWords.join('').toLowerCase().split('')
                .filter(char => vowels.has(char))
        ));
        
        // Set up the vowel display
        const vowelLetter = vowelFeature.querySelector('.vowel-letter');
        if (uniqueVowels.length > 0) {
            console.log('Setting first vowel letter to:', uniqueVowels[0].toUpperCase());
            vowelLetter.textContent = uniqueVowels[0].toUpperCase();
            vowelLetter.style.display = 'inline-block';
        }
    });

    // Vowel feature buttons
    document.querySelector('#vowelFeature .yes-btn').addEventListener('click', () => {
        console.log('Vowel YES button clicked');
        handleVowelSelection(true);
    });
    
    document.querySelector('#vowelFeature .no-btn').addEventListener('click', () => {
        console.log('Vowel NO button clicked');
        handleVowelSelection(false);
    });

    // LEXICON feature
    document.getElementById('lexiconButton').addEventListener('click', () => {
        const input = document.getElementById('lexiconInput').value.trim();
        if (input) {
            console.log('LEXICON input:', input);
            const filteredWords = filterWordsByLexicon(currentFilteredWords, input);
            lexiconCompleted = true;
            displayResults(filteredWords);
            // Hide LEXICON and show next feature
            document.getElementById('lexiconFeature').style.display = 'none';
            showNextFeature();
        }
    });

    document.getElementById('lexiconSkipButton').addEventListener('click', () => {
        console.log('LEXICON SKIP selected');
        lexiconCompleted = true;
        // Hide LEXICON and show next feature
        document.getElementById('lexiconFeature').style.display = 'none';
        showNextFeature();
    });

    // Enter key handlers
    document.getElementById('position1Input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('position1Button').click();
        }
    });

    document.getElementById('lexiconInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('lexiconButton').click();
        }
    });

    // Reset button - full page refresh
    document.getElementById('resetButton').addEventListener('click', () => {
        window.location.reload();
    });
    
    // Settings button
    document.getElementById('settingsButton').addEventListener('click', () => {
        document.getElementById('settingsModal').style.display = 'block';
    });
    
    // Close settings
    document.querySelector('.close-button').addEventListener('click', () => {
        document.getElementById('settingsModal').style.display = 'none';
    });
    
    // Close settings when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('settingsModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };

    // O? feature buttons
    document.getElementById('oYesBtn').addEventListener('click', () => {
        console.log('O? YES selected');
        const filteredWords = filterWordsByO(currentFilteredWords, true);
        document.getElementById('oFeature').classList.add('completed');
        displayResults(filteredWords);
        // Hide O? and show LEXICON
        document.getElementById('oFeature').style.display = 'none';
        document.getElementById('lexiconFeature').style.display = 'block';
    });
    
    document.getElementById('oNoBtn').addEventListener('click', () => {
        console.log('O? NO selected');
        const filteredWords = filterWordsByO(currentFilteredWords, false);
        document.getElementById('oFeature').classList.add('completed');
        displayResults(filteredWords);
        // Hide O? and show LEXICON
        document.getElementById('oFeature').style.display = 'none';
        document.getElementById('lexiconFeature').style.display = 'block';
    });
    
    document.getElementById('oSkipBtn').addEventListener('click', () => {
        console.log('O? SKIP selected');
        document.getElementById('oFeature').classList.add('completed');
        // Hide O? and show LEXICON
        document.getElementById('oFeature').style.display = 'none';
        document.getElementById('lexiconFeature').style.display = 'block';
    });
});

// Function to check if a letter is curved
function isCurvedLetter(letter) {
    if (!letter) return false;
    letter = letter.toUpperCase();
    return letterShapes.curved.has(letter);
}

// Function to filter words by curved letter positions
function filterWordsByCurvedPositions(words, positions) {
    // Special case: if input is "0", filter for words with all straight letters in first 5 positions
    if (positions === "0") {
        return words.filter(word => {
            // Check first 5 positions (or word length if shorter)
            for (let i = 0; i < Math.min(5, word.length); i++) {
                if (isCurvedLetter(word[i])) {
                    return false; // Reject if any curved letter found
                }
            }
            return true; // Keep if all letters are straight
        });
    }

    // Convert positions string to array of numbers and validate
    const positionArray = positions.split('')
        .map(Number)
        .filter(pos => pos >= 1 && pos <= 5); // Only allow positions 1-5
    
    if (positionArray.length === 0) {
        console.log('No valid positions provided');
        return words;
    }
    
    return words.filter(word => {
        // Skip words shorter than the highest required position
        const maxPosition = Math.max(...positionArray);
        if (word.length < maxPosition) {
            return false;
        }
        
        // Check each position from 1 to 5
        for (let i = 0; i < 5; i++) {
            const pos = i + 1; // Convert to 1-based position
            const letter = word[i];
            
            // Skip if we've reached the end of the word
            if (!letter) {
                continue;
            }
            
            if (positionArray.includes(pos)) {
                // This position should have a curved letter
                if (!isCurvedLetter(letter)) {
                    return false;
                }
            } else {
                // This position should have a straight letter
                if (isCurvedLetter(letter)) {
                    return false;
                }
            }
        }
        
        return true;
    });
}

// Word categories mapping
const wordCategories = {
    // Business and commerce
    business: new Set(['BUSINESS', 'COMPANY', 'CORPORATION', 'ENTERPRISE', 'INDUSTRY', 'MARKET', 'TRADE', 'COMMERCE', 'OFFICE', 'STORE', 'SHOP']),
    
    // Technology and electronics
    technology: new Set(['COMPUTER', 'PHONE', 'CAMERA', 'RADIO', 'TELEVISION', 'LAPTOP', 'CHARGING', 'BATTERY', 'SCREEN', 'KEYBOARD', 'MOUSE', 'PRINTER', 'SCANNER', 'ROUTER', 'SERVER', 'NETWORK', 'WIFI', 'BLUETOOTH', 'USB', 'HDMI']),
    
    // Food and drink
    food: new Set(['PIZZA', 'PASTA', 'BURGER', 'SANDWICH', 'SALAD', 'SOUP', 'STEW', 'CAKE', 'BREAD', 'COFFEE', 'TEA', 'WINE', 'BEER', 'MEAT', 'FISH', 'CHICKEN', 'RICE', 'NOODLE', 'FRUIT', 'VEGETABLE']),
    
    // Elements and chemistry
    element: new Set(['CARBON', 'OXYGEN', 'NITROGEN', 'HYDROGEN', 'SILVER', 'GOLD', 'IRON', 'COPPER', 'ALUMINUM', 'CALCIUM', 'SODIUM', 'POTASSIUM', 'MAGNESIUM', 'CHLORINE', 'FLUORINE', 'BROMINE', 'IODINE']),
    
    // Transportation
    transport: new Set(['CARRIAGE', 'TRAIN', 'PLANE', 'BOAT', 'SHIP', 'TRUCK', 'BUS', 'TAXI', 'CAR', 'BIKE', 'MOTORCYCLE', 'HELICOPTER', 'SUBWAY', 'TRAM', 'FERRY', 'JET', 'ROCKET', 'SPACESHIP']),
    
    // Buildings and structures
    building: new Set(['HOUSE', 'BUILDING', 'TOWER', 'BRIDGE', 'TUNNEL', 'GATE', 'WALL', 'CASTLE', 'PALACE', 'TEMPLE', 'CHURCH', 'MOSQUE', 'SYNAGOGUE', 'STADIUM', 'ARENA', 'THEATER', 'CINEMA', 'MUSEUM', 'LIBRARY', 'SCHOOL', 'HOSPITAL', 'OFFICE', 'FACTORY', 'WAREHOUSE', 'STORE', 'SHOP', 'MARKET', 'MALL', 'PARK', 'GARDEN', 'PARK', 'PLAYGROUND', 'POOL', 'GARDEN', 'FARM', 'BARN', 'SHED', 'GARAGE', 'STABLE']),
    
    // Nature and environment
    nature: new Set(['RIVER', 'MOUNTAIN', 'FOREST', 'OCEAN', 'LAKE', 'STREAM', 'VALLEY', 'DESERT', 'JUNGLE', 'MEADOW', 'GRASSLAND', 'WETLAND', 'CAVE', 'VOLCANO', 'GLACIER', 'ISLAND', 'BEACH', 'COAST', 'CLIFF', 'CANYON']),
    
    // Animals
    animal: new Set(['LION', 'TIGER', 'ELEPHANT', 'GIRAFFE', 'MONKEY', 'DOLPHIN', 'WHALE', 'SHARK', 'EAGLE', 'HAWK', 'OWL', 'PENGUIN', 'KANGAROO', 'KOALA', 'PANDA', 'BEAR', 'WOLF', 'FOX', 'DEER', 'RABBIT', 'SQUIRREL', 'MOUSE', 'RAT', 'HAMSTER', 'GERBIL', 'GUINEA', 'PIG', 'FERRET', 'WEASEL', 'OTTER', 'BEAVER', 'RACCOON', 'SKUNK', 'BADGER', 'HEDGEHOG', 'PORCUPINE', 'SLOTH', 'ANTEATER', 'ARMADILLO', 'PLATYPUS', 'ECHIDNA', 'ANIMAL']),
    
    // Plants
    plant: new Set(['TREE', 'FLOWER', 'GRASS', 'BUSH', 'VINE', 'LEAF', 'ROSE', 'LILY', 'TULIP', 'DAISY', 'SUNFLOWER', 'PALM', 'PINE', 'OAK', 'MAPLE', 'BAMBOO', 'CACTUS', 'MUSHROOM', 'FERN', 'MOSS', 'HERB', 'SPICE', 'SEED', 'SPROUT', 'BUD', 'STEM', 'BRANCH', 'TRUNK', 'ROOT', 'BARK', 'THORN', 'PETAL', 'POLLEN', 'NECTAR', 'SAP', 'PLANT']),
    
    // Weather
    weather: new Set(['RAIN', 'STORM', 'CLOUD', 'WIND', 'SUN', 'SNOW', 'FROST', 'THUNDER', 'LIGHTNING', 'HAIL', 'SLEET', 'FOG', 'MIST', 'HUMIDITY', 'DROUGHT', 'FLOOD', 'TORNADO', 'HURRICANE', 'CYCLONE', 'BLIZZARD']),
    
    // Time
    time: new Set(['YEAR', 'MONTH', 'WEEK', 'DAY', 'HOUR', 'MINUTE', 'SECOND', 'CENTURY', 'DECADE', 'SEASON', 'SPRING', 'SUMMER', 'AUTUMN', 'WINTER', 'MORNING', 'EVENING', 'NIGHT', 'DAWN', 'DUSK', 'TIME', 'PERIOD', 'ERA', 'AGE', 'STAGE', 'PHASE', 'STEP', 'POINT', 'MOMENT', 'INSTANT', 'WHILE', 'DURATION', 'SPAN', 'INTERVAL', 'GAP', 'BREAK', 'PAUSE']),
    
    // Body parts
    body: new Set(['HEAD', 'HAND', 'FOOT', 'ARM', 'LEG', 'EYE', 'EAR', 'NOSE', 'MOUTH', 'FACE', 'HAIR', 'SKIN', 'BONE', 'MUSCLE', 'HEART', 'LUNG', 'LIVER', 'BRAIN', 'STOMACH', 'INTESTINE']),
    
    // Clothing
    clothing: new Set(['SHIRT', 'PANTS', 'DRESS', 'SKIRT', 'JACKET', 'COAT', 'HAT', 'SHOES', 'SOCKS', 'GLOVES', 'SCARF', 'TIE', 'BELT', 'WATCH', 'JEWELRY', 'NECKLACE', 'BRACELET', 'RING', 'EARRING']),
    
    // Tools
    tool: new Set(['HAMMER', 'SCREWDRIVER', 'WRENCH', 'PLIERS', 'DRILL', 'SAW', 'AXE', 'SHOVEL', 'RAKE', 'BROOM', 'MOP', 'BRUSH', 'KNIFE', 'FORK', 'SPOON', 'PLATE', 'BOWL', 'CUP', 'GLASS']),
    
    // Furniture
    furniture: new Set(['TABLE', 'CHAIR', 'SOFA', 'BED', 'DESK', 'SHELF', 'CABINET', 'WARDROBE', 'DRESSER', 'BOOKCASE', 'COUCH', 'OTTOMAN', 'STOOL', 'BENCH', 'MIRROR', 'LAMP', 'CLOCK', 'PICTURE']),
    
    // Music
    music: new Set(['PIANO', 'GUITAR', 'DRUM', 'VIOLIN', 'FLUTE', 'TRUMPET', 'SAXOPHONE', 'CLARINET', 'HARP', 'CELLO', 'BASS', 'ORGAN', 'ACCORDION', 'TAMBOURINE', 'CYMBAL', 'XYLOPHONE', 'HARMONICA', 'MUSIC', 'SONG', 'MELODY', 'HARMONY', 'RHYTHM', 'BEAT', 'TUNE', 'NOTE', 'CHORD', 'SCALE', 'INSTRUMENT']),
    
    // Materials and products
    material: new Set(['PAPER', 'PLASTIC', 'METAL', 'WOOD', 'GLASS', 'RUBBER', 'LEATHER', 'FABRIC', 'CLOTH', 'COTTON', 'SILK', 'WOOL', 'NYLON', 'POLYESTER', 'CELLOPHANE', 'CELLOTAPE', 'TAPE', 'FOIL', 'FILM', 'SHEET', 'ROLL', 'STRIP', 'BAND', 'CORD', 'ROPE', 'STRING', 'WIRE', 'CABLE', 'PIPE', 'TUBE', 'ROD', 'BEAM', 'PLANK', 'BOARD', 'TILE', 'BRICK', 'STONE', 'CONCRETE', 'CEMENT', 'PAINT', 'INK', 'DYE', 'PIGMENT', 'WAX', 'OIL', 'GREASE', 'GLUE', 'ADHESIVE', 'SEALANT', 'COATING', 'FINISH']),
    
    // Sports
    sport: new Set(['FOOTBALL', 'BASKETBALL', 'TENNIS', 'GOLF', 'SWIMMING', 'RUNNING', 'JUMPING', 'THROWING', 'CATCHING', 'KICKING', 'HITTING', 'SCORING', 'RACING', 'COMPETITION', 'TOURNAMENT', 'CHAMPIONSHIP']),
    
    // Colors
    color: new Set(['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'BLACK', 'WHITE', 'PINK', 'BROWN', 'GRAY', 'GOLD', 'SILVER', 'BRONZE', 'MAROON', 'NAVY', 'TEAL', 'TURQUOISE', 'INDIGO', 'VIOLET', 'COLOR', 'HUE', 'SHADE', 'TINT', 'TONE']),
    
    // Emotions
    emotion: new Set(['HAPPY', 'SAD', 'ANGRY', 'SCARED', 'EXCITED', 'WORRIED', 'CALM', 'NERVOUS', 'ANXIOUS', 'DEPRESSED', 'JOYFUL', 'PEACEFUL', 'FRUSTRATED', 'CONFUSED', 'SURPRISED', 'DISGUSTED', 'EMBARRASSED']),
    
    // Professions
    profession: new Set(['DOCTOR', 'TEACHER', 'LAWYER', 'ENGINEER', 'ARTIST', 'MUSICIAN', 'SCIENTIST', 'WRITER', 'ACTOR', 'DIRECTOR', 'CHEF', 'FARMER', 'DRIVER', 'PILOT', 'SOLDIER', 'POLICE', 'FIREFIGHTER']),
    
    // Places
    place: new Set(['CITY', 'TOWN', 'VILLAGE', 'COUNTRY', 'STATE', 'PROVINCE', 'REGION', 'CONTINENT', 'ISLAND', 'PENINSULA', 'BAY', 'GULF', 'STRAIT', 'CHANNEL', 'HARBOR', 'PORT', 'AIRPORT', 'STATION', 'TERMINAL', 'PARK', 'GARDEN', 'PLAYGROUND', 'FIELD', 'GROUND', 'AREA', 'ZONE', 'SPACE', 'PLACE', 'LOCATION', 'SITE', 'SPOT', 'POINT', 'CORNER', 'EDGE', 'SIDE', 'END', 'START', 'MIDDLE', 'CENTER']),
    
    // Education
    education: new Set(['SCHOOL', 'COLLEGE', 'UNIVERSITY', 'CLASS', 'COURSE', 'LESSON', 'LECTURE', 'SEMINAR', 'WORKSHOP', 'TRAINING', 'STUDY', 'LEARN', 'TEACH', 'EDUCATE', 'GRADUATE', 'DEGREE', 'DIPLOMA', 'CERTIFICATE']),
    
    // Communication
    communication: new Set(['LETTER', 'EMAIL', 'MESSAGE', 'TEXT', 'CALL', 'PHONE', 'VOICE', 'SPEAK', 'TALK', 'CHAT', 'CONVERSATION', 'DISCUSSION', 'MEETING', 'CONFERENCE', 'PRESENTATION', 'BROADCAST', 'TRANSMISSION']),
    
    // Money and finance
    finance: new Set(['MONEY', 'CASH', 'COIN', 'BANK', 'ACCOUNT', 'CREDIT', 'DEBIT', 'LOAN', 'MORTGAGE', 'INVESTMENT', 'STOCK', 'BOND', 'SHARE', 'DIVIDEND', 'INTEREST', 'TAX', 'INSURANCE', 'PENSION']),
    
    // Health and medicine
    health: new Set(['HEALTH', 'MEDICAL', 'DOCTOR', 'NURSE', 'PATIENT', 'HOSPITAL', 'CLINIC', 'PHARMACY', 'MEDICINE', 'DRUG', 'VACCINE', 'TREATMENT', 'THERAPY', 'SURGERY', 'RECOVERY', 'WELLNESS', 'FITNESS']),
    
    // Entertainment
    entertainment: new Set(['MOVIE', 'FILM', 'THEATER', 'CINEMA', 'SHOW', 'PLAY', 'MUSICAL', 'CONCERT', 'PERFORMANCE', 'GAME', 'SPORT', 'COMPETITION', 'FESTIVAL', 'CELEBRATION', 'PARTY', 'EVENT', 'EXHIBITION', 'ADVENTURE', 'PARK', 'PLAYGROUND', 'CARNIVAL', 'FAIR', 'CIRCUS', 'ZOO', 'AQUARIUM', 'MUSEUM', 'GALLERY', 'STUDIO', 'STAGE', 'ARENA', 'STADIUM']),
    
    // Science
    science: new Set(['SCIENCE', 'RESEARCH', 'EXPERIMENT', 'LABORATORY', 'OBSERVATION', 'THEORY', 'HYPOTHESIS', 'ANALYSIS', 'DATA', 'RESULT', 'DISCOVERY', 'INVENTION', 'INNOVATION', 'TECHNOLOGY', 'ENGINEERING', 'MATHEMATICS']),
    
    // Scientific instruments and devices
    instrument: new Set(['ACCELERATOR', 'ACCELEROMETER', 'THERMOMETER', 'BAROMETER', 'HYGROMETER', 'ANEMOMETER', 'SPECTROMETER', 'MICROSCOPE', 'TELESCOPE', 'OSCILLOSCOPE', 'VOLTMETER', 'AMMETER', 'OHMMETER', 'MULTIMETER', 'CALORIMETER', 'CHROMATOGRAPH', 'ELECTROMETER', 'GALVANOMETER', 'MANOMETER', 'PHOTOMETER', 'RADAR', 'SONAR', 'SEISMOMETER', 'GRAVIMETER', 'MAGNETOMETER', 'GYROSCOPE', 'COMPASS', 'PROTRACTOR', 'MICROMETER', 'CALIPER']),
    
    // Government
    government: new Set(['GOVERNMENT', 'POLITICS', 'POLICY', 'LAW', 'REGULATION', 'ADMINISTRATION', 'DEPARTMENT', 'AGENCY', 'COMMITTEE', 'COUNCIL', 'PARLIAMENT', 'CONGRESS', 'SENATE', 'ELECTION', 'VOTE', 'CITIZEN']),
    
    // Military
    military: new Set(['MILITARY', 'ARMY', 'NAVY', 'AIRFORCE', 'SOLDIER', 'OFFICER', 'COMMANDER', 'GENERAL', 'ADMIRAL', 'COLONEL', 'CAPTAIN', 'LIEUTENANT', 'SERGEANT', 'TROOP', 'BATTALION', 'REGIMENT', 'DIVISION']),
    
    // Religion
    religion: new Set(['RELIGION', 'FAITH', 'BELIEF', 'GOD', 'CHURCH', 'TEMPLE', 'MOSQUE', 'SYNAGOGUE', 'PRAYER', 'WORSHIP', 'SACRED', 'HOLY', 'DIVINE', 'SPIRITUAL', 'RELIGIOUS', 'THEOLOGICAL', 'MYSTICAL']),
    
    // Recreation and leisure
    recreation: new Set(['PARK', 'PLAYGROUND', 'GARDEN', 'POOL', 'BEACH', 'LAKE', 'RIVER', 'MOUNTAIN', 'TRAIL', 'PATH', 'FIELD', 'COURT', 'PITCH', 'GROUND', 'SPACE', 'AREA', 'ZONE', 'SITE', 'LOCATION', 'PLACE', 'SPOT', 'VENUE']),
    
    // Compound words
    compound: new Set(['ADVENTURE', 'PLAYGROUND', 'PARK', 'GARDEN', 'HOUSE', 'ROOM', 'PLACE', 'SPACE', 'TIME', 'WORK', 'LIFE', 'WORLD', 'LIGHT', 'SIDE', 'WAY', 'LINE', 'POINT', 'LEVEL', 'FORM', 'TYPE', 'STYLE', 'MODE', 'STATE', 'PHASE', 'STAGE', 'STEP', 'PART', 'PIECE', 'UNIT', 'ITEM', 'THING', 'OBJECT', 'ELEMENT', 'FACTOR', 'ASPECT', 'FEATURE', 'TRAIT', 'QUALITY', 'NATURE', 'CHARACTER', 'PERSON', 'PLACE', 'THING', 'BLACK', 'WHITE', 'RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'PINK', 'BROWN', 'GRAY']),
    
    // Activities and actions
    activity: new Set(['PLAY', 'GAME', 'SPORT', 'EXERCISE', 'WORK', 'STUDY', 'LEARN', 'TEACH', 'READ', 'WRITE', 'DRAW', 'PAINT', 'SING', 'DANCE', 'ACT', 'PERFORM', 'PRACTICE', 'TRAIN', 'COMPETE', 'RACE', 'RUN', 'JUMP', 'SWIM', 'CLIMB', 'WALK', 'RIDE', 'DRIVE', 'FLY', 'SAIL', 'TRAVEL', 'EXPLORE', 'ADVENTURE', 'DISCOVER', 'CREATE', 'BUILD', 'MAKE', 'DO']),
    
    // States and conditions
    state: new Set(['STATE', 'CONDITION', 'SITUATION', 'CIRCUMSTANCE', 'POSITION', 'PLACE', 'LEVEL', 'STAGE', 'PHASE', 'STEP', 'POINT', 'MOMENT', 'TIME', 'PERIOD', 'ERA', 'AGE', 'FORM', 'TYPE', 'KIND', 'SORT', 'NATURE', 'CHARACTER', 'QUALITY', 'TRAIT', 'FEATURE', 'ASPECT', 'FACTOR', 'ELEMENT', 'PART', 'PIECE', 'UNIT', 'ITEM', 'THING', 'OBJECT']),
    
    // Movement and motion
    movement: new Set(['MOVE', 'MOTION', 'MOVEMENT', 'FLOW', 'STREAM', 'CURRENT', 'DRIFT', 'FLOW', 'FLUX', 'FLOW', 'STREAM', 'CURRENT', 'DRIFT', 'FLOW', 'FLUX', 'FLOW', 'STREAM', 'CURRENT', 'DRIFT', 'FLOW', 'FLUX', 'FLOW', 'STREAM', 'CURRENT', 'DRIFT', 'FLOW', 'FLUX', 'FLOW', 'STREAM', 'CURRENT', 'DRIFT', 'FLOW', 'FLUX']),
    
    // Size and dimension
    size: new Set(['SIZE', 'DIMENSION', 'LENGTH', 'WIDTH', 'HEIGHT', 'DEPTH', 'THICKNESS', 'WEIGHT', 'MASS', 'VOLUME', 'AREA', 'SPACE', 'EXTENT', 'RANGE', 'SCOPE', 'SCALE', 'PROPORTION', 'RATIO', 'AMOUNT', 'QUANTITY', 'NUMBER', 'COUNT', 'TOTAL', 'SUM', 'AVERAGE', 'MEDIAN', 'MODE', 'RANGE', 'SPREAD', 'DISTRIBUTION']),
    
    // Quality and characteristic
    quality: new Set(['QUALITY', 'CHARACTERISTIC', 'TRAIT', 'FEATURE', 'ASPECT', 'FACTOR', 'ELEMENT', 'PART', 'PIECE', 'UNIT', 'ITEM', 'THING', 'OBJECT', 'NATURE', 'CHARACTER', 'TYPE', 'KIND', 'SORT', 'FORM', 'STYLE', 'MODE', 'WAY', 'MANNER', 'METHOD', 'APPROACH', 'TECHNIQUE', 'PROCESS', 'PROCEDURE', 'SYSTEM', 'STRUCTURE', 'PATTERN', 'DESIGN', 'PLAN', 'SCHEME', 'STRATEGY', 'TACTIC']),
    
    // Fruits and berries
    fruit: new Set(['APPLE', 'BANANA', 'ORANGE', 'LEMON', 'LIME', 'GRAPE', 'PEACH', 'PLUM', 'CHERRY', 'BERRY', 'BLACKBERRY', 'RASPBERRY', 'STRAWBERRY', 'BLUEBERRY', 'CRANBERRY', 'GOOSEBERRY', 'ELDERBERRY', 'MELON', 'WATERMELON', 'CANTALOUPE', 'HONEYDEW', 'PINEAPPLE', 'MANGO', 'PAPAYA', 'KIWI', 'FIG', 'DATE', 'PRUNE', 'RAISIN', 'CURRANT', 'FRUIT']),
    
    // Birds
    bird: new Set(['BIRD', 'EAGLE', 'HAWK', 'FALCON', 'OWL', 'VULTURE', 'BLACKBIRD', 'ROBIN', 'SPARROW', 'FINCH', 'CARDINAL', 'BLUEBIRD', 'THRUSH', 'WREN', 'WARBLER', 'SWALLOW', 'SWIFT', 'MARTIN', 'LARK', 'NIGHTINGALE', 'CUCKOO', 'WOODPECKER', 'DOVE', 'PIGEON', 'PARROT', 'MACAW', 'COCKATOO', 'BUDGIE', 'CANARY', 'CHICKEN', 'TURKEY', 'DUCK', 'GOOSE', 'SWAN', 'PELICAN', 'STORK', 'HERON', 'CRANE', 'FLAMINGO', 'PENGUIN', 'OSTRICH', 'EMU', 'KIWI']),
};

// Function to get word category
function getWordCategory(word) {
    const upperWord = word.toUpperCase();
    
    // Check each category
    for (const [category, words] of Object.entries(wordCategories)) {
        // Check if the word starts with any of the category words
        for (const categoryWord of words) {
            if (upperWord.startsWith(categoryWord)) {
                return category;
            }
        }
    }
    
    return null; // No category found
}

// Function to check if words are in the same family
function areWordsInSameFamily(word1, word2) {
    // Get the first 5 characters of each word
    const prefix1 = word1.slice(0, 5).toLowerCase();
    const prefix2 = word2.slice(0, 5).toLowerCase();
    
    // Words must share the first 5 characters exactly
    if (prefix1 !== prefix2) {
        return false;
    }
    
    // Get categories for both words
    const category1 = getWordCategory(word1);
    const category2 = getWordCategory(word2);
    
    // If either word is in a specific category (fruit, bird, etc.), they must match exactly
    const specificCategories = ['fruit', 'bird', 'animal', 'plant', 'music', 'material'];
    if (specificCategories.includes(category1) || specificCategories.includes(category2)) {
        return category1 === category2;
    }
    
    // For compound words, check if they share the same base word
    const baseWords = {
        'apple': ['pie', 'mac', 'sauce', 'juice', 'cider'],
        'black': ['berry', 'bird', 'board', 'smith', 'mail'],
        'blue': ['berry', 'bird', 'print', 'jeans'],
        'red': ['berry', 'bird', 'wood', 'wine'],
        'white': ['board', 'wash', 'wine', 'fish'],
        'green': ['house', 'wood', 'tea', 'bean'],
        'yellow': ['stone', 'wood', 'cake'],
        'brown': ['stone', 'sugar', 'rice'],
        'gray': ['stone', 'matter', 'area'],
        'pink': ['slip', 'eye', 'lady'],
        'purple': ['heart', 'haze', 'rain'],
        'orange': ['juice', 'peel', 'tree'],
        'gold': ['fish', 'mine', 'rush'],
        'silver': ['fish', 'mine', 'ware'],
        'bronze': ['age', 'medal', 'statue']
    };
    
    // Check if both words are compound words with the same base
    for (const [base, suffixes] of Object.entries(baseWords)) {
        if (word1.toLowerCase().startsWith(base) && word2.toLowerCase().startsWith(base)) {
            // Check if both words end with one of the known suffixes
            const suffix1 = word1.toLowerCase().slice(base.length);
            const suffix2 = word2.toLowerCase().slice(base.length);
            if (suffixes.includes(suffix1) && suffixes.includes(suffix2)) {
                return true;
            }
        }
    }
    
    // If no specific category match and no compound word match, use the original category check
    return category1 !== null && category1 === category2;
}

// Function to group similar words
function groupSimilarWords(words) {
    const groups = new Map(); // Maps representative word to its group
    const processedWords = new Set();
    
    // Sort words by length (shorter first) and then alphabetically
    const sortedWords = [...words].sort((a, b) => {
        if (a.length === b.length) {
            return a.localeCompare(b);
        }
        return a.length - b.length;
    });
    
    // First pass: identify word families
    for (let i = 0; i < sortedWords.length; i++) {
        const word = sortedWords[i];
        
        // Skip if already processed
        if (processedWords.has(word)) continue;
        
        // Start a new group with this word
        const group = [word];
        processedWords.add(word);
        
        // Look for related words
        for (let j = i + 1; j < sortedWords.length; j++) {
            const otherWord = sortedWords[j];
            
            // Skip if already processed
            if (processedWords.has(otherWord)) continue;
            
            // Check if words are in the same family
            if (areWordsInSameFamily(word, otherWord)) {
                group.push(otherWord);
                processedWords.add(otherWord);
            }
        }
        
        // Only create a group if we found related words
        if (group.length > 1) {
            // Sort the group by length and then alphabetically
            group.sort((a, b) => {
                if (a.length === b.length) {
                    return a.localeCompare(b);
                }
                return a.length - b.length;
            });
            
            // Use the shortest word as the representative
            const representative = group[0];
            groups.set(representative, group);
        }
    }
    
    return {
        representativeWords: groups,
        displayWords: Array.from(groups.keys())
    };
}

// Function to create and show overlay
function showWordGroupOverlay(words) {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'word-group-overlay';
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'word-group-content';
    
    // Add words to content
    words.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-group-item';
        wordElement.textContent = word;
        content.appendChild(wordElement);
    });
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'word-group-close';
    closeButton.textContent = '×';
    closeButton.onclick = () => {
        document.body.removeChild(overlay);
    };
    
    // Assemble overlay
    content.appendChild(closeButton);
    overlay.appendChild(content);
    
    // Add click handler to close when clicking outside content
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    };
    
    // Add to document
    document.body.appendChild(overlay);
}

// Handle workflow creation
document.getElementById('createWorkflowButton').addEventListener('click', () => {
    document.getElementById('homepage').style.display = 'none';
    document.getElementById('workflowCreation').style.display = 'block';
});

// Handle workflow saving
document.getElementById('saveWorkflowButton').addEventListener('click', () => {
    const workflowName = document.getElementById('workflowName').value.trim();
    const selectedFeatures = Array.from(document.querySelectorAll('.feature-checkbox:checked'))
        .map(checkbox => checkbox.value);
    
    if (!workflowName) {
        alert('Please enter a workflow name');
        return;
    }
    
    if (selectedFeatures.length === 0) {
        alert('Please select at least one feature');
        return;
    }
    
    // Create new workflow
    const newWorkflow = {
        id: 'workflow_' + Date.now(),
        name: workflowName,
        steps: selectedFeatures.map(feature => ({ feature }))
    };
    
    // Add to workflows array
    workflows.push(newWorkflow);
    
    // Update workflow select
    const workflowSelect = document.getElementById('workflowSelect');
    const option = document.createElement('option');
    option.value = newWorkflow.name; // Use name as value instead of id
    option.textContent = newWorkflow.name;
    workflowSelect.appendChild(option);
    
    // Return to homepage
    document.getElementById('workflowCreation').style.display = 'none';
    document.getElementById('homepage').style.display = 'block';
    
    // Clear form
    document.getElementById('workflowName').value = '';
    document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
});

// Handle cancel workflow creation
document.getElementById('cancelWorkflowButton').addEventListener('click', () => {
    document.getElementById('workflowCreation').style.display = 'none';
    document.getElementById('homepage').style.display = 'block';
    
    // Clear form
    document.getElementById('workflowName').value = '';
    document.querySelectorAll('.feature-checkbox').forEach(checkbox => {
        checkbox.checked = false;
    });
});

// Handle workflow selection change
workflowSelect.addEventListener('change', function() {
    if (this.value === 'create-new') {
        showWorkflowCreation();
    }
});

// Function to load word list
async function loadWordList() {
    try {
        const response = await fetch('wordlist.txt');
        if (!response.ok) {
            throw new Error('Failed to load wordlist');
        }
        const text = await response.text();
        wordList = text.split('\n').filter(word => word.trim());
        currentFilteredWords = [...wordList];
        currentWordlistForVowels = [...wordList];
        console.log('Wordlist loaded successfully:', wordList.length, 'words');
        return wordList;
    } catch (error) {
        console.error('Error loading wordlist:', error);
        throw error;
    }
}

// Function to execute workflow
async function executeWorkflow(steps) {
    try {
        // Load the wordlist
        await loadWordList();
        
        // Execute each step in the workflow
        for (const step of steps) {
            // Show the appropriate feature based on the step
            const featureElement = document.getElementById(step + 'Feature');
            if (featureElement) {
                featureElement.style.display = 'block';
            }
            
            // Wait for user interaction
            await new Promise(resolve => {
                const handleFeatureComplete = () => {
                    featureElement.classList.add('completed');
                    resolve();
                };
                
                // Add event listener for feature completion
                featureElement.addEventListener('completed', handleFeatureComplete);
            });
        }
        
        // Show results
        displayResults(currentFilteredWords);
    } catch (error) {
        console.error('Error executing workflow:', error);
        throw error;
    }
}

// Function to display results
function displayResults(words) {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (words.length === 0) {
        resultsContainer.innerHTML = '<p>No words match the current criteria.</p>';
        return;
    }
    
    const wordList = document.createElement('ul');
    wordList.className = 'word-list';
    
    words.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        wordList.appendChild(li);
    });
    
    resultsContainer.appendChild(wordList);
}

// Function to handle vowel selection
function handleVowelSelection(includeVowel) {
    const currentVowel = uniqueVowels[currentVowelIndex];
    console.log('Handling vowel selection:', currentVowel, 'Include:', includeVowel);
    
    if (includeVowel) {
        currentFilteredWordsForVowels = currentFilteredWordsForVowels.filter(word => 
            word.toLowerCase().includes(currentVowel)
        );
    } else {
        currentFilteredWordsForVowels = currentFilteredWordsForVowels.filter(word => 
            !word.toLowerCase().includes(currentVowel)
        );
    }
    
    // Remove the current vowel from uniqueVowels array
    uniqueVowels = uniqueVowels.filter((v, index) => index !== currentVowelIndex);
    
    // Update the display with the filtered words
    displayResults(currentFilteredWordsForVowels);
    
    // If we still have vowels to process, show the next one
    if (uniqueVowels.length > 0) {
        const vowelFeature = document.getElementById('vowelFeature');
        const vowelLetter = vowelFeature.querySelector('.vowel-letter');
        vowelLetter.textContent = uniqueVowels[0].toUpperCase();
        vowelLetter.style.display = 'inline-block';
    } else {
        // No more vowels to process, mark as completed
        document.getElementById('vowelFeature').classList.add('completed');
        // Update currentFilteredWords with the vowel-filtered results
        currentFilteredWords = [...currentFilteredWordsForVowels];
        
        // Hide vowel feature and show next feature
        document.getElementById('vowelFeature').style.display = 'none';
        showNextFeature();
    }
}

// Function to filter words by O? feature
function filterWordsByO(words, includeO) {
    console.log('Filtering words by O? mode:', includeO ? 'YES' : 'NO');
    
    const filteredWords = words.filter(word => {
        const hasO = word.toLowerCase().includes('o');
        return includeO ? hasO : !hasO;
    });
    
    return filteredWords;
}

// Function to filter words by COLOUR3
function filterWordsByColour3(words) {
    const colour3Letters = new Set(['A', 'B', 'C', 'E', 'G', 'I', 'L', 'N', 'M', 'O', 'P', 'R', 'S', 'T', 'V', 'W', 'Y']);
    
    const filteredWords = words.filter(word => {
        // Check only position 5 (0-based index 4)
        const pos5 = word.length > 4 ? word[4].toUpperCase() : null;
        return pos5 && colour3Letters.has(pos5);
    });
    
    return filteredWords;
}

// Function to show next feature
function showNextFeature() {
    // First hide all features
    const allFeatures = [
        'originalLexFeature',
        'eeeFeature',
        'lexiconFeature',
        'consonantQuestion',
        'position1Feature',
        'vowelFeature',
        'colour3Feature',
        'shapeFeature',
        'oFeature',
        'curvedFeature'
    ];
    
    allFeatures.forEach(featureId => {
        document.getElementById(featureId).style.display = 'none';
    });
    
    // Then show the appropriate feature based on the current state
    if (hasAdjacentConsonants === null) {
        document.getElementById('consonantQuestion').style.display = 'block';
    }
    else if (!document.getElementById('position1Feature').classList.contains('completed')) {
        document.getElementById('position1Feature').style.display = 'block';
    }
    else if (isVowelMode && !document.getElementById('vowelFeature').classList.contains('completed')) {
        document.getElementById('vowelFeature').style.display = 'block';
    }
    else if (!document.getElementById('oFeature').classList.contains('completed')) {
        document.getElementById('oFeature').style.display = 'block';
    }
    else if (!lexiconCompleted) {
        document.getElementById('lexiconFeature').style.display = 'block';
    }
    else if (!originalLexCompleted) {
        document.getElementById('originalLexFeature').style.display = 'block';
    }
    else if (!eeeCompleted) {
        document.getElementById('eeeFeature').style.display = 'block';
    }
    else if (isColour3Mode && !document.getElementById('colour3Feature').classList.contains('completed')) {
        document.getElementById('colour3Feature').style.display = 'block';
    }
    else if (isShapeMode && !document.getElementById('shapeFeature').classList.contains('completed')) {
        document.getElementById('shapeFeature').style.display = 'block';
    }
    else if (!document.getElementById('curvedFeature').classList.contains('completed')) {
        document.getElementById('curvedFeature').style.display = 'block';
    }
    else {
        expandWordList();
    }
}

// Function to expand word list
function expandWordList() {
    const wordListContainer = document.getElementById('wordListContainer');
    wordListContainer.classList.add('expanded');
}

// Function to reset the app
function resetApp() {
    // Reset all variables
    currentFilteredWords = [...originalFilteredWords];
    currentVowelIndex = 0;
    uniqueVowels = [];
    hasAdjacentConsonants = null;
    selectedCurvedLetter = null;
    hasO = null;
    currentFilteredWordsForVowels = [];
    
    // Clear all results and show full wordlist
    displayResults(originalFilteredWords);
    
    // Reset all features
    const features = [
        'consonantQuestion',
        'position1Feature',
        'vowelFeature',
        'colour3Feature',
        'shapeFeature',
        'oFeature',
        'curvedFeature'
    ];
    
    features.forEach(featureId => {
        const feature = document.getElementById(featureId);
        if (feature) {
            feature.classList.remove('completed');
            feature.style.display = 'none';
        }
    });
    
    // Reset all input fields
    document.getElementById('position1Input').value = '';
    
    // Show the first feature (consonant question)
    document.getElementById('consonantQuestion').style.display = 'block';
}

// Function to check if a word has any adjacent consonants
function hasWordAdjacentConsonants(word) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const wordLower = word.toLowerCase();
    
    for (let i = 0; i < wordLower.length - 1; i++) {
        const currentChar = wordLower[i];
        const nextChar = wordLower[i + 1];
        
        // Check if both current and next characters are consonants
        if (!vowels.has(currentChar) && !vowels.has(nextChar)) {
            return true;
        }
    }
    return false;
}

// Letter shape categories with exact categorization
const letterShapes = {
    straight: new Set(['A', 'E', 'F', 'H', 'I', 'K', 'L', 'M', 'N', 'T', 'V', 'W', 'X', 'Y', 'Z']),
    curved: new Set(['B', 'C', 'D', 'G', 'J', 'O', 'P', 'Q', 'R', 'S', 'U'])
};

// Function to get letter shape
function getLetterShape(letter) {
    letter = letter.toUpperCase();
    if (letterShapes.straight.has(letter)) return 'straight';
    if (letterShapes.curved.has(letter)) return 'curved';
    return null;
}

// Function to filter words by shape category
function filterWordsByShape(words, position, category) {
    return words.filter(word => {
        if (word.length <= position) return false;
        const letter = word[position];
        return getLetterShape(letter) === category;
    });
}

// Function to update shape display
function updateShapeDisplay(words) {
    const shapeFeature = document.getElementById('shapeFeature');
    const shapeDisplay = shapeFeature.querySelector('.shape-display');
    
    if (!isShapeMode || words.length === 0) {
        shapeFeature.style.display = 'none';
        return;
    }
    
    // Get the length of the shortest word to avoid out-of-bounds
    const shortestLength = Math.min(...words.map(word => word.length));
    
    // Analyze all positions in the words
    const startPos = 0;
    const endPos = shortestLength;
    
    const position = findLeastVariancePosition(words, startPos, endPos);
    
    if (position === -1) {
        shapeFeature.style.display = 'none';
        return;
    }
    
    currentPosition = position;
    const analysis = analyzePositionShapes(words, position);
    const shapes = analysis.shapes;
    
    const positionDisplay = shapeDisplay.querySelector('.position-display');
    positionDisplay.textContent = `Position ${position + 1}`;
    
    const categoryButtons = shapeDisplay.querySelector('.category-buttons');
    categoryButtons.innerHTML = '';
    
    Object.entries(shapes).forEach(([category, letters]) => {
        if (letters.size > 0) {
            const button = document.createElement('button');
            button.className = 'category-button';
            const percentage = Math.round(analysis.distribution[category] * 100);
            button.textContent = `${category.toUpperCase()} (${percentage}%)`;
            button.addEventListener('click', () => {
                const filteredWords = filterWordsByShape(words, position, category);
                displayResults(filteredWords);
                expandWordList();
            });
            categoryButtons.appendChild(button);
        }
    });
    
    shapeFeature.style.display = 'block';
}

// Function to analyze position shapes
function analyzePositionShapes(words, position) {
    const shapes = {
        straight: new Set(),
        curved: new Set()
    };
    
    let totalLetters = 0;
    
    words.forEach(word => {
        if (word.length > position) {
            const letter = word[position];
            const shape = getLetterShape(letter);
            if (shape) {
                shapes[shape].add(letter);
                totalLetters++;
            }
        }
    });
    
    const distribution = {
        straight: shapes.straight.size / totalLetters,
        curved: shapes.curved.size / totalLetters
    };
    
    return {
        shapes,
        distribution,
        totalLetters
    };
}

// Function to find position with least variance
function findLeastVariancePosition(words, startPos, endPos) {
    let maxVariance = -1;
    let result = -1;
    
    for (let pos = startPos; pos < endPos; pos++) {
        const analysis = analyzePositionShapes(words, pos);
        
        // Skip if we don't have at least one letter of each shape
        if (analysis.shapes.straight.size === 0 || analysis.shapes.curved.size === 0) {
            continue;
        }
        
        // Calculate variance between the two distributions
        const variance = Math.abs(analysis.distribution.straight - analysis.distribution.curved);
        
        if (variance > maxVariance) {
            maxVariance = variance;
            result = pos;
        }
    }
    
    return result;
}

// Function to find position with most variance
function findPositionWithMostVariance(words) {
    // Initialize array to store unique letters for each position
    const positionLetters = Array(5).fill().map(() => new Set());
    
    // Collect unique letters for each position
    words.forEach(word => {
        for (let i = 0; i < Math.min(5, word.length); i++) {
            positionLetters[i].add(word[i].toUpperCase());
        }
    });
    
    // Find position with most unique letters
    let maxVariance = -1;
    let result = -1;
    let resultLetters = [];
    
    positionLetters.forEach((letters, index) => {
        if (letters.size > maxVariance) {
            maxVariance = letters.size;
            result = index;
            resultLetters = Array.from(letters).sort();
        }
    });
    
    return {
        position: result,
        letters: resultLetters
    };
}

// Function to filter words by original lex
function filterWordsByOriginalLex(words, position, letter) {
    return words.filter(word => {
        if (word.length <= position) return false;
        return word[position].toUpperCase() === letter.toUpperCase();
    });
}

// Function to filter words by EEE? feature
function filterWordsByEee(words, mode) {
    return words.filter(word => {
        if (word.length < 2) return false;
        
        const secondChar = word[1].toUpperCase();
        
        switch(mode) {
            case 'E':
                return secondChar === 'E';
                
            case 'YES':
                const yesLetters = new Set(['B', 'C', 'D', 'G', 'P', 'T', 'V', 'Z']);
                return yesLetters.has(secondChar);
                
            case 'NO':
                const noLetters = new Set(['B', 'C', 'D', 'G', 'P', 'T', 'V', 'Z']);
                return !noLetters.has(secondChar);
        }
    });
}

// Function to filter words by LEXICON feature
function filterWordsByLexicon(words, positions) {
    const curvedLetters = new Set(['B', 'C', 'D', 'G', 'J', 'O', 'P', 'Q', 'R', 'S', 'U']);
    
    // Special case: if input is "0", filter for words with all straight letters in first 5 positions
    if (positions === "0") {
        return words.filter(word => {
            // Check first 5 positions (or word length if shorter)
            for (let i = 0; i < Math.min(5, word.length); i++) {
                if (curvedLetters.has(word[i].toUpperCase())) {
                    return false;
                }
            }
            return true;
        });
    }
    
    // Convert positions string to array of numbers
    const positionArray = positions.split('').map(Number);
    
    return words.filter(word => {
        // Skip words shorter than 5 characters
        if (word.length < 5) return false;
        
        // Check each position from 1 to 5
        for (let i = 0; i < 5; i++) {
            const pos = i + 1; // Convert to 1-based position
            const letter = word[i].toUpperCase();
            const isCurved = curvedLetters.has(letter);
            
            if (positionArray.includes(pos)) {
                // This position should have a curved letter
                if (!isCurved) return false;
            } else {
                // This position should have a straight letter
                if (isCurved) return false;
            }
        }
        
        return true;
    });
}

// Function to get consonants in order
function getConsonantsInOrder(str) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const consonants = [];
    const word = str.toLowerCase();
    
    for (let i = 0; i < word.length; i++) {
        if (!vowels.has(word[i])) {
            consonants.push(word[i]);
        }
    }
    
    return consonants;
}

// Function to get unique vowels
function getUniqueVowels(str) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const uniqueVowels = new Set();
    str.toLowerCase().split('').forEach(char => {
        if (vowels.has(char)) {
            uniqueVowels.add(char);
        }
    });
    return Array.from(uniqueVowels);
}

// Function to find least common vowel
function findLeastCommonVowel(words, vowels) {
    const vowelCounts = {};
    vowels.forEach(vowel => {
        vowelCounts[vowel] = 0;
    });

    words.forEach(word => {
        const wordLower = word.toLowerCase();
        vowels.forEach(vowel => {
            if (wordLower.includes(vowel)) {
                vowelCounts[vowel]++;
            }
        });
    });

    let leastCommonVowel = vowels[0];
    let lowestCount = vowelCounts[vowels[0]];

    vowels.forEach(vowel => {
        if (vowelCounts[vowel] < lowestCount) {
            lowestCount = vowelCounts[vowel];
            leastCommonVowel = vowel;
        }
    });

    return leastCommonVowel;
}

// Function to update word count
function updateWordCount(count) {
    const wordCountElement = document.getElementById('wordCount');
    if (wordCountElement) {
        wordCountElement.textContent = count;
    }
}

// Function to toggle mode
function toggleMode() {
    isNewMode = true; // Default to new mode
    resetApp();
}

// Function to toggle feature
function toggleFeature(featureId) {
    // Default all features to enabled
    isColour3Mode = true;
    isVowelMode = true;
    isShapeMode = true;
    
    // Update the display
    showNextFeature();
}

// Function to export wordlist
function exportWordlist() {
    // Create a text file with the current filtered words
    const text = currentFilteredWords.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = `wordlist_${currentFilteredWords.length}_words.txt`;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
}

// Function to initialize workflow dropdown
function initializeWorkflowDropdown() {
    const workflowSelect = document.getElementById('workflowSelect');
    if (!workflowSelect) return;

    // Clear existing options except the first one
    while (workflowSelect.options.length > 1) {
        workflowSelect.remove(1);
    }

    // Add saved workflows to dropdown
    workflows.forEach(workflow => {
        const option = document.createElement('option');
        option.value = workflow.name;
        option.textContent = workflow.name;
        workflowSelect.appendChild(option);
    });
}