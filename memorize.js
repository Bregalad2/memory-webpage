var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition
var SpeechGrammarList = SpeechGrammarList || window.webkitSpeechGrammarList
var SpeechRecognitionEvent = SpeechRecognitionEvent || webkitSpeechRecognitionEvent

var TOKEN = "cb7ee6a078ba50116ec0fe3bd87a9a9b"

var books = ['genesis', 'exodus', 'leviticus', 'numbers', 'deuteronomy',
'joshua', 'judges', 'ruth', '1 samuel', '2 samuel', '1 kings',
'2 kings', '1 chronicles', '2 chronicles', 'ezra', 'nehemiah',
'esther', 'job', 'psalm', 'proverbs', 'ecclesiastes', 'song of songs', 'isaiah',
'jeremiah', 'lamentations', 'ezekiel', 'daniel', 'hosea', 'joel', 'amos',
'obadiah', 'jonah', 'micah', 'nahum', 'habakkuk', 'zephaniah', 'haggai',
'zechariah', 'malachi', 'matthew', 'mark', 'luke', 'john', 'acts', 'romans',
'first corinthians', 'second corinthians', 'galatians', 'ephesians', 'philippians',
'colossians', '1 thessalonians', '2 thessalonians', '1 timothy',
'2 timothy', 'titus', 'philemon', 'hebrews', 'james', '1 peter', '2 peter',
'1 john', '2 john', '3 john', 'jude', 'revelation'
]

var altBooks = {
  '1st samuel': '1 samuel',
  '2nd samuel': '2 samuel',
  '1st kings': '1 kings',
  '2nd kings': '2 kings',
  '1st chronicles': '1 chronicles',
  '2nd chronicles': '2 chronicles',
  '1st thessalonians': '1 thessalonians',
  '2nd thessalonians': '2 thessalonians',
  '1st timothy': '1 timothy',
  '2nd timothy': '2 timothy',
  '1st peter': '1 peter',
  '2nd peter': '2 peter',
  '1st john': '1 john',
  '2nd john': '2 john',
  '3rd john': '3 john'
};

var esv = ['ESV', 'esv', 'esb', 'english standard', 'e s']

var nasb = ['NASB', 'nas', 'nasty', 'new american', 'n a s']

var kjv = ['KJV', 'king james', 'kj', 'k j']

var versions = [kjv, nasb, esv]
var versionKey = {"NASB": "685d1470fe4d5c3b-01",
  "ESV": "685d1470fe4d5c3b-01",
  "KJV": "de4e12af7f28f599-01"
}

var recognition = new SpeechRecognition();
recognition.continuous = true;
recognition.interimResults = true;

recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;
recognition.maxAlternatives = 1;

var diagnostic = document.querySelector('.output');
var version = document.querySelector('.version');
var bg = document.querySelector('html');

document.body.onclick = function() {
  recognition.start();
}

recognition.onresult = function(event) {
  // The SpeechRecognitionEvent results property returns a SpeechRecognitionResultList object
  // The SpeechRecognitionResultList object contains SpeechRecognitionResult objects.
  // It has a getter so it can be accessed like an array
  // The first [0] returns the SpeechRecognitionResult at the last position.
  // Each SpeechRecognitionResult object contains SpeechRecognitionAlternative objects that contain individual results.
  // These also have getters so they can be accessed like arrays.
  // The second [0] returns the SpeechRecognitionAlternative at position 0.
  // We then return the transcript property of the SpeechRecognitionAlternative object
  var transcript = event.results[0][0].transcript;
  diagnostic.textContent = 'Last heard: ' + transcript + '.';

  if (JSON.stringify(transcript).toLowerCase().includes('zahavi') || JSON.stringify(transcript).toLowerCase().includes('zahabi')) {
    onCommand(event)
  }

  console.log('Result: ' + transcript);
}

recognition.onspeechend = function() {
  recognition.stop();
  setTimeout(document.body.onclick, 100)
}

recognition.onnomatch = function(event) {
  diagnostic.textContent = "I didn't recognise that color.";
}

recognition.onerror = function(event) {
  diagnostic.textContent = 'Error occurred in recognition: ' + event.error;
  console.log(event.error)
}

//onCommand: runs when Silas is heard
function onCommand (event) {
  var transcript = JSON.stringify(event.results[0][0].transcript);
  if (transcript.toLowerCase().includes('load')||transcript.toLowerCase().includes('learn')) {
    commandLoad(event);
  }
}

//commandLoad: the command for load / learn
function commandLoad (event) {
  var verses = verseRecognition(event);
  console.log(verses)
  var fetcher = new XMLHttpRequest();
  fetcher.withCredentials = false;
  fetcher.addEventListener('readystatechange', function () {
    if (this.readyState === this.DONE) {
      const { data, meta } = JSON.parse(this.responseText);
      //_BAPI.t(meta.fumsId);
      resolve(data);
    }
  });
  var key = versionKey[verses[0]]

  fetcher.open(
    'GET',
    'https://api.scripture.api.bible/v1/bibles/'+key+'/search?query='+verses[1]+verses[2]+verses[3][0]
  );
  fetcher.setRequestHeader('api-key', TOKEN);
  fetcher.onerror = () => reject(fetcher.statusText);
  fetcher.send();
  console.log(fetcher.responseText)
  version.innerHTML = fetcher.responseText
}

// recognise verses
function verseRecognition (event) {
  var book = "";
  var chapter = 0;
  var verses = [];
  var version = 'NASB';
  var fuzzyBooks = FuzzySet(books);
  var transcript = JSON.stringify(event.results[0][0].transcript);
  var numbers = transcript.match(/\d+/g).map(Number);


  if (transcript[0] in ['first', 'second', 'third']) {
    spokenStuff = [transcript[0]+" "+transcript[1], transcript[2], [transcript[3]]]
  } else {
    spokenStuff = [transcript[0], transcript[1], [transcript[2]]]
  }

  var newVersion = versionRecognition(event)
  if (newVersion != '') {
    version = newVersion
  }

  for (var key in altBooks) {
    if (transcript.toLowerCase().includes(key)) {
      numbers = numbers.slice(1)
    }
    transcript = transcript.toLowerCase().replace(key, altBooks[key])
  }
  for (var b = 1; b<books.length; b++) {
    if (transcript.toLowerCase().indexOf(books[b]) != -1) {
      book = books[b];
    }
  }

  if (book == '') {
    book = fuzzyBooks.get(transcript)[0][1]
  }

  chapter = numbers[0]
  verses = [numbers[1]]


  if (numbers[2]) {
    if (transcript.indexOf('and') != -1 || transcript.indexOf('&') != -1 || transcript.indexOf('an ') != -1) {
      verses = numbers.slice(1)
    } else {verses = getRange(numbers[1], numbers[2])}
  }

  return [version, book, chapter, verses]
}

// recognise version: KJV, ESV, or NASB
function versionRecognition (event) {
  var color = event.results[0][0].transcript;
  var newVersion = '';
  for (ver = 0; ver < versions.length; ver++) {
    for (keyword = 0; keyword < versions[ver].length; keyword++) {
      if (JSON.stringify(color).toLowerCase().indexOf(versions[ver][keyword]) != -1) {
        newVersion = versions[ver][0]
      }
    }
  }
  return newVersion
}

//
function getRange(from, to) {
  var verses = []
  for (i = from; i <= to; i++) {
    verses = verses.concat([i]);
  }
  return verses
}
