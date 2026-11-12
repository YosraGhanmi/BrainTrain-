import type { PalmaresContent } from './types';

// What the Palmarès page shipped with. Everything here is editable from
// Admin > Palmarès once saved.
export const DEFAULT_PALMARES: PalmaresContent = {
  seoTitle: {
    en: 'Robotics Awards and Trophies | Braintrain Academy Sousse',
    fr: 'Palmarès et trophées en robotique | Braintrain Academy Sousse',
  },
  seoDescription: {
    en: 'Awards at FIRST LEGO League Tunisia and the RFO Arab Championship in Jordan: discover the trophies won by Braintrain Academy students in Sousse.',
    fr: 'Des prix à la FIRST LEGO League Tunisie et au championnat arabe RFO en Jordanie : découvrez les trophées des élèves de Braintrain Academy à Sousse.',
  },
  heading: {
    en: 'Braintrain Academy awards and trophies',
    fr: 'Palmarès et trophées de Braintrain Academy',
  },
  intro: {
    en: 'Since 2023, Braintrain Academy students aged 4 to 18 have represented Sousse and Tunisia at national and international robotics competitions. Here are their main results.',
    fr: 'Depuis 2023, les élèves de Braintrain Academy, de 4 à 18 ans, représentent Sousse et la Tunisie dans des compétitions de robotique nationales et internationales. Voici leurs principaux résultats.',
  },
  awardsEyebrow: { en: 'Our awards', fr: 'Nos récompenses' },
  awardsHeading: { en: 'Our *journey*, our victories', fr: 'Notre *parcours*, nos victoires' },
  awardsIntro: {
    en: 'Recognition of our commitment and the quality of our learning.',
    fr: 'Une reconnaissance de notre engagement et de la qualité de notre apprentissage.',
  },
  competitions: [
    {
      title: {
        en: 'FIRST LEGO League Challenge 2026 – Tunisia National Tournament',
        fr: 'FIRST LEGO League Challenge 2026 – Tournoi national de Tunisie',
      },
      intro: { en: '', fr: '' },
      awards: [
        { en: '1st place – Motivation Award', fr: '1re place – Prix de la Motivation (Motivation Award)' },
        { en: '2nd place – Champion Award (national level)', fr: "2e place – Champion Award (à l'échelle nationale)" },
        { en: '3rd place – Innovation Project', fr: '3e place – Innovation Project' },
        { en: '3rd place – Core Values', fr: '3e place – Core Values' },
        {
          en: 'Qualified for the international competition, to represent Tunisia once again',
          fr: 'Qualification pour la compétition internationale, pour représenter la Tunisie encore une fois',
        },
      ],
      image: '',
      imageAlt: { en: '', fr: '' },
    },
    {
      title: {
        en: 'Arab Championship – RFO (Robotics Football Olympiad), Dead Sea, Jordan (December 2025)',
        fr: 'Championnat arabe – RFO (Robotics Football Olympiad), Mer Morte, Jordanie (décembre 2025)',
      },
      intro: { en: '', fr: '' },
      awards: [
        { en: '1st place – Innovation Project (junior category)', fr: "1re place – Projet d'innovation (catégorie junior)" },
        { en: '1st place – Best Creative Solution (junior category)', fr: '1re place – Meilleure solution créative (catégorie junior)' },
        { en: '1st place – Best Robot Design (senior category)', fr: '1re place – Meilleur design de robot (catégorie senior)' },
      ],
      image: '',
      imageAlt: { en: '', fr: '' },
    },
    {
      title: {
        en: 'FIRST LEGO League Challenge 2025 – Tunisia National Tournament',
        fr: 'FIRST LEGO League Challenge 2025 – Tournoi national de Tunisie',
      },
      intro: { en: 'In their very first participation:', fr: 'Pour leur première participation :' },
      awards: [
        { en: '1st place – Core Values', fr: '1re place – Core Values' },
        { en: '2nd place – Innovation Project', fr: '2e place – Innovation Project' },
        { en: '2nd place – Robot Performance', fr: '2e place – Robot Performance' },
        { en: '3rd place – Champion Award (national level)', fr: "3e place – Champion Award (à l'échelle nationale)" },
        {
          en: 'Qualified for the FIRST LEGO League international competition in Greece (May 2025)',
          fr: 'Qualification pour la compétition internationale FIRST LEGO League en Grèce (mai 2025)',
        },
      ],
      image: '',
      imageAlt: { en: '', fr: '' },
    },
    // Waiting for the competition name, date and the eight awards: hidden on
    // the page until at least one award line is filled in
    {
      title: { en: 'Students under 10', fr: 'Élèves de moins de 10 ans' },
      intro: { en: 'Our youngest students won 8 trophies:', fr: 'Nos plus jeunes élèves ont remporté 8 trophées :' },
      awards: [],
      image: '',
      imageAlt: {
        en: 'Young Braintrain Academy students with their 8 trophies',
        fr: 'Les jeunes élèves de Braintrain Academy avec leurs 8 trophées',
      },
    },
  ],
  videosHeading: {
    en: 'Photos and videos from our international competitions',
    fr: 'Photos et vidéos de nos compétitions internationales',
  },
  videos: [
    {
      title: {
        en: 'Robot Game – FLL Open International Championship (OIC), Greece',
        fr: 'Robot Game – FLL Open International Championship (OIC), Grèce',
      },
      highlight: {
        en: 'Our team scored 475 out of 545 points in the Robot Game.',
        fr: 'Notre équipe a marqué 475 points sur 545 au Robot Game.',
      },
      description: {
        en: 'At the Robot Game of the FIRST LEGO League Open International Championship in Greece, the robot designed and programmed by our students completes its missions on its own and scores 475 out of 545 points.',
        fr: "Au Robot Game de l'Open International Championship FIRST LEGO League en Grèce, le robot conçu et programmé par nos élèves accomplit ses missions en autonomie et marque 475 points sur 545.",
      },
      url: 'https://www.facebook.com/share/v/1cePRqoobe/',
      image: '/ach/j.jpg',
    },
    {
      title: {
        en: 'Our students at the international competition in Greece (2025)',
        fr: 'Nos élèves à la compétition internationale en Grèce (2025)',
      },
      highlight: { en: '', fr: '' },
      description: {
        en: "Our students represent Tunisia at the FIRST LEGO League international competition in Greece in May 2025, the team's first international experience.",
        fr: "Nos élèves représentent la Tunisie à la compétition internationale FIRST LEGO League en Grèce en mai 2025, une première expérience internationale pour l'équipe.",
      },
      url: 'https://www.facebook.com/share/r/1FGSihzqLB/',
      image: '/ach/jk.jpg',
    },
    {
      title: {
        en: 'Award ceremony – RFO Arab Championship, Dead Sea, Jordan',
        fr: 'Remise des prix – Championnat arabe RFO, Mer Morte, Jordanie',
      },
      highlight: { en: '', fr: '' },
      description: {
        en: 'At the Dead Sea in Jordan, our teams receive three 1st place awards at the RFO (Robotics Football Olympiad) Arab Championship, in the junior and senior categories.',
        fr: 'À la Mer Morte en Jordanie, nos équipes reçoivent trois prix de 1re place au championnat arabe RFO (Robotics Football Olympiad), en catégories junior et senior.',
      },
      url: 'https://www.facebook.com/share/r/1De5dJX522/',
      image: '/ach/winnn.jpg',
    },
    {
      title: { en: 'Celebrating the trophies in Jordan', fr: 'Célébration des trophées en Jordanie' },
      highlight: { en: '', fr: '' },
      description: {
        en: 'Right after the award ceremony, our students and their coaches celebrate their three 1st place trophies from the RFO Arab Championship in Jordan.',
        fr: 'Juste après la remise des prix, nos élèves et leurs coachs célèbrent en Jordanie leurs trois trophées de 1re place au championnat arabe RFO.',
      },
      url: 'https://www.facebook.com/share/r/1Hn5S7F4Wj/',
      image: '/ach/oman.jpg',
    },
  ],
  mediaHeading: { en: 'Braintrain in the media', fr: 'Braintrain dans les médias' },
  mediaIntro: {
    en: 'Our results in Jordan were praised by the media and by the embassy.',
    fr: "Nos résultats en Jordanie ont été salués par les médias et par l'ambassade.",
  },
  media: [
    {
      name: { en: 'Media interview', fr: 'Interview dans les médias' },
      badge: { en: 'Interview', fr: 'Interview' },
      description: {
        en: 'Interview with the Braintrain Academy team after its results at the RFO Arab Championship in Jordan.',
        fr: "Interview de l'équipe Braintrain Academy après ses résultats au championnat arabe RFO en Jordanie.",
      },
      url: 'https://www.facebook.com/share/r/19wU2oy9yU/',
      image: '/palmares/media/interview.svg',
      logo: false,
    },
    {
      name: { en: 'Embassy of Jordan', fr: 'Ambassade de Jordanie' },
      badge: { en: 'Embassy', fr: 'Ambassade' },
      description: {
        en: "The Embassy of Jordan highlights Braintrain Academy's participation and awards.",
        fr: "L'ambassade de Jordanie met en avant la participation et les prix de Braintrain Academy.",
      },
      url: 'https://www.facebook.com/share/p/1CEfg5TK9F/',
      image: '/palmares/media/jordan-flag.svg',
      logo: false,
    },
    {
      name: { en: 'La Presse', fr: 'La Presse' },
      badge: { en: 'Newspaper', fr: 'Presse écrite' },
      description: {
        en: 'The newspaper La Presse covers the results of Braintrain Academy students.',
        fr: 'Le journal La Presse parle des résultats des élèves de Braintrain Academy.',
      },
      url: 'https://www.facebook.com/share/p/1CmKmTBazE/',
      image: '/palmares/media/la-presse.png',
      logo: true,
    },
    {
      name: { en: 'Al Arabiya', fr: 'Al Arabiya' },
      badge: { en: 'Television', fr: 'Télévision' },
      description: {
        en: 'The Al Arabiya channel puts the spotlight on the Braintrain Academy team.',
        fr: "La chaîne Al Arabiya met en lumière l'équipe de Braintrain Academy.",
      },
      url: 'https://www.facebook.com/share/p/19EXEHB3tC/',
      image: '/palmares/media/al-arabiya.svg',
      logo: true,
    },
  ],
  statsHeading: { en: 'In numbers', fr: 'En chiffres' },
  stats: [
    { value: 12, label: { en: 'courses', fr: 'cours' } },
    { value: 1500, label: { en: 'students', fr: 'élèves' } },
    { value: 19, label: { en: 'trophies', fr: 'trophées' } },
  ],
  photos: [
    {
      src: '/ach/oman.jpg',
      alt: {
        en: 'Braintrain Academy students with their three 1st place trophies from the RFO Arab Championship in Jordan',
        fr: 'Élèves de Braintrain Academy avec leurs trois trophées de 1re place du championnat arabe RFO en Jordanie',
      },
    },
    // Uploaded on the live site; the page hides any photo that fails to load
    {
      src: '/uploads/ach/1793350321052-2.jpg',
      alt: {
        en: 'FIRST LEGO League Tunisia 2025 and 2026 trophies won by Braintrain Academy',
        fr: 'Trophées FIRST LEGO League Tunisie 2025 et 2026 remportés par Braintrain Academy',
      },
    },
    {
      src: '/ach/t.jpg',
      alt: {
        en: 'Braintrain Academy FIRST LEGO League Challenge trophies',
        fr: 'Trophées FIRST LEGO League Challenge de Braintrain Academy',
      },
    },
    {
      src: '/ach/ALL.jpg',
      alt: {
        en: 'Braintrain Academy students in Sousse with their robotics trophies',
        fr: 'Les élèves de Braintrain Academy à Sousse avec leurs trophées de robotique',
      },
    },
    {
      src: '/ach/winnn.jpg',
      alt: {
        en: 'The Braintrain team on stage with the Tunisian flag and its trophy',
        fr: "L'équipe Braintrain sur scène avec le drapeau tunisien et son trophée",
      },
    },
    {
      src: '/ach/hh.jpg',
      alt: {
        en: 'Trophy won by Braintrain Academy students',
        fr: 'Trophée remporté par les élèves de Braintrain Academy',
      },
    },
  ],
};
