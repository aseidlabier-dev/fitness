# Fitness App – Android APK erstellen & offline nutzen

**100% Offline-Betrieb. Keine Cloud, kein Server, kein Internet nötig.**

---

## SCHRITT 1 – GitHub Desktop öffnen & Änderungen übertragen

1. Öffne **GitHub Desktop**.
2. Wähle oben links das Repository **`fitness`** aus.
   *(Falls es noch nicht in der Liste ist: **File → Add Local Repository...** und wähle den Ordner `D:\Antigravity_Programme\Privat\Fitness\Android` aus).*
3. Unten links bei **Summary** eingeben: `Update: Theme-Umschaltung, Datenexport & Icon`
4. Klicke auf **Commit to main** (oder *Commit to master*).
5. Klicke oben auf **Push origin**.

→ Die neuen Dateien sind jetzt auf GitHub. Der Build startet **automatisch**!

---

## SCHRITT 2 – APK-Bau auf GitHub beobachten & herunterladen

1. Öffne im Browser: **https://github.com/aseidlabier-dev/fitness/actions**
2. Du siehst den laufenden Workflow **„Fitness Android APK bauen“**.
3. Nach ca. 8–10 Minuten erscheint das grüne Häkchen ✅.
4. Klicke auf den abgeschlossenen Workflow.
5. Scrolle ganz nach unten zu **„Artifacts“**.
6. Klicke auf **„Fitness-App-Android-APK“** (ZIP-Datei wird heruntergeladen).
7. ZIP-Datei öffnen → darin liegt **`app-debug.apk`**.

---

## SCHRITT 3 – APK auf das Handy übertragen & installieren

1. Übertrage `app-debug.apk` per **OneDrive** oder **USB-Kabel** auf das Handy.
2. Öffne auf dem Handy die App **„Eigene Dateien“** (bzw. Downloads).
3. Tippe auf `app-debug.apk` und wähle **Installieren** (bzw. Aktualisieren).
4. Die App **„Fitness“** startet mit eigenem Icon auf dem Startbildschirm 🎉.

---

## SCHRITT 4 – Bisherige Trainingsdaten übertragen (Datensicherung)

1. Öffne die Fitness-App auf dem PC (oder Browser):
   - Klicke im Menü auf **⚙️ Admin**.
   - Klicke unter **Datensicherung & Export** auf **„📦 Komplett-Backup (.json)“**.
2. Sende die heruntergeladene `.json`-Datei auf dein Handy (z. B. via OneDrive).
3. Öffne die neue **Fitness-App (APK)** auf dem Handy:
   - Gehe auf **⚙️ Admin** → **Datensicherung & Export**.
   - Klicke auf **„📂 Backup-Datei auswählen & importieren“**.
   - Wähle die `.json`-Datei aus und bestätige mit **OK**.
4. Fertig! Alle Geräte, Fotos und bisherigen Trainingseinheiten sind sofort 1:1 auf dem Handy verfügbar.
