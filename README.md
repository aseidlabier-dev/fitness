# Fitness App – Android APK erstellen & installieren

**Alle Daten bleiben ausschließlich auf deinem Handy. Keine Cloud, kein Internet nötig.**

---

## Was passiert hier?

GitHub (ein kostenloser Dienst) baut die APK-Datei automatisch in der Cloud.  
Du lädst die fertige APK herunter, überträgst sie per OneDrive auf dein Handy und installierst sie dort.

---

## SCHRITT 1 – Kostenloses GitHub-Konto erstellen

1. Öffne im Browser: **https://github.com/signup**
2. Gib eine E-Mail-Adresse, ein Passwort und einen Benutzernamen ein
3. Konto bestätigen (E-Mail-Link anklicken)

---

## SCHRITT 2 – GitHub Desktop installieren (einmalig)

GitHub Desktop ist ein einfaches Programm zum Hochladen von Dateien.

1. Öffne: **https://desktop.github.com**
2. Klicke auf „Download for Windows" → Installieren
3. Beim ersten Start: Mit deinem GitHub-Konto anmelden

---

## SCHRITT 3 – Neues Repository (Projekt) erstellen

1. In GitHub Desktop: **File → New Repository**
2. Einstellungen:
   - **Name:** `fitness-android`
   - **Local Path:** Diesen Ordner hier auswählen (`Fitness/Android`)
   - **Initialize this repository:** ✅ Häkchen setzen
3. Klicke auf **Create Repository**
4. Dann: **Publish repository** (oben in der Leiste)
   - „Keep this code private" ✅ (Häkchen lassen – Projekt bleibt privat)
   - Klicke auf **Publish Repository**

---

## SCHRITT 4 – Dateien auf GitHub hochladen

1. In GitHub Desktop siehst du links alle neuen Dateien
2. Unten links bei „Summary" eingeben: `Erste Version`
3. Klicke auf **Commit to main**
4. Dann oben auf **Push origin**

→ Die Dateien sind jetzt auf GitHub. Der Build startet **automatisch**!

---

## SCHRITT 5 – Build beobachten & APK herunterladen

1. Öffne im Browser: **https://github.com/DEIN-BENUTZERNAME/fitness-android/actions**
   *(DEIN-BENUTZERNAME durch deinen GitHub-Namen ersetzen)*
2. Du siehst einen laufenden Workflow „Android APK bauen"
3. **Warte ca. 8–12 Minuten** bis das grüne Häkchen ✅ erscheint
4. Klicke auf den abgeschlossenen Workflow
5. Scrolle ganz nach unten zu **„Artifacts"**
6. Klicke auf **„Fitness-App-Android-APK"** → ZIP-Datei wird heruntergeladen
7. ZIP öffnen → darin liegt die Datei `app-debug.apk`

---

## SCHRITT 6 – APK per OneDrive auf das Handy übertragen

1. Kopiere `app-debug.apk` in deinen **OneDrive-Ordner** auf dem PC
2. Warte, bis OneDrive synchronisiert hat
3. Öffne auf dem **Samsung Galaxy A50** die OneDrive-App
4. Navigiere zur APK-Datei und tippe drauf → **Herunterladen**

---

## SCHRITT 7 – APK auf dem Samsung Galaxy A50 installieren

### Einmalige Vorbereitung (nur beim ersten Mal):
1. **Einstellungen** → **Apps**
2. Oben rechts: **3 Punkte** → **Spezieller App-Zugriff**
3. **Unbekannte Apps installieren**
4. **Meine Dateien** oder **OneDrive** → **Erlauben**

### App installieren:
1. Öffne auf dem Handy die App **„Meine Dateien"**
2. Navigiere zu **Downloads** → Tippe auf `app-debug.apk`
3. Tippe auf **Installieren**
4. Die App **„Fitness"** erscheint auf dem Startbildschirm 🎉

---

## Wichtige Hinweise

| Thema | Info |
|-------|------|
| 🔒 Datensicherheit | Alle Trainingsdaten bleiben **nur auf dem Handy**. Keine Cloud, kein Server. |
| 📦 Datengröße | Die APK ist ca. 5–8 MB groß |
| 🔄 Update | Wenn du die App aktualisieren möchtest, Dateien ändern → Commit → Push → neue APK herunterladen & installieren |
| 🗑️ Deinstallation | Normale Deinstallation über Android-Einstellungen. Dabei werden **alle Daten gelöscht**! |
| 📱 Kompatibilität | Android 7.0 und neuer (Samsung Galaxy A50 mit Android 11 ✅) |

---

## Hilfe & Fehlerbehebung

**Build schlägt fehl (rotes ❌)?**
→ Klicke auf den fehlgeschlagenen Build → schaue in die Logs → schreibe die Fehlermeldung auf

**APK lässt sich nicht installieren?**
→ Prüfe ob „Unbekannte Apps installieren" für den verwendeten Datei-Manager erlaubt ist

**App startet nicht?**
→ Starte das Handy neu und versuche es erneut
