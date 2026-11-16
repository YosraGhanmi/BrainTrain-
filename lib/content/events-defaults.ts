import type { EventsContent } from './types';

const FB_PAGE_VIDEO = (id: string) => `https://www.facebook.com/reel/${id}`;

// What the Events page shipped with. Everything here is editable from
// Admin > Events page once saved.
export const DEFAULT_EVENTS: EventsContent = {
  seoTitle: {
    en: 'Events: Inspire Talks and Closing Ceremonies | Braintrain Academy Sousse',
    fr: 'Événements : Inspire Talks et cérémonies de clôture | Braintrain Academy Sousse',
  },
  seoDescription: {
    en: 'Inspire Talks with Tunisian entrepreneurs and the Braintrain Academy closing ceremonies in Sousse, in pictures and video. Plus the next international competition, coming to Tunisia.',
    fr: "Les Inspire Talks avec des entrepreneurs tunisiens et les cérémonies de clôture de Braintrain Academy à Sousse, en images et en vidéo. Et la prochaine compétition internationale, bientôt en Tunisie.",
  },
  mastheadTitle: { en: 'Our *events*', fr: 'Nos *événements*' },
  mastheadTagline: {
    en: 'Braintrain Academy',
    fr: 'Braintrain Academy',
  },
  intro: {
    en: 'Talks with people who built something, and the ceremonies where we celebrate what our students have built. Here is how it went.',
    fr: "Des rencontres avec des personnes qui ont construit quelque chose, et les cérémonies où l'on célèbre ce que nos élèves ont construit. Voici comment ça s'est passé.",
  },
  heroImages: [
    '/events/cc2-2.jpg',
    '/events/it2-2.jpg',
    '/events/cc1-3.jpg',
    '/events/cc2-5.jpg',
    '/events/it1-1.jpg',
    '/events/cc1-2.jpg',
    '/events/cc2-8.jpg',
    '/events/it2-1.jpg',
    '/events/cc1-6.jpg',
    '/events/cc2-6.jpg',
    '/events/cc2-4.jpg',
    '/events/cc1-1.jpg',
    '/events/cc2-3.jpg',
    '/events/it2-3.jpg',
    '/events/cc1-5.jpg',
    '/events/cc2-9.jpg',
    '/events/cc2-7.jpg',
    '/events/cc1-4.jpg',
    '/events/cc2-1.jpg',
  ],
  upcoming: {
    eyebrow: { en: 'Coming soon', fr: 'Bientôt' },
    title: { en: 'RIFA World Cup, *coming to Tunisia*', fr: 'RIFA World Cup, *bientôt en Tunisie*' },
    tagline: {
      en: 'Official partner in Tunisia. One more country. One bigger community.',
      fr: 'Partenaire officiel en Tunisie. Un pays de plus. Une communauté plus grande.',
    },
    text: {
      en: 'Braintrain Academy is the official partner of the RIFA World Cup in Tunisia for 2026-2027. We are preparing the international competition here at home. Watch the teaser, and stay close for the dates.',
      fr: "Braintrain Academy est le partenaire officiel de la RIFA World Cup en Tunisie pour 2026-2027. Nous préparons la compétition internationale chez nous. Regardez le teaser et restez proches pour les dates.",
    },
    dateLabel: { en: '2026 - 2027', fr: '2026 - 2027' },
    image: '/events/rifa-world-cup.jpg',
    imageAlt: {
      en: 'Tunisian flag over Sidi Bou Said at night: Braintrain and RIFA World Cup, official partner in Tunisia, 2026-2027',
      fr: 'Drapeau tunisien au-dessus de Sidi Bou Saïd la nuit : Braintrain et RIFA World Cup, partenaire officiel en Tunisie, 2026-2027',
    },
    facebookUrl: FB_PAGE_VIDEO('1616490756519798'),
    videoFile: '',
    poster: '/events/rifa-teaser.jpg',
    portrait: true,
  },
  events: [
    {
      id: 'closing-ceremony-2',
      kicker: { en: 'Closing Ceremony · Edition 2', fr: 'Cérémonie de clôture · Édition 2' },
      title: { en: 'Closing Ceremony, second edition', fr: 'Cérémonie de clôture, deuxième édition' },
      date: { en: 'September 2026', fr: 'Septembre 2026' },
      standfirst: {
        en: 'A year of building, celebrated together.',
        fr: 'Une année à construire, célébrée ensemble.',
      },
      body: { en: '', fr: '' },
      speakers: [],
      facebookUrl: FB_PAGE_VIDEO('1622576929212466'),
      videoFile: '',
      poster: '/events/closing-ceremony-2.jpg',
      portrait: true,
      postUrl: 'https://www.facebook.com/share/r/18V1P1Am1b/',
    },
    {
      id: 'inspire-talks-2',
      kicker: { en: 'Inspire Talks · Edition 2', fr: 'Inspire Talks · Édition 2' },
      title: {
        en: 'Inspire Talks, second edition: new stories, new perspectives',
        fr: 'Inspire Talks, deuxième édition : de nouvelles histoires, de nouveaux regards',
      },
      date: { en: 'August 2026', fr: 'Août 2026' },
      standfirst: {
        en: 'Three entrepreneurs, one stage, the same mission: inspire the next generation.',
        fr: 'Trois entrepreneurs, une scène, la même mission : inspirer la prochaine génération.',
      },
      body: {
        en: 'After the success of our first edition, Inspire Talks returned for a second experience, bringing three entrepreneurs together on one stage to connect with and inspire the next generation.\n\nThrough authentic conversations, they spoke about their journeys, the challenges behind their achievements, the lessons they learned along the way, and the mindset needed to keep moving forward.\n\nAt Braintrain Academy, we believe children need more than lessons. They need to meet people who have turned ideas into action, faced uncertainty, learned from failure, and kept building.\n\nThank you for investing your time in the next generation and for helping us plant the seeds of ambition, creativity, entrepreneurship, leadership and innovation. Real journeys. Real experiences. Real inspiration for future changemakers. And this is only the beginning.',
        fr: "Après le succès de notre première édition, les Inspire Talks sont revenus pour une deuxième expérience, réunissant trois entrepreneurs sur une même scène pour échanger avec la prochaine génération et l'inspirer.\n\nÀ travers des échanges authentiques, ils ont parlé de leurs parcours, des défis derrière leurs réussites, des leçons apprises en chemin et de l'état d'esprit nécessaire pour continuer d'avancer.\n\nÀ Braintrain Academy, nous croyons que les enfants ont besoin de plus que des cours. Ils ont besoin de rencontrer des personnes qui ont transformé des idées en actions, affronté l'incertitude, appris de l'échec et continué à construire.\n\nMerci d'avoir investi votre temps dans la prochaine génération et de nous aider à semer les graines de l'ambition, de la créativité, de l'entrepreneuriat, du leadership et de l'innovation. De vrais parcours. De vraies expériences. De vraies sources d'inspiration pour les futurs changemakers. Et ce n'est que le début.",
      },
      speakers: [
        { en: 'Dr. Amine Mosbah', fr: 'Dr. Amine Mosbah' },
        { en: 'Asma Basly', fr: 'Asma Basly' },
        { en: 'Dr. Bassem Seddik', fr: 'Dr. Bassem Seddik' },
      ],
      facebookUrl: '',
      videoFile: '',
      poster: '/events/it2-2.jpg',
      portrait: true,
      postUrl: 'https://www.facebook.com/share/p/1JRtdJvj5j/',
    },
    {
      id: 'closing-ceremony-1',
      kicker: { en: 'Closing Ceremony · Edition 1', fr: 'Cérémonie de clôture · Édition 1' },
      title: { en: 'Closing Ceremony, first edition', fr: 'Cérémonie de clôture, première édition' },
      date: { en: 'September 2025', fr: 'Septembre 2025' },
      standfirst: {
        en: 'Celebrating together what the children have built.',
        fr: 'On célèbre ensemble ce que les enfants ont construit.',
      },
      body: { en: '', fr: '' },
      speakers: [],
      facebookUrl: FB_PAGE_VIDEO('1584983709149897'),
      videoFile: '',
      poster: '/events/closing-ceremony-1.jpg',
      portrait: true,
      postUrl: 'https://www.facebook.com/share/v/18WxmyTEHb/',
    },
    {
      id: 'inspire-talks-1',
      kicker: { en: 'Inspire Talks · Edition 1', fr: 'Inspire Talks · Édition 1' },
      title: {
        en: 'Inspire Talks: four entrepreneurs, real stories',
        fr: 'Inspire Talks : quatre entrepreneurs, de vraies histoires',
      },
      date: { en: 'August 2025', fr: 'Août 2025' },
      standfirst: {
        en: 'Four passionate entrepreneurs gave their time to inspire the next generation.',
        fr: 'Quatre entrepreneurs passionnés ont donné de leur temps pour inspirer la prochaine génération.',
      },
      body: {
        en: 'We are delighted to share the success of our Inspire Talks, which brought together four passionate entrepreneurs who invested their time to inspire the next generation.\n\nThey shared the true stories of their journeys: the challenges they faced, the lessons they learned and the victories they celebrated.\n\nThis event was not only about business. It was above all about showing children that ideas can grow, that obstacles can be overcome and that dreams can come true. Through authentic exchanges and inspiring stories, we sparked curiosity, fed ambition and planted the seeds of future changemakers.\n\nA huge thank you to our speakers for sharing their expertise, vision and real-life experience.',
        fr: "Nous sommes ravis de partager le succès de notre Inspire Talks, qui a réuni quatre entrepreneurs passionnés ayant investi de leur temps pour inspirer la prochaine génération.\n\nIls ont dévoilé les vraies histoires de leurs parcours : les défis qu'ils ont affrontés, les leçons qu'ils ont apprises et les victoires qu'ils ont célébrées.\n\nCet événement n'était pas seulement une question de business. Il s'agissait surtout de montrer aux enfants que les idées peuvent grandir, que les obstacles peuvent être surmontés et que les rêves peuvent devenir réalité. À travers des échanges authentiques et des récits inspirants, nous avons éveillé la curiosité, nourri l'ambition et semé les graines des futurs changemakers.\n\nUn immense merci à nos intervenants pour avoir partagé leur expertise, leur vision et leurs expériences concrètes.",
      },
      speakers: [
        { en: 'Chiheb Eddine Fatnassi | CEO, Pixelup', fr: 'Chiheb Eddine Fatnassi | CEO, Pixelup' },
        { en: 'Ichraf Jarray | CEO, Hive12', fr: 'Ichraf Jarray | CEO, Hive12' },
        { en: 'Aziz Ben Romdhane | COO, EasyBank', fr: 'Aziz Ben Romdhane | COO, EasyBank' },
        { en: 'Hichem Mokni | CEO, NextAV', fr: 'Hichem Mokni | CEO, NextAV' },
      ],
      facebookUrl: '',
      videoFile: '',
      poster: '/events/it1-1.jpg',
      portrait: true,
      postUrl: 'https://www.facebook.com/share/p/1C4ipVcNkQ/',
    },
  ],
};
