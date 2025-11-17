const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

(async () => {
  const htmlPath = path.join(__dirname, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf-8');
  const css = fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf-8');
  const js = fs.readFileSync(path.join(__dirname, 'script.js'), 'utf-8');

  html = html
    .replace('<link rel="stylesheet" href="styles.css">', `<style>${css}</style>`)
    .replace('<script src="script.js"></script>', `<script>${js}</script>`);

  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    beforeParse(window) {
      window.alert = (msg) => console.log('[alert]', msg);
      window.matchMedia = window.matchMedia || function() { return { matches: false, addListener() {}, removeListener() {} }; };
      window.navigator.serviceWorker = { register: async () => ({}) };
      window.navigator.vibrate = () => {};
      window.fetch = async () => ({ ok: false });
    }
  });

  await new Promise(resolve => {
    dom.window.addEventListener('load', resolve);
  });

  const { window } = dom;
  if (!window.executeWorkflow) {
    console.error('executeWorkflow not found');
    return;
  }

  window.loadWordList = async function() {
    window.wordList = ['APPLE', 'BANANA', 'ORANGE'];
    window.currentFilteredWords = [...window.wordList];
    window.totalWords = window.wordList.length;
    window.wordListLoaded = true;
    return window.wordList;
  };

  const workflowPromise = window.executeWorkflow([{ feature: 'positionCons' }]);

  setTimeout(() => {
    const featureArea = window.document.getElementById('featureArea');
    console.log('featureArea snapshot before input:', featureArea.innerHTML.trim());
    const positionInput = window.document.getElementById('positionConsPosition');
    const lettersInput = window.document.getElementById('positionConsLetters');
    const countInput = window.document.getElementById('positionConsCount');
    const submitButton = window.document.getElementById('positionConsSubmit');
    if (positionInput && lettersInput && countInput && submitButton) {
      positionInput.value = '2';
      lettersInput.value = 'ABC';
      countInput.value = '1';
      submitButton.click();
    } else {
      console.error('Failed to find POSITION-CONS inputs');
    }
  }, 100);

  try {
    await workflowPromise;
    const featureArea = window.document.getElementById('featureArea');
    console.log('featureArea HTML after completion:', featureArea.innerHTML.trim());
  } catch (err) {
    console.error('Error executing workflow:', err);
  }
})();
