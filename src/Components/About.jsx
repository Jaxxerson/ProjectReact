import React from 'react'
import { Link } from 'react-router-dom'
import grower from '../assets/images/pexels-leefinvrede-37087450.jpg'
import market from '../assets/images/pexels-giovana-montes-furlan-378236299-34655583.jpg'
import records from '../assets/images/pexels-jonathankwuka-19661361.jpg'
import harvest from '../assets/images/pexels-shootsaga-30839537.jpg'
import cropCare from '../assets/images/pexels-kalz-michael-1277172-36390056.jpg'
import fieldTeam from '../assets/images/pexels-safari-consoler-3290243-11350335.jpg'

const pillars = [
  {
    title: "Farm memory",
    text: "Planting dates, expenses, harvest notes, workers, and stock live in one timeline so every season teaches the next one.",
  },
  {
    title: "Fairer selling",
    text: "Farmers list what is ready, buyers compare real supply, and value stays closer to the people doing the growing.",
  },
  {
    title: "Local confidence",
    text: "Profiles, ratings, and farm details help buyers trust where food comes from and help workers find serious farms.",
  },
]

const journey = [
  {
    label: "Plan",
    title: "Start with the season",
    text: "A farmer can map what is planted, where it sits, who is responsible, and what success should look like before the first harvest is due.",
  },
  {
    label: "Track",
    title: "Keep the farm honest",
    text: "Costs, crop notes, labour, and product stock become visible early, so decisions are based on what is happening instead of what everyone hopes is happening.",
  },
  {
    label: "Sell",
    title: "Move harvests with context",
    text: "Produce listings carry farm names, photos, ratings, and location details, helping buyers choose confidently and farmers protect their margins.",
  },
]

const promises = [
  "Practical tools before flashy complexity",
  "Farmer ownership of records and decisions",
  "Cleaner trust between growers, workers, and buyers",
  "A marketplace that values freshness and traceability",
]

const About = () => {
  return (
    <main className="page-dark about-page">
      <section className="about-hero">
        <img src={grower} alt="Farmer standing in a cultivated field" />
        <div className="about-hero-copy">
          <p className="dashboard-kicker">About ShambaSmart</p>
          <h1>A farm operating room for growers who are done guessing.</h1>
          <p>ShambaSmart brings records, people, produce, and payments into one calm workspace built around how Kenyan farms actually move.</p>
          <div className="about-actions">
            <Link to="/farms" className="btn btn-success">Explore Farms</Link>
            <Link to="/product" className="btn btn-outline-light">Browse Produce</Link>
          </div>
        </div>
      </section>

      <section className="about-manifesto">
        <div>
          <p className="dashboard-kicker">The idea</p>
          <h2>Every farm deserves a sharper memory and a better route to market.</h2>
        </div>
        <p>ShambaSmart is built for the farmer who knows their land by feel, but wants the numbers to stand beside that instinct. It turns scattered notes, WhatsApp messages, price guesses, worker arrangements, crop problems, and buyer conversations into a living business record.</p>
      </section>

      <section className="about-image-grid">
        <img src={market} alt="Fresh produce displayed in a market" />
        <img src={records} alt="Farm landscape with growing crops" />
        <img src={harvest} alt="Hands holding fresh produce after harvest" />
      </section>

      <section className="about-pillars">
        {pillars.map((pillar) => (
          <article className="about-pillar" key={pillar.title}>
            <h3>{pillar.title}</h3>
            <p>{pillar.text}</p>
          </article>
        ))}
      </section>

      <section className="about-split-story">
        <div>
          <p className="dashboard-kicker">Why it matters</p>
          <h2>Good farms already have skill. ShambaSmart adds structure.</h2>
          <p>Many growers know their soil, seasons, suppliers, and customers deeply. The problem is that farm operations often live across notebooks, memory, phone calls, and scattered receipts. When the farm grows, that invisible system starts to strain.</p>
          <p>ShambaSmart gives that knowledge a place to land. It helps the farm owner see what has been planted, what has been spent, what workers are doing, what products are ready, and what buyers are asking for without flattening the human side of farming.</p>
        </div>
        <img src={cropCare} alt="Healthy crop leaves in a farm field" />
      </section>

      <section className="about-journey">
        <div className="about-section-heading">
          <p className="dashboard-kicker">How it works</p>
          <h2>From field decisions to market movement.</h2>
        </div>
        <div className="about-journey-grid">
          {journey.map((item) => (
            <article className="about-journey-card" key={item.label}>
              <span>{item.label}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-photo-band">
        <img src={fieldTeam} alt="Farm team working outdoors" />
        <div>
          <p className="dashboard-kicker">Our promise</p>
          <h2>Built to feel useful on an ordinary workday, not only impressive in a pitch.</h2>
          <ul>
            {promises.map((promise) => <li key={promise}>{promise}</li>)}
          </ul>
        </div>
      </section>

      <section className="about-closing">
        <p className="dashboard-kicker">What we are building toward</p>
        <h2>A food network where small and mid-sized farms are visible, trusted, and paid with less friction.</h2>
      </section>
    </main>
  )
}

export default About
