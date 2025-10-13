# 🔐 Login-Zugangsdaten für Clarity CRM

## Demo-Accounts

### 1. Sales Lead (Verkaufsleiter)
- **E-Mail:** `lead@clarity.com`
- **Passwort:** `lead123`
- **Rolle:** SALES_LEAD
- **Name:** Sarah Thompson
- **Berechtigungen:**
  - Vollzugriff auf alle Funktionen
  - Team-Übersicht und KPIs
  - Aufgaben zuweisen und neu zuweisen
  - AI Insights Dashboard

### 2. Sales Agent (Vertriebsmitarbeiter)
- **E-Mail:** `john@clarity.com`
- **Passwort:** `agent123`
- **Rolle:** SALES_AGENT
- **Name:** John Davis
- **Berechtigungen:**
  - Eigene Aufgaben verwalten
  - Aktivitäten protokollieren
  - Anrufnotizen erstellen
  - Dashboard-Zugriff

### 3. Weitere Agents (Optional)
Alle mit demselben Passwort `agent123`:
- **Emma Wilson:** `emma@clarity.com`
- **Mike Chen:** `mike@clarity.com`

## Login-URL

**Lokal:** http://localhost:3001/login

## Quick-Login Funktion

Auf der Login-Seite gibt es Quick-Login Buttons für beide Demo-Accounts:
- Einfach auf den gewünschten Account-Button klicken
- Automatische Anmeldung ohne manuelle Eingabe

## Sicherheitshinweise

⚠️ **WICHTIG für Produktion:**

1. **Passwörter ändern:**
   - Die Demo-Passwörter sind nur für Entwicklung/Testing
   - In Produktion sichere Passwörter verwenden

2. **NEXTAUTH_SECRET:**
   - Aktuell: `dev-secret-key-please-change-in-production`
   - Für Produktion einen starken, zufälligen String generieren:
     ```bash
     openssl rand -base64 32
     ```

3. **Umgebungsvariablen:**
   - `.env` ist in `.gitignore` und wird nicht versioniert
   - Jeder Developer muss eigene `.env` aus `.env.example` erstellen

## Authentifizierung-Details

### Technologie
- **NextAuth.js** v5 (latest)
- **Strategie:** Credentials Provider
- **Session:** JWT-basiert
- **Passwort-Hashing:** bcryptjs (10 Rounds)

### Protected Routes
Alle Routes außer `/login` sind geschützt:
- `/` - Dashboard
- `/users` - Team-Verwaltung
- `/tasks` - Aufgaben
- `/activities` - Aktivitäten
- `/call-notes` - Anrufnotizen
- `/insights` - AI Insights

### Session-Informationen
Die Session enthält:
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    teamId?: string | null;
    teamName?: string;
  }
}
```

## Logout

- **Sidebar:** Klick auf "Abmelden" Button (unten in der Sidebar)
- **Programmatisch:** Automatische Weiterleitung zu `/login`
- **Session:** Wird vollständig gelöscht

## Troubleshooting

### Problem: "Ungültige E-Mail oder Passwort"
**Lösung:**
- Überprüfen Sie die Schreibweise
- E-Mail muss exakt sein (Kleinbuchstaben)
- Passwort ist case-sensitive

### Problem: Umleitung funktioniert nicht
**Lösung:**
1. Prüfen Sie `NEXTAUTH_URL` in `.env`
2. Sollte `http://localhost:3001` sein (nicht 3000)
3. Server neu starten

### Problem: Session wird nicht gespeichert
**Lösung:**
1. `NEXTAUTH_SECRET` in `.env` überprüfen
2. Browser-Cookies löschen
3. Server neu starten

## Testing

### Manueller Test
1. Öffnen Sie http://localhost:3001
2. Sie werden automatisch zu `/login` umgeleitet
3. Verwenden Sie einen der Demo-Accounts
4. Nach erfolgreicher Anmeldung: Weiterleitung zum Dashboard

### Quick-Test mit curl
```bash
curl -X POST http://localhost:3001/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"lead@clarity.com","password":"lead123"}'
```

## API Endpoints

### NextAuth Routes
- `GET/POST /api/auth/signin` - Login-Seite/Prozess
- `GET/POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Aktuelle Session abrufen
- `GET /api/auth/csrf` - CSRF-Token
- `GET /api/auth/providers` - Verfügbare Provider

## Datenbank

Passwörter werden mit bcryptjs gehasht (10 Salz-Runden):
```typescript
const hashedPassword = await bcrypt.hash("lead123", 10);
```

**Beispiel Hash:**
```
$2a$10$XxYyZz... (60 Zeichen)
```

## Neue User hinzufügen

### Via Prisma Studio
```bash
npm run db:studio
```
1. User-Tabelle öffnen
2. "Add Record" klicken
3. Passwort muss vorher gehasht werden!

### Via Seed Script
`prisma/seed.ts` bearbeiten und dann:
```bash
npm run db:seed
```

### Passwort hashen (Node.js)
```javascript
const bcrypt = require('bcryptjs');
const hash = await bcrypt.hash('meinPasswort', 10);
console.log(hash);
```

---

**🔒 Sicher • 🚀 Schnell • ✨ Einfach**

