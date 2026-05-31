/* ============================================================
   ThatDailyDeal — Events feature
   Per-feature module (classic script, loaded after v6.js).
   Owns everything inside the `events` tab: it renders its markup
   into #eventsRoot and manages its own state. Keeps index.html a
   thin skeleton and v6.js focused on the app shell.

   Convention (see dist-v6/CLAUDE.md):
   - index.html provides only the mount point: <div id="eventsRoot">
   - shared visuals must come from components.css classes
     (here: the .event-card family — a horizontal date-stub ticket)
   - feature-only positioning is the shared bottom-sheet scaffold in
     v6.css (.events-page / -head / -title, shared with Contests)
   ============================================================ */
(() => {
  const root = document.getElementById('eventsRoot');
  if (!root) return;

  // Upcoming events, ordered soonest-first. Each renders as one .event-card:
  // the date stub (month / day / weekday) + a green body (kicker, title, and
  // a "time · tagline" subline). Demo data; wire to a real feed later.
  const EVENTS = [
    { month: 'Jul', day: '27', dow: 'Sun', kicker: 'Weekend Bash', title: 'Weekend Cash Bash', sub: '5:00 PM · Play to win' },
    { month: 'Aug', day: '3',  dow: 'Sat', kicker: 'Trivia Night', title: 'Summer Showdown',    sub: '7:30 PM · Top prize $250' },
    { month: 'Aug', day: '10', dow: 'Sat', kicker: 'Live Draw',    title: 'Mega Giveaway',       sub: '6:00 PM · 10 winners' },
    { month: 'Aug', day: '17', dow: 'Sat', kicker: 'Foodie Fest',  title: 'Taco Throwdown',      sub: '12:00 PM · Free entry' },
    { month: 'Sep', day: '1',  dow: 'Mon', kicker: 'Labor Day',    title: 'Holiday Deal Drop',   sub: '9:00 AM · Doorbusters' },
  ];

  // Lightning bolt for the eyebrow row (matches the design's kicker icon).
  const bolt = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>';

  const eventCard = (e) => `
    <article class="event-card">
      <div class="event-card-date">
        <span class="event-card-month">${e.month}</span>
        <span class="event-card-day">${e.day}</span>
        <span class="event-card-dow">${e.dow}</span>
      </div>
      <div class="event-card-body">
        <span class="event-card-eyebrow">${bolt}${e.kicker}</span>
        <h3 class="event-card-title">${e.title}</h3>
        <p class="event-card-sub">${e.sub}</p>
      </div>
    </article>`;

  // Sticky "Events" header + the scrolling list of cards (shared bottom-sheet
  // scaffold with the Contests tab — see .events-page in v6.css).
  root.innerHTML = `
    <div class="events-page">
      <div class="events-head">
        <h2 class="events-title">Events</h2>
      </div>
      ${EVENTS.map(eventCard).join('')}
    </div>`;
})();
