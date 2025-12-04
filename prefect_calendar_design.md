# Prefect Calendar — Documento Tecnico Completo

Questo documento definisce l'architettura, i requisiti, il design funzionale e tecnico dell'applicazione "Prefect Calendar", un'interfaccia avanzata per visualizzare, gestire e schedulare flow runs e schedules di Prefect Server.

---

# 1. Obiettivi

L'applicazione deve fornire:

1. Una UI chiara e moderna per visualizzare tutte le schedulazioni (in forma di calendario, lista, agenda).
2. Un editor per creare/modificare schedule dei deployment Prefect.
3. Un sistema di grouping intelligente per visualizzare schedule periodiche (es. ogni 15 minuti) come blocchi continui.
4. Una separazione netta tra il ruolo di Prefect (che **scheduling** e **trigger** dei flow runs) e il ruolo dell'app (che **visualizza** e **modifica** le configurazioni).
5. Un pannello di connessione / configurazione che permette di collegarsi al Prefect server e mostrare lo stato della connessione.

---

# 2. Architettura generale

## 2.1 Componenti principali

L'applicazione è strutturata in 3 macro-sezioni:

### **A. Settings & Connection Layer**

Gestione connessione al Prefect server:

* URL Prefect API
* API key / token
* Workspace
* Test endpoint (`/health` o equivalente)
* Badge di stato (verde/giallo/rosso)

### **B. Calendar Engine (Client-side)**

Componente interno che:

* interroga Prefect per ottenere deploy, schedules e future runs
* unifica e normalizza i dati in una lista di eventi
* applica il grouping periodico
* espone dati alla UI (calendar, list, agenda)

### **C. Schedule Editor**

Modulo per:

* creare nuove schedule
* modificare schedule esistenti
* aprire l'editor cliccando elementi nel calendario / lista

## 2.2 Interazioni con Prefect

L'app **non** sostituisce lo scheduler: legge e scrive solo tramite API Prefect.

Endpoint utilizzati (Prefect 2.x/3.x equivalente):

* **GET /deployments**
* **GET /deployments/{id}**
* **GET /deployments/{id}/schedule**
* **GET /deployments/{id}/runs** → filtrato su time window futura
* **POST /deployments/{id}/schedule** (creazione schedule)
* **PATCH /deployments/{id}/schedule/{schedule_id}** (modifica schedule)
* **DELETE /deployments/{id}/schedule/{schedule_id}**

---

# 3. Modello dati interno dell'app

## 3.1 Modello Event

```ts
Event {
  deploymentId: string;
  deploymentName: string;
  scheduleId: string | null;
  startTime: Date;
  frequency: Duration | null; // solo se periodico
}
```

## 3.2 Modello Group

Un group rappresenta una sequenza consecutiva di occorrenze di una **stessa schedule**.

```ts
Group {
  deploymentId: string;
  scheduleId: string;
  start: Date; // prima occorrenza del blocco
  end: Date;   // ultima occorrenza del blocco
  occurrences: Event[];
  frequency: Duration;
}
```

Un group si interrompe quando:

* cambia scheduleId
* cambia deploymentId
* la distanza tra due Event non corrisponde (± pochi secondi) alla frequenza
* tra due occorrenze compare un evento di un altro deployment

## 3.3 Modello CalendarView

```ts
CalendarData {
  groups: Group[];
  singleEvents: Event[]; // eventi non raggruppabili
}
```

---

# 4. Logica di grouping

Questa parte è fondamentale per ottenere l'effetto "Teams-style" desiderato.

## 4.1 Algoritmo

Input: lista ordinata di Event.

Processo:

1. Ordina tutti gli Event per startTime.
2. Scorri linearmente e confronta l'evento corrente col precedente.
3. Crea un nuovo Group se:

   * non esiste un group attivo
   * cambia deploymentId o scheduleId
   * il delta tra eventi non corrisponde a `frequency`
   * compare un Event di un altro deployment/schedule nel mezzo
4. Se il periodo combacia:

   * aggiungi l'evento al group corrente
   * aggiorna `end`
5. Alla fine, espone la lista dei gruppi per la UI.

---

# 5. Interfacce utente

L'app avrà 4 viste principali.

## 5.1 Tab Impostazioni

* Campo URL Prefect API
* Campo API Key
* Campo Workspace
* Test connessione con badge:

  * **Verde**: connessione ok
  * **Giallo**: problemi temporanei / riconnessione
  * **Rosso**: connessione fallita

## 5.2 Vista Calendario

Tipologia "calendario settimanale" stile Teams:

* colonne = giorni
* righe = fasce orarie
* ogni group rappresentato come blocco colorato
* colore per deployment o tipo schedule
* icone:

  * ∞ per periodico
  * ▶ per run singolo

Clic su un blocco → apre **Schedule Editor**.

## 5.3 Vista Lista

Visualizza eventi e gruppi in ordine cronologico.

Due modalità:

* **Lista continua** (tutti gli item futuri)
* **Lista giornaliera** (gruppati per giorno)

Per ogni group:

```
[09:00 - 12:00] ogni 15 minuti — Deployment X (20 occorrenze)
```

## 5.4 Vista Agenda (hour-by-hour)

* Visualizzazione per singolo giorno
* 24 fasce orarie
* allineamento preciso degli eventi
* perfetto per debug delle schedules

---

# 6. Schedule Editor

Apre in tre modi:

* click su calendario (su uno slot vuoto o su un blocco esistente)
* click su lista (su uno slot vuoto o su un item esistente)
* pulsante globale **"New schedule"** sempre visibile nella UI (es. in alto a destra)

Comportamento di apertura:

* **Click su slot vuoto (giorno/ora)**:

  * apre il modale in modalità *creazione*
  * precompila data/ora di start (ed eventualmente durata) con lo slot selezionato
* **Click su blocco/entry esistente (group o singolo evento)**:

  * apre il modale in modalità *edit*
  * carica deploymentId, scheduleId e i parametri della schedule associata
* **Click su "New schedule"**:

  * apre il modale in modalità *creazione*
  * nessun campo precompilato, salvo default globali (timezone, oggi, ecc.)

## Funzioni

* click su lista (su uno slot vuoto o su un item esistente)
* pulsante globale **"New schedule"** sempre visibile nella UI (es. in alto a destra)

Comportamento di apertura:

* **Click su slot vuoto (giorno/ora)**:

  * apre il modale in modalità *creazione*
  * precompila data/ora di start (ed eventualmente durata) con lo slot selezionato
* **Click su blocco/entry esistente (group o singolo evento)**:

  * apre il modale in modalità *edit*
  * carica deploymentId, scheduleId e i parametri della schedule associata
* **Click su "New schedule"**:

  * apre il modale in modalità *creazione*
  * nessun campo precompilato, salvo default globali (timezone, oggi, ecc
* Creare nuova schedule per un deployment
* Modificare una schedule esistente
* Parametri gestiti:

  * tipo: interval / cron / rrule
  * start time
  * end time (opzionale)
  * timezone
  * anchor date
* Preview delle prossime N occorrenze
* Salvataggio via API Prefect

---

# 7. Motore Calendar (estrazione dati da Prefect)

## 7.1 Fetch dei deployment

```
GET /deployments
```

## 7.2 Fetch delle schedule

Per ogni deployment:

```
GET /deployments/{id}/schedule
```

## 7.3 Fetch future runs

Per generare i gruppi, servono le occorrenze future.

Richiesta:

```
GET /deployments/{id}/runs?start_time_after=now&start_time_before=now+window
```

Window predefinita: **+30 giorni**.

## 7.4 Normalizzazione

Per ogni run: costruire un Event completo.

Successivamente: applicare grouping.

---

# 8. Stato dell’applicazione & caching

Per evitare di chiamare continuamente Prefect:

* Cache dei deployment (5 minuti)
* Cache delle schedule (5 minuti)
* Cache future runs (30–60 secondi)

Aggiornamento manuale tramite pulsante "Refresh".

---

# 9. Logiche di colore & stile

### Mapping colori per deployment

Ogni deployment riceve un colore consistente, stabile tra sessioni.

Metodo:

* hash(deploymentId) → indice palette

### Icone

* Periodico: `∞`
* Singolo evento: `•`
* Blocco group: `▮`

### Tooltip

Contiene:

* Nome deployment
* Frequenza
* Start–end del blocco
* Lista prime 3 occorrenze

---

# 10. Roadmap di sviluppo

## Fase 1 — Base

* UI impostazioni + connessione
* Lettura deployment, schedule, runs
* Modalità lista semplice (senza grouping)

## Fase 2 — Grouping & modello calendario

* Implementazione algoritmo grouping
* Vista calendario (settimana)
* Vista lista con grouping

## Fase 3 — Editor schedule

* Modal per creare/modificare schedule
* Anteprima occorrenze

## Fase 4 — Vista agenda

* Visualizzazione oraria per singolo giorno

## Fase 5 — Rifiniture

* caching
* ottimizzazione richieste Prefect
* tema grafico

---

# 11. Scalabilità e limiti

* Tutto il carico è sul client: Prefect genera occurrences, l'app le aggrega.
* Supporta cluster con decine di deployment e migliaia di occorrenze future.
* In caso di schedule molto fitte (es. ogni 1 minuto), grouping riduce drasticamente il carico sulla UI.

---

# 12. Conclusione

Lo scheduler di Prefect rimane il singolo punto di verità. L'app "Prefect Calendar" fornisce una visualizzazione evoluta, un motore di grouping intelligente e un editor visuale che riproduce il comportamento di Teams/Outlook, ma totalmente basato sul runtime Prefect.

Il tutto senza bisogno di implementare uno scheduler alternativo.
