let classifier;
const options = { probabilityThreshold: 0.5};

function preload() {
  classifier = ml5.soundClassifier('SpeechCommands18w', options, setup);
}

let resultsdiv;

function setup() {
  createCanvas(400,400);
  resultsdiv = document.getElementById("result");
  resultsdiv.html="ready";
  classifier.classify(gotResult);
}

function gotResult(error, results) {
  // Display error in the console
  if (error) {
      console.error(error);
  }else{
    resultsdiv.append(results[0].label+" ");
    resultsdiv.append(results[0].confidence);
  }
}

