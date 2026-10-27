// Idempotent demo-data seeder: safe to run repeatedly (upserts by natural keys).
//   npm run seed
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Movie from '../models/movieModel.js';
import Theatre from '../models/theatreModel.js';
import Show from '../models/showModel.js';

// All titles, plots and posters are original demo content (locally stored SVG art).
const movies = [
  { name: 'Neon Monsoon', slug: 'neon-monsoon', genres: ['Sci-Fi', 'Thriller'], language: 'Hindi', certificate: 'U/A', duration: 128, releaseDate: '2026-08-14',
    description: 'In a rain-drenched future Mumbai, a courier discovers that the city\'s lights are rewriting people\'s memories. DEMO MOVIE.' },
  { name: 'The Last Lighthouse', slug: 'the-last-lighthouse', genres: ['Drama', 'Mystery'], language: 'English', certificate: 'U/A', duration: 117, releaseDate: '2026-07-03',
    description: 'A retired keeper and a stranded researcher uncover why the final lighthouse on the coast never goes dark. DEMO MOVIE.' },
  { name: 'Quantum Chai', slug: 'quantum-chai', genres: ['Comedy', 'Sci-Fi'], language: 'Hindi', certificate: 'U', duration: 109, releaseDate: '2026-09-05',
    description: 'A tea-stall owner accidentally invents a kettle that boils time itself, and the neighbourhood will never be the same. DEMO MOVIE.' },
  { name: 'Midnight Bazaar', slug: 'midnight-bazaar', genres: ['Fantasy', 'Adventure'], language: 'Tamil', certificate: 'U', duration: 134, releaseDate: '2026-06-20',
    description: 'Every new moon a market appears where anything can be traded. One girl bargains for her village\'s lost name. DEMO MOVIE.' },
  { name: 'Paper Tigers of Pune', slug: 'paper-tigers-of-pune', genres: ['Action', 'Crime'], language: 'Marathi', certificate: 'A', duration: 141, releaseDate: '2026-05-30',
    description: 'Three origami artists become the city\'s unlikely vigilantes after a heist at the old printing house. DEMO MOVIE.' },
  { name: 'Orbit 9', slug: 'orbit-9', genres: ['Sci-Fi', 'Adventure'], language: 'English', certificate: 'U/A', duration: 152, releaseDate: '2026-09-26',
    description: 'The crew of a failing space station has nine orbits to repair the one system that keeps them all alive. DEMO MOVIE.' },
  { name: 'Saffron Skies', slug: 'saffron-skies', genres: ['Romance', 'Drama'], language: 'Hindi', certificate: 'U', duration: 122, releaseDate: '2026-08-01',
    description: 'Two kite-makers from rival families in Jaipur fall in love during the week of the kite festival. DEMO MOVIE.' },
  { name: 'The Hollow Orchard', slug: 'the-hollow-orchard', genres: ['Horror', 'Mystery'], language: 'English', certificate: 'A', duration: 104, releaseDate: '2026-10-02',
    description: 'A family inherits an orchard where the trees only bear fruit after dark. DEMO MOVIE.' },
];

const theatres = [
  { name: 'IMovies Star Cinema', location: 'Indore, Madhya Pradesh (demo)', theatreCode: 'IM-STAR',
    sections: [{ name: 'Premium', rows: 3, seatsPerRow: 10, price: 350 }, { name: 'Standard', rows: 5, seatsPerRow: 12, price: 220 }] },
  { name: 'IMovies Orbit Multiplex', location: 'Bhopal, Madhya Pradesh (demo)', theatreCode: 'IM-ORBIT',
    sections: [{ name: 'Recliner', rows: 2, seatsPerRow: 8, price: 500 }, { name: 'Gold', rows: 3, seatsPerRow: 10, price: 300 }, { name: 'Silver', rows: 4, seatsPerRow: 12, price: 180 }] },
];

const TIMES = ['10:30', '14:00', '18:30', '21:45'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

async function run() {
  await connectDB();
  const movieDocs = [];
  for (const { slug, ...m } of movies) {
    const doc = await Movie.findOneAndUpdate(
      { name: m.name },
      { $setOnInsert: { ...m, posterUrl: `/posters/${slug}.svg`, trailerUrl: '' } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    movieDocs.push(doc);
  }
  const theatreDocs = [];
  for (const t of theatres) {
    const doc = await Theatre.findOneAndUpdate({ theatreCode: t.theatreCode }, { $setOnInsert: t }, { upsert: true, new: true });
    theatreDocs.push(doc);
  }

  // Shows for the next 7 days; one movie per (theatre, time slot), rotating through the catalogue.
  let created = 0;
  for (let day = 0; day < 7; day += 1) {
    const d = new Date();
    d.setDate(d.getDate() + day);
    const date = ymd(d);
    for (let t = 0; t < theatreDocs.length; t += 1) {
      for (let s = 0; s < TIMES.length; s += 1) {
        const movie = movieDocs[(day * 3 + t * 2 + s) % movieDocs.length];
        const show = new Show({ movie: movie._id, theatre: theatreDocs[t]._id, date, time: TIMES[s], sections: theatreDocs[t].sections.map((x) => x.toObject()) });
        await show.validate();
        if (show.startsAt <= new Date()) continue; // skip slots already in the past today
        const res = await Show.updateOne(
          { theatre: show.theatre, startsAt: show.startsAt },
          { $setOnInsert: { movie: show.movie, theatre: show.theatre, date, time: TIMES[s], startsAt: show.startsAt, sections: show.toObject().sections, totalSeats: show.totalSeats, bookedSeats: [] } },
          { upsert: true }
        );
        if (res.upsertedCount) created += 1;
      }
    }
  }
  console.log(`✔ Seed complete: ${movieDocs.length} movies, ${theatreDocs.length} theatres, ${created} new shows (existing records were left untouched).`);
}

run()
  .catch((err) => {
    console.error(`✖ Seeding failed: ${err.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
