import React from 'react'
import Carousel from 'react-bootstrap/Carousel'
import soko1 from '../assets/images/pexels-barrytheoctopus-33624055.jpg'
import soko2 from '../assets/images/pexels-made-by-pixels-133605980-33364793.jpg'
import soko3 from '../assets/images/pexels-nannawabadiya-37125911.jpg'
import soko4 from '../assets/images/pexels-planeteelevene-13583431.jpg'
import farmLedger from '../assets/images/pexels-jonathankwuka-19661361.jpg'
import market from '../assets/images/pexels-giovana-montes-furlan-378236299-34655583.jpg'
import mission from '../assets/images/pexels-safari-consoler-3290243-11350335.jpg'

const storySections = [
  {
    title: "Built for African farmers",
    image: farmLedger,
    text: "ShambaSmart is a platform built for the African farmer. Whether you own five acres in Nakuru or manage a greenhouse in Kiambu, ShambaSmart gives you the tools to run your farm like a business: track your crops, log your costs, manage your workers and sell your produce directly to buyers across Kenya. No middlemen. No guesswork. Just your farm, working smarter.",
  },
  {
    title: "The problem we solve",
    image: soko2,
    reverse: true,
    text: "For too long, African farmers have carried everything in their heads: what was planted, what was spent, what was earned. When things go wrong, there is no record. When buyers come, there is no price history. When workers need paying, there is no clear ledger. ShambaSmart changes that. Every seed planted, every shilling spent, every harvest logged: all in one place, always accessible, always yours.",
  },
  {
    title: "A direct marketplace",
    image: market,
    text: "ShambaSmart is also a marketplace. When your tomatoes are ready, you should not have to wait at the roadside or sell to a middleman for half what they are worth. List your produce on ShambaSmart and connect directly with buyers: individuals, restaurants, retailers and businesses across Kenya who want fresh, traceable food straight from the source. They pay via M-Pesa. You get paid instantly. Simple as that.",
  },
  {
    title: "Our mission",
    image: mission,
    text: "ShambaSmart was built in Kenya, for Kenya, with one belief at its core: that the people who grow our food deserve modern tools and fair markets. Every farmer who joins makes the platform smarter. Every sale made cuts out a middleman. Every harvest logged builds a future where African agriculture is not just surviving, it is thriving.",
  },
]

const Home = () => {
  return (
    <main className="page-dark home-page">
      <Carousel className="home-carousel" indicators controls interval={3500} fade>
        {[soko1, soko2, soko3, soko4].map((image, index) => (
          <Carousel.Item key={image}>
            <img className="home-carousel-image" src={image} alt={`ShambaSmart farm ${index + 1}`} />
          </Carousel.Item>
        ))}
      </Carousel>

      <section className="home-hero-copy">
        <p className="dashboard-kicker">ShambaSmart</p>
        <h1>Farming is hard enough. Managing it shouldn't be.</h1>
      </section>

      <section className="home-story">
        {storySections.map((section) => (
          <article className={`home-story-row ${section.reverse ? "reverse" : ""}`} key={section.title}>
            <div className="home-story-card">
              <h2>{section.title}</h2>
              <p>{section.text}</p>
            </div>
            <img src={section.image} alt={section.title} className="home-story-photo" />
          </article>
        ))}
      </section>

      <section className="home-closing">
        <h2>Join thousands of farmers already using ShambaSmart.</h2>
        <p>Your farm. Your data. Your market.</p>
      </section>
    </main>
  )
}

export default Home
