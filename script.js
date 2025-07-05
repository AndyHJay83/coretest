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
let mostFrequentLetter = null;
let leastFrequentLetter = null;
let usedLettersInWorkflow = [];  // Track letters used in current workflow
let letterFrequencyMap = new Map();  // Store frequency of all letters

// Workflow Management
let workflows = JSON.parse(localStorage.getItem('workflows')) || [];
let currentWorkflow = null;

// Global workflow state management
let workflowState = {
    confirmedLetters: new Set(), // Letters we KNOW are in the word
    excludedLetters: new Set(),  // Letters we KNOW are NOT in the word
    confirmedPositions: {},      // Letters we know are at specific positions
    wordLength: null,           // If we know the word length
    hasVowels: new Set(),       // Vowels we've confirmed are in the word
    excludedVowels: new Set(),  // Vowels we've confirmed are NOT in the word
    hasO: null,                 // Whether word contains 'O' (from O? feature)
    hasE: null,                 // Whether word contains 'E' (from EEE features)
    abcdeSelection: new Set(),  // Letters selected in ABCDE feature
    abcSelection: new Set(),    // Letters selected in ABC feature
    mostFrequentRank: 1,        // Current rank for most frequent letter
    leastFrequentRank: 1,       // Current rank for least frequent letter
    usedLettersInWorkflow: []   // Track letters used in workflow (existing)
};

// Function to reset workflow state
function resetWorkflowState() {
    workflowState = {
        confirmedLetters: new Set(),
        excludedLetters: new Set(),
        confirmedPositions: {},
        wordLength: null,
        hasVowels: new Set(),
        excludedVowels: new Set(),
        hasO: null,
        hasE: null,
        abcdeSelection: new Set(),
        abcSelection: new Set(),
        mostFrequentRank: 1,
        leastFrequentRank: 1,
        usedLettersInWorkflow: []
    };
}

// Function to check if a letter is already known
function isLetterKnown(letter) {
    return workflowState.confirmedLetters.has(letter) || workflowState.excludedLetters.has(letter);
}

// Function to get known status of a letter
function getLetterStatus(letter) {
    if (workflowState.confirmedLetters.has(letter)) return 'confirmed';
    if (workflowState.excludedLetters.has(letter)) return 'excluded';
    return 'unknown';
}

// Function to log workflow state for debugging
function logWorkflowState() {
    console.log('=== WORKFLOW STATE ===');
    console.log('Confirmed letters:', Array.from(workflowState.confirmedLetters));
    console.log('Excluded letters:', Array.from(workflowState.excludedLetters));
    console.log('Confirmed positions:', workflowState.confirmedPositions);
    console.log('Word length:', workflowState.wordLength);
    console.log('Has vowels:', Array.from(workflowState.hasVowels));
    console.log('Excluded vowels:', Array.from(workflowState.excludedVowels));
    console.log('Has O:', workflowState.hasO);
    console.log('Has E:', workflowState.hasE);
    console.log('ABCDE selection:', Array.from(workflowState.abcdeSelection));
    console.log('ABC selection:', Array.from(workflowState.abcSelection));
    console.log('=====================');
}

// DOM Elements
const createWorkflowButton = document.getElementById('createWorkflowButton');
const cancelWorkflowButton = document.getElementById('cancelWorkflowButton');
const saveWorkflowButton = document.getElementById('saveWorkflowButton');
const backToHomeButton = document.getElementById('backToHomeButton');
const workflowName = document.getElementById('workflowName');
const selectedFeaturesList = document.getElementById('selectedFeaturesList');
const workflowSelect = document.getElementById('workflowSelect');
const performButton = document.getElementById('performButton');

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load saved workflows from localStorage
    const savedWorkflows = localStorage.getItem('workflows');
    if (savedWorkflows) {
        workflows = JSON.parse(savedWorkflows);
        // Set the most recent workflow as default if there are any workflows
        if (workflows.length > 0) {
            const mostRecentWorkflow = workflows[workflows.length - 1];
            workflowSelect.value = mostRecentWorkflow.name;
            const workflowCustomSelect = document.getElementById('workflowCustomSelect');
            if (workflowCustomSelect) {
                const selectedText = workflowCustomSelect.querySelector('.selected-text');
                if (selectedText) {
                    selectedText.textContent = mostRecentWorkflow.name;
                }
            }
        }
    }
    
    // Initialize dropdowns and button listeners
    initializeDropdowns();
    
    // Display saved workflows
    displaySavedWorkflows();
    
    // Initialize NOT IN feature
    initializeNotInFeature();

    // Add wordlist change listener - reset loaded flag when wordlist changes
    const wordlistSelect = document.getElementById('wordlistSelect');
    wordlistSelect.addEventListener('change', () => {
        // Reset the loaded flag so new wordlist will be loaded when workflow executes
        wordListLoaded = false;
        wordList = [];
        currentFilteredWords = [];
    });
});

// Function to initialize dropdowns
function initializeDropdowns() {
    // --- WORKFLOW DROPDOWN ---
    const workflowSelect = document.getElementById('workflowSelect');
    // Remove all options except the first two
    while (workflowSelect.options.length > 2) {
        workflowSelect.remove(2);
    }
    // Add options for each saved workflow
    const savedWorkflows = JSON.parse(localStorage.getItem('workflows') || '[]');
    savedWorkflows.forEach(workflow => {
        const option = document.createElement('option');
        option.value = workflow.name;
        option.textContent = workflow.name;
        workflowSelect.appendChild(option);
    });
    // Remove any existing custom-select immediately after workflowSelect
    let nextElem = workflowSelect.nextElementSibling;
    while (nextElem && nextElem.classList && nextElem.classList.contains('custom-select')) {
        const toRemove = nextElem;
        nextElem = nextElem.nextElementSibling;
        toRemove.parentNode.removeChild(toRemove);
    }
    // Create new custom select
    const workflowCustomSelect = document.createElement('div');
    workflowCustomSelect.className = 'custom-select';
    workflowCustomSelect.id = 'workflowCustomSelect';
    workflowCustomSelect.innerHTML = `
        <div class="selected-text">${workflowSelect.options[workflowSelect.selectedIndex]?.textContent || 'Select a workflow...'}</div>
        <div class="options-list"></div>
    `;
    workflowSelect.insertAdjacentElement('afterend', workflowCustomSelect);
    const workflowSelectedText = workflowCustomSelect.querySelector('.selected-text');
    const workflowOptionsList = workflowCustomSelect.querySelector('.options-list');
    workflowCustomSelect.style.zIndex = '9998';
    workflowOptionsList.style.zIndex = '9999';
    // Populate options
    workflowOptionsList.innerHTML = '';
    const defaultWorkflowOptions = [
        { value: '', text: 'Select a workflow...' },
        { value: 'create-new', text: 'New Workflow' }
    ];
    defaultWorkflowOptions.forEach(option => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = option.text;
        optionElement.dataset.value = option.value;
        workflowOptionsList.appendChild(optionElement);
    });
    savedWorkflows.forEach(workflow => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option';
        optionElement.textContent = workflow.name;
        optionElement.dataset.value = workflow.name;
        workflowOptionsList.appendChild(optionElement);
    });
    // Event handlers
    const closeWorkflowDropdown = () => {
        workflowOptionsList.classList.remove('show');
        workflowOptionsList.style.cssText = '';
        document.body.classList.remove('workflow-dropdown-open');
    };
    const toggleWorkflowDropdown = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        closeWordlistDropdown();
        if (workflowOptionsList.classList.contains('show')) {
            closeWorkflowDropdown();
        } else {
            workflowOptionsList.classList.add('show');
            workflowOptionsList.style.cssText = `
                display: block !important;
                position: absolute;
                width: 100%;
                height: auto;
                max-height: none;
                overflow: visible;
                z-index: 9999;
                background: white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            `;
            document.body.classList.add('workflow-dropdown-open');
        }
    };
    workflowCustomSelect.addEventListener('click', toggleWorkflowDropdown);
    workflowCustomSelect.addEventListener('touchstart', toggleWorkflowDropdown, { passive: false });
    const handleWorkflowOptionSelect = (e) => {
        e.preventDefault(); e.stopPropagation();
        const option = e.target.closest('.option');
        if (!option) return;
        const value = option.dataset.value;
        const text = option.textContent;
        workflowSelect.value = value;
        workflowSelectedText.textContent = text;
        closeWorkflowDropdown();
        if (value === 'create-new') { showWorkflowCreation(); }
    };
    workflowOptionsList.addEventListener('click', handleWorkflowOptionSelect);
    workflowOptionsList.addEventListener('touchstart', handleWorkflowOptionSelect, { passive: false });

    // --- WORDLIST DROPDOWN ---
    const wordlistSelect = document.getElementById('wordlistSelect');
    // Remove any existing custom-select immediately after wordlistSelect
    nextElem = wordlistSelect.nextElementSibling;
    while (nextElem && nextElem.classList && nextElem.classList.contains('custom-select')) {
        const toRemove = nextElem;
        nextElem = nextElem.nextElementSibling;
        toRemove.parentNode.removeChild(toRemove);
    }
    // Create new custom select
    const wordlistCustomSelect = document.createElement('div');
    wordlistCustomSelect.className = 'custom-select';
    wordlistCustomSelect.id = 'wordlistCustomSelect';
    wordlistCustomSelect.innerHTML = `
        <div class="selected-text">${wordlistSelect.options[wordlistSelect.selectedIndex]?.textContent || 'ENUK Wordlist'}</div>
        <div class="options-list"></div>
    `;
    wordlistSelect.insertAdjacentElement('afterend', wordlistCustomSelect);
    const wordlistSelectedText = wordlistCustomSelect.querySelector('.selected-text');
    const wordlistOptionsList = wordlistCustomSelect.querySelector('.options-list');
    wordlistCustomSelect.style.zIndex = '100';
    wordlistOptionsList.style.zIndex = '101';
    // Populate options
    wordlistOptionsList.innerHTML = '';
    Array.from(wordlistSelect.options).forEach(option => {
        const customOption = document.createElement('div');
        customOption.className = 'option';
        customOption.textContent = option.textContent;
        customOption.dataset.value = option.value;
        if (option.selected) { customOption.classList.add('selected'); }
        wordlistOptionsList.appendChild(customOption);
    });
    // Event handlers
    const closeWordlistDropdown = () => {
        wordlistOptionsList.classList.remove('show');
        wordlistOptionsList.style.cssText = '';
    };
    const toggleWordlistDropdown = (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        closeWorkflowDropdown();
        if (wordlistOptionsList.classList.contains('show')) {
            closeWordlistDropdown();
        } else {
            wordlistOptionsList.classList.add('show');
            wordlistOptionsList.style.cssText = `
                display: block !important;
                position: absolute;
                width: 100%;
                height: auto;
                max-height: none;
                overflow: visible;
                z-index: 101;
                background: white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            `;
        }
    };
    wordlistCustomSelect.addEventListener('click', toggleWordlistDropdown);
    wordlistCustomSelect.addEventListener('touchstart', toggleWordlistDropdown, { passive: false });
    const handleWordlistOptionSelect = (e) => {
        e.preventDefault(); e.stopPropagation();
        const option = e.target.closest('.option');
        if (!option) return;
        const value = option.dataset.value;
        const text = option.textContent;
        wordlistSelect.value = value;
        wordlistSelectedText.textContent = text;
        closeWordlistDropdown();
    };
    wordlistOptionsList.addEventListener('click', handleWordlistOptionSelect);
    wordlistOptionsList.addEventListener('touchstart', handleWordlistOptionSelect, { passive: false });

    // --- OUTSIDE CLICK HANDLERS ---
    const closeDropdowns = (e) => {
        if (!workflowCustomSelect.contains(e.target)) { closeWorkflowDropdown(); }
        if (!wordlistCustomSelect.contains(e.target)) { closeWordlistDropdown(); }
    };
    document.addEventListener('click', closeDropdowns);
    document.addEventListener('touchstart', closeDropdowns, { passive: true });

    // Set up button listeners
    setupButtonListeners();
}

// Function to setup button listeners
function setupButtonListeners() {
    // Create Workflow button
    const createWorkflowButton = document.getElementById('createWorkflowButton');
    if (createWorkflowButton) {
        createWorkflowButton.replaceWith(createWorkflowButton.cloneNode(true));
        const newCreateWorkflowButton = document.getElementById('createWorkflowButton');
        newCreateWorkflowButton.addEventListener('click', showWorkflowCreation);
        newCreateWorkflowButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            showWorkflowCreation();
        }, { passive: false });
    }
    
    // Toggle Saved Workflows button
    const toggleSavedWorkflowsButton = document.getElementById('toggleSavedWorkflows');
    if (toggleSavedWorkflowsButton) {
        toggleSavedWorkflowsButton.replaceWith(toggleSavedWorkflowsButton.cloneNode(true));
        const newToggleButton = document.getElementById('toggleSavedWorkflows');
        newToggleButton.addEventListener('click', toggleSavedWorkflows);
        newToggleButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleSavedWorkflows();
        }, { passive: false });
    }
    
    // Cancel Workflow button
    const cancelWorkflowButton = document.getElementById('cancelWorkflowButton');
    if (cancelWorkflowButton) {
        cancelWorkflowButton.replaceWith(cancelWorkflowButton.cloneNode(true));
        const newCancelWorkflowButton = document.getElementById('cancelWorkflowButton');
        newCancelWorkflowButton.addEventListener('click', hideWorkflowCreation);
        newCancelWorkflowButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            hideWorkflowCreation();
        }, { passive: false });
    }
    
    // Save Workflow button
    const saveWorkflowButton = document.getElementById('saveWorkflowButton');
    if (saveWorkflowButton) {
        saveWorkflowButton.replaceWith(saveWorkflowButton.cloneNode(true));
        const newSaveWorkflowButton = document.getElementById('saveWorkflowButton');
        newSaveWorkflowButton.addEventListener('click', saveWorkflow);
        newSaveWorkflowButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            saveWorkflow();
        }, { passive: false });
    }
    
    // Perform button
    const performButton = document.getElementById('performButton');
    if (performButton) {
        performButton.replaceWith(performButton.cloneNode(true));
        const newPerformButton = document.getElementById('performButton');
        newPerformButton.addEventListener('click', async () => {
            const selectedWorkflow = document.getElementById('workflowSelect').value;
            if (!selectedWorkflow) {
                alert('Please select a workflow first');
                return;
            }
            try {
                const workflow = workflows.find(w => w.name === selectedWorkflow);
                if (!workflow) {
                    throw new Error('Selected workflow not found');
                }
                document.getElementById('homepage').style.display = 'none';
                document.getElementById('workflowCreation').style.display = 'none';
                const workflowExecution = document.getElementById('workflowExecution');
                workflowExecution.style.display = 'block';
                await executeWorkflow(workflow.steps);
            } catch (error) {
                console.error('Error executing workflow:', error);
                alert('Error executing workflow: ' + error.message);
            }
        });
        newPerformButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            newPerformButton.click();
        }, { passive: false });
    }
}

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
        
        // Add click event to remove feature
        featureItem.addEventListener('click', () => {
            featureItem.remove();
        });
        
        // Add touch and drag events for mobile
        featureItem.addEventListener('touchstart', (e) => {
            e.preventDefault();
            featureItem.classList.add('dragging');
            featureItem.remove();
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
    if (workflows.some(w => w.name === workflowName)) {
        alert('A workflow with this name already exists. Please choose a different name.');
        if (workflowNameInput) {
            workflowNameInput.focus();
        }
        return;
    }

    try {
        // Create new workflow
        const newWorkflow = {
            name: workflowName,
            steps: selectedFeatures.map(feature => ({ feature }))
        };
        
        // Add to workflows array
        workflows.push(newWorkflow);
        
        // Save to localStorage
        localStorage.setItem('workflows', JSON.stringify(workflows));
        
        // Update workflow select
        const workflowSelect = document.getElementById('workflowSelect');
        if (workflowSelect) {
            const option = document.createElement('option');
            option.value = newWorkflow.name;
            option.textContent = newWorkflow.name;
            workflowSelect.appendChild(option);
        }
        
        // Clear form
        if (workflowNameInput) {
            workflowNameInput.value = '';
        }
        document.getElementById('selectedFeaturesList').innerHTML = '';
        
        // Reinitialize dropdowns
        initializeDropdowns();
        
        // Show success message and return to homepage
        alert('Workflow saved successfully!');
        hideWorkflowCreation();
        
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

// Handle workflow selection change
workflowSelect.addEventListener('change', function() {
    if (this.value === 'create-new') {
        showWorkflowCreation();
    }
});

// Add touch event handling for workflow selection
workflowSelect.addEventListener('touchstart', function(e) {
    e.preventDefault();
    // Trigger the native select dropdown
    this.click();
}, { passive: false });

// Add touch event handling for workflow options
workflowSelect.addEventListener('touchend', function(e) {
    e.preventDefault();
    const selectedOption = this.options[this.selectedIndex];
    if (selectedOption && selectedOption.value === 'create-new') {
        showWorkflowCreation();
    }
}, { passive: false });

// Function to load word list
async function loadWordList() {
    try {
        const startTime = performance.now();
        console.log('=== WORDLIST LOADING START ===');
        
        // Show loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.id = 'loadingIndicator';
        loadingIndicator.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: rgba(0,0,0,0.8); color: white; padding: 20px; border-radius: 10px; 
                        z-index: 10000; text-align: center;">
                <div>Loading wordlist...</div>
                <div id="loadingProgress" style="margin-top: 10px; font-size: 12px;">Initializing...</div>
            </div>
        `;
        document.body.appendChild(loadingIndicator);
        
        const updateProgress = (message) => {
            const progressElement = document.getElementById('loadingProgress');
            if (progressElement) {
                progressElement.textContent = message;
            }
            console.log('Progress:', message);
        };
        
        const wordlistSelect = document.getElementById('wordlistSelect');
        const selectedWordlist = wordlistSelect.value;
        console.log('Selected wordlist value:', selectedWordlist);
        let wordlistPath;
        let gzippedPath;
        
        switch(selectedWordlist) {
            case '19127':
                wordlistPath = 'words/19127.txt';
                gzippedPath = 'words/19127.txt.gz';
                break;
            case 'emotions':
                wordlistPath = 'words/EmotionsJobsSpiritAnimals.txt';
                gzippedPath = 'words/EmotionsJobsSpiritAnimals.txt.gz';
                break;
            case '134k':
                wordlistPath = 'words/134K.txt';
                gzippedPath = 'words/134K.txt.gz';
                break;
            case 'boysnames':
                wordlistPath = 'words/BoysNames.txt';
                gzippedPath = 'words/BoysNames.txt.gz';
                break;
            case 'girlsnames':
                wordlistPath = 'words/GirlsNames.txt';
                gzippedPath = 'words/GirlsNames.txt.gz';
                break;
            case 'allnames':
                wordlistPath = 'words/AllNames.txt';
                gzippedPath = 'words/AllNames.txt.gz';
                break;
            case 'colouritems':
                wordlistPath = 'words/ColourItems.txt';
                gzippedPath = 'words/ColourItems.txt.gz';
                break;
            case 'enuk':
            default:
                wordlistPath = 'words/ENUK-Long words Noun.txt';
                gzippedPath = 'words/ENUK-Long words Noun.txt.gz';
                break;
        }
        console.log('Selected wordlist path:', wordlistPath);
        console.log('Gzipped path:', gzippedPath);
        
        let response;
        let text;
        let usedGzip = false;
        
        // Try gzipped file first for better performance
        try {
            updateProgress('Loading compressed file...');
            console.log('Attempting to load gzipped file...');
            const fetchStart = performance.now();
            response = await fetch(gzippedPath);
            const fetchTime = performance.now() - fetchStart;
            console.log(`Fetch time: ${fetchTime.toFixed(2)}ms`);
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (response.ok) {
                updateProgress('Decompressing file...');
                const decompressStart = performance.now();
                const arrayBuffer = await response.arrayBuffer();
                const bufferTime = performance.now() - decompressStart;
                console.log(`ArrayBuffer time: ${bufferTime.toFixed(2)}ms`);
                console.log('ArrayBuffer size:', arrayBuffer.byteLength, 'bytes');
                
                // Decompress using pako (if available) or fallback to text
                if (typeof pako !== 'undefined') {
                    console.log('Pako library available, decompressing...');
                    const pakoStart = performance.now();
                    const decompressed = pako.inflate(new Uint8Array(arrayBuffer), { to: 'string' });
                    const pakoTime = performance.now() - pakoStart;
                    console.log(`Pako decompression time: ${pakoTime.toFixed(2)}ms`);
                    console.log('Decompressed size:', decompressed.length, 'characters');
                    text = decompressed;
                    usedGzip = true;
                    console.log('✅ Successfully loaded and decompressed gzipped file');
                } else {
                    console.log('❌ Pako not available, falling back to uncompressed');
                    throw new Error('Pako not available, falling back to uncompressed');
                }
            } else {
                console.log('❌ Gzipped file not found, falling back to uncompressed');
                throw new Error('Gzipped file not found, falling back to uncompressed');
            }
        } catch (gzipError) {
            console.log('❌ Gzipped file failed, loading uncompressed file:', gzipError.message);
            updateProgress('Loading uncompressed file...');
            response = await fetch(wordlistPath);
            if (!response.ok) {
                throw new Error('Failed to load wordlist');
            }
            text = await response.text();
            usedGzip = false;
        }
        
        console.log('Text loaded, length:', text.length);
        console.log('Used gzip:', usedGzip);
        updateProgress('Processing wordlist...');
        
        // Optimize the word processing
        const processStart = performance.now();
        
        // Use more efficient string processing
        const lines = text.split('\n');
        console.log(`Split into ${lines.length} lines`);
        
        // Use Set for faster filtering and deduplication
        const wordSet = new Set();
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (trimmed) {
                wordSet.add(trimmed);
            }
        }
        
        wordList = Array.from(wordSet);
        const processTime = performance.now() - processStart;
        console.log(`Processing time: ${processTime.toFixed(2)}ms`);
        console.log('Filtered words count:', wordList.length);
        
        currentFilteredWords = [...wordList];
        currentWordlistForVowels = [...wordList];
        
        const totalTime = performance.now() - startTime;
        console.log(`Total loading time: ${totalTime.toFixed(2)}ms`);
        console.log('Wordlist loaded successfully:', wordList.length, 'words');
        console.log('=== WORDLIST LOADING END ===');
        
        // Remove loading indicator
        if (loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        
        return wordList;
    } catch (error) {
        console.error('Error loading wordlist:', error);
        // Remove loading indicator on error
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator && loadingIndicator.parentNode) {
            loadingIndicator.parentNode.removeChild(loadingIndicator);
        }
        throw error;
    }
}

// Add lazy loading flag
let wordListLoaded = false;
let lastLoadedWordlist = '';

// Function to execute workflow
async function executeWorkflow(steps) {
    try {
        // Get the currently selected wordlist
        const wordlistSelect = document.getElementById('wordlistSelect');
        const selectedWordlist = wordlistSelect.value;
        console.log('Selected wordlist:', selectedWordlist);
        
        // Check if we need to load a new wordlist
        const needsReload = !wordListLoaded || 
                           wordList.length === 0 || 
                           lastLoadedWordlist !== selectedWordlist;
        
        if (needsReload) {
            await loadWordList();
            wordListLoaded = true;
            lastLoadedWordlist = selectedWordlist;
        }
        console.log('Wordlist loaded, word count:', wordList.length);
        
        // Reset workflow state at the beginning of each workflow
        resetWorkflowState();
        console.log('Workflow state reset');
        
        // Reset all feature states
        currentFilteredWords = [...wordList]; // Start with the full wordlist
        lexiconCompleted = false;
        originalLexCompleted = false;
        eeeCompleted = false;
        hasAdjacentConsonants = null;
        hasO = null;
        selectedCurvedLetter = null;
        currentVowelIndex = 0;
        uniqueVowels = [];
        currentFilteredWordsForVowels = [];
        currentPosition1Word = '';
        leastFrequentLetter = null;  // Reset least frequent letter state
        
        // Reset used letters at the start of a new workflow
        usedLettersInWorkflow = [];
        
        console.log('Starting workflow with steps:', steps);
        console.log('Using wordlist:', selectedWordlist);
        console.log('Current word count:', currentFilteredWords.length);
        
        // Hide homepage and show workflow execution
        const homepage = document.getElementById('homepage');
        const workflowExecution = document.getElementById('workflowExecution');
        
        if (homepage) {
            homepage.style.display = 'none';
        }
        
        if (workflowExecution) {
            workflowExecution.style.display = 'flex';
            workflowExecution.style.flexDirection = 'column';
            workflowExecution.style.height = '100vh';
        }

        // Add home button if it doesn't exist
        let homeButton = document.getElementById('homeButton');
        if (!homeButton) {
            homeButton = document.createElement('button');
            homeButton.id = 'homeButton';
            homeButton.className = 'home-button';
            homeButton.innerHTML = '⌂';
            homeButton.title = 'Return to Home';
            
            // Function to handle home button action
            const handleHomeAction = () => {
                // Hide workflow execution
                if (workflowExecution) {
                    workflowExecution.style.display = 'none';
                }
                // Show homepage
                if (homepage) {
                    homepage.style.display = 'block';
                }
                // Remove reset button if it exists
                const resetButton = document.getElementById('resetWorkflowButton');
                if (resetButton) {
                    resetButton.remove();
                }
                // Remove home button
                homeButton.remove();
            };
            
            // Add both click and touch events
            homeButton.addEventListener('click', handleHomeAction);
            homeButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleHomeAction();
            }, { passive: false });
            
            // Insert home button next to the header
            const header = document.querySelector('.header');
            if (header) {
                header.insertBefore(homeButton, header.firstChild);
            }
        }

        // Add reset button if it doesn't exist
        let resetButton = document.getElementById('resetWorkflowButton');
        if (!resetButton) {
            resetButton = document.createElement('button');
            resetButton.id = 'resetWorkflowButton';
            resetButton.className = 'reset-workflow-button';
            resetButton.innerHTML = '↺';
            resetButton.title = 'Reset Workflow';
            
            // Function to handle reset action
            const handleResetAction = () => {
                if (currentWorkflow) {
                    executeWorkflow(currentWorkflow.steps);
                }
            };
            
            // Add both click and touch events
            resetButton.addEventListener('click', handleResetAction);
            resetButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleResetAction();
            }, { passive: false });
            
            document.body.appendChild(resetButton);
        }
        
        // Store current workflow for reset functionality
        currentWorkflow = { steps };
        
        // Create feature elements if they don't exist
        const featureElements = {
            position1Feature: createPosition1Feature(),
            vowelFeature: createVowelFeature(),
            oFeature: createOFeature(),
            lexiconFeature: createLexiconFeature(),
            eeeFeature: createEeeFeature(),
            eeeFirstFeature: createEeeFirstFeature(),
            originalLexFeature: createOriginalLexFeature(),
            consonantQuestion: createConsonantQuestion(),
            colour3Feature: createColour3Feature(),
            shapeFeature: createShapeFeature(),
            curvedFeature: createCurvedFeature(),
            lengthFeature: createLengthFeature(),
            mostFrequentFeature: createMostFrequentFeature(),
            leastFrequentFeature: createLeastFrequentFeature(),
            notInFeature: createNotInFeature(),
            abcde: createAbcdeFeature(),
            abc: createAbcFeature(),
            findEee: createFindEeeFeature(),
        };
        
        // Add all feature elements to the document body
        Object.values(featureElements).forEach(element => {
            if (element) {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
                document.body.appendChild(element);
                element.style.display = 'none';
                element.classList.remove('completed');
            }
        });
        
        // Get or create the feature area and results container
        let featureArea = document.getElementById('featureArea');
        let resultsContainer = document.getElementById('results');
        
        if (!featureArea) {
            featureArea = document.createElement('div');
            featureArea.id = 'featureArea';
            featureArea.className = 'feature-area';
            workflowExecution.insertBefore(featureArea, workflowExecution.firstChild);
        }
        
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'results';
            resultsContainer.className = 'results-container';
            workflowExecution.appendChild(resultsContainer);
        }
        
        // Set up the layout
        featureArea.style.flex = '0 0 33vh';
        featureArea.style.minHeight = '200px';
        featureArea.style.padding = '20px';
        featureArea.style.backgroundColor = '#f5f5f5';
        featureArea.style.borderBottom = '1px solid #ddd';
        
        resultsContainer.style.flex = '1';
        resultsContainer.style.overflowY = 'auto';
        resultsContainer.style.padding = '20px';
        resultsContainer.style.backgroundColor = '#fff';
        
        // Clear any existing content
        featureArea.innerHTML = '';
        resultsContainer.innerHTML = '';
        
        // Display initial wordlist
        displayResults(currentFilteredWords);
        
        // Track the rank of MOST FREQUENT features
        let mostFrequentRank = 1;
        
        // Execute each step in sequence
        for (const step of steps) {
            console.log('Executing step:', step);
            
            let featureId = step.feature + 'Feature';
            if (step.feature === 'consonant') {
                featureId = 'consonantQuestion';
            }
            
            // Always create a fresh feature element for each step
            let featureElement;
            switch (step.feature) {
                case 'mostFrequent':
                    featureElement = createMostFrequentFeature();
                    break;
                case 'leastFrequent':
                    featureElement = createLeastFrequentFeature();
                    break;
                case 'length':
                    featureElement = createLengthFeature();
                    break;
                case 'notIn':
                    featureElement = createNotInFeature();
                    break;
                case 'position1':
                    featureElement = createPosition1Feature();
                    break;
                case 'vowel':
                    featureElement = createVowelFeature();
                    break;
                case 'o':
                    featureElement = createOFeature();
                    break;
                case 'lexicon':
                    featureElement = createLexiconFeature();
                    break;
                case 'eee':
                    featureElement = createEeeFeature();
                    break;
                case 'eeeFirst':
                    featureElement = createEeeFirstFeature();
                    break;
                case 'originalLex':
                    featureElement = createOriginalLexFeature();
                    break;
                case 'consonant':
                    featureElement = createConsonantQuestion();
                    break;
                case 'colour3':
                    featureElement = createColour3Feature();
                    break;
                case 'shape':
                    featureElement = createShapeFeature();
                    break;
                case 'curved':
                    featureElement = createCurvedFeature();
                    break;
                case 'abcde':
                    featureElement = createAbcdeFeature();
                    break;
                case 'abc':
                    featureElement = createAbcFeature();
                    break;
                case 'findEee':
                    featureElement = createFindEeeFeature();
                    break;
                default:
                    featureElement = null;
            }
            if (!featureElement) continue;
            featureArea.innerHTML = '';
            featureArea.appendChild(featureElement);
            featureElement.style.display = 'block';
            
            // For MOST FREQUENT feature, use the current rank
            if (step.feature === 'mostFrequent') {
                mostFrequentLetter = findMostFrequentLetter(currentFilteredWords, mostFrequentRank);
                if (mostFrequentLetter) {
                    const letterDisplay = featureElement.querySelector('.letter');
                    if (letterDisplay) {
                        letterDisplay.textContent = mostFrequentLetter;
                    }
                }
            }
            // For LEAST FREQUENT feature
            else if (step.feature === 'leastFrequent') {
                leastFrequentLetter = findLeastFrequentLetter(currentFilteredWords);
                if (leastFrequentLetter) {
                    const letterDisplay = featureElement.querySelector('.letter');
                    if (letterDisplay) {
                        letterDisplay.textContent = leastFrequentLetter;
                    }
                }
            }
            
            // Set up event listeners for this feature
            setupFeatureListeners(step.feature, (filteredWords) => {
                currentFilteredWords = filteredWords;
                displayResults(currentFilteredWords);
            });
            
            // Wait for user interaction
            await new Promise((resolve) => {
                const handleFeatureComplete = () => {
                    console.log(`Feature ${featureId} completed`);
                    featureElement.classList.add('completed');
                    featureElement.style.display = 'none';
                    
                    // If this was the MOST FREQUENT feature and YES was selected, increment the rank
                    if (step.feature === 'mostFrequent' && mostFrequentLetter) {
                        usedLettersInWorkflow.push(mostFrequentLetter);
                        mostFrequentRank++;
                    }
                    
                    resolve();
                };
                
                featureElement.addEventListener('completed', handleFeatureComplete, { once: true });
            });
        }
        
        // Show final results
        displayResults(currentFilteredWords);
    } catch (error) {
        console.error('Error executing workflow:', error);
        throw error;
    }
}

// Helper functions to create feature elements
function createPosition1Feature() {
    const div = document.createElement('div');
    div.id = 'position1Feature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">SHORT WORD</h2>
        <div class="position-input">
            <input type="text" id="position1Input" placeholder="Enter a word">
            <button id="position1Button">SUBMIT</button>
            <button id="position1DoneButton">DONE</button>
        </div>
    `;
    return div;
}

function createVowelFeature() {
    const div = document.createElement('div');
    div.id = 'vowelFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">VOWEL</h2>
        <div class="vowel-letter"></div>
        <div class="button-container">
            <button class="vowel-btn yes-btn">YES</button>
            <button class="vowel-btn no-btn">NO</button>
        </div>
        <div class="position-buttons">
            <button class="position-btn" data-position="1">1</button>
            <button class="position-btn" data-position="2">2</button>
            <button class="position-btn" data-position="3">3</button>
            <button class="position-btn" data-position="4">4</button>
            <button class="position-btn" data-position="5">5</button>
            <button class="position-btn" data-position="6">6</button>
            <button class="position-btn" data-position="7">7</button>
            <button class="position-btn" data-position="8">8</button>
        </div>
    `;
    return div;
}

function createOFeature() {
    const div = document.createElement('div');
    div.id = 'oFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">O?</h2>
        <div class="button-container">
            <button id="oYesBtn" class="yes-btn">YES</button>
            <button id="oNoBtn" class="no-btn">NO</button>
            <button id="oSkipBtn" class="skip-button">SKIP</button>
        </div>
    `;
    return div;
}

function createLexiconFeature() {
    const div = document.createElement('div');
    div.id = 'lexiconFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">LEXICON</h2>
        <div class="lexicon-input">
            <input type="text" id="lexiconInput" placeholder="Enter positions (e.g., 123)">
            <button id="lexiconButton">SUBMIT</button>
            <button id="lexiconSkipButton" class="skip-button">SKIP</button>
        </div>
    `;
    return div;
}

function createEeeFeature() {
    const div = document.createElement('div');
    div.id = 'eeeFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">EEE?</h2>
        <div class="button-container">
            <button id="eeeButton">E</button>
            <button id="eeeYesBtn" class="yes-btn">YES</button>
            <button id="eeeNoBtn" class="no-btn">NO</button>
        </div>
    `;
    return div;
}

function createEeeFirstFeature() {
    const div = document.createElement('div');
    div.id = 'eeeFirstFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">EEEFIRST</h2>
        <div class="button-container">
            <button id="eeeFirstButton">E</button>
            <button id="eeeFirstYesBtn" class="yes-btn">YES</button>
            <button id="eeeFirstNoBtn" class="no-btn">NO</button>
        </div>
        <button id="eeeFirstSkipButton" class="skip-button">SKIP</button>
    `;
    return div;
}

function createOriginalLexFeature() {
    const div = document.createElement('div');
    div.id = 'originalLexFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">LEXICON</h2>
        <div class="position-info">
            <div class="position-display">Position: <span class="position-number">1</span></div>
            <div class="possible-letters">Possible letters: <span class="letters-list"></span></div>
        </div>
        <div class="lexicon-input">
            <input type="text" id="originalLexInput" placeholder="Enter a word">
            <button id="originalLexButton">SUBMIT</button>
            <button id="originalLexSkipButton" class="skip-button">SKIP</button>
        </div>
    `;
    return div;
}

function createConsonantQuestion() {
    const div = document.createElement('div');
    div.id = 'consonantQuestion';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">CONSONANTS TOGETHER?</h2>
        <div class="button-container">
            <button id="consonantYesBtn" class="yes-btn">YES</button>
            <button id="consonantNoBtn" class="no-btn">NO</button>
        </div>
    `;
    return div;
}

function createColour3Feature() {
    const div = document.createElement('div');
    div.id = 'colour3Feature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">COLOUR3</h2>
        <div class="button-container">
            <button id="colour3YesBtn" class="yes-btn">YES</button>
            <button id="colour3SkipButton" class="skip-button">SKIP</button>
        </div>
    `;
    return div;
}

function createShapeFeature() {
    const div = document.createElement('div');
    div.id = 'shapeFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">SHAPE</h2>
        <div class="shape-display">
            <div class="position-display"></div>
            <div class="category-buttons"></div>
        </div>
    `;
    return div;
}

function createCurvedFeature() {
    const div = document.createElement('div');
    div.id = 'curvedFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">CURVED</h2>
        <div class="curved-buttons">
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
        </div>
        <button id="curvedSkipBtn" class="skip-button">SKIP</button>
    `;
    return div;
}

function createLengthFeature() {
    const div = document.createElement('div');
    div.id = 'lengthFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">LENGTH</h2>
        <div class="length-input">
            <input type="number" id="lengthInput" placeholder="Enter length (3+)" min="3">
            <button id="lengthButton">SUBMIT</button>
            <button id="lengthSkipButton" class="skip-button">SKIP</button>
        </div>
    `;
    return div;
}

function createMostFrequentFeature() {
    const div = document.createElement('div');
    div.id = 'mostFrequentFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">MOST FREQUENT</h2>
        <div class="frequent-letter-display">
            <div class="letter">-</div>
        </div>
        <div class="button-container">
            <button id="frequentYesBtn" class="yes-btn">YES</button>
            <button id="frequentNoBtn" class="no-btn">NO</button>
            <button id="frequentSkipButton" class="skip-button">SKIP</button>
        </div>
    `;
    return div;
}

function createLeastFrequentFeature() {
    const div = document.createElement('div');
    div.id = 'leastFrequentFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">LEAST FREQUENT</h2>
        <div class="frequent-letter-display">
            <div class="letter">-</div>
        </div>
        <div class="button-container">
            <button id="leastFrequentYesBtn" class="yes-btn">YES</button>
            <button id="leastFrequentNoBtn" class="no-btn">NO</button>
            <button id="leastFrequentSkipButton" class="skip-button">SKIP</button>
        </div>
    `;
    return div;
}

function createNotInFeature() {
    const div = document.createElement('div');
    div.id = 'notInFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">NOT IN</h2>
        <div class="input-group">
            <input type="text" id="notInInput" placeholder="Enter letters...">
            <button id="notInButton">SUBMIT</button>
            <button id="notInSkipButton" class="skip-button">SKIP</button>
        </div>
    `;
    return div;
}

// --- ABCDE Feature Logic ---
function createAbcdeFeature() {
    const div = document.createElement('div');
    div.id = 'abcdeFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">ABCDE</h2>
        <div class="abcde-row" style="display: flex; justify-content: center; gap: 10px;">
            <button class="abcde-btn" data-letter="A">A</button>
            <button class="abcde-btn" data-letter="B">B</button>
            <button class="abcde-btn" data-letter="C">C</button>
            <button class="abcde-btn" data-letter="D">D</button>
            <button class="abcde-btn" data-letter="E">E</button>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px; gap: 10px;">
            <button id="abcdeDoneButton">DONE</button>
            <button id="abcdeNoneButton" class="none-button">NONE</button>
            <button id="abcdeSkipButton" class="skip-button">SKIP</button>
        </div>
    `;
    return div;
}

// --- ABC Feature Logic ---
function createAbcFeature() {
    const div = document.createElement('div');
    div.id = 'abcFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">ABC</h2>
        <div class="abc-row" style="display: flex; justify-content: center; gap: 10px;">
            <button class="abc-btn" data-letter="A">A</button>
            <button class="abc-btn" data-letter="B">B</button>
            <button class="abc-btn" data-letter="C">C</button>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px; gap: 10px;">
            <button id="abcDoneButton">DONE</button>
            <button id="abcNoneButton" class="none-button">NONE</button>
            <button id="abcSkipButton" class="skip-button">SKIP</button>
        </div>
    `;
    return div;
}

// --- FIND-EEE Feature Logic ---
function createFindEeeFeature() {
    const div = document.createElement('div');
    div.id = 'findEeeFeature';
    div.className = 'feature-section';
    div.innerHTML = `
        <h2 class="feature-title">FIND-EEE</h2>
        <div class="find-eee-row" style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
            <button class="find-eee-btn" data-letter="B">B</button>
            <button class="find-eee-btn" data-letter="C">C</button>
            <button class="find-eee-btn" data-letter="D">D</button>
            <button class="find-eee-btn" data-letter="E">E</button>
            <button class="find-eee-btn" data-letter="G">G</button>
            <button class="find-eee-btn" data-letter="P">P</button>
            <button class="find-eee-btn" data-letter="T">T</button>
            <button class="find-eee-btn" data-letter="V">V</button>
            <button class="find-eee-btn" data-letter="Z">Z</button>
        </div>
        <div class="find-eee-position-row" style="display: flex; justify-content: center; gap: 10px; margin-top: 15px;">
            <button class="find-eee-position-btn" data-position="1">1</button>
            <button class="find-eee-position-btn" data-position="2">2</button>
            <button class="find-eee-position-btn" data-position="3">3</button>
            <button class="find-eee-position-btn" data-position="4">4</button>
            <button class="find-eee-position-btn" data-position="5">5</button>
            <button class="find-eee-position-btn" data-position="6">6</button>
            <button class="find-eee-position-btn" data-position="7">7</button>
            <button class="find-eee-position-btn" data-position="8">8</button>
        </div>
        <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px; gap: 10px;">
            <button id="findEeeSkipButton" class="skip-button">SKIP</button>
        </div>
    `;
    return div;
}

// Filtering logic for ABCDE feature
function filterWordsByAbcde(words, yesLetters) {
    return words.filter(word => {
        // Must include all YES letters
        for (const letter of yesLetters) {
            if (!word.includes(letter)) return false;
        }
        // Must NOT include any of the other letters (A-E not in yesLetters)
        for (const letter of ['A','B','C','D','E']) {
            if (!yesLetters.includes(letter) && word.includes(letter)) return false;
        }
        return true;
    });
}

// Filtering logic for ABC feature
function filterWordsByAbc(words, yesLetters) {
    return words.filter(word => {
        // Must include all YES letters
        for (const letter of yesLetters) {
            if (!word.includes(letter)) return false;
        }
        // Must NOT include any of the other letters (A-C not in yesLetters)
        for (const letter of ['A','B','C']) {
            if (!yesLetters.includes(letter) && word.includes(letter)) return false;
        }
        return true;
    });
}

// Filtering logic for FIND-EEE feature
function filterWordsByFindEee(words, selectedLetter, selectedPosition) {
    return words.filter(word => {
        if (selectedPosition === null) {
            // Only letter filtering - word must contain the letter anywhere
            return word.includes(selectedLetter);
        } else {
            // Letter + position filtering - word must have the letter at the specific position
            const position = selectedPosition - 1;
            return word.length > position && word[position] === selectedLetter;
        }
    });
}

// Function to setup feature listeners
function setupFeatureListeners(feature, callback) {
    switch (feature) {
        case 'position1': {
            const position1Button = document.getElementById('position1Button');
            const position1DoneButton = document.getElementById('position1DoneButton');
            const position1Input = document.getElementById('position1Input');
            
            if (position1Button) {
                position1Button.onclick = () => {
                    const input = position1Input?.value.trim();
                    if (input) {
                        const consonants = getConsonantsInOrder(input);
                        if (consonants.length >= 2) {
                            const filteredWords = filterWordsByPosition1(currentFilteredWords, consonants);
                            // Store the input word for vowel feature
                            currentPosition1Word = input.toUpperCase(); // Ensure it's uppercase
                            callback(filteredWords);
                            document.getElementById('position1Feature').dispatchEvent(new Event('completed'));
    } else {
                            alert('Please enter a word with at least 2 consonants');
                        }
                    } else {
                        alert('Please enter a word');
                    }
                };
                
                // Add touch event for mobile
                position1Button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    position1Button.click();
                }, { passive: false });
            }
            
            if (position1DoneButton) {
                position1DoneButton.onclick = () => {
                    callback(currentFilteredWords);
                    document.getElementById('position1Feature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                position1DoneButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    position1DoneButton.click();
                }, { passive: false });
            }
            break;
        }
            
        case 'vowel': {
            const vowelYesBtn = document.querySelector('#vowelFeature .yes-btn');
            const vowelNoBtn = document.querySelector('#vowelFeature .no-btn');
            const positionBtns = document.querySelectorAll('#vowelFeature .position-btn');
            
            // Initialize vowel processing with current words
            currentFilteredWordsForVowels = [...currentFilteredWords];
            originalFilteredWords = [...currentFilteredWords];
            currentVowelIndex = 0;
            
            // Get vowels from Position 1 word in order
            const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
            uniqueVowels = [];
            if (currentPosition1Word) {
                for (const char of currentPosition1Word.toLowerCase()) {
                    if (vowels.has(char)) {
                        uniqueVowels.push(char);
                    }
                }
            }
            
            // Set up the vowel display
            const vowelFeature = document.getElementById('vowelFeature');
            const vowelLetter = vowelFeature.querySelector('.vowel-letter');
            if (uniqueVowels.length > 0) {
                vowelLetter.textContent = uniqueVowels[0].toUpperCase();
                vowelLetter.style.display = 'inline-block';
            }

            // Function to filter words by vowel position
            function filterWordsByVowelPosition(words, vowel, position) {
                return words.filter(word => {
                    // Convert position to 0-based index
                    const pos = position - 1;
                    // Check if word is long enough and has the vowel in the specified position
                    return word.length > pos && word[pos].toLowerCase() === vowel.toLowerCase();
                });
            }

            // Add click handlers for position buttons
            positionBtns.forEach(btn => {
                btn.onclick = () => {
                    const position = parseInt(btn.dataset.position);
                    const currentVowel = uniqueVowels[currentVowelIndex];
                    if (currentVowel) {
                        const filteredWords = filterWordsByVowelPosition(currentFilteredWords, currentVowel, position);
                        callback(filteredWords);
                        document.getElementById('vowelFeature').dispatchEvent(new Event('completed'));
                    }
                };
                
                // Add touch event for mobile
                btn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    btn.click();
                }, { passive: false });
            });

            // Existing YES/NO button handlers remain unchanged
            if (vowelYesBtn) {
                vowelYesBtn.onclick = () => {
                    handleVowelSelection(true);
                };
                
                // Add touch event for mobile
                vowelYesBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    vowelYesBtn.click();
                }, { passive: false });
            }
            
            if (vowelNoBtn) {
                vowelNoBtn.onclick = () => {
                    handleVowelSelection(false);
                };
                
                // Add touch event for mobile
                vowelNoBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    vowelNoBtn.click();
                }, { passive: false });
            }
            break;
        }
            
        case 'o': {
            const oYesBtn = document.getElementById('oYesBtn');
            const oNoBtn = document.getElementById('oNoBtn');
            const oSkipBtn = document.getElementById('oSkipBtn');
            
            if (oYesBtn) {
                oYesBtn.onclick = () => {
                    const filteredWords = filterWordsByO(currentFilteredWords, true);
                    callback(filteredWords);
                    document.getElementById('oFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                oYesBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    oYesBtn.click();
                }, { passive: false });
            }
            
            if (oNoBtn) {
                oNoBtn.onclick = () => {
                    const filteredWords = filterWordsByO(currentFilteredWords, false);
                    callback(filteredWords);
                    document.getElementById('oFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                oNoBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    oNoBtn.click();
                }, { passive: false });
            }
            
            if (oSkipBtn) {
                oSkipBtn.onclick = () => {
                    callback(currentFilteredWords);
                    document.getElementById('oFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                oSkipBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    oSkipBtn.click();
                }, { passive: false });
            }
            break;
        }
            
        case 'curved': {
            const curvedButtons = document.querySelectorAll('.curved-btn');
            const curvedSkipBtn = document.getElementById('curvedSkipBtn');
            
            curvedButtons.forEach(button => {
                button.onclick = () => {
                    const letter = button.textContent;
                    const filteredWords = filterWordsByCurvedPositions(currentFilteredWords, letter);
                    callback(filteredWords);
                    document.getElementById('curvedFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                button.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    button.click();
                }, { passive: false });
            });
            
            if (curvedSkipBtn) {
                curvedSkipBtn.onclick = () => {
                    callback(currentFilteredWords);
                    document.getElementById('curvedFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                curvedSkipBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    curvedSkipBtn.click();
                }, { passive: false });
            }
            break;
        }
            
        case 'colour3': {
            const colour3YesBtn = document.getElementById('colour3YesBtn');
            const colour3SkipButton = document.getElementById('colour3SkipButton');
            
            if (colour3YesBtn) {
                colour3YesBtn.onclick = () => {
                    const filteredWords = filterWordsByColour3(currentFilteredWords);
                    callback(filteredWords);
                    document.getElementById('colour3Feature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                colour3YesBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    colour3YesBtn.click();
                }, { passive: false });
            }
            
            if (colour3SkipButton) {
                colour3SkipButton.onclick = () => {
                    callback(currentFilteredWords);
                    document.getElementById('colour3Feature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                colour3SkipButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    colour3SkipButton.click();
                }, { passive: false });
            }
            break;
        }
            
        case 'lexicon': {
            const lexiconButton = document.getElementById('lexiconButton');
            const lexiconSkipButton = document.getElementById('lexiconSkipButton');
            
            if (lexiconButton) {
                lexiconButton.onclick = () => {
                    const input = document.getElementById('lexiconInput')?.value.trim();
                    if (input) {
                        const filteredWords = filterWordsByLexicon(currentFilteredWords, input);
                        callback(filteredWords);
                        document.getElementById('lexiconFeature').dispatchEvent(new Event('completed'));
                    } else {
                        alert('Please enter positions (e.g., 123)');
                    }
                };
                
                // Add touch event for mobile
                lexiconButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    lexiconButton.click();
                }, { passive: false });
            }
            
            if (lexiconSkipButton) {
                lexiconSkipButton.onclick = () => {
                    callback(currentFilteredWords);
                    document.getElementById('lexiconFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                lexiconSkipButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    lexiconSkipButton.click();
                }, { passive: false });
            }
            break;
        }
            
        case 'consonant': {
            const consonantYesBtn = document.getElementById('consonantYesBtn');
            const consonantNoBtn = document.getElementById('consonantNoBtn');
            
            if (consonantYesBtn) {
                consonantYesBtn.onclick = () => {
                    hasAdjacentConsonants = true;
                    const filteredWords = currentFilteredWords.filter(word => hasWordAdjacentConsonants(word));
                    callback(filteredWords);
                    document.getElementById('consonantQuestion').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                consonantYesBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    consonantYesBtn.click();
                }, { passive: false });
            }
            
            if (consonantNoBtn) {
                consonantNoBtn.onclick = () => {
                    hasAdjacentConsonants = false;
                    const filteredWords = currentFilteredWords.filter(word => !hasWordAdjacentConsonants(word));
                    callback(filteredWords);
                    document.getElementById('consonantQuestion').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                consonantNoBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    consonantNoBtn.click();
                }, { passive: false });
            }
            break;
        }
            
        case 'eee': {
            const eeeButton = document.getElementById('eeeButton');
            const eeeYesBtn = document.getElementById('eeeYesBtn');
            const eeeNoBtn = document.getElementById('eeeNoBtn');
            
            if (eeeButton) {
                eeeButton.onclick = () => {
                    const filteredWords = filterWordsByEee(currentFilteredWords, 'E');
                    callback(filteredWords);
                    document.getElementById('eeeFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                eeeButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    eeeButton.click();
                }, { passive: false });
            }
            
            if (eeeYesBtn) {
                eeeYesBtn.onclick = () => {
                    const filteredWords = filterWordsByEee(currentFilteredWords, 'YES');
                    callback(filteredWords);
                    document.getElementById('eeeFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                eeeYesBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    eeeYesBtn.click();
                }, { passive: false });
            }
            
            if (eeeNoBtn) {
                eeeNoBtn.onclick = () => {
                    const filteredWords = filterWordsByEee(currentFilteredWords, 'NO');
                    callback(filteredWords);
                    document.getElementById('eeeFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                eeeNoBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    eeeNoBtn.click();
                }, { passive: false });
            }
            break;
        }

        case 'eeeFirst': {
            const eeeFirstButton = document.getElementById('eeeFirstButton');
            const eeeFirstYesBtn = document.getElementById('eeeFirstYesBtn');
            const eeeFirstNoBtn = document.getElementById('eeeFirstNoBtn');
            const eeeFirstSkipButton = document.getElementById('eeeFirstSkipButton');
            
            if (eeeFirstButton) {
                eeeFirstButton.onclick = () => {
                    const filteredWords = filterWordsByEeeFirst(currentFilteredWords, 'E');
                    callback(filteredWords);
                    document.getElementById('eeeFirstFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                eeeFirstButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    eeeFirstButton.click();
                }, { passive: false });
            }
            
            if (eeeFirstYesBtn) {
                eeeFirstYesBtn.onclick = () => {
                    const filteredWords = filterWordsByEeeFirst(currentFilteredWords, 'YES');
                    callback(filteredWords);
                    document.getElementById('eeeFirstFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                eeeFirstYesBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    eeeFirstYesBtn.click();
                }, { passive: false });
            }
            
            if (eeeFirstNoBtn) {
                eeeFirstNoBtn.onclick = () => {
                    const filteredWords = filterWordsByEeeFirst(currentFilteredWords, 'NO');
                    callback(filteredWords);
                    document.getElementById('eeeFirstFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                eeeFirstNoBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    eeeFirstNoBtn.click();
                }, { passive: false });
            }

            if (eeeFirstSkipButton) {
                eeeFirstSkipButton.onclick = () => {
                    callback(currentFilteredWords); // Keep the current word list unchanged
                    document.getElementById('eeeFirstFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                eeeFirstSkipButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    eeeFirstSkipButton.click();
                }, { passive: false });
            }
            break;
        }
        
        case 'originalLex': {
            const originalLexButton = document.getElementById('originalLexButton');
            const originalLexSkipButton = document.getElementById('originalLexSkipButton');
            const originalLexInput = document.getElementById('originalLexInput');
            
            // Find position with most variance and update display
            const { position, letters } = findPositionWithMostVariance(currentFilteredWords);
            originalLexPosition = position;
            
            // Update position display
            const positionNumber = document.querySelector('#originalLexFeature .position-number');
            if (positionNumber) {
                positionNumber.textContent = position + 1; // Convert to 1-based position
            }
            
            // Update possible letters display
            const lettersList = document.querySelector('#originalLexFeature .letters-list');
            if (lettersList) {
                lettersList.textContent = letters.join(', ');
            }
            
            if (originalLexButton) {
                originalLexButton.onclick = () => {
                    const input = originalLexInput?.value.trim();
                    if (input) {
                        const filteredWords = filterWordsByOriginalLex(currentFilteredWords, originalLexPosition, input);
                        callback(filteredWords);
                        document.getElementById('originalLexFeature').dispatchEvent(new Event('completed'));
                    } else {
                        alert('Please enter a word');
                    }
                };
                
                // Add touch event for mobile
                originalLexButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    originalLexButton.click();
                }, { passive: false });
            }
            
            if (originalLexSkipButton) {
                originalLexSkipButton.onclick = () => {
                    callback(currentFilteredWords);
                    document.getElementById('originalLexFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                originalLexSkipButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    originalLexSkipButton.click();
                }, { passive: false });
            }
            break;
        }

        case 'length': {
            const lengthButton = document.getElementById('lengthButton');
            const lengthSkipButton = document.getElementById('lengthSkipButton');
            const lengthInput = document.getElementById('lengthInput');
            
            if (lengthButton) {
                lengthButton.onclick = () => {
                    const input = lengthInput?.value.trim();
                    if (input) {
                        const length = parseInt(input);
                        if (length >= 3) {
                            const filteredWords = filterWordsByLength(currentFilteredWords, length);
                            callback(filteredWords);
                            document.getElementById('lengthFeature').dispatchEvent(new Event('completed'));
                        } else {
                            alert('Please enter a length of 3 or more');
                        }
                    } else {
                        alert('Please enter a length');
                    }
                };
                
                // Add touch event for mobile
                lengthButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    lengthButton.click();
                }, { passive: false });
            }
            
            if (lengthSkipButton) {
                lengthSkipButton.onclick = () => {
                    callback(currentFilteredWords);
                    document.getElementById('lengthFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                lengthSkipButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    lengthSkipButton.click();
                }, { passive: false });
            }
            break;
        }

        case 'mostFrequent': {
            const frequentYesBtn = document.getElementById('frequentYesBtn');
            const frequentNoBtn = document.getElementById('frequentNoBtn');
            const frequentSkipButton = document.getElementById('frequentSkipButton');
            const letterDisplay = document.querySelector('#mostFrequentFeature .letter');
            
            // Find and display most frequent letter (will skip already-answered letters)
            mostFrequentLetter = findMostFrequentLetter(currentFilteredWords);
            
            if (letterDisplay) {
                if (mostFrequentLetter) {
                    letterDisplay.textContent = mostFrequentLetter;
                    letterDisplay.style.color = '#000'; // Normal color
                    // Enable buttons if we have a letter
                    if (frequentYesBtn) frequentYesBtn.disabled = false;
                    if (frequentNoBtn) frequentNoBtn.disabled = false;
                } else {
                    letterDisplay.textContent = 'No more unique letters';
                    // Disable buttons if no more letters
                    if (frequentYesBtn) frequentYesBtn.disabled = true;
                    if (frequentNoBtn) frequentNoBtn.disabled = true;
                }
            }
            
            if (frequentYesBtn) {
                frequentYesBtn.onclick = () => {
                    if (mostFrequentLetter) {
                        // Update workflow state
                        workflowState.confirmedLetters.add(mostFrequentLetter);
                        console.log(`MOST FREQUENT: ${mostFrequentLetter} confirmed`);
                        logWorkflowState();
                        
                        const filteredWords = filterWordsByMostFrequent(currentFilteredWords, mostFrequentLetter, true);
                        callback(filteredWords);
                        document.getElementById('mostFrequentFeature').classList.add('completed');
                        document.getElementById('mostFrequentFeature').dispatchEvent(new Event('completed'));
                    }
                };
                
                // Add touch event for mobile
                frequentYesBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (!frequentYesBtn.disabled) {
                        frequentYesBtn.click();
                    }
                }, { passive: false });
            }
            
            if (frequentNoBtn) {
                frequentNoBtn.onclick = () => {
                    if (mostFrequentLetter) {
                        // Update workflow state
                        workflowState.excludedLetters.add(mostFrequentLetter);
                        console.log(`MOST FREQUENT: ${mostFrequentLetter} excluded`);
                        logWorkflowState();
                        
                        const filteredWords = filterWordsByMostFrequent(currentFilteredWords, mostFrequentLetter, false);
                        callback(filteredWords);
                        document.getElementById('mostFrequentFeature').classList.add('completed');
                        document.getElementById('mostFrequentFeature').dispatchEvent(new Event('completed'));
                    }
                };
                
                // Add touch event for mobile
                frequentNoBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (!frequentNoBtn.disabled) {
                        frequentNoBtn.click();
                    }
                }, { passive: false });
            }
            
            if (frequentSkipButton) {
                frequentSkipButton.onclick = () => {
                    callback(currentFilteredWords);
                    document.getElementById('mostFrequentFeature').classList.add('completed');
                    document.getElementById('mostFrequentFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                frequentSkipButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    frequentSkipButton.click();
                }, { passive: false });
            }
            break;
        }

        case 'leastFrequent': {
            const leastFrequentYesBtn = document.getElementById('leastFrequentYesBtn');
            const leastFrequentNoBtn = document.getElementById('leastFrequentNoBtn');
            const leastFrequentSkipButton = document.getElementById('leastFrequentSkipButton');
            const letterDisplay = document.querySelector('#leastFrequentFeature .letter');
            
            // Find and display least frequent letter (will skip already-answered letters)
            leastFrequentLetter = findLeastFrequentLetter(currentFilteredWords);
            
            if (letterDisplay) {
                if (leastFrequentLetter) {
                    letterDisplay.textContent = leastFrequentLetter;
                    letterDisplay.style.color = '#000'; // Normal color
                    // Enable buttons if we have a letter
                    if (leastFrequentYesBtn) leastFrequentYesBtn.disabled = false;
                    if (leastFrequentNoBtn) leastFrequentNoBtn.disabled = false;
                } else {
                    letterDisplay.textContent = 'No more unique letters';
                    // Disable buttons if no more letters
                    if (leastFrequentYesBtn) leastFrequentYesBtn.disabled = true;
                    if (leastFrequentNoBtn) leastFrequentNoBtn.disabled = true;
                }
            }
            
            if (leastFrequentYesBtn) {
                leastFrequentYesBtn.onclick = () => {
                    if (leastFrequentLetter) {
                        // Update workflow state
                        workflowState.confirmedLetters.add(leastFrequentLetter);
                        console.log(`LEAST FREQUENT: ${leastFrequentLetter} confirmed`);
                        logWorkflowState();
                        
                        const filteredWords = filterWordsByLeastFrequent(currentFilteredWords, leastFrequentLetter, true);
                        callback(filteredWords);
                        document.getElementById('leastFrequentFeature').classList.add('completed');
                        document.getElementById('leastFrequentFeature').dispatchEvent(new Event('completed'));
                    }
                };
                
                // Add touch event for mobile
                leastFrequentYesBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (!leastFrequentYesBtn.disabled) {
                        leastFrequentYesBtn.click();
                    }
                }, { passive: false });
            }
            
            if (leastFrequentNoBtn) {
                leastFrequentNoBtn.onclick = () => {
                    if (leastFrequentLetter) {
                        // Update workflow state
                        workflowState.excludedLetters.add(leastFrequentLetter);
                        console.log(`LEAST FREQUENT: ${leastFrequentLetter} excluded`);
                        logWorkflowState();
                        
                        const filteredWords = filterWordsByLeastFrequent(currentFilteredWords, leastFrequentLetter, false);
                        callback(filteredWords);
                        document.getElementById('leastFrequentFeature').classList.add('completed');
                        document.getElementById('leastFrequentFeature').dispatchEvent(new Event('completed'));
                    }
                };
                
                // Add touch event for mobile
                leastFrequentNoBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    if (!leastFrequentNoBtn.disabled) {
                        leastFrequentNoBtn.click();
                    }
                }, { passive: false });
            }
            
            if (leastFrequentSkipButton) {
                leastFrequentSkipButton.onclick = () => {
                    callback(currentFilteredWords);
                    document.getElementById('leastFrequentFeature').classList.add('completed');
                    document.getElementById('leastFrequentFeature').dispatchEvent(new Event('completed'));
                };
                
                // Add touch event for mobile
                leastFrequentSkipButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    leastFrequentSkipButton.click();
                }, { passive: false });
            }
            break;
        }

        case 'notIn': {
            const notInButton = document.getElementById('notInButton');
            const notInSkipButton = document.getElementById('notInSkipButton');
            const notInInput = document.getElementById('notInInput');

            if (notInButton && notInInput && notInSkipButton) {
                // Remove any existing event listeners
                const newNotInButton = notInButton.cloneNode(true);
                const newNotInSkipButton = notInSkipButton.cloneNode(true);
                const newNotInInput = notInInput.cloneNode(true);
                
                notInButton.parentNode.replaceChild(newNotInButton, notInButton);
                notInSkipButton.parentNode.replaceChild(newNotInSkipButton, notInSkipButton);
                notInInput.parentNode.replaceChild(newNotInInput, notInInput);

                newNotInButton.addEventListener('click', () => {
                    const letters = newNotInInput.value.toLowerCase();
                    if (letters) {
                        filterWordsByNotIn(letters);
                        callback(currentFilteredWords);
                        document.getElementById('notInFeature').classList.add('completed');
                        document.getElementById('notInFeature').dispatchEvent(new Event('completed'));
                    }
                });

                newNotInSkipButton.addEventListener('click', () => {
                    callback(currentFilteredWords);
                    document.getElementById('notInFeature').classList.add('completed');
                    document.getElementById('notInFeature').dispatchEvent(new Event('completed'));
                });

                // Add enter key support
                newNotInInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        newNotInButton.click();
                    }
                });

                // Add touch events for mobile
                newNotInButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    newNotInButton.click();
                }, { passive: false });

                newNotInSkipButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    newNotInSkipButton.click();
                }, { passive: false });
            }
            break;
        }

        case 'abcde': {
            const yesBtns = Array.from(document.querySelectorAll('.abcde-btn'));
            const doneBtn = document.getElementById('abcdeDoneButton');
            const skipBtn = document.getElementById('abcdeSkipButton');
            const noneBtn = document.getElementById('abcdeNoneButton');
            let yesLetters = [];

            yesBtns.forEach(btn => {
                btn.classList.remove('active');
                btn.onclick = () => {
                    const letter = btn.dataset.letter;
                    if (yesLetters.includes(letter)) {
                        yesLetters = yesLetters.filter(l => l !== letter);
                        btn.classList.remove('active');
                    } else {
                        yesLetters.push(letter);
                        btn.classList.add('active');
                    }
                };
                // Touch event for mobile
                btn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    btn.onclick();
                }, { passive: false });
            });

            if (doneBtn) {
                doneBtn.onclick = () => {
                    // Update workflow state with ABCDE selections
                    workflowState.abcdeSelection = new Set(yesLetters);
                    
                    // Add selected letters to confirmed letters
                    yesLetters.forEach(letter => {
                        workflowState.confirmedLetters.add(letter);
                    });
                    
                    // Add unselected letters to excluded letters
                    ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
                        if (!yesLetters.includes(letter)) {
                            workflowState.excludedLetters.add(letter);
                        }
                    });
                    
                    console.log(`ABCDE feature completed. Selected: ${yesLetters.join(', ')}`);
                    logWorkflowState();
                    
                    const filteredWords = filterWordsByAbcde(currentFilteredWords, yesLetters);
                    callback(filteredWords);
                    const featureDiv = document.getElementById('abcdeFeature');
                    featureDiv.classList.add('completed');
                    featureDiv.dispatchEvent(new Event('completed'));
                };
                doneBtn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    doneBtn.onclick();
                }, { passive: false });
            }
            
            if (noneBtn) {
                noneBtn.onclick = () => {
                    // Update workflow state - exclude all ABCDE letters
                    workflowState.abcdeSelection = new Set([]);
                    
                    // Add all ABCDE letters to excluded letters
                    ['A', 'B', 'C', 'D', 'E'].forEach(letter => {
                        workflowState.excludedLetters.add(letter);
                    });
                    
                    console.log(`ABCDE feature completed. NONE selected - all letters excluded`);
                    logWorkflowState();
                    
                    // Filter out words containing any of A, B, C, D, E
                    const filteredWords = currentFilteredWords.filter(word => {
                        return !['A', 'B', 'C', 'D', 'E'].some(letter => 
                            word.toUpperCase().includes(letter)
                        );
                    });
                    
                    callback(filteredWords);
                    const featureDiv = document.getElementById('abcdeFeature');
                    featureDiv.classList.add('completed');
                    featureDiv.dispatchEvent(new Event('completed'));
                };
                noneBtn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    noneBtn.onclick();
                }, { passive: false });
            }
            
            if (skipBtn) {
                skipBtn.onclick = () => {
                    callback(currentFilteredWords);
                    const featureDiv = document.getElementById('abcdeFeature');
                    featureDiv.classList.add('completed');
                    featureDiv.dispatchEvent(new Event('completed'));
                };
                skipBtn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    skipBtn.onclick();
                }, { passive: false });
            }
            break;
        }
        case 'abc': {
            const yesBtns = Array.from(document.querySelectorAll('.abc-btn'));
            const doneBtn = document.getElementById('abcDoneButton');
            const skipBtn = document.getElementById('abcSkipButton');
            const noneBtn = document.getElementById('abcNoneButton');
            let yesLetters = [];

            yesBtns.forEach(btn => {
                btn.classList.remove('active');
                btn.onclick = () => {
                    const letter = btn.dataset.letter;
                    if (yesLetters.includes(letter)) {
                        yesLetters = yesLetters.filter(l => l !== letter);
                        btn.classList.remove('active');
                    } else {
                        yesLetters.push(letter);
                        btn.classList.add('active');
                    }
                };
                // Touch event for mobile
                btn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    btn.onclick();
                }, { passive: false });
            });

            if (doneBtn) {
                doneBtn.onclick = () => {
                    // Update workflow state with ABC selections
                    workflowState.abcSelection = new Set(yesLetters);
                    
                    // Add selected letters to confirmed letters
                    yesLetters.forEach(letter => {
                        workflowState.confirmedLetters.add(letter);
                    });
                    
                    // Add unselected letters to excluded letters
                    ['A', 'B', 'C'].forEach(letter => {
                        if (!yesLetters.includes(letter)) {
                            workflowState.excludedLetters.add(letter);
                        }
                    });
                    
                    console.log(`ABC feature completed. Selected: ${yesLetters.join(', ')}`);
                    logWorkflowState();
                    
                    const filteredWords = filterWordsByAbc(currentFilteredWords, yesLetters);
                    callback(filteredWords);
                    const featureDiv = document.getElementById('abcFeature');
                    featureDiv.classList.add('completed');
                    featureDiv.dispatchEvent(new Event('completed'));
                };
                doneBtn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    doneBtn.onclick();
                }, { passive: false });
            }
            
            if (noneBtn) {
                noneBtn.onclick = () => {
                    // Update workflow state - exclude all ABC letters
                    workflowState.abcSelection = new Set([]);
                    
                    // Add all ABC letters to excluded letters
                    ['A', 'B', 'C'].forEach(letter => {
                        workflowState.excludedLetters.add(letter);
                    });
                    
                    console.log(`ABC feature completed. NONE selected - all letters excluded`);
                    logWorkflowState();
                    
                    // Filter out words containing any of A, B, C
                    const filteredWords = currentFilteredWords.filter(word => {
                        return !['A', 'B', 'C'].some(letter => 
                            word.toUpperCase().includes(letter)
                        );
                    });
                    
                    callback(filteredWords);
                    const featureDiv = document.getElementById('abcFeature');
                    featureDiv.classList.add('completed');
                    featureDiv.dispatchEvent(new Event('completed'));
                };
                noneBtn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    noneBtn.onclick();
                }, { passive: false });
            }
            
            if (skipBtn) {
                skipBtn.onclick = () => {
                    callback(currentFilteredWords);
                    const featureDiv = document.getElementById('abcFeature');
                    featureDiv.classList.add('completed');
                    featureDiv.dispatchEvent(new Event('completed'));
                };
                skipBtn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    skipBtn.onclick();
                }, { passive: false });
            }
            break;
        }
        case 'findEee': {
            const letterBtns = Array.from(document.querySelectorAll('.find-eee-btn'));
            const positionBtns = Array.from(document.querySelectorAll('.find-eee-position-btn'));
            const skipBtn = document.getElementById('findEeeSkipButton');
            let selectedLetter = null;
            let selectedPosition = null;

            // Reset all buttons
            letterBtns.forEach(btn => {
                btn.classList.remove('active');
                btn.onclick = () => {
                    const letter = btn.dataset.letter;
                    
                    // Select the letter
                    letterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedLetter = letter;
                    
                    console.log('Letter selected:', letter, 'Button classes:', btn.className);
                    
                    // Filter immediately by letter only
                    const filteredWords = filterWordsByFindEee(currentFilteredWords, letter, null);
                    callback(filteredWords);
                };
                // Touch event for mobile
                btn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    btn.onclick();
                }, { passive: false });
            });

            positionBtns.forEach(btn => {
                btn.classList.remove('active');
                btn.onclick = () => {
                    const position = parseInt(btn.dataset.position);
                    
                    // Select the position
                    positionBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    selectedPosition = position;
                    
                    console.log('Position selected:', position, 'Button classes:', btn.className);
                    
                    // If both letter and position are selected, apply filter and move to next feature
                    if (selectedLetter && selectedPosition) {
                        const filteredWords = filterWordsByFindEee(currentFilteredWords, selectedLetter, selectedPosition);
                        callback(filteredWords);
                        
                        // Move to next feature automatically
                        const featureDiv = document.getElementById('findEeeFeature');
                        featureDiv.classList.add('completed');
                        featureDiv.dispatchEvent(new Event('completed'));
                    }
                };
                // Touch event for mobile
                btn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    btn.onclick();
                }, { passive: false });
            });

            if (skipBtn) {
                skipBtn.onclick = () => {
                    // If letter is selected but no position, keep the letter filter
                    if (selectedLetter && !selectedPosition) {
                        // Keep current filtered words (letter filter already applied)
                        callback(currentFilteredWords);
                    } else if (!selectedLetter && !selectedPosition) {
                        // Nothing selected, no changes to wordlist
                        callback(currentFilteredWords);
                    }
                    
                    const featureDiv = document.getElementById('findEeeFeature');
                    featureDiv.classList.add('completed');
                    featureDiv.dispatchEvent(new Event('completed'));
                };
                skipBtn.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    skipBtn.onclick();
                }, { passive: false });
            }
            break;
        }
    }
}

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
    
    // Update word count first
    updateWordCount(words.length);
    
    // For large lists, use virtual scrolling approach
    if (words.length > 1000) {
        // Show first 1000 words with a "show more" option
        const initialWords = words.slice(0, 1000);
        const remainingCount = words.length - 1000;
        
        // Create HTML string for initial words (much faster than individual DOM elements)
        const wordListHTML = initialWords.map(word => `<li>${word}</li>`).join('');
        
        resultsContainer.innerHTML = `
            <ul class="word-list">
                ${wordListHTML}
            </ul>
            <div class="load-more-container" style="text-align: center; margin: 20px 0;">
                <button id="loadMoreBtn" class="load-more-btn" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Show ${remainingCount.toLocaleString()} more words
                </button>
            </div>
        `;
        
        // Add event listener for load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                // Show all words
                const allWordsHTML = words.map(word => `<li>${word}</li>`).join('');
                resultsContainer.innerHTML = `
                    <ul class="word-list">
                        ${allWordsHTML}
                    </ul>
                `;
            });
        }
    } else {
        // For smaller lists, show all words at once using innerHTML
        const wordListHTML = words.map(word => `<li>${word}</li>`).join('');
        resultsContainer.innerHTML = `
            <ul class="word-list">
                ${wordListHTML}
            </ul>
        `;
    }
    
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
        const vowelFeature = document.getElementById('vowelFeature');
        vowelFeature.classList.add('completed');
        // Update currentFilteredWords with the vowel-filtered results
        currentFilteredWords = [...currentFilteredWordsForVowels];
        
        // Hide vowel feature
        vowelFeature.style.display = 'none';
        
        // Reset both lexicon states
        lexiconCompleted = false;
        originalLexCompleted = false;
        
        // Dispatch the completed event
        console.log('Dispatching vowel feature completed event');
        const completedEvent = new Event('completed');
        vowelFeature.dispatchEvent(completedEvent);
        
        // Show next feature
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
    const features = [
        'position1Feature',
        'vowelFeature',
        'oFeature',
        'lexiconFeature',
        'eeeFeature',
        'eeeFirstFeature',
        'lengthFeature',
        'mostFrequentFeature',
        'leastFrequentFeature',
        'notInFeature',
        'abcdeFeature',
        'abcFeature',
    ];
    
    // Hide all features first
    features.forEach(feature => {
        const element = document.getElementById(feature);
        if (element) {
            element.style.display = 'none';
        }
    });
    
    // Show the first non-completed feature
    if (!document.getElementById('position1Feature').classList.contains('completed')) {
        document.getElementById('position1Feature').style.display = 'block';
    }
    else if (!document.getElementById('vowelFeature').classList.contains('completed')) {
        document.getElementById('vowelFeature').style.display = 'block';
    }
    else if (!document.getElementById('oFeature').classList.contains('completed')) {
        document.getElementById('oFeature').style.display = 'block';
    }
    else if (!document.getElementById('lexiconFeature').classList.contains('completed')) {
        document.getElementById('lexiconFeature').style.display = 'block';
    }
    else if (!document.getElementById('eeeFeature').classList.contains('completed')) {
        document.getElementById('eeeFeature').style.display = 'block';
    }
    else if (!document.getElementById('eeeFirstFeature').classList.contains('completed')) {
        document.getElementById('eeeFirstFeature').style.display = 'block';
    }
    else if (!document.getElementById('lengthFeature').classList.contains('completed')) {
        document.getElementById('lengthFeature').style.display = 'block';
    }
    else if (!document.getElementById('mostFrequentFeature').classList.contains('completed')) {
        document.getElementById('mostFrequentFeature').style.display = 'block';
    }
    else if (!document.getElementById('leastFrequentFeature').classList.contains('completed')) {
        document.getElementById('leastFrequentFeature').style.display = 'block';
    }
    else if (!document.getElementById('notInFeature').classList.contains('completed')) {
        document.getElementById('notInFeature').style.display = 'block';
    }
    else if (!document.getElementById('abcdeFeature').classList.contains('completed')) {
        document.getElementById('abcdeFeature').style.display = 'block';
    }
    else if (!document.getElementById('abcFeature').classList.contains('completed')) {
        document.getElementById('abcFeature').style.display = 'block';
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
    currentPosition1Word = '';
    originalLexCompleted = false;
    lexiconCompleted = false;
    eeeCompleted = false;
    
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
        'curvedFeature',
        'lexiconFeature',
        'originalLexFeature',
        'eeeFeature',
        'eeeFirstFeature',
        'lengthFeature',
        'mostFrequentFeature',
        'leastFrequentFeature',
        'notInFeature',
        'abcdeFeature',
        'abcFeature',
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
    document.getElementById('originalLexInput').value = '';
    document.getElementById('lexiconInput').value = '';
    document.getElementById('notInInput').value = '';
    
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

// Function to filter words by EEEFIRST feature
function filterWordsByEeeFirst(words, mode) {
    return words.filter(word => {
        if (word.length < 1) return false;
        
        const firstChar = word[0].toUpperCase();
        
        switch(mode) {
            case 'E':
                return firstChar === 'E';
                
            case 'YES':
                const yesLetters = new Set(['B', 'C', 'D', 'G', 'P', 'T', 'V', 'Z']);
                return yesLetters.has(firstChar);
                
            case 'NO':
                const noLetters = new Set(['B', 'C', 'D', 'G', 'P', 'T', 'V', 'Z']);
                return !noLetters.has(firstChar);
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

// Initialize drag and drop functionality
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
    // Allow multiple instances of MOST FREQUENT and LEAST FREQUENT features
    if (featureType === 'mostFrequent' || featureType === 'leastFrequent') {
        return false;
    }
    // For all other features, maintain the single instance rule
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
    
    // Add click event to remove feature
    selectedFeature.addEventListener('click', () => {
        selectedFeature.remove();
    });
    
    // Add touch event for mobile
    selectedFeature.addEventListener('touchstart', (e) => {
        e.preventDefault();
        selectedFeature.remove();
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
    
    // Initialize scroll indicator
    const scrollIndicator = document.getElementById('scrollIndicator');
    const availableFeatures = document.getElementById('availableFeatures');
    
    if (scrollIndicator && availableFeatures) {
        // Check if scrolling is needed
        const checkScrollNeeded = () => {
            const isScrollable = availableFeatures.scrollHeight > availableFeatures.clientHeight;
            scrollIndicator.classList.toggle('hidden', !isScrollable);
        };
        
        // Check on load
        checkScrollNeeded();
        
        // Check on resize
        window.addEventListener('resize', checkScrollNeeded);
        
        // Handle scroll indicator click
        scrollIndicator.addEventListener('click', () => {
            console.log('Scroll indicator clicked');
            console.log('availableFeatures:', availableFeatures);
            console.log('scrollHeight:', availableFeatures.scrollHeight, 'clientHeight:', availableFeatures.clientHeight);
            availableFeatures.scrollTo({
                top: availableFeatures.scrollHeight,
                behavior: 'smooth'
            });
        });
        
        // Hide indicator when scrolled to bottom
        availableFeatures.addEventListener('scroll', () => {
            const isAtBottom = availableFeatures.scrollTop + availableFeatures.clientHeight >= availableFeatures.scrollHeight - 10;
            scrollIndicator.classList.toggle('hidden', isAtBottom);
        });
    } else {
        if (!scrollIndicator) console.log('Scroll indicator button not found');
        if (!availableFeatures) console.log('Available features container not found');
    }
    
    // Improve LENGTH input touch sensitivity
    const lengthInput = document.getElementById('lengthInput');
    if (lengthInput) {
        lengthInput.setAttribute('tabindex', '0');
        lengthInput.addEventListener('touchstart', function(e) {
            e.stopPropagation();
            this.focus();
        }, { passive: false });
        lengthInput.addEventListener('click', function() {
            this.focus();
        });
    }
    // ... existing code ...
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
            // Remove existing event listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Add click event
            newButton.addEventListener('click', () => {
                const featureType = newButton.dataset.feature;
                if (!isFeatureAlreadySelected(featureType)) {
                    addFeatureToSelected(featureType);
                }
            });
            
            // Add touch event for mobile with debounce
            let touchTimeout;
            newButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (touchTimeout) {
                    clearTimeout(touchTimeout);
                }
                touchTimeout = setTimeout(() => {
                    const featureType = newButton.dataset.feature;
                if (!isFeatureAlreadySelected(featureType)) {
                    addFeatureToSelected(featureType);
                }
                }, 100);
            }, { passive: false });
        });
    }
}

function isFeatureAlreadySelected(featureType) {
    const selectedFeatures = document.getElementById('selectedFeaturesList');
    // Allow multiple instances of MOST FREQUENT and LEAST FREQUENT features
    if (featureType === 'mostFrequent' || featureType === 'leastFrequent') {
        // Check if the feature was just added (within the last 500ms)
        const lastAdded = selectedFeatures.getAttribute('lastAdded');
        const lastAddedTime = selectedFeatures.getAttribute('lastAddedTime');
        const now = Date.now();
        
        if (lastAdded === featureType && lastAddedTime && (now - parseInt(lastAddedTime)) < 500) {
            return true;
        }
        
        selectedFeatures.setAttribute('lastAdded', featureType);
        selectedFeatures.setAttribute('lastAddedTime', now.toString());
        return false;
    }
    // For all other features, maintain the single instance rule
    return selectedFeatures.querySelector(`[data-feature="${featureType}"]`) !== null;
}

function addFeatureToSelected(featureType) {
    const selectedFeatures = document.getElementById('selectedFeaturesList');
    const featureButton = document.querySelector(`.feature-button[data-feature="${featureType}"]`);
    
    if (!featureButton) return;
    
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
        e.stopPropagation();
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

// Remove the duplicate addFeatureToList function since we're using addFeatureToSelected
// ... existing code ...

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
    #createWorkflowButton {
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
    
    #createWorkflowButton:hover {
        background-color: #45a049;
    }
    
    #performButton {
        width: 200px;
        height: 40px;
        font-size: 16px;
        font-weight: bold;
        padding: 8px 16px;
        margin: 10px;
        border-radius: 4px;
        background-color: #4169E1; /* Royal Blue */
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
    
    #performButton:hover {
        background-color: #1E40AF; /* Darker Royal Blue for hover */
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
    document.getElementById('homepage').style.display = 'none';
    document.getElementById('workflowExecution').style.display = 'none';
    document.getElementById('workflowCreation').style.display = 'block';
    
    // Hide saved workflows initially
    const savedWorkflows = document.getElementById('savedWorkflows');
    if (savedWorkflows) {
        savedWorkflows.style.display = 'none';
    }
    
    // Initialize info buttons
    initializeInfoButtons();
}

// Hide workflow creation page
function hideWorkflowCreation() {
    document.getElementById('homepage').style.display = 'block';
    document.getElementById('workflowCreation').style.display = 'none';
    document.getElementById('workflowExecution').style.display = 'none';
}

// Hide native select elements to prevent overlap with custom dropdowns (aggressive)
const hideNativeSelectStyle = document.createElement('style');
hideNativeSelectStyle.textContent = `
select#workflowSelect,
select#wordlistSelect {
    display: none !important;
    position: absolute !important;
    left: -9999px !important;
    width: 1px !important;
    height: 1px !important;
    opacity: 0 !important;
    pointer-events: none !important;
    z-index: -1 !important;
}
`;
document.head.appendChild(hideNativeSelectStyle);

// Inject CSS to lower z-index and opacity of other custom-selects when workflow dropdown is open
const workflowDropdownCSS = document.createElement('style');
workflowDropdownCSS.textContent = `
body.workflow-dropdown-open .custom-select:not(#workflowCustomSelect) {
    z-index: 1 !important;
    opacity: 0.2 !important;
    pointer-events: none !important;
}
`;
document.head.appendChild(workflowDropdownCSS);

// Add filtering function
function filterWordsByLength(words, length) {
    return words.filter(word => word.length === length);
}

// Add helper function to find most frequent letter
function findMostFrequentLetter(words, rank = 1) {
    // Count frequencies of all letters
    const frequencyMap = new Map();
    words.forEach(word => {
        [...word].forEach(letter => {
            // Only count letters A-Z (same filter as findLeastFrequentLetter)
            if (/^[A-Z]$/.test(letter)) {
                frequencyMap.set(letter, (frequencyMap.get(letter) || 0) + 1);
            }
        });
    });
    
    // Sort letters by frequency
    const sortedLetters = [...frequencyMap.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0]);
    
    // Find the nth most frequent letter that hasn't been answered in this workflow
    let count = 0;
    for (const letter of sortedLetters) {
        // Skip letters that have already been confirmed or excluded in this workflow
        if (!workflowState.confirmedLetters.has(letter) && !workflowState.excludedLetters.has(letter)) {
            count++;
            if (count === rank) {
                return letter;
            }
        }
    }
    return null;  // No more unique frequent letters that haven't been answered
}

// Add filtering function
function filterWordsByMostFrequent(words, letter, include) {
    return words.filter(word => {
        const hasLetter = word.toUpperCase().includes(letter);
        return include ? hasLetter : !hasLetter;
    });
}

// Function to find the least frequent letter
function findLeastFrequentLetter(words) {
    // Count frequencies of all letters
    const frequencyMap = new Map();
    words.forEach(word => {
        [...word].forEach(letter => {
            // Only count letters A-Z
            if (/^[A-Z]$/.test(letter)) {
                frequencyMap.set(letter, (frequencyMap.get(letter) || 0) + 1);
            }
        });
    });
    
    // Sort letters by frequency (ascending)
    const sortedLetters = [...frequencyMap.entries()]
        .sort((a, b) => a[1] - b[1])
        .map(entry => entry[0]);
    
    // Return the least frequent letter that hasn't been answered in this workflow
    for (const letter of sortedLetters) {
        // Skip letters that have already been confirmed or excluded in this workflow
        if (!workflowState.confirmedLetters.has(letter) && !workflowState.excludedLetters.has(letter)) {
            return letter;
        }
    }
    return null;  // No more unique letters that haven't been answered
}

// Function to filter words based on least frequent letter
function filterWordsByLeastFrequent(words, letter, include) {
    if (!letter) return words;
    return words.filter(word => {
        const hasLetter = word.includes(letter);
        return include ? hasLetter : !hasLetter;
    });
}

// Add a cooldown map to track when features were last added
const featureCooldown = new Map();

function initializeFeatureSelection() {
    const availableFeatures = document.getElementById('availableFeatures');
    const selectedFeaturesList = document.getElementById('selectedFeaturesList');
    
    if (availableFeatures) {
        const featureButtons = availableFeatures.querySelectorAll('.feature-button');
        
        featureButtons.forEach(button => {
            // Remove existing event listeners
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            // Single handler for both click and touch
            const handleFeatureSelection = (e) => {
                e.preventDefault();
                const featureType = newButton.dataset.feature;
                
                // Check cooldown
                const lastAdded = featureCooldown.get(featureType);
                const now = Date.now();
                if (lastAdded && (now - lastAdded) < 1000) {
                    return; // Ignore if within cooldown period
                }
                
                if (!isFeatureAlreadySelected(featureType)) {
                    addFeatureToSelected(featureType);
                    featureCooldown.set(featureType, now);
                }
            };
            
            // Add both click and touch events
            newButton.addEventListener('click', handleFeatureSelection);
            newButton.addEventListener('touchstart', handleFeatureSelection, { passive: false });
        });
    }
}

function isFeatureAlreadySelected(featureType) {
    const selectedFeatures = document.getElementById('selectedFeaturesList');
    // Allow multiple instances of MOST FREQUENT and LEAST FREQUENT features
    if (featureType === 'mostFrequent' || featureType === 'leastFrequent') {
        return false;
    }
    // For all other features, maintain the single instance rule
    return selectedFeatures.querySelector(`[data-feature="${featureType}"]`) !== null;
}

function addFeatureToSelected(featureType) {
    const selectedFeatures = document.getElementById('selectedFeaturesList');
    const featureButton = document.querySelector(`.feature-button[data-feature="${featureType}"]`);
    
    if (!featureButton) return;
    
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
        e.stopPropagation();
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

// Add NOT IN feature to the featureElements object
const featureElements = {
    // ... existing features ...
    notIn: createNotInFeature(),
};

// Add NOT IN feature handlers
function initializeNotInFeature() {
    const notInButton = document.getElementById('notInButton');
    const notInInput = document.getElementById('notInInput');
    const notInSkipButton = document.getElementById('notInSkipButton');

    if (notInButton && notInInput && notInSkipButton) {
        // Remove any existing event listeners
        const newNotInButton = notInButton.cloneNode(true);
        const newNotInSkipButton = notInSkipButton.cloneNode(true);
        const newNotInInput = notInInput.cloneNode(true);
        
        notInButton.parentNode.replaceChild(newNotInButton, notInButton);
        notInSkipButton.parentNode.replaceChild(newNotInSkipButton, notInSkipButton);
        notInInput.parentNode.replaceChild(newNotInInput, notInInput);

        newNotInButton.addEventListener('click', () => {
            const letters = newNotInInput.value.toLowerCase();
            if (letters) {
                filterWordsByNotIn(letters);
                callback(currentFilteredWords);
                document.getElementById('notInFeature').classList.add('completed');
                document.getElementById('notInFeature').dispatchEvent(new Event('completed'));
            }
        });

        newNotInSkipButton.addEventListener('click', () => {
            callback(currentFilteredWords);
            document.getElementById('notInFeature').classList.add('completed');
            document.getElementById('notInFeature').dispatchEvent(new Event('completed'));
        });

        // Add enter key support
        newNotInInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                newNotInButton.click();
            }
        });

        // Add touch events for mobile
        newNotInButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            newNotInButton.click();
        }, { passive: false });

        newNotInSkipButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            newNotInSkipButton.click();
        }, { passive: false });
    }
}

function filterWordsByNotIn(letters) {
    const letterSet = new Set(letters.toLowerCase());
    currentFilteredWords = currentFilteredWords.filter(word => {
        // Check if ANY of the letters are in the word
        return !Array.from(letterSet).some(letter => word.toLowerCase().includes(letter));
    });
    displayResults(currentFilteredWords);
}