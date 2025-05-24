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
let currentPosition1Word = '';

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

// Function to initialize workflow dropdown
function initializeWorkflowDropdown() {
    const workflowSelect = document.getElementById('workflowSelect');
    if (!workflowSelect) {
        console.error('Workflow select element not found');
        return;
    }

    // Load saved workflows
    const savedWorkflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    console.log('Initializing dropdown with workflows:', savedWorkflows); // Debug log
    
    // Clear existing options except the first two (default and create new)
    while (workflowSelect.options.length > 2) {
        workflowSelect.remove(2);
    }
    
    // Add saved workflows
    savedWorkflows.forEach(workflow => {
        const option = document.createElement('option');
        option.value = workflow.id;
        option.textContent = workflow.name;
        workflowSelect.appendChild(option);
        console.log('Added workflow to dropdown:', workflow); // Debug log
    });

    // Reset dropdown to default state
    workflowSelect.value = '';

    // Set up event listeners
    workflowSelect.addEventListener('change', function() {
        const performButton = document.getElementById('performButton');
        if (performButton) {
            performButton.disabled = this.value === '' || this.value === 'create-new';
        }

        if (this.value === 'create-new') {
            showWorkflowCreation();
        }
    });

    // Set up button listeners
    const createButton = document.getElementById('createWorkflowButton');
    if (createButton) {
        createButton.addEventListener('click', showWorkflowCreation);
    }

    const performButton = document.getElementById('performButton');
    if (performButton) {
        performButton.addEventListener('click', performWorkflow);
    }
}

function showWorkflowCreation() {
    document.getElementById('homepageContent').style.display = 'none';
    document.getElementById('workflowCreationContent').style.display = 'block';
    document.getElementById('workflowName').focus();
}

async function performWorkflow() {
    console.log('Performing workflow...');
    
    // Get the selected workflow ID
    const workflowSelect = document.getElementById('workflowSelect');
    const selectedWorkflowId = workflowSelect.value;
    
    console.log('Selected workflow ID:', selectedWorkflowId);
    
    // Validate selection
    if (!selectedWorkflowId || selectedWorkflowId === 'create-new') {
        alert('Please select a workflow to perform');
        return;
    }
    
    // Get all saved workflows
    const savedWorkflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    console.log('All saved workflows:', savedWorkflows);
    
    // Find the selected workflow
    const workflow = savedWorkflows.find(w => w.id === selectedWorkflowId);
    console.log('Found workflow:', workflow);
    
    if (!workflow) {
        alert('Selected workflow not found');
        return;
    }

    try {
        // Load the wordlist first
        await loadWordList();
        currentFilteredWords = [...wordList]; // Start with the full wordlist
        console.log('Wordlist loaded, starting with', currentFilteredWords.length, 'words');
        
        // Hide homepage and show workflow execution
        document.getElementById('homepage').style.display = 'none';
        const workflowExecution = document.getElementById('workflowExecution');
        workflowExecution.style.display = 'flex';
        
        // Clear previous content
        const featureArea = document.getElementById('featureArea');
        const resultsContainer = document.getElementById('results');
        featureArea.innerHTML = '';
        resultsContainer.innerHTML = '';
        
        // Create and display each feature section
        workflow.features.forEach(feature => {
            const featureSection = document.createElement('div');
            featureSection.className = 'feature-section';
            featureSection.id = `${feature.toLowerCase()}Feature`;
            featureSection.style.display = 'block'; // Ensure feature is visible
            
            const featureTitle = document.createElement('div');
            featureTitle.className = 'feature-title';
            featureTitle.textContent = feature;
            featureSection.appendChild(featureTitle);
            
            // Add feature-specific content based on the feature type
            switch(feature.toLowerCase()) {
                case 'original lex':
                    addOriginalLexContent(featureSection);
                    break;
                case 'eee?':
                    addEeeContent(featureSection);
                    break;
                case 'o?':
                    addOContent(featureSection);
                    break;
                case 'curved':
                    addCurvedContent(featureSection);
                    break;
                case 'colour3':
                    addColour3Content(featureSection);
                    break;
                case 'lexicon':
                    addLexiconContent(featureSection);
                    break;
                case 'consonant':
                    addConsonantContent(featureSection);
                    break;
                case 'position 1':
                    addPosition1Content(featureSection);
                    break;
                case 'vowel':
                    addVowelContent(featureSection);
                    break;
                case 'shape':
                    addShapeContent(featureSection);
                    break;
            }
            
            featureArea.appendChild(featureSection);
        });

        // Display initial word count
        updateWordCount(currentFilteredWords.length);
        
        // Set up event listeners for the first feature
        if (workflow.features.length > 0) {
            const firstFeature = workflow.features[0].toLowerCase();
            setupFeatureListeners(firstFeature, (filteredWords) => {
                currentFilteredWords = filteredWords;
                displayResults(filteredWords);
            });
        }

    } catch (error) {
        console.error('Error executing workflow:', error);
        alert('There was an error executing the workflow. Please try again.');
    }
}

// Helper functions to add feature-specific content
function addOriginalLexContent(container) {
    const display = document.createElement('div');
    display.className = 'original-lex-display';
    display.innerHTML = `
        <div class="position-display">Position <span id="originalLexPosition">-</span></div>
        <div class="letters-display">Letters: <span id="originalLexLetters">-</span></div>
    `;
    container.appendChild(display);
    
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    inputGroup.innerHTML = `
        <input type="text" id="originalLexInput" placeholder="Enter a word...">
        <button id="originalLexButton">DONE</button>
        <button id="originalLexSkipButton" class="skip-button">SKIP</button>
    `;
    container.appendChild(inputGroup);
}

function addEeeContent(container) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.innerHTML = `
        <button id="eeeButton" class="yes-btn">E</button>
        <button id="eeeYesBtn" class="yes-btn">YES</button>
        <button id="eeeNoBtn" class="no-btn">NO</button>
    `;
    container.appendChild(buttonContainer);
}

function addOContent(container) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.innerHTML = `
        <button id="oYesBtn" class="yes-btn">YES</button>
        <button id="oNoBtn" class="no-btn">NO</button>
        <button id="oSkipBtn" class="skip-button">SKIP</button>
    `;
    container.appendChild(buttonContainer);
}

function addCurvedContent(container) {
    const curvedButtons = document.createElement('div');
    curvedButtons.className = 'curved-buttons';
    curvedButtons.innerHTML = `
        <button class="curved-btn">B</button>
        <button class="curved-btn">C</button>
        <button class="curved-btn">D</button>
        <button class="curved-btn">G</button>
        <button class="curved-btn">J</button>
        <button class="curved-btn">O</button>
        <button class="curved-btn">P</button>
        <button class="curved-btn">Q</button>
        <button class="curved-btn">R</button>
        <button class="curved-btn">S</button>
        <button class="curved-btn">U</button>
    `;
    container.appendChild(curvedButtons);
    
    const skipButton = document.createElement('button');
    skipButton.id = 'curvedSkipBtn';
    skipButton.className = 'skip-button';
    skipButton.textContent = 'SKIP';
    container.appendChild(skipButton);
}

function addColour3Content(container) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.innerHTML = `
        <button id="colour3YesBtn" class="yes-btn">YES</button>
        <button id="colour3SkipButton" class="skip-button">SKIP</button>
    `;
    container.appendChild(buttonContainer);
}

function addLexiconContent(container) {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'lexicon-input';
    inputGroup.innerHTML = `
        <input type="text" id="lexiconInput" placeholder="Enter positions (e.g., 14)">
        <button id="lexiconButton">DONE</button>
    `;
    container.appendChild(inputGroup);
    
    const skipButton = document.createElement('button');
    skipButton.id = 'lexiconSkipButton';
    skipButton.className = 'skip-button';
    skipButton.textContent = 'SKIP';
    container.appendChild(skipButton);
}

function addConsonantContent(container) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.innerHTML = `
        <button id="consonantYesBtn" class="yes-btn">YES</button>
        <button id="consonantNoBtn" class="no-btn">NO</button>
    `;
    container.appendChild(buttonContainer);
}

function addPosition1Content(container) {
    const inputGroup = document.createElement('div');
    inputGroup.className = 'position-input';
    inputGroup.innerHTML = `
        <input type="text" id="position1Input" placeholder="Enter a word...">
        <button id="position1Button">DONE</button>
        <button id="position1DoneButton" class="skip-button">SKIP</button>
    `;
    container.appendChild(inputGroup);
}

function addVowelContent(container) {
    const vowelLetter = document.createElement('div');
    vowelLetter.className = 'vowel-letter';
    container.appendChild(vowelLetter);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.innerHTML = `
        <button class="vowel-btn yes-btn">YES</button>
        <button class="vowel-btn no-btn">NO</button>
    `;
    container.appendChild(buttonContainer);
}

function addShapeContent(container) {
    const shapeDisplay = document.createElement('div');
    shapeDisplay.className = 'shape-display';
    shapeDisplay.innerHTML = `
        <div class="position-display"></div>
        <div class="category-buttons"></div>
    `;
    container.appendChild(shapeDisplay);
}

// ... existing code ...

// Add this to ensure dropdown is initialized when the page loads
document.addEventListener('DOMContentLoaded', () => {
    initializeWorkflowDropdown();
});

// Add this to ensure dropdown is reinitialized after any workflow changes
function reinitializeWorkflowDropdown() {
    initializeWorkflowDropdown();
}

// Hide workflow creation page
function hideWorkflowCreation() {
    document.getElementById('homepage').style.display = 'block';
    document.getElementById('workflowCreation').style.display = 'none';
    document.getElementById('workflowExecution').style.display = 'none';
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load word list
    await loadWordList();
    
    // Load saved workflows from localStorage
    const savedWorkflows = localStorage.getItem('workflows');
    if (savedWorkflows) {
        workflows = JSON.parse(savedWorkflows);
    }
    
    // Initialize workflow dropdown
    initializeWorkflowDropdown();
    
    // Set up button listeners
    setupButtonListeners();
});

// Function to add feature to selected features list
function addFeatureToList(feature) {
    const selectedFeaturesList = document.getElementById('selectedFeaturesList');
    if (!selectedFeaturesList) return;
    
    // Check if feature is already selected
    const existingFeature = selectedFeaturesList.querySelector(`[data-feature="${feature}"]`);
    if (!existingFeature) {
        const featureItem = document.createElement('div');
        featureItem.className = 'selected-feature-item';
        featureItem.setAttribute('data-feature', feature);
        featureItem.draggable = true;
        
        const featureName = document.createElement('span');
        featureName.textContent = feature.toUpperCase();
        featureItem.appendChild(featureName);
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-feature';
        removeButton.textContent = '×';
        removeButton.onclick = (e) => {
            e.stopPropagation();
            featureItem.remove();
        };
        featureItem.appendChild(removeButton);
        
        // Add touch and drag events for mobile
        featureItem.addEventListener('touchstart', (e) => {
            e.preventDefault();
            featureItem.classList.add('dragging');
        }, { passive: false });
        
        featureItem.addEventListener('touchend', (e) => {
            e.preventDefault();
            featureItem.classList.remove('dragging');
        }, { passive: false });
        
        featureItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', feature);
            e.dataTransfer.effectAllowed = 'move';
            featureItem.classList.add('dragging');
        });
        
        featureItem.addEventListener('dragend', () => {
            featureItem.classList.remove('dragging');
        });
        
        selectedFeaturesList.appendChild(featureItem);
    }
}

// Function to setup button listeners
function setupButtonListeners() {
    // Create Workflow button
    const createWorkflowButton = document.getElementById('createWorkflowButton');
    if (createWorkflowButton) {
        createWorkflowButton.addEventListener('click', showWorkflowCreation);
        createWorkflowButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            showWorkflowCreation();
        }, { passive: false });
    }
    
    // Cancel Workflow button
    const cancelWorkflowButton = document.getElementById('cancelWorkflowButton');
    if (cancelWorkflowButton) {
        cancelWorkflowButton.addEventListener('click', hideWorkflowCreation);
        cancelWorkflowButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            hideWorkflowCreation();
        }, { passive: false });
    }
    
    // Save Workflow button
    const saveWorkflowButton = document.getElementById('saveWorkflowButton');
    if (saveWorkflowButton) {
        saveWorkflowButton.addEventListener('click', saveWorkflow);
        saveWorkflowButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            saveWorkflow();
        }, { passive: false });
    }
    
    // Perform button
    const performButton = document.getElementById('performButton');
    if (performButton) {
        performButton.addEventListener('click', performWorkflow);
        performButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            performWorkflow();
        }, { passive: false });
    }
    
    // Settings button
    const settingsButton = document.getElementById('settingsButton');
    if (settingsButton) {
        settingsButton.addEventListener('click', () => {
            document.getElementById('settingsModal').style.display = 'block';
        });
        settingsButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            document.getElementById('settingsModal').style.display = 'block';
        }, { passive: false });
    }
    
    // Close settings button
    const closeButton = document.querySelector('.close-button');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            document.getElementById('settingsModal').style.display = 'none';
        });
        closeButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            document.getElementById('settingsModal').style.display = 'none';
        }, { passive: false });
    }
}

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

// Function to save workflow
function saveWorkflow() {
    const workflowNameInput = document.getElementById('workflowName');
    const workflowName = workflowNameInput ? workflowNameInput.value.trim() : '';
    const selectedFeatures = Array.from(document.querySelectorAll('#selectedFeaturesList .selected-feature-item'))
        .map(item => item.dataset.feature);
    
    // Validate workflow name
    if (!workflowName) {
        alert('Please enter a workflow name');
        if (workflowNameInput) {
            workflowNameInput.focus();
        }
        return;
    }
    
    // Validate selected features
    if (selectedFeatures.length === 0) {
        alert('Please select at least one feature');
        return;
    }
    
    // Check if workflow name already exists
    const existingWorkflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    if (existingWorkflows.some(w => w.name === workflowName)) {
        alert('A workflow with this name already exists. Please choose a different name.');
        if (workflowNameInput) {
            workflowNameInput.focus();
        }
        return;
    }

    try {
        // Create new workflow with a unique ID
        const newWorkflow = {
            id: Date.now().toString(), // Generate unique ID
            name: workflowName,
            steps: selectedFeatures.map(feature => ({ feature }))
        };
        
        console.log('Saving new workflow:', newWorkflow); // Debug log
        
        // Add to workflows array
        existingWorkflows.push(newWorkflow);
        
        // Save to localStorage
        localStorage.setItem('workflows', JSON.stringify(existingWorkflows));
        console.log('Saved workflows to localStorage:', existingWorkflows); // Debug log
        
        // Clear form
        if (workflowNameInput) {
            workflowNameInput.value = '';
        }
        document.getElementById('selectedFeaturesList').innerHTML = '';
        
        // Reinitialize the workflow dropdown
        initializeWorkflowDropdown();
        
        // Show success message and return to homepage
        alert('Workflow saved successfully!');
        
        // Hide workflow creation page and show homepage
        document.getElementById('workflowCreation').style.display = 'none';
        document.getElementById('homepage').style.display = 'block';
        
    } catch (error) {
        console.error('Error saving workflow:', error);
        alert('There was an error saving the workflow. Please try again.');
    }
}

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

// Function to load word list
async function loadWordList() {
    try {
        const response = await fetch('words/ENUK-Long words Noun.txt');
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
function executeWorkflow(workflow) {
    console.log('Executing workflow:', workflow);
    
    // Clear previous content
    const featureArea = document.getElementById('featureArea');
    const resultsContainer = document.getElementById('results');
    featureArea.innerHTML = '';
    resultsContainer.innerHTML = '';
    
    // Show the workflow execution page
    document.getElementById('workflowExecution').style.display = 'flex';
    
    // Create and display each feature section
    workflow.features.forEach(feature => {
        const featureSection = document.createElement('div');
        featureSection.className = 'feature-section';
        featureSection.id = `${feature.toLowerCase()}Feature`;
        
        const featureTitle = document.createElement('div');
        featureTitle.className = 'feature-title';
        featureTitle.textContent = feature;
        featureSection.appendChild(featureTitle);
        
        // Add feature-specific content based on the feature type
        switch(feature.toLowerCase()) {
            case 'original lex':
                addOriginalLexContent(featureSection);
                break;
            case 'eee?':
                addEeeContent(featureSection);
                break;
            case 'o?':
                addOContent(featureSection);
                break;
            case 'curved':
                addCurvedContent(featureSection);
                break;
            case 'colour3':
                addColour3Content(featureSection);
                break;
            case 'lexicon':
                addLexiconContent(featureSection);
                break;
            case 'consonant':
                addConsonantContent(featureSection);
                break;
            case 'position 1':
                addPosition1Content(featureSection);
                break;
            case 'vowel':
                addVowelContent(featureSection);
                break;
            case 'shape':
                addShapeContent(featureSection);
                break;
        }
        
        featureArea.appendChild(featureSection);
    });
}

// Helper functions to add feature-specific content
function addOriginalLexContent(container) {
    const display = document.createElement('div');
    display.className = 'original-lex-display';
    display.innerHTML = `
        <div class="position-display">Position <span id="originalLexPosition">-</span></div>
        <div class="letters-display">Letters: <span id="originalLexLetters">-</span></div>
    `;
    container.appendChild(display);
    
    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    inputGroup.innerHTML = `
        <input type="text" id="originalLexInput" placeholder="Enter a word...">
        <button id="originalLexButton">DONE</button>
        <button id="originalLexSkipButton" class="skip-button">SKIP</button>
    `;
    container.appendChild(inputGroup);
}

function addEeeContent(container) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.innerHTML = `
        <button id="eeeButton" class="yes-btn">E</button>
        <button id="eeeYesBtn" class="yes-btn">YES</button>
        <button id="eeeNoBtn" class="no-btn">NO</button>
    `;
    container.appendChild(buttonContainer);
}

// ... Add other feature content helper functions as needed ...

// ... existing code ...

// Function to display results
function displayResults(words) {
    const resultsContainer = document.getElementById('results');
    if (!resultsContainer) {
        console.error('Results container not found');
        return;
    }
    
    console.log('Displaying results in container:', resultsContainer);
    
    // Clear the results container
    resultsContainer.innerHTML = '';
    
    if (words.length === 0) {
        resultsContainer.innerHTML = '<p>No words match the current criteria.</p>';
        updateWordCount(0);
        return;
    }
    
    // Create word list container
    const wordList = document.createElement('ul');
    wordList.className = 'word-list';
    
    // Add words to the list
    words.forEach(word => {
        const li = document.createElement('li');
        li.textContent = word;
        wordList.appendChild(li);
    });
    
    // Add the word list to the results container
    resultsContainer.appendChild(wordList);
    
    // Update word count
    updateWordCount(words.length);
    
    // Ensure the feature area is empty and visible
    const featureArea = document.getElementById('featureArea');
    if (featureArea) {
        featureArea.style.display = 'block';
        // Clear any wordlist that might have been accidentally added to the feature area
        if (featureArea.querySelector('.word-list')) {
            featureArea.innerHTML = '';
        }
    }
}

// Function to update word count
function updateWordCount(count) {
    let wordCountDisplay = document.getElementById('wordCountDisplay');
    
    // Create the display if it doesn't exist
    if (!wordCountDisplay) {
        wordCountDisplay = document.createElement('div');
        wordCountDisplay.id = 'wordCountDisplay';
        wordCountDisplay.className = 'word-count-display';
        document.body.appendChild(wordCountDisplay);
    }
    
    wordCountDisplay.textContent = count;
}

// Add CSS for word count display
const style = document.createElement('style');
style.textContent = `
    .word-count-display {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.75);
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 16px;
        font-weight: bold;
        z-index: 1000;
        min-width: 40px;
        text-align: center;
    }
`;
document.head.appendChild(style);

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
    
    // Move to next vowel
    currentVowelIndex++;
    
    // Update the display with the filtered words
    displayResults(currentFilteredWordsForVowels);
    
    // If we still have vowels to process, show the next one
    if (currentVowelIndex < uniqueVowels.length) {
        const vowelFeature = document.getElementById('vowelFeature');
        const vowelLetter = vowelFeature.querySelector('.vowel-letter');
        vowelLetter.textContent = uniqueVowels[currentVowelIndex].toUpperCase();
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
    currentPosition1Word = ''; // Reset the Position 1 word
    
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

function filterWordsByPosition1(words, consonants) {
    if (!consonants || consonants.length < 2) return words;
    
    return words.filter(word => {
                        const wordLower = word.toLowerCase();
                        
        if (hasAdjacentConsonants) {
            // YES to Consonants Together: look for the specific consonant pairs together
                        // Create all possible pairs of consonants from the input word
                        const consonantPairs = [];
                        for (let i = 0; i < consonants.length; i++) {
                            for (let j = i + 1; j < consonants.length; j++) {
                                consonantPairs.push([consonants[i], consonants[j]]);
                            }
                        }
                        
                        // Check if any of the consonant pairs appear together in the word
                        for (const [con1, con2] of consonantPairs) {
                            const pair1 = con1 + con2;
                            const pair2 = con2 + con1;
                            if (wordLower.includes(pair1) || wordLower.includes(pair2)) {
                                return true;
                            }
                        }
                        return false;
                } else {
                    // NO to Consonants Together: look for ANY pair of consonants in middle 5/6 characters
                        const wordLength = wordLower.length;
                        
                        // Determine middle section length (5 for odd, 6 for even)
                        const middleLength = wordLength % 2 === 0 ? 6 : 5;
                        const startPos = Math.floor((wordLength - middleLength) / 2);
                        const middleSection = wordLower.slice(startPos, startPos + middleLength);
                        
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
                                return true;
                            }
                        }
                        return false;
        }
    });
}

// Function to display saved workflows in the workflow builder
function displaySavedWorkflows() {
    const savedWorkflowsContainer = document.getElementById('savedWorkflows');
    if (!savedWorkflowsContainer) {
        console.error('Saved workflows container not found');
        return;
    }
    
    // Clear existing content
    savedWorkflowsContainer.innerHTML = '';
    
    // Create list container
    const workflowList = document.createElement('div');
    workflowList.className = 'saved-workflow-list';
    
    // Add each workflow
    workflows.forEach(workflow => {
        const workflowItem = document.createElement('div');
        workflowItem.className = 'saved-workflow-item';
        
        // Workflow name
        const nameSpan = document.createElement('span');
        nameSpan.textContent = workflow.name;
        nameSpan.className = 'workflow-name';
        nameSpan.onclick = () => editWorkflow(workflow);
        workflowItem.appendChild(nameSpan);
        
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '×';
        deleteButton.className = 'delete-workflow';
        deleteButton.onclick = (e) => {
            e.stopPropagation();
            deleteWorkflow(workflow);
        };
        workflowItem.appendChild(deleteButton);
        
        workflowList.appendChild(workflowItem);
    });
    
    savedWorkflowsContainer.appendChild(workflowList);
}

// Function to toggle saved workflows visibility
function toggleSavedWorkflows() {
    let modal = document.getElementById('savedWorkflowsModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'savedWorkflowsModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Saved Workflows</h2>
                    <button class="close-button" aria-label="Close">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="savedWorkflowsList"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        // Add close button functionality with both click and touch events
        const closeButton = modal.querySelector('.close-button');
        const closeModal = (e) => {
            e.preventDefault();
            e.stopPropagation();
            modal.style.display = 'none';
            document.body.style.overflow = '';
        };
        closeButton.addEventListener('click', closeModal);
        closeButton.addEventListener('touchstart', closeModal, { passive: false });

        // Close modal when clicking/touching outside
        const closeOnOutside = (e) => {
            if (e.target === modal) {
                e.preventDefault();
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        };
        modal.addEventListener('click', closeOnOutside);
        modal.addEventListener('touchstart', closeOnOutside, { passive: false });

        // Prevent body scrolling when modal is open
        modal.addEventListener('touchmove', (e) => {
            if (e.target === modal) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    // Display the modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Update the workflows list
    const workflowsList = document.getElementById('savedWorkflowsList');
    workflowsList.innerHTML = '';

    if (workflows.length === 0) {
        workflowsList.innerHTML = '<p class="no-workflows">No saved workflows yet.</p>';
        return;
    }

    // Create list of workflows
    workflows.forEach(workflow => {
        const workflowItem = document.createElement('div');
        workflowItem.className = 'workflow-item';
        workflowItem.setAttribute('role', 'button');
        workflowItem.setAttribute('tabindex', '0');
        
        const workflowInfo = document.createElement('div');
        workflowInfo.className = 'workflow-info';
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'workflow-name';
        nameSpan.textContent = workflow.name;
        
        const stepsSpan = document.createElement('span');
        stepsSpan.className = 'workflow-steps';
        stepsSpan.textContent = workflow.steps.map(step => step.feature).join(' → ');
        
        workflowInfo.appendChild(nameSpan);
        workflowInfo.appendChild(stepsSpan);
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-workflow';
        deleteButton.textContent = '×';
        deleteButton.setAttribute('aria-label', `Delete workflow ${workflow.name}`);
        
        // Handle delete with both click and touch events
        const handleDelete = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${workflow.name}"?`)) {
                const index = workflows.findIndex(w => w.name === workflow.name);
                if (index !== -1) {
                    workflows.splice(index, 1);
                    localStorage.setItem('workflows', JSON.stringify(workflows));
                    
                    const workflowSelect = document.getElementById('workflowSelect');
                    if (workflowSelect) {
                        const option = workflowSelect.querySelector(`option[value="${workflow.name}"]`);
                        if (option) option.remove();
                    }
                    
                    workflowItem.remove();
                    
                    if (workflows.length === 0) {
                        workflowsList.innerHTML = '<p class="no-workflows">No saved workflows yet.</p>';
                    }
                }
            }
        };
        
        deleteButton.addEventListener('click', handleDelete);
        deleteButton.addEventListener('touchstart', handleDelete, { passive: false });
        
        workflowItem.appendChild(workflowInfo);
        workflowItem.appendChild(deleteButton);
        workflowsList.appendChild(workflowItem);
    });
}

// Function to edit a workflow
function editWorkflow(workflow) {
    // Set workflow name
    const workflowNameInput = document.getElementById('workflowName');
    if (workflowNameInput) {
        workflowNameInput.value = workflow.name;
    }
    
    // Clear existing selected features
    const selectedFeaturesList = document.getElementById('selectedFeaturesList');
    if (selectedFeaturesList) {
        selectedFeaturesList.innerHTML = '';
    }
    
    // Add workflow steps to selected features
    workflow.steps.forEach(step => {
        const featureItem = document.createElement('div');
        featureItem.className = 'selected-feature-item';
        featureItem.setAttribute('data-feature', step.feature);
        featureItem.draggable = true;
        
        const featureName = document.createElement('span');
        featureName.textContent = step.feature.toUpperCase();
        featureItem.appendChild(featureName);
        
        const removeButton = document.createElement('button');
        removeButton.className = 'remove-feature';
        removeButton.textContent = '×';
        removeButton.onclick = () => featureItem.remove();
        featureItem.appendChild(removeButton);
        
        // Add drag and drop for reordering
        featureItem.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', step.feature);
            e.dataTransfer.effectAllowed = 'move';
            featureItem.classList.add('dragging');
        });
        
        featureItem.addEventListener('dragend', () => {
            featureItem.classList.remove('dragging');
        });
        
        selectedFeaturesList.appendChild(featureItem);
    });
    
    // Show workflow creation page
    showWorkflowCreation();
}

// Function to delete a workflow
function deleteWorkflow(workflow) {
    if (confirm(`Are you sure you want to delete the workflow "${workflow.name}"?`)) {
        // Remove from workflows array
        const index = workflows.findIndex(w => w.id === workflow.id);
        if (index !== -1) {
            workflows.splice(index, 1);
            
            // Update localStorage
            localStorage.setItem('workflows', JSON.stringify(workflows));
            
            // Update workflow select dropdown
            const workflowSelect = document.getElementById('workflowSelect');
            if (workflowSelect) {
                const option = workflowSelect.querySelector(`option[value="${workflow.name}"]`);
                if (option) {
                    option.remove();
                }
            }
            
            // Update saved workflows display
            displaySavedWorkflows();
        }
    }
}

// Function to initialize drag and drop functionality
function initializeDragAndDrop() {
    const availableFeatures = document.getElementById('availableFeatures');
    const selectedFeatures = document.getElementById('selectedFeaturesList');
    
    // Add drag events to available features
    const featureButtons = availableFeatures.querySelectorAll('.feature-button');
    featureButtons.forEach(button => {
        button.addEventListener('dragstart', handleDragStart);
        button.addEventListener('dragend', handleDragEnd);
    });

    // Add drop events to selected features container
    selectedFeatures.addEventListener('dragover', handleDragOver);
    selectedFeatures.addEventListener('dragenter', handleDragEnter);
    selectedFeatures.addEventListener('dragleave', handleDragLeave);
    selectedFeatures.addEventListener('drop', handleDrop);
}

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.feature);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
    e.preventDefault();
    const selectedFeatures = document.getElementById('selectedFeaturesList');
    selectedFeatures.classList.add('drag-over');
}

function handleDragLeave(e) {
    const selectedFeatures = document.getElementById('selectedFeaturesList');
    selectedFeatures.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const selectedFeatures = document.getElementById('selectedFeaturesList');
    selectedFeatures.classList.remove('drag-over');
    
    const featureType = e.dataTransfer.getData('text/plain');
    const featureButton = document.querySelector(`.feature-button[data-feature="${featureType}"]`);
    
    if (featureButton && !isFeatureAlreadySelected(featureType)) {
        addFeatureToSelected(featureType);
    }
}

function isFeatureAlreadySelected(featureType) {
    const selectedFeatures = document.getElementById('selectedFeaturesList');
    return selectedFeatures.querySelector(`[data-feature="${featureType}"]`) !== null;
}

function addFeatureToSelected(featureType) {
    const selectedFeatures = document.getElementById('selectedFeaturesList');
    const featureButton = document.querySelector(`.feature-button[data-feature="${featureType}"]`);
    
    const selectedFeature = document.createElement('div');
    selectedFeature.className = 'selected-feature-item';
    selectedFeature.dataset.feature = featureType;
    
    const featureName = document.createElement('span');
    featureName.textContent = featureButton.textContent;
    selectedFeature.appendChild(featureName);
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-feature';
    removeButton.textContent = '×';
    removeButton.onclick = (e) => {
        e.stopPropagation(); // Prevent the click from bubbling up
        selectedFeature.remove();
    };
    selectedFeature.appendChild(removeButton);
    
    // Add click event to move feature back to available
    selectedFeature.addEventListener('click', (e) => {
        if (e.target !== removeButton) {
            selectedFeature.remove();
        }
    });
    
    // Add touch event for mobile
    selectedFeature.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.target !== removeButton) {
            selectedFeature.remove();
        }
    }, { passive: false });
    
    selectedFeatures.appendChild(selectedFeature);
}

function removeFeature(featureType) {
    const selectedFeature = document.querySelector(`.selected-feature-item[data-feature="${featureType}"]`);
    if (selectedFeature) {
        selectedFeature.remove();
    }
}

// Initialize drag and drop when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDragAndDrop();
});

// Re-initialize drag and drop when new content is added
function reinitializeDragAndDrop() {
    initializeDragAndDrop();
}

// Initialize feature selection functionality
function initializeFeatureSelection() {
    const availableFeatures = document.getElementById('availableFeatures');
    const selectedFeaturesList = document.getElementById('selectedFeaturesList');
    
    if (availableFeatures) {
        const featureButtons = availableFeatures.querySelectorAll('.feature-button');
        
        featureButtons.forEach(button => {
            // Remove drag events
            button.draggable = false;
            
            // Add click event
            button.addEventListener('click', () => {
                const featureType = button.dataset.feature;
                if (!isFeatureAlreadySelected(featureType)) {
                    addFeatureToSelected(featureType);
                }
            });
            
            // Add touch event for mobile
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const featureType = button.dataset.feature;
                if (!isFeatureAlreadySelected(featureType)) {
                    addFeatureToSelected(featureType);
                }
            }, { passive: false });
        });
    }
}

function isFeatureAlreadySelected(featureType) {
    const selectedFeatures = document.getElementById('selectedFeaturesList');
    return selectedFeatures.querySelector(`[data-feature="${featureType}"]`) !== null;
}

function addFeatureToSelected(featureType) {
    const selectedFeatures = document.getElementById('selectedFeaturesList');
    const featureButton = document.querySelector(`.feature-button[data-feature="${featureType}"]`);
    
    const selectedFeature = document.createElement('div');
    selectedFeature.className = 'selected-feature-item';
    selectedFeature.dataset.feature = featureType;
    
    const featureName = document.createElement('span');
    featureName.textContent = featureButton.textContent;
    selectedFeature.appendChild(featureName);
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-feature';
    removeButton.textContent = '×';
    removeButton.onclick = (e) => {
        e.stopPropagation(); // Prevent the click from bubbling up
        selectedFeature.remove();
    };
    selectedFeature.appendChild(removeButton);
    
    // Add click event to move feature back to available
    selectedFeature.addEventListener('click', (e) => {
        if (e.target !== removeButton) {
            selectedFeature.remove();
        }
    });
    
    // Add touch event for mobile
    selectedFeature.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (e.target !== removeButton) {
            selectedFeature.remove();
        }
    }, { passive: false });
    
    selectedFeatures.appendChild(selectedFeature);
}

function removeFeature(featureType) {
    const selectedFeature = document.querySelector(`.selected-feature-item[data-feature="${featureType}"]`);
    if (selectedFeature) {
        selectedFeature.remove();
    }
}

// Initialize feature selection when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeFeatureSelection();
});

// Re-initialize feature selection when new content is added
function reinitializeFeatureSelection() {
    initializeFeatureSelection();
}

// Add CSS for the new elements
const originalLexStyle = document.createElement('style');
originalLexStyle.textContent = `
    .position-info {
        margin: 10px 0;
        padding: 10px;
        background-color: #f5f5f5;
        border-radius: 5px;
    }
    
    .position-display {
        font-weight: bold;
        margin-bottom: 5px;
    }
    
    .possible-letters {
        font-size: 0.9em;
        color: #666;
    }
    
    .letters-list {
        font-family: monospace;
    }
`;
document.head.appendChild(originalLexStyle);

// Add CSS for reset button
const resetButtonStyle = document.createElement('style');
resetButtonStyle.textContent = `
    .reset-workflow-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.75);
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        transition: background-color 0.2s;
    }
    
    .reset-workflow-button:hover {
        background-color: rgba(0, 0, 0, 0.9);
    }
    
    .reset-workflow-button:active {
        transform: scale(0.95);
    }
`;
document.head.appendChild(resetButtonStyle);

// Add CSS for home button
const homeButtonStyle = document.createElement('style');
homeButtonStyle.textContent = `
    .home-button {
        background: none;
        border: none;
        color: #333;
        font-size: 24px;
        cursor: pointer;
        padding: 0 10px;
        margin-right: 10px;
        transition: color 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }
    
    .home-button:hover {
        color: #666;
    }
    
    .home-button:active {
        transform: scale(0.95);
    }
`;
document.head.appendChild(homeButtonStyle);

// Update CSS for buttons to improve touch targets
const buttonStyles = document.createElement('style');
buttonStyles.textContent = `
    .reset-workflow-button {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background-color: rgba(0, 0, 0, 0.75);
        color: white;
        border: none;
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        transition: background-color 0.2s;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
    }
    
    .reset-workflow-button:hover {
        background-color: rgba(0, 0, 0, 0.9);
    }
    
    .reset-workflow-button:active {
        transform: scale(0.95);
    }
    
    .home-button {
        background: none;
        border: none;
        color: #333;
        font-size: 24px;
        cursor: pointer;
        padding: 10px;
        margin-right: 10px;
        transition: color 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 48px;
        min-height: 48px;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
    }
    
    .home-button:hover {
        color: #666;
    }
    
    .home-button:active {
        transform: scale(0.95);
    }
`;
document.head.appendChild(buttonStyles);

// Add CSS for button consistency
const buttonConsistencyStyle = document.createElement('style');
buttonConsistencyStyle.textContent = `
    #createWorkflowButton, #performButton {
        width: 200px;
        height: 40px;
        font-size: 16px;
        font-weight: bold;
        padding: 8px 16px;
        margin: 10px;
        border-radius: 4px;
        background-color: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
        transition: background-color 0.2s;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        box-sizing: border-box;
        line-height: 1;
        white-space: nowrap;
    }
    
    #createWorkflowButton:hover, #performButton:hover {
        background-color: #45a049;
    }
    
    #createWorkflowButton:active, #performButton:active {
        transform: scale(0.98);
    }

    /* Ensure the button container doesn't affect button size */
    .button-container {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
    }

    /* Make dropdown options scrollable */
    .options-list {
        max-height: 200px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #888 #f1f1f1;
    }

    /* Style scrollbar for Webkit browsers */
    .options-list::-webkit-scrollbar {
        width: 8px;
    }

    .options-list::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
    }

    .options-list::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
    }

    .options-list::-webkit-scrollbar-thumb:hover {
        background: #555;
    }
`;
document.head.appendChild(buttonConsistencyStyle);

// Feature Info Modal Functions
function showFeatureInfo(featureId) {
    console.log('Showing info for feature:', featureId);
    const modal = document.getElementById(`${featureId}Info`);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Prevent background scrolling
        document.body.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
        console.error('Modal not found for feature:', featureId);
    }
}

function hideFeatureInfo(featureId) {
    console.log('Hiding info for feature:', featureId);
    const modal = document.getElementById(`${featureId}Info`);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Re-enable background scrolling
        document.body.removeEventListener('touchmove', preventScroll);
    }
}

function preventScroll(e) {
    e.preventDefault();
}

// Add event listeners for info buttons
function initializeInfoButtons() {
    console.log('Initializing info buttons');
    // Info button click handlers
    document.querySelectorAll('.info-button').forEach(button => {
        console.log('Adding listeners to button:', button);
        // Remove any existing listeners
        button.removeEventListener('click', handleInfoClick);
        button.removeEventListener('touchend', handleInfoClick);
        
        // Add both click and touch events
        button.addEventListener('click', handleInfoClick);
        button.addEventListener('touchend', handleInfoClick);
    });

    // Close button click handlers
    document.querySelectorAll('.close-info-button').forEach(button => {
        // Remove any existing listeners
        button.removeEventListener('click', handleCloseClick);
        button.removeEventListener('touchend', handleCloseClick);
        
        // Add both click and touch events
        button.addEventListener('click', handleCloseClick);
        button.addEventListener('touchend', handleCloseClick);
    });

    // Close modal when clicking outside
    document.querySelectorAll('.feature-info-modal').forEach(modal => {
        // Remove any existing listeners
        modal.removeEventListener('click', handleOutsideClick);
        modal.removeEventListener('touchend', handleOutsideClick);
        
        // Add both click and touch events
        modal.addEventListener('click', handleOutsideClick);
        modal.addEventListener('touchend', handleOutsideClick);
    });
}

function handleInfoClick(e) {
    console.log('Info button clicked');
    e.preventDefault();
    e.stopPropagation(); // Prevent drag start
    const featureId = this.getAttribute('data-feature');
    console.log('Feature ID:', featureId);
    showFeatureInfo(featureId);
}

function handleCloseClick(e) {
    console.log('Close button clicked');
    e.preventDefault();
    e.stopPropagation();
    const modal = this.closest('.feature-info-modal');
    const featureId = modal.id.replace('Info', '');
    hideFeatureInfo(featureId);
}

function handleOutsideClick(e) {
    console.log('Outside clicked');
    e.preventDefault();
    if (e.target === this) {
        const featureId = this.id.replace('Info', '');
        hideFeatureInfo(featureId);
    }
}

// Initialize info buttons when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing info buttons');
    initializeInfoButtons();
});

// Also initialize info buttons when the workflow creation page is shown
function showWorkflowCreation() {
    // ... existing code ...
    initializeInfoButtons();
}