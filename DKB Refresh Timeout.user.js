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


  // --------------------------------------------------------------------------- //
  // Settings                                                                    //
  // --------------------------------------------------------------------------- //

  // Hier kann die maximale Loginzeit in Minuten festgelegt werden. Reset benötigt echten Seitenrefresh!
  var maxLoginTime  = 240;
  // Oberer Grenzwert in Sekunden. Frühstmöglicher Zeitpunkt zum Rücksetzten des 5 Minuten Timers
  var cdLimitMax    = 120;
  // Unterer Grenzwert in Sekunden. Minimalste erlaubte Restzeit des 5 Minuten Timers
  var cdLimitMin    = 35;
  // Hier kann die Textausgabe im Konsolenfenster aktiviert werden (true / false)var
  var logState    = true;


  // --------------------------------------------------------------------------- //
  // Variables
  // --------------------------------------------------------------------------- //

  // Zufällig ermittelter Wert zwischen [cdLimitMax] und [cdLimitMin].
  // Unterschreitet der "5 Minuten Logout Countdown" diesen Wert wird dieser zurückgesetzt
  // und ein neuer Zufallswert generiert.
  // Durch die Verwendung von zufälligen Werten soll ein "natürlich" wirkendes Verhalten simuliert werden.
  var cdLimit;
  // Variable zu speichern der Intervall ID.
  // Wird benötigt um auf den gesetzten Intervall zugreifen zu können um ihn z.B zu löschen.
  var checkInterval;
  // Die aktuelle Uhrzeit. Wird für die Überwachung der maximalen Loginzeit [maxLoginTime] benötigt
  var starttime = Date.now();
  // In der Variable [htmlElement] wird der Knoten des HTML Elements, welches den 5 Minuten Timers enthält gespeichert
  var htmlElement = document.querySelector(".sessionTimer");

  // [maxLoginTime] von Minuten in Millisekunden umrechnen
  maxLoginTime *= 60000;
  // Wenn das HTML Element mit dem 5 Minuten Countdown existiert...
  // (Gibt es nicht auf jeder Seite! Z.B. Login/Logout Seite)
  if (!htmlElement) {
    if (logState) {
      console.log("No countdownTimer on the page");1
    }
  } else {
  //if (htmlElement){
    var sessionInfoCountdownSpan= document.getElementById('sessionInfoCountdown');
    var newCD = document.createElement("span");
    newCD.id= "newCD";
    newCD.textContent = '00:00:00';
    // Füge dem HTML Element auf der Seite mit der ID 'sessionTimer' unser oben
    // definieres Element als neues letztes Kindelement hinzu.
    // Dieses 'übermalt' den originalen 5 Minuten Logout Timer.
    sessionInfoCountdownSpan.parentNode.insertBefore(newCD, sessionInfoCountdownSpan.nextSibling);
    // Speichere den HTML Knoten von unserem neuen <b>mm:ss</b> Tag um direkt auf die
    // Timeranzeige zugreifen zu können
    //var newCD = document.getElementById('sessionInfoCountdown');
    // Starte einen 1 Sekunden Intervall um den neuen Countdownzähler zu aktualisieren (Funktion 'updateCD')
    var newCdInterval = setInterval(updateCD, 1000);

    // hide the original element
    sessionInfoCountdownSpan.style.display = 'none';
    setValues();
  }


  // --------------------------------------------------------------------------- //
  // Local funtions                                                              //
  // --------------------------------------------------------------------------- //

  /**
   * Wird nach jedem Start des Skripts, sowie nach jedem Rücksetzen des
   * 5-Minuten Countdowns ausgeführt.
   */
  function setValues() {
    // Ermitteln der Zufallszahl zwischen [cdLimitMax] und [cdLimitMin]
    cdLimit = Math.floor(Math.random() * (cdLimitMax - cdLimitMin + 1)) + cdLimitMin;
    var checkIntervalMillis = Math.floor(Math.random() * 4000 + 1001);
    // Initialisieren und starten des Intervalls zum überpüfen des
    // originalen 5 Minuten Logout Countdowns. (Funktion
    // 'checkOriginalTimer') Wiederholrate ist zufällig zwischen 1000 und
    // 5000 Millisekunden (damit nicht immer zur vollen Sekunde geklickt
    // wird)
    checkInterval = setInterval(checkOriginalTimer, checkIntervalMillis);
    // Textausgabe in der Konsole wenn [logState] = true
    if (logState) {
      console.log("'checkInterval' Frequenz: ", checkIntervalMillis, "MilliSekunden");
      console.log("Countdown Limit: ", cdLimit, "Sekunden");
    }
  } //'setValues()'


  /**
   * Aktualisiert den neu eingeführten, verlängerten Logout Timer.
   * Bei Ablauf erfolgt Logout!
   */
  function updateCD() {
    // vergangene Millisekunden seit Skriptstart
    var millisPassed = Date.now() - starttime;
    // Und deren Differenz zu [maxLoginTime]. [cdValue] ist somit die Restzeit
    var cdValue = maxLoginTime - millisPassed;

    // Die Resetzeit in Textformat 'hh:mm:ss' (mit führender Null wenn
    // einstellig) umwandeln und die Coutdown-Anzeige aktualisieren
    newCD.textContent = leadingZero(cdValue/1000/60/60)
                      + ":"
                      + leadingZero((cdValue/1000/60)%60)
                      + ":"
                      + leadingZero(cdValue/1000%60);
    // Wenn Maximale Loginzeit überschritten ([cdValue] ist 0 oder negativ)
    if (cdValue <=0) {
      if (logState) {
          console.log("Final logout!");
      }
      // Lösche den 1 Sekunden Intervall
      clearInterval(newCdInterval);
      // Lösche den Interval zum Resetten des originalen 5 Minuten Logout CD
      clearInterval(checkInterval);
      // Dann klicke auf den Logout Link. Dieser ist das erste Kindelemet des HTML Elemets mit der ID 'Login'.
      document.getElementById('logout').firstElementChild.click();
    }
  }


  /**
   * Prüft den Countdown-Stand des originalen Countdownzählers.
   * Ruft 'setValues()' auf, wenn dieser geringer ist als das berechnete
   * Limit.
   */
  function checkOriginalTimer() {
    // Der Inhalt des HTML Elements, welches den Wert des "5 Minuten Logout Countdowns" enhält wird ausgelesen
    //var text = htmlElement.innerHTML;
    var text = document.getElementById("sessionInfoCountdown").textContent;
    //console.log("SICD.text: ", document.getElementById("sessionInfoCountdown").textContent);
    // eventuelle Leerzeichen am Beginn und Ende des Textes werden abgeschnitten.
    text.trim();

    // Wenn der Text 4 Zeichen hat. (z.B: '1:35' {Minuten einstellig -
    // Doppelpunkt - Sekunden zweistellig} sind 4 Zeichen.) Die Angabe '> 4
    // Minuten' wird somit ignoriert.
    if (text.length == 5) {
    // Der Text wird in Sekunden umgewandelt (Die Sekunden aus den letzten
    // beiden Zeichen addiert mit den Minuten * 60 aus Zeichen 1)
    var seconds = Number(text.slice(-2)) + Number(text.slice(0, 2)) * 60;
    // Textausgabe in der Konsole wenn [logState] = true
    if (logState) {
      console.log("Restzeit original Contdown: ", seconds, "Sekunden. Limit bei " + cdLimit + " Sekunden.");
    }

    // Wenn die ausgelesene Restzeit in Sekunden des "5 Minuten Logout
    // Countdowns" den in [cdLimit] gespeicherten Wert untersreitet....
    if (seconds < cdLimit) {
        // Textausgabe in der Konsole wenn [logState] = true
        if (logState) {
          console.log("Original Contdown ("+ seconds + ") kleiner als cdLimit (" + cdLimit +")  --> RESET");
        }
        // Der Intervall, welcher in der Funktion  'setValues()' gestartet wurde, wird gelöscht.
        clearInterval(checkInterval);
        // Das '.click()' Event wird ausgelöst. Ziel ist der Refresh Button
        document.querySelector(".sessionTimer").click();
        // führe die Funktion 'setValues()' aus.
        setValues();
      }
    }
  }


  /**
   * Fügt einstelligen Zahlenwerten eine führende '0' hinzu.
   *
   * @param {string} value: Die zu prüfende Zahl.
   * @returns {string} der übergebene 'value' mit evtl. vorangestellter 0
   */
  function leadingZero(value) {
    // Rückgabe als Text und mit führender 0 falls [value] kleiner 10
    return (value < 10 ? '0' : '' ) + parseInt(value);
  }
})();
