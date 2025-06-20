// Test script for Most Frequent Letter fix
const testWords = ['APPLE', 'BANANA', 'CARROT', 'DOG', 'ELEPHANT', 'FROG', 'GRAPE', 'HOUSE', 'IGLOO', 'JUICE'];

// Test with words that have spaces and special characters
const testWordsWithSpaces = ['APPLE PIE', 'BANANA-SPLIT', 'CARROT CAKE', 'DOG HOUSE', 'ELEPHANT-SIZED', 'FROG LEGS', 'GRAPE JUICE', 'HOUSE-KEEPING', 'IGLOO BUILDING', 'JUICE BOX'];

// Mock the usedLettersInWorkflow variable
const usedLettersInWorkflow = [];

// Fixed findMostFrequentLetter function (copied from script.js)
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
    
    // Find the nth most frequent letter that hasn't been used
    let count = 0;
    for (const letter of sortedLetters) {
        if (!usedLettersInWorkflow.includes(letter)) {
            count++;
            if (count === rank) {
                return letter;
            }
        }
    }
    return null;  // No more unique frequent letters
}

// Test cases
console.log('Testing Most Frequent Letter Fix:');
console.log('');

// Test 1: Normal words (should work as before)
console.log('Test 1: Normal words');
const result1 = findMostFrequentLetter(testWords, 1);
console.log('Most frequent letter:', result1);
console.log('Expected: A letter (A-Z)');
console.log('');

// Test 2: Words with spaces and special characters
console.log('Test 2: Words with spaces and special characters');
const result2 = findMostFrequentLetter(testWordsWithSpaces, 1);
console.log('Most frequent letter:', result2);
console.log('Expected: A letter (A-Z), NOT a space or special character');
console.log('');

// Test 3: Show all characters in test words with spaces
console.log('Test 3: All characters in test words with spaces');
const allChars = new Set();
testWordsWithSpaces.forEach(word => {
    [...word].forEach(char => allChars.add(char));
});
console.log('All unique characters found:', Array.from(allChars).sort());
console.log('Expected: Should include spaces, hyphens, and letters');
console.log('');

// Test 4: Show frequency map for words with spaces
console.log('Test 4: Frequency map for words with spaces');
const frequencyMap = new Map();
testWordsWithSpaces.forEach(word => {
    [...word].forEach(letter => {
        if (/^[A-Z]$/.test(letter)) {
            frequencyMap.set(letter, (frequencyMap.get(letter) || 0) + 1);
        }
    });
});
console.log('Letter frequencies (A-Z only):', Object.fromEntries(frequencyMap));
console.log('Expected: Only A-Z letters, no spaces or special characters');
console.log('');

console.log('Most Frequent Letter fix test completed!'); 