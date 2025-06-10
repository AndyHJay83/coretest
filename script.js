import { createLengthFeature, lengthFeatureCSS } from './lengthFeature.js';

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

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    // Load word list
    await loadWordList();
    
    // Load saved workflows from localStorage
    const savedWorkflows = localStorage.getItem('workflows');
    if (savedWorkflows) {
        workflows = JSON.parse(savedWorkflows);
    }
    
    // Initialize dropdowns
    initializeDropdowns();
    
    // Display saved workflows
    displaySavedWorkflows();
}); 