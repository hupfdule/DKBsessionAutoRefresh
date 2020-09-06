// ==UserScript==
// @name         DKB Refresh Timeout
// @version      1.0
// @description  Dieses Script verhindert den automatischen Logout im DKB Banking für x Minuten
//               ACHTUNG! Dadurch wird eine wichtige Sicherheitsfunktion ausgehebelt!!!!
//
//                             Ich übernehme
//               K E I N E R L E I     V E R A N T W O R T U N G
//                  für eventuelle Schäden jeglicher Art!!!!
//
// @author       Kratzerchen (modified by anonymous)
// @include      https://www.dkb.de/banking/*
// @include      https://www.dkb.de/DkbTransactionBanking/*
// @grant        none
// ==/UserScript==

// Tabulatorbreite auf 4 stellen!

(function() {
	'use strict';

	var maxLoginTime	= 240;																				// Hier kann die maximale Loginzeit in Minuten festgelegt werden. Reset benötigt echten Seitenrefresh!
	var cdLimitMax		= 120;																				// Oberer Grenzwert in Sekunden. Frühstmöglicher Zeitpunkt zum Rücksetzten des 5 Minuten Timers
	var cdLimitMin		= 35;																				// Unterer Grenzwert in Sekunden. Minimalste erlaubte Restzeit des 5 Minuten Timers
    var logState		= true;																			// Hier kann die Textausgabe im Konsolenfenster aktiviert werden (true / false)var
	var cdLimit;																							// Zufällig ermittelter Wert zwischen [cdLimitMax] und [cdLimitMin].
																											// Unterschreitet der "5 Minuten Logout Countdown" diesen Wert wird dieser zurückgesetzt und ein neuer Zufallswert generiert.
																											// Durch die Verwendung von zufälligen Werten soll ein "natürlich" wirkendes Verhalten simuliert werden
	var checkInterval;																						// Variable zu speichern der Intervall ID. Wird benötigt um auf den gesetzten Intervall zugreifen zu können um ihn z.B zu löschen.
	var starttime = Date.now();																				// Die aktuelle Uhrzeit. Wird für die Überwachung der maximalen Loginzeit [maxLoginTime] benötigt
	var htmlElement = document.querySelector(".sessionTimer");									// In der Variable [htmlElement] wird der Knoten des HTML Elements, welches den 5 Minuten Timers enthält gespeichert

	maxLoginTime *= 60000;																					// [maxLoginTime] von Minuten in Millisekunden umrechnen
	if (!htmlElement) {
        if (logState) {
            console.log("No countdownTimer on the page");1
        }
    } else {
    //if (htmlElement){																						// Wenn das HTML Element mit dem 5 Minuten Countdown existiert...  (Gibt es nicht auf jeder Seite! Z.B. Login/Logout Seite)
        var sessionInfoCountdownSpan= document.getElementById('sessionInfoCountdown');
        var newCD = document.createElement("span");
        newCD.id= "newCD";
		newCD.textContent = '00:00:00';
        sessionInfoCountdownSpan.parentNode.insertBefore(newCD, sessionInfoCountdownSpan.nextSibling);		// Füge dem HTML Element auf der Seite mit der ID 'sessionTimer' unser oben definieres Element als neues letztes Kindelement hinzu.
																											// Dieses 'übermalt' den originalen 5 Minuten Logout Timer.
        //var newCD = document.getElementById('sessionInfoCountdown');														// Speichere den HTML Knoten von unserem neuen <b>mm:ss</b> Tag um direkt auf die Timeranzeige zugreifen zu können
        var newCdInterval = setInterval(updateCD, 1000);													// Starte einen 1 Sekunden Intervall um den neuen Countdownzähler zu aktualisieren (Funktion 'updateCD')

        // hide the original element
        sessionInfoCountdownSpan.style.display = 'none';
        setValues();
    }																										// ansonsten mache nichts...  (if htmlElement)

	function setValues(){																					// Funktion 'setValues()' wird nach jedem Sart des Skripts sowie nach jedem Rücksetzen des 5 Minuten Countdowns ausgeführt
		cdLimit = Math.floor(Math.random() * (cdLimitMax - cdLimitMin + 1)) + cdLimitMin;					// Ermitteln der Zufallszahl zwischen [cdLimitMax] und [cdLimitMin]
		var checkIntervalMillis = Math.floor(Math.random() * 4000 + 1001);
        checkInterval = setInterval(checkOriginalTimer, checkIntervalMillis);								// Initialisieren und starten des Intervalls zum überpüfen des originalen 5 Minuten Logout Countdowns. (Funktion 'checkOriginalTimer')
																											// Wiederholrate ist zufällig zwischen 1000 und 5000 Millisekunden (damit nicht immer zur vollen Sekunde geklickt wird)
		if (logState){																						// Textausgabe in der Konsole wenn [logState] = true
			console.log("'checkInterval' Frequenz: ", checkIntervalMillis, "MilliSekunden");
			console.log("Countdown Limit: ", cdLimit, "Sekunden");
		}
	}																										// Ende der Funktion 'setValues()'

	function updateCD(){																					// Funktion zum akualieren des von uns eingefügten Logout Timers. Bei Ablauf erfolgt Logout!
		var millisPassed = Date.now() - starttime;															// vergangene Millisekunden seit Skriptstart
		var cdValue = maxLoginTime - millisPassed;															// Und deren Differenz zu [maxLoginTime]. [cdValue] ist somit die Restzeit
		newCD.textContent = leadingZero(cdValue/1000/60/60) + ":" + leadingZero((cdValue/1000/60)%60) + ":" + leadingZero(cdValue/1000%60);
																											// Die Resetzeit in Textformat 'hh:mm:ss' (mit führender Null wenn einstellig) umwandeln und die Coutdown-Anzeige aktualisieren
		if (cdValue <=0){																					// Wenn Maximale Loginzeit überschritten ([cdValue] ist 0 oder negativ)
            if (logState) {
                console.log("Final logout!");
            }
            clearInterval(newCdInterval);																	// Lösche den 1 Sekunden Intervall
			clearInterval(checkInterval)																	// Lösche den Interval zum Resetten des originalen 5 Minuten Logout CD
            document.getElementById('logout').firstElementChild.click();									// Dann klicke auf den Logout Link. Dieser ist das erste Kindelemet des HTML Elemets mit der ID 'Login'.
		}
	}

	function checkOriginalTimer(){																			// Die Funktion 'checkSessionTimerUpdate()' wird durch den in 'setValues()' gestarteten Intervall regelmäsßig ausgeführt

		//var text = htmlElement.innerHTML;																	// Der Inhalt des HTML Elements, welches den Wert des "5 Minuten Logout Countdowns" enhält wird ausgelesen
		var text = document.getElementById("sessionInfoCountdown").textContent;
        //console.log("SICD.text: ", document.getElementById("sessionInfoCountdown").textContent);
        text.trim();																						// eventuelle Leerzeichen am Beginn und Ende des Textes werden abgeschnitten.

        if (text.length == 5){																				// Wenn der Text 4 Zeichen hat. (z.B: '1:35' {Minuten einstellig - Doppelpunkt - Sekunden zweistellig} sind 4 Zeichen.) Die Angabe '> 4 Minuten' wird somit ignoriert.
		    var seconds = Number(text.slice(-2)) + Number(text.slice(0, 2)) * 60;							// Der Text wird in Sekunden umgewandelt (Die Sekunden aus den letzten beiden Zeichen addiert mit den Minuten * 60 aus Zeichen 1)
		    if (logState){																					// Textausgabe in der Konsole wenn [logState] = true
				console.log("Restzeit original Contdown: ", seconds, "Sekunden. Limit bei " + cdLimit + " Sekunden.");
			}

			if (seconds < cdLimit){																			// Wenn die ausgelesene Restzeit in Sekunden des "5 Minuten Logout Countdowns" den in [cdLimit] gespeicherten Wert untersreitet....
				if (logState){																				// Textausgabe in der Konsole wenn [logState] = true
					console.log("Original Contdown ("+ seconds + ") kleiner als cdLimit (" + cdLimit +")  --> RESET");
				}
				clearInterval(checkInterval);																// Der Intervall, welcher in der Funktion  'setValues()' gestartet wurde, wird gelöscht.
				document.querySelector(".sessionTimer").click();									// Das '.click()' Event wird ausgelöst. Ziel ist der Refresh Button
				setValues();																				// führe die Funktion 'setValues()' aus.
			}
		}
	}

	function leadingZero(value){																			// Funktion um einstelligen Zahlenwerten eine führende '0' zu verpassen
		return (value < 10 ? '0' : '' ) + parseInt(value);													// Rückgabe als Text und mit führender 0 falls [value] kleiner 10
	}
})();
