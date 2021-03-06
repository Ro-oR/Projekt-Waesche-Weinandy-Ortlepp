//Aufgabe1
//gibt meinen Namen auf der Console aus

console.log('Maura')

//Aufgabe2
// Konstante mit maximaler Bewertung, Variablen Bewertung und Anzahl der Bewertungen

const maxBewertung = 5
var bewertung = 4
var anzahl = 10 

//ausgeben lassen
console.log('\n')
console.log(maxBewertung)
console.log(bewertung)
console.log(anzahl)

//neue Werte
bewertung = 3
//maxBewertung = 9 // verursacht Error, da Assignment zu einer Konstanten
anzahl = 17

console.log(maxBewertung)
console.log(bewertung)
console.log(anzahl)

// Neue Werte für Variablen werden einfach übernommen und die Alten überschrieben


//Aufgabe 3: Bewertung über die Konsole einlesen, passend zur Konstante
//Einbindung des Readline-Moduls

const readline = require('readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

/*
console.log('\n')
rl.question('Bitte geben Sie die Bewertung ein (zwischen 0 und 5):', function(answer) {
	if (answer >=0 && answer <= maxBewertung) { // Werte zwischen 0 und maxBewertung erlaubt
		console.log('Ihre Bewertung:' +answer); 
		anzahl++
		console.log(anzahl)
	} else {console.log('Diese Zahl ist keine gültige Eingabe!')}
	rl.close();
});

*/ 

//Aufgabe 4+5: Bewertung n mal berechnen, immer zufällige Bewertung, Berechnung in Funktion

function getRandom(min, max) {
	return Math.floor(Math.random() * (max - min +1)) + min; 
  } //Funktion um Zufallszahl zwischen (max & min) zuerstellen

console.log('\n')

rl.question('Wie oft soll bewertet werden?:', function(answer) {
	var gesamt =0 
	for(i=0; i<answer; i++){ // n mal bewerten 
		var x = getRandom(0, maxBewertung) //Berechnung der Bewertung in Funktion
		console.log('\nDies ist Bewertung Nummer '+(i+1))
		console.log ("Die Bewertung ist:" +x)
		anzahl++
		gesamt = gesamt + x
		console.log("Gesamtzahl der Bewertungen:" +anzahl )
		console.log("Gesamtbewertung:"+(gesamt/anzahl))
	}
	rl.close();
	
}) 
