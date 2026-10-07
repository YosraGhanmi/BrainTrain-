import fs from 'fs';
import path from 'path';
import { parseAgeRange } from './age-range';
import type { SiteContent, LocalizedString, StatEntry, TimelineEntry, CourseEntry, AgeGroupEntry, NewsPost, CalendarEvent, ClassFormat } from './types';

// Everything the admin dashboard edits lives in one JSON file on disk. This
// only works because the app runs on a traditional Node server with a
// persistent filesystem — a serverless host would need a real database
// instead, since its filesystem is read-only / ephemeral per invocation.
const CONTENT_PATH = path.join(process.cwd(), 'data', 'content.json');

const DEFAULT_CONTENT: SiteContent = {
  sponsors: [
    '/partners/American corner.png',
    '/partners/Ecole Internationale Francaise.jpg',
    '/partners/amideast.png',
    '/partners/arsii.jpg',
    '/partners/asediact.jpg',
    '/partners/class quiz.jpg',
    '/partners/jci.jpg',
    '/partners/ministere.png',
    '/partners/novation city.jpg',
    '/partners/robotna.jpg',
  ],
  stats: [
    {
      value: 12,
      label: { en: 'Courses', fr: 'Cours' },
    },
    {
      value: 1500,
      label: { en: 'Students', fr: 'Élèves' },
    },
    {
      value: 19,
      label: { en: 'Trophies', fr: 'Trophées' },
    },
  ],
  achievementsImages: [
    '/ach/ALL.jpg',
    '/ach/h.jpg',
    '/ach/hh.jpg',
    '/ach/j.jpg',
    '/ach/jk.jpg',
    '/ach/ml.jpg',
    '/ach/oman.jpg',
    '/ach/t.jpg',
    '/ach/w.jpg',
    '/ach/win.jpg',
    '/ach/winnn.jpg',
    '/ach/ww.png',
  ],
  timeline: [
    {
      date: { en: 'October 2023', fr: 'Octobre 2023' },
      title: { en: 'BrainTrain is founded', fr: 'Création de BrainTrain' },
      logo: true,
      summary: {
        en: 'A Tunisian academy opens its doors with one idea: let kids learn by building.',
        fr: 'Une académie tunisienne ouvre ses portes avec une idée : faire apprendre les enfants en construisant.',
      },
    },
    {
      date: { en: 'February 2025', fr: 'Février 2025' },
      title: {
        en: 'FIRST® LEGO® League Tunisia 2025: national participation',
        fr: 'FIRST® LEGO® League Tunisie 2025 : participation nationale',
      },
      logo: false,
      summary: { en: '', fr: '' },
      facebookUrl: 'https://www.facebook.com/share/p/1EKdYAzwfw/',
    },
    {
      date: { en: 'May 2025', fr: 'Mai 2025' },
      title: { en: 'FIRST® LEGO® League World Competition', fr: 'Compétition internationale FIRST® LEGO® League' },
      logo: false,
      summary: {
        en: 'International participation at the FLL in Greece.',
        fr: 'Participation internationale à la FLL en Grèce.',
      },
      facebookUrl: 'https://www.facebook.com/share/v/1JofUcLoNG/',
    },
    {
      date: { en: 'August 2025', fr: 'Août 2025' },
      title: { en: 'Inspire Talks', fr: 'Inspire Talks' },
      logo: false,
      summary: { en: '', fr: '' },
      facebookUrl: 'https://www.facebook.com/share/p/1C4ipVcNkQ/',
    },
    {
      date: { en: 'September 2025', fr: 'Septembre 2025' },
      title: { en: 'Closing Ceremony', fr: 'Cérémonie de clôture' },
      logo: true,
      summary: { en: '', fr: '' },
      facebookUrl: 'https://www.facebook.com/share/v/18WxmyTEHb/',
    },
    {
      date: { en: 'December 2025', fr: 'Décembre 2025' },
      title: { en: 'Arab Championship: 3 prizes', fr: 'Championnat arabe : 3 prix' },
      logo: false,
      summary: {
        en: 'The season closes with three wins at the Arab level.',
        fr: 'La saison se termine avec trois victoires au niveau arabe.',
      },
      facebookUrl: 'https://www.facebook.com/share/p/1GgBnrf4Bx/',
    },
    {
      date: { en: 'March 2026', fr: 'Mars 2026' },
      title: { en: 'FLL national qualification', fr: 'Qualification nationale FLL' },
      logo: false,
      summary: { en: 'We qualified for the second time.', fr: 'Nous nous sommes qualifiés pour la deuxième fois.' },
      facebookUrl: 'https://www.facebook.com/share/p/1GgBnrf4Bx/',
    },
    {
      date: { en: 'April 2026', fr: 'Avril 2026' },
      title: { en: 'National competition for kids aged 6-9', fr: 'Compétition nationale pour les 6-9 ans' },
      logo: false,
      summary: { en: '', fr: '' },
      facebookUrl: 'https://www.facebook.com/share/v/1KRb2XBszp/',
    },
    {
      date: { en: 'May 2026', fr: 'Mai 2026' },
      title: { en: 'International participation in Greece', fr: 'Participation internationale en Grèce' },
      logo: false,
      summary: {
        en: 'Representing Tunisia abroad once again.',
        fr: "Nous représentons à nouveau la Tunisie à l'étranger.",
      },
      facebookUrl: 'https://www.facebook.com/share/r/1Edh8mNZdD/',
    },
    {
      date: { en: 'August 2026', fr: 'Août 2026' },
      title: { en: 'Inspire Talks', fr: 'Inspire Talks' },
      logo: false,
      summary: { en: '', fr: '' },
      facebookUrl: 'https://www.facebook.com/share/p/1JRtdJvj5j/',
    },
    {
      date: { en: 'September 2026', fr: 'Septembre 2026' },
      title: { en: 'Closing Ceremony', fr: 'Cérémonie de clôture' },
      logo: true,
      summary: { en: 'Coming soon', fr: 'Bientôt' },
    },
  ],
  contact: {
    email: { value: 'contact@braintrain.tn', href: 'mailto:contact@braintrain.tn' },
    phone: { value: '58 996 112', href: 'tel:+21658996112' },
    location: {
      value: 'Rue Gp1, Khzema Ouest, Sousse, Tunisia, 4071',
      href: 'https://www.google.com/maps/place/Braintrain+Academy/@35.8441536,10.6122719,17z/data=!3m1!4b1!4m6!3m5!1s0x12fd8b0074c0577b:0x4e986dd851ffe308!8m2!3d35.8441493!4d10.6148468!16s%2Fg%2F11vzg1d9bv?entry=tts&g_ep=EgoyMDI0MDkxOC4xKgBIAVAD',
    },
    mapsEmbedSrc: 'https://www.google.com/maps?q=35.8441493,10.6148468&z=17&output=embed',
  },
  socials: [
    { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61556624844766' },
    { label: 'Instagram', href: 'https://www.instagram.com/braintrain.tn/' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/company/braintrainacademy/' },
  ],
  courses: [
    {
      slug: 'robotique-6-9',
      title: { en: 'Robotics', fr: 'Robotique' },
      icon: 'Bot',
      color: '#f7b500',
      description: {
        en: 'Build, wire and program real robots from scratch. Kids design circuits, assemble chassis, and bring their creations to life through hands-on robotics challenges.',
        fr: 'Construire, câbler et programmer de vrais robots à partir de zéro. Les enfants conçoivent des circuits, assemblent des châssis et donnent vie à leurs créations à travers des défis de robotique concrets.',
      },
      sessions: 12,
      price: 0,
      ageGroupSlug: '6-9',
      outcome: {
        en: 'Your child builds and programs a robot that moves and reacts to its surroundings.',
        fr: 'Votre enfant construit et programme un robot qui se déplace et réagit à son environnement.',
      },
      tools: [],
      tagline: {
        en: 'Build robots... *and bring them to life.*',
        fr: 'Construire des robots... *et leur donner vie.*',
      },
      highlights: [
        {
          icon: 'Wrench',
          title: { en: 'Build', fr: 'Construire' },
          text: { en: 'Assemble chassis, motors and sensors', fr: 'Assembler châssis, moteurs et capteurs' },
        },
        {
          icon: 'Code2',
          title: { en: 'Program', fr: 'Programmer' },
          text: { en: 'Give the robot precise instructions', fr: 'Donner des ordres précis au robot' },
        },
        {
          icon: 'Trophy',
          title: { en: 'Take on challenges', fr: 'Relever des défis' },
          text: { en: 'Missions and robotics competitions', fr: 'Missions et compétitions de robotique' },
        },
      ],
      skills: [
        { en: 'Build a robot step by step', fr: 'Monter un robot étape par étape' },
        { en: 'Use motors and sensors', fr: 'Utiliser moteurs et capteurs' },
        { en: 'Program movements', fr: 'Programmer des déplacements' },
        { en: 'Test, debug and improve', fr: 'Tester, corriger, améliorer' },
        { en: 'Work as a team', fr: 'Travailler en équipe' },
      ],
    },
    {
      slug: 'robotique-10-13',
      title: { en: 'Robotics', fr: 'Robotique' },
      icon: 'Bot',
      color: '#f7b500',
      description: {
        en: 'Build, wire and program real robots from scratch. Kids design circuits, assemble chassis, and bring their creations to life through hands-on robotics challenges.',
        fr: 'Construire, câbler et programmer de vrais robots à partir de zéro. Les enfants conçoivent des circuits, assemblent des châssis et donnent vie à leurs créations à travers des défis de robotique concrets.',
      },
      sessions: 12,
      price: 0,
      ageGroupSlug: '10-13',
      outcome: {
        en: 'Your child designs a robot for a real challenge, wires its sensors and programs it to complete a mission on its own.',
        fr: 'Votre enfant conçoit un robot pour un vrai défi, câble ses capteurs et le programme pour accomplir une mission en autonomie.',
      },
      tools: [],
      tagline: {
        en: 'Build robots... *and bring them to life.*',
        fr: 'Construire des robots... *et leur donner vie.*',
      },
      highlights: [
        {
          icon: 'Wrench',
          title: { en: 'Build', fr: 'Construire' },
          text: { en: 'Assemble chassis, motors and sensors', fr: 'Assembler châssis, moteurs et capteurs' },
        },
        {
          icon: 'Code2',
          title: { en: 'Program', fr: 'Programmer' },
          text: { en: 'Give the robot precise instructions', fr: 'Donner des ordres précis au robot' },
        },
        {
          icon: 'Trophy',
          title: { en: 'Take on challenges', fr: 'Relever des défis' },
          text: { en: 'Missions and robotics competitions', fr: 'Missions et compétitions de robotique' },
        },
      ],
      skills: [
        { en: 'Build a robot step by step', fr: 'Monter un robot étape par étape' },
        { en: 'Use motors and sensors', fr: 'Utiliser moteurs et capteurs' },
        { en: 'Program movements', fr: 'Programmer des déplacements' },
        { en: 'Test, debug and improve', fr: 'Tester, corriger, améliorer' },
        { en: 'Work as a team', fr: 'Travailler en équipe' },
      ],
    },
    {
      slug: 'robotique-14-18',
      title: { en: 'Robotics', fr: 'Robotique' },
      icon: 'Bot',
      color: '#f7b500',
      description: {
        en: 'Build, wire and program real robots from scratch. Kids design circuits, assemble chassis, and bring their creations to life through hands-on robotics challenges.',
        fr: 'Construire, câbler et programmer de vrais robots à partir de zéro. Les enfants conçoivent des circuits, assemblent des châssis et donnent vie à leurs créations à travers des défis de robotique concrets.',
      },
      sessions: 12,
      price: 0,
      ageGroupSlug: '14-18',
      outcome: {
        en: 'Your child builds an advanced robot, codes its behavior and is ready to compete in national and international robotics challenges.',
        fr: 'Votre enfant construit un robot avancé, programme son comportement et est prêt à concourir dans des défis de robotique nationaux et internationaux.',
      },
      tools: [],
      tagline: {
        en: 'Build robots... *and bring them to life.*',
        fr: 'Construire des robots... *et leur donner vie.*',
      },
      highlights: [
        {
          icon: 'Wrench',
          title: { en: 'Build', fr: 'Construire' },
          text: { en: 'Assemble chassis, motors and sensors', fr: 'Assembler châssis, moteurs et capteurs' },
        },
        {
          icon: 'Code2',
          title: { en: 'Program', fr: 'Programmer' },
          text: { en: 'Give the robot precise instructions', fr: 'Donner des ordres précis au robot' },
        },
        {
          icon: 'Trophy',
          title: { en: 'Take on challenges', fr: 'Relever des défis' },
          text: { en: 'Missions and robotics competitions', fr: 'Missions et compétitions de robotique' },
        },
      ],
      skills: [
        { en: 'Build a robot step by step', fr: 'Monter un robot étape par étape' },
        { en: 'Use motors and sensors', fr: 'Utiliser moteurs et capteurs' },
        { en: 'Program movements', fr: 'Programmer des déplacements' },
        { en: 'Test, debug and improve', fr: 'Tester, corriger, améliorer' },
        { en: 'Work as a team', fr: 'Travailler en équipe' },
      ],
    },
    {
      slug: 'programmation-6-9',
      title: { en: 'Programming', fr: 'Programmation' },
      icon: 'Code2',
      color: '#3d7fff',
      description: {
        en: 'Learn to code through games and interactive projects. Students write real programs, debug logic, and build the problem-solving mindset behind every app they use.',
        fr: "Apprendre à coder à travers des jeux et des projets interactifs. Les élèves écrivent de vrais programmes, corrigent leur logique et développent l'esprit de résolution de problèmes qui se cache derrière chaque application qu'ils utilisent.",
      },
      sessions: 10,
      price: 0,
      ageGroupSlug: '6-9',
      outcome: {
        en: 'Your child creates their own animated story and a small game, using loops and conditions.',
        fr: 'Votre enfant crée sa propre histoire animée et un petit jeu, avec des boucles et des conditions.',
      },
      tools: [],
      tagline: {
        en: 'Learn to code... *by making your own games.*',
        fr: 'Apprendre à coder... *en créant ses propres jeux.*',
      },
      highlights: [
        {
          icon: 'Lightbulb',
          title: { en: 'Imagine', fr: 'Imaginer' },
          text: { en: 'Invent a game or a story', fr: 'Inventer un jeu ou une histoire' },
        },
        {
          icon: 'Code2',
          title: { en: 'Code', fr: 'Coder' },
          text: { en: 'Write real programs', fr: 'Écrire de vrais programmes' },
        },
        {
          icon: 'Bug',
          title: { en: 'Debug', fr: 'Déboguer' },
          text: { en: 'Find and fix mistakes', fr: 'Trouver et corriger les erreurs' },
        },
      ],
      skills: [
        { en: 'Think like a programmer', fr: 'Penser comme un programmeur' },
        { en: 'Use loops and conditions', fr: 'Utiliser boucles et conditions' },
        { en: 'Create interactive games', fr: 'Créer des jeux interactifs' },
        { en: 'Fix their own bugs', fr: 'Corriger ses erreurs' },
        { en: 'Present their project', fr: 'Présenter son projet' },
      ],
    },
    {
      slug: 'programmation-10-13',
      title: { en: 'Programming', fr: 'Programmation' },
      icon: 'Code2',
      color: '#3d7fff',
      description: {
        en: 'Learn to code through games and interactive projects. Students write real programs, debug logic, and build the problem-solving mindset behind every app they use.',
        fr: "Apprendre à coder à travers des jeux et des projets interactifs. Les élèves écrivent de vrais programmes, corrigent leur logique et développent l'esprit de résolution de problèmes qui se cache derrière chaque application qu'ils utilisent.",
      },
      sessions: 10,
      price: 0,
      ageGroupSlug: '10-13',
      outcome: {
        en: 'Your child codes a complete game or app, from the idea to a working version, and knows how to find and fix bugs.',
        fr: "Votre enfant code un jeu ou une application complète, de l'idée à la version qui fonctionne, et sait trouver et corriger ses erreurs.",
      },
      tools: [],
      tagline: {
        en: 'Learn to code... *by making your own games.*',
        fr: 'Apprendre à coder... *en créant ses propres jeux.*',
      },
      highlights: [
        {
          icon: 'Lightbulb',
          title: { en: 'Imagine', fr: 'Imaginer' },
          text: { en: 'Invent a game or a story', fr: 'Inventer un jeu ou une histoire' },
        },
        {
          icon: 'Code2',
          title: { en: 'Code', fr: 'Coder' },
          text: { en: 'Write real programs', fr: 'Écrire de vrais programmes' },
        },
        {
          icon: 'Bug',
          title: { en: 'Debug', fr: 'Déboguer' },
          text: { en: 'Find and fix mistakes', fr: 'Trouver et corriger les erreurs' },
        },
      ],
      skills: [
        { en: 'Think like a programmer', fr: 'Penser comme un programmeur' },
        { en: 'Use loops and conditions', fr: 'Utiliser boucles et conditions' },
        { en: 'Create interactive games', fr: 'Créer des jeux interactifs' },
        { en: 'Fix their own bugs', fr: 'Corriger ses erreurs' },
        { en: 'Present their project', fr: 'Présenter son projet' },
      ],
    },
    {
      slug: 'entrepreneuriat-6-9',
      title: { en: 'Entrepreneurship', fr: 'Entrepreneuriat' },
      icon: 'Rocket',
      color: '#ff5a5f',
      description: {
        en: 'Turn ideas into real ventures. Kids learn to spot opportunities, pitch a concept, and plan a mini business from the ground up.',
        fr: 'Transformer des idées en vrais projets. Les enfants apprennent à repérer des opportunités, à présenter un concept et à planifier une mini-entreprise de A à Z.',
      },
      sessions: 8,
      price: 0,
      ageGroupSlug: '6-9',
      outcome: {
        en: 'Your child invents a product, builds a prototype and presents it confidently in front of an audience.',
        fr: 'Votre enfant invente un produit, en fabrique un prototype et le présente avec assurance devant un public.',
      },
      tools: [],
      tagline: { en: 'Turn an idea... *into a real project.*', fr: 'Transformer une idée... *en vrai projet.*' },
      highlights: [
        {
          icon: 'Lightbulb',
          title: { en: 'Imagine', fr: 'Imaginer' },
          text: { en: 'Spot a problem worth solving', fr: 'Repérer un problème à résoudre' },
        },
        {
          icon: 'Rocket',
          title: { en: 'Build', fr: 'Construire' },
          text: { en: 'Create a prototype and a plan', fr: 'Créer un prototype et un plan' },
        },
        {
          icon: 'Presentation',
          title: { en: 'Pitch', fr: 'Présenter' },
          text: { en: 'Win over an audience', fr: 'Convaincre un public' },
        },
      ],
      skills: [
        { en: 'Find a good idea', fr: 'Trouver une bonne idée' },
        { en: 'Understand customers', fr: 'Comprendre ses clients' },
        { en: 'Work out a simple budget', fr: 'Calculer un budget simple' },
        { en: 'Give a pitch', fr: 'Faire un pitch' },
        { en: 'Work as a team', fr: 'Travailler en équipe' },
      ],
    },
    {
      slug: 'entrepreneuriat-10-13',
      title: { en: 'Entrepreneurship', fr: 'Entrepreneuriat' },
      icon: 'Rocket',
      color: '#ff5a5f',
      description: {
        en: 'Turn ideas into real ventures. Kids learn to spot opportunities, pitch a concept, and plan a mini business from the ground up.',
        fr: 'Transformer des idées en vrais projets. Les enfants apprennent à repérer des opportunités, à présenter un concept et à planifier une mini-entreprise de A à Z.',
      },
      sessions: 8,
      price: 0,
      ageGroupSlug: '10-13',
      outcome: {
        en: 'Your child turns an idea into a mini business plan: target customers, price, budget and a pitch.',
        fr: 'Votre enfant transforme une idée en mini business plan : clients visés, prix, budget et pitch.',
      },
      tools: [],
      tagline: { en: 'Turn an idea... *into a real project.*', fr: 'Transformer une idée... *en vrai projet.*' },
      highlights: [
        {
          icon: 'Lightbulb',
          title: { en: 'Imagine', fr: 'Imaginer' },
          text: { en: 'Spot a problem worth solving', fr: 'Repérer un problème à résoudre' },
        },
        {
          icon: 'Rocket',
          title: { en: 'Build', fr: 'Construire' },
          text: { en: 'Create a prototype and a plan', fr: 'Créer un prototype et un plan' },
        },
        {
          icon: 'Presentation',
          title: { en: 'Pitch', fr: 'Présenter' },
          text: { en: 'Win over an audience', fr: 'Convaincre un public' },
        },
      ],
      skills: [
        { en: 'Find a good idea', fr: 'Trouver une bonne idée' },
        { en: 'Understand customers', fr: 'Comprendre ses clients' },
        { en: 'Work out a simple budget', fr: 'Calculer un budget simple' },
        { en: 'Give a pitch', fr: 'Faire un pitch' },
        { en: 'Work as a team', fr: 'Travailler en équipe' },
      ],
    },
    {
      slug: 'entrepreneuriat-14-18',
      title: { en: 'Entrepreneurship', fr: 'Entrepreneuriat' },
      icon: 'Rocket',
      color: '#ff5a5f',
      description: {
        en: 'Turn ideas into real ventures. Kids learn to spot opportunities, pitch a concept, and plan a mini business from the ground up.',
        fr: 'Transformer des idées en vrais projets. Les enfants apprennent à repérer des opportunités, à présenter un concept et à planifier une mini-entreprise de A à Z.',
      },
      sessions: 8,
      price: 0,
      ageGroupSlug: '14-18',
      outcome: {
        en: 'Your child runs a startup project from start to finish and pitches it to a jury, just like a real founder.',
        fr: 'Votre enfant mène un projet de startup de A à Z et le présente devant un jury, comme un vrai fondateur.',
      },
      tools: [],
      tagline: { en: 'Turn an idea... *into a real project.*', fr: 'Transformer une idée... *en vrai projet.*' },
      highlights: [
        {
          icon: 'Lightbulb',
          title: { en: 'Imagine', fr: 'Imaginer' },
          text: { en: 'Spot a problem worth solving', fr: 'Repérer un problème à résoudre' },
        },
        {
          icon: 'Rocket',
          title: { en: 'Build', fr: 'Construire' },
          text: { en: 'Create a prototype and a plan', fr: 'Créer un prototype et un plan' },
        },
        {
          icon: 'Presentation',
          title: { en: 'Pitch', fr: 'Présenter' },
          text: { en: 'Win over an audience', fr: 'Convaincre un public' },
        },
      ],
      skills: [
        { en: 'Find a good idea', fr: 'Trouver une bonne idée' },
        { en: 'Understand customers', fr: 'Comprendre ses clients' },
        { en: 'Work out a simple budget', fr: 'Calculer un budget simple' },
        { en: 'Give a pitch', fr: 'Faire un pitch' },
        { en: 'Work as a team', fr: 'Travailler en équipe' },
      ],
    },
    {
      slug: 'jeu-intelligence-emotionnelle-4-5',
      title: { en: 'Emotional Intelligence Games', fr: "Jeu d'intelligence émotionnelle" },
      icon: 'Smile',
      color: '#6c5ce7',
      description: {
        en: 'A playful introduction to feelings and social skills, helping young children recognize, name and manage their emotions through games.',
        fr: 'Une initiation ludique aux émotions et aux compétences sociales, qui aide les jeunes enfants à reconnaître, nommer et gérer leurs émotions grâce au jeu.',
      },
      sessions: 6,
      price: 0,
      ageGroupSlug: '4-5',
      outcome: {
        en: 'Your child recognizes and names their main emotions and has simple tools to calm down and share.',
        fr: "Votre enfant reconnaît et nomme ses principales émotions et dispose d'outils simples pour se calmer et partager.",
      },
      tools: [],
      tagline: {
        en: 'Understanding emotions... *through play.*',
        fr: 'Apprendre à comprendre ses émotions... *en jouant.*',
      },
      highlights: [
        {
          icon: 'Smile',
          title: { en: 'Recognize', fr: 'Reconnaître' },
          text: { en: 'Identify their emotions', fr: 'Identifier ses émotions' },
        },
        {
          icon: 'MessageCircle',
          title: { en: 'Express', fr: 'Exprimer' },
          text: { en: 'Put feelings into words', fr: "Mettre des mots sur ce qu'il ressent" },
        },
        {
          icon: 'Flower2',
          title: { en: 'Manage', fr: 'Gérer' },
          text: { en: 'Learn ways to calm down', fr: 'Découvrir des techniques pour se calmer' },
        },
      ],
      skills: [
        { en: 'Recognize emotions', fr: 'Reconnaître ses émotions' },
        { en: 'Name them', fr: 'Les nommer' },
        { en: 'Understand what triggers them', fr: 'Comprendre ce qui les déclenche' },
        { en: 'Learn to calm down', fr: 'Apprendre à se calmer' },
        { en: 'Communicate better with others', fr: 'Mieux communiquer avec les autres' },
      ],
    },
    {
      slug: 'tech-explorers-4-5',
      title: { en: 'Tech Explorers', fr: 'Tech Explorers' },
      icon: 'Cpu',
      color: '#0ea5e9',
      description: {
        en: 'A two-year technical foundation where young children discover how things are built, how mechanisms move, how robots follow commands and how sensors help them react. Through Tiny Bot, STEAM Park and Thymio, students build engineering thinking, mechanical reasoning, robotics foundations and early coding logic through hands-on challenges: 1 session/week, 1h30, from 15 September to 15 June.',
        fr: "Une fondation technique de deux ans où les jeunes enfants découvrent comment les choses sont construites, comment les mécanismes bougent, comment les robots suivent des commandes et comment les capteurs les aident à réagir. Avec Tiny Bot, STEAM Park et Thymio, les enfants développent une pensée d'ingénieur, un raisonnement mécanique, des bases en robotique et une logique de codage précoce à travers des défis pratiques : 1 séance/semaine, 1h30, du 15 septembre au 15 juin.",
      },
      sessions: 36,
      price: 0,
      ageGroupSlug: '4-5',
      curriculum: [
        {
          title: { en: 'Year 1: Discover & Control', fr: 'Année 1 : découvrir & contrôler' },
          points: [
            {
              en: 'Engineering foundations: structures, stability and the build-test-improve habit.',
              fr: "Bases d'ingénierie : structures, stabilité et l'habitude de construire-tester-améliorer.",
            },
            {
              en: 'Mechanics: wheels, axles, gears and how motion transfers between parts.',
              fr: 'Mécanique : roues, essieux, engrenages et transfert du mouvement entre les pièces.',
            },
            {
              en: 'Meet the robot: movement commands and first guided routes.',
              fr: 'Rencontre avec le robot : commandes de mouvement et premiers parcours guidés.',
            },
            {
              en: 'Early coding: ordered sequences, prediction and first debugging.',
              fr: 'Premiers pas en code : séquences ordonnées, prédiction et premier débogage.',
            },
            {
              en: 'Sensors: how a robot detects its environment and reacts.',
              fr: 'Capteurs : comment un robot détecte son environnement et y réagit.',
            },
            {
              en: 'Capstone: a guided project combining a build with robot movement or sensing.',
              fr: 'Projet final : un projet guidé combinant construction et mouvement ou détection du robot.',
            },
          ],
        },
        {
          title: { en: 'Year 2: Plan & Create', fr: 'Année 2 : planifier & créer' },
          points: [
            {
              en: 'Purposeful design: building to a constraint and a stated success criterion.',
              fr: 'Conception réfléchie : construire selon une contrainte et un objectif précis.',
            },
            {
              en: 'Mechanisms with a purpose: gear direction, speed and input-output reasoning.',
              fr: 'Mécanismes utiles : sens et vitesse des engrenages, raisonnement entrée-sortie.',
            },
            {
              en: 'Robot planning: longer command sequences, repetition and route optimization.',
              fr: 'Planification robotique : séquences plus longues, répétition et optimisation du trajet.',
            },
            {
              en: 'Sensor logic: if-then reasoning and autonomous robot behaviors.',
              fr: 'Logique de capteurs : raisonnement si-alors et comportements autonomes du robot.',
            },
            {
              en: 'Integrated systems: structure, mechanism and robot behavior working together.',
              fr: 'Systèmes intégrés : structure, mécanisme et comportement du robot combinés.',
            },
            {
              en: 'Capstone: a full project (plan, build, code, debug and present), ready for ages 6-9.',
              fr: 'Projet final : un projet complet (planifier, construire, coder, déboguer, présenter), prêt pour les 6-9 ans.',
            },
          ],
        },
      ],
      outcome: {
        en: 'Your child builds their own mechanisms, guides a small robot and writes their first command sequences.',
        fr: 'Votre enfant construit ses propres mécanismes, guide un petit robot et écrit ses premières séquences de commandes.',
      },
      tools: ['Tiny Bot', 'STEAM Park', 'Thymio'],
      sessionHours: 1.5,
      tagline: {
        en: 'Discover how things work... *by building.*',
        fr: 'Découvrir comment tout fonctionne... *en construisant.*',
      },
      highlights: [
        {
          icon: 'Cog',
          title: { en: 'Build', fr: 'Construire' },
          text: { en: 'Structures and mechanisms', fr: 'Structures et mécanismes' },
        },
        {
          icon: 'Bot',
          title: { en: 'Steer', fr: 'Piloter' },
          text: { en: 'Guide a small robot', fr: 'Guider un petit robot' },
        },
        {
          icon: 'Puzzle',
          title: { en: 'Code', fr: 'Coder' },
          text: { en: 'First command sequences', fr: 'Premières séquences de commandes' },
        },
      ],
      skills: [
        { en: 'Build stable structures', fr: 'Construire des structures stables' },
        { en: 'Understand gears and wheels', fr: 'Comprendre engrenages et roues' },
        { en: 'Guide a robot', fr: 'Guider un robot' },
        { en: 'Create command sequences', fr: 'Créer des séquences de commandes' },
        { en: 'Discover sensors', fr: 'Découvrir les capteurs' },
      ],
    },
    {
      slug: 'jeu-intelligence-emotionnelle-6-9',
      title: { en: 'Emotional Intelligence Games', fr: "Jeu d'intelligence émotionnelle" },
      icon: 'Smile',
      color: '#6c5ce7',
      description: {
        en: 'A playful introduction to feelings and social skills, helping young children recognize, name and manage their emotions through games.',
        fr: 'Une initiation ludique aux émotions et aux compétences sociales, qui aide les jeunes enfants à reconnaître, nommer et gérer leurs émotions grâce au jeu.',
      },
      sessions: 6,
      price: 0,
      ageGroupSlug: '6-9',
      outcome: {
        en: 'Your child understands their own emotions and those of others, and handles frustration and teamwork better.',
        fr: 'Votre enfant comprend ses émotions et celles des autres, et gère mieux la frustration et le travail en équipe.',
      },
      tools: [],
      tagline: {
        en: 'Understanding emotions... *through play.*',
        fr: 'Apprendre à comprendre ses émotions... *en jouant.*',
      },
      highlights: [
        {
          icon: 'Smile',
          title: { en: 'Recognize', fr: 'Reconnaître' },
          text: { en: 'Identify their emotions', fr: 'Identifier ses émotions' },
        },
        {
          icon: 'MessageCircle',
          title: { en: 'Express', fr: 'Exprimer' },
          text: { en: 'Put feelings into words', fr: "Mettre des mots sur ce qu'il ressent" },
        },
        {
          icon: 'Flower2',
          title: { en: 'Manage', fr: 'Gérer' },
          text: { en: 'Learn ways to calm down', fr: 'Découvrir des techniques pour se calmer' },
        },
      ],
      skills: [
        { en: 'Recognize emotions', fr: 'Reconnaître ses émotions' },
        { en: 'Name them', fr: 'Les nommer' },
        { en: 'Understand what triggers them', fr: 'Comprendre ce qui les déclenche' },
        { en: 'Learn to calm down', fr: 'Apprendre à se calmer' },
        { en: 'Communicate better with others', fr: 'Mieux communiquer avec les autres' },
      ],
    },
    {
      slug: 'electronique-10-13',
      title: { en: 'Electronics', fr: 'Électronique' },
      icon: 'CircuitBoard',
      color: '#00b894',
      description: {
        en: 'Hands-on exploration of circuits, sensors and components. Students learn how electricity powers the devices around them by building their own working circuits.',
        fr: "Une exploration pratique des circuits, des capteurs et des composants. Les élèves découvrent comment l'électricité alimente les appareils qui les entourent en construisant leurs propres circuits.",
      },
      sessions: 10,
      price: 0,
      ageGroupSlug: '10-13',
      outcome: {
        en: 'Your child reads a simple circuit diagram and builds working circuits with LEDs, buttons and sensors.',
        fr: 'Votre enfant lit un schéma électrique simple et réalise des circuits qui fonctionnent avec LED, boutons et capteurs.',
      },
      tools: [],
      tagline: {
        en: 'Understand electricity... *by making it flow.*',
        fr: "Comprendre l'électricité... *en la faisant circuler.*",
      },
      highlights: [
        {
          icon: 'CircuitBoard',
          title: { en: 'Wire', fr: 'Câbler' },
          text: { en: 'Build their own circuits', fr: 'Monter ses propres circuits' },
        },
        {
          icon: 'Zap',
          title: { en: 'Understand', fr: 'Comprendre' },
          text: { en: 'Current, voltage and components', fr: 'Courant, tension et composants' },
        },
        {
          icon: 'Lightbulb',
          title: { en: 'Invent', fr: 'Inventer' },
          text: { en: 'Create objects that react', fr: 'Créer des objets qui réagissent' },
        },
      ],
      skills: [
        { en: 'Read a simple diagram', fr: 'Lire un schéma simple' },
        { en: 'Use LEDs, buttons and sensors', fr: 'Utiliser LED, boutons et capteurs' },
        { en: 'Build a circuit safely', fr: 'Monter un circuit en toute sécurité' },
        { en: 'Measure and test', fr: 'Mesurer et tester' },
        { en: 'Complete a mini project', fr: 'Réaliser un mini-projet' },
      ],
    },
    {
      slug: 'impression-design-3d-10-13',
      title: { en: '3D Printing & Design', fr: 'Impression et design 3D' },
      icon: 'Printer',
      color: '#ff8c42',
      description: {
        en: 'From sketch to physical object. Kids learn 3D modeling basics and watch their designs come to life on a 3D printer.',
        fr: "Du croquis à l'objet réel. Les enfants apprennent les bases de la modélisation 3D et voient leurs créations prendre vie sur une imprimante 3D.",
      },
      sessions: 8,
      price: 0,
      ageGroupSlug: '10-13',
      outcome: {
        en: 'Your child models their own object in 3D and prints it, from the first sketch to the finished piece.',
        fr: "Votre enfant modélise son propre objet en 3D et l'imprime, du premier croquis à la pièce finie.",
      },
      tools: [],
      tagline: { en: 'From sketch... *to real object.*', fr: "Du croquis... *à l'objet réel.*" },
      highlights: [
        {
          icon: 'Pencil',
          title: { en: 'Sketch', fr: 'Dessiner' },
          text: { en: 'Imagine their object', fr: 'Imaginer son objet' },
        },
        {
          icon: 'Box',
          title: { en: 'Model', fr: 'Modéliser' },
          text: { en: 'Create it in 3D on screen', fr: "Le créer en 3D à l'écran" },
        },
        {
          icon: 'Printer',
          title: { en: 'Print', fr: 'Imprimer' },
          text: { en: 'Watch it come out of the printer', fr: "Le voir sortir de l'imprimante" },
        },
      ],
      skills: [
        { en: 'Sketch an idea', fr: 'Dessiner une idée' },
        { en: 'Model in 3D', fr: 'Modéliser en 3D' },
        { en: 'Take precise measurements', fr: 'Prendre des mesures précises' },
        { en: 'Prepare a print', fr: 'Préparer une impression' },
        { en: 'Improve their object', fr: 'Améliorer son objet' },
      ],
    },
    {
      slug: 'python-14-18',
      title: { en: 'Python', fr: 'Python' },
      icon: 'Terminal',
      color: '#0b8793',
      description: {
        en: 'A deeper dive into real-world programming with Python: scripting, logic and small projects that prepare teens for serious coding.',
        fr: 'Une immersion plus poussée dans la programmation réelle avec Python : scripts, logique et petits projets qui préparent les adolescents à coder sérieusement.',
      },
      sessions: 12,
      price: 0,
      ageGroupSlug: '14-18',
      outcome: {
        en: 'Your child writes real Python programs: scripts, small games and tools that solve everyday problems.',
        fr: 'Votre enfant écrit de vrais programmes en Python : scripts, petits jeux et outils qui résolvent des problèmes du quotidien.',
      },
      tools: ['Python'],
      tagline: { en: 'Code like a pro... *with Python.*', fr: 'Coder comme un pro... *avec Python.*' },
      highlights: [
        {
          icon: 'Terminal',
          title: { en: 'Write', fr: 'Écrire' },
          text: { en: 'Real Python scripts', fr: 'De vrais scripts Python' },
        },
        {
          icon: 'Puzzle',
          title: { en: 'Solve', fr: 'Résoudre' },
          text: { en: 'Real-world problems', fr: 'Des problèmes concrets' },
        },
        {
          icon: 'Rocket',
          title: { en: 'Build', fr: 'Construire' },
          text: { en: 'Games and useful tools', fr: 'Jeux et outils utiles' },
        },
      ],
      skills: [
        { en: 'Master Python basics', fr: 'Maîtriser les bases de Python' },
        { en: 'Use variables, loops and functions', fr: 'Utiliser variables, boucles et fonctions' },
        { en: 'Work with data', fr: 'Manipuler des données' },
        { en: 'Debug efficiently', fr: 'Déboguer efficacement' },
        { en: 'Complete a full project', fr: 'Mener un projet complet' },
      ],
    },
  ],
  ageGroups: [
    {
      slug: '4-5',
      label: { en: '4-5 years', fr: '4-5 ans' },
      description: {
        en: 'First steps into discovery: playing with emotions, ideas, structures and simple robots in a fun, guided way.',
        fr: 'Premiers pas vers la découverte : jouer avec les émotions, les idées, les structures et de petits robots, de façon ludique et encadrée.',
      },
      icon: 'Baby',
      image: '/age/4-5.jpg',
      minAge: 4,
      maxAge: 5,
      stage: { en: 'Little Explorers', fr: 'Les petits explorateurs' },
    },
    {
      slug: '6-9',
      label: { en: '6-9 years', fr: '6-9 ans' },
      description: {
        en: 'Robotics, coding and entrepreneurship basics introduced through hands-on, playful projects.',
        fr: "Les bases de la robotique, de la programmation et de l'entrepreneuriat, à travers des projets pratiques et ludiques.",
      },
      icon: 'Puzzle',
      image: '/age/6-9.jpg',
      minAge: 6,
      maxAge: 9,
      stage: { en: 'Young Builders', fr: 'Les jeunes bâtisseurs' },
    },
    {
      slug: '10-13',
      label: { en: '10-13 years', fr: '10-13 ans' },
      description: {
        en: 'Deeper dives into electronics, 3D design and programming to build real, working projects.',
        fr: "Approfondissement de l'électronique, du design 3D et de la programmation pour construire de vrais projets fonctionnels.",
      },
      icon: 'Cpu',
      image: '/age/10-13.png',
      minAge: 10,
      maxAge: 13,
      stage: { en: 'Inventors', fr: 'Les inventeurs' },
    },
    {
      slug: '14-18',
      label: { en: '14-18 years', fr: '14-18 ans' },
      description: {
        en: 'Advanced Python, robotics and entrepreneurship to prepare teens for real-world challenges.',
        fr: 'Python avancé, robotique et entrepreneuriat pour préparer les adolescents aux défis du monde réel.',
      },
      icon: 'GraduationCap',
      image: '/age/14-18.png',
      minAge: 14,
      maxAge: 18,
      stage: { en: 'Innovators', fr: 'Les innovateurs' },
    },
  ],
  news: [],
  calendarEvents: [],
  classFormat: { sessionsPerWeek: 1, sessionHours: 2, maxGroupSize: 12 },
  familyDiscountPercent: 5,
};

// `data/content.json` may still hold plain strings for fields that used to be
// English-only, from before French support existed — normalize those into
// { en, fr } on read (using the English text as a placeholder French value
// until an admin translates it) instead of crashing or silently dropping data.
function toLocalized(value: unknown, fallback: LocalizedString): LocalizedString {
  if (typeof value === 'string') return { en: value, fr: value };
  if (value && typeof value === 'object' && 'en' in value) {
    const v = value as Partial<LocalizedString>;
    return { en: v.en ?? fallback.en, fr: v.fr || v.en || fallback.fr };
  }
  return fallback;
}

function normalize(raw: Partial<SiteContent>): SiteContent {
  const merged = { ...DEFAULT_CONTENT, ...raw };

  const stats: StatEntry[] = (raw.stats ?? DEFAULT_CONTENT.stats).map((s: any) => ({
    value: s.value,
    label: toLocalized(s.label, { en: '', fr: '' }),
  }));

  const timeline: TimelineEntry[] = (raw.timeline ?? DEFAULT_CONTENT.timeline).map((t: any) => ({
    date: toLocalized(t.date, { en: '', fr: '' }),
    title: toLocalized(t.title, { en: '', fr: '' }),
    logo: Boolean(t.logo),
    summary: toLocalized(t.summary, { en: '', fr: '' }),
    facebookUrl: t.facebookUrl || undefined,
  }));

  const courses: CourseEntry[] = (raw.courses ?? DEFAULT_CONTENT.courses).map((c: any) => ({
    ...c,
    title: toLocalized(c.title, { en: '', fr: '' }),
    description: toLocalized(c.description, { en: '', fr: '' }),
    sessionHours: typeof c.sessionHours === 'number' && c.sessionHours > 0 ? c.sessionHours : undefined,
    tagline: toLocalized(c.tagline, { en: '', fr: '' }),
    highlights: Array.isArray(c.highlights)
      ? c.highlights.map((h: any) => ({
          icon: String(h.icon ?? 'Lightbulb'),
          title: toLocalized(h.title, { en: '', fr: '' }),
          text: toLocalized(h.text, { en: '', fr: '' }),
        }))
      : [],
    outcome: toLocalized(c.outcome, { en: '', fr: '' }),
    skills: Array.isArray(c.skills) ? c.skills.map((s: any) => toLocalized(s, { en: '', fr: '' })) : [],
    tools: Array.isArray(c.tools) ? c.tools.map(String).filter(Boolean) : [],
  }));

  const ageGroups: AgeGroupEntry[] = (raw.ageGroups ?? DEFAULT_CONTENT.ageGroups).map((g: any) => {
    const label = toLocalized(g.label, { en: '', fr: '' });
    // Groups saved before age ranges existed: read the range off the label
    const parsed = parseAgeRange(label.en) ?? parseAgeRange(String(g.slug ?? ''));
    return {
      ...g,
      label,
      description: toLocalized(g.description, { en: '', fr: '' }),
      minAge: typeof g.minAge === 'number' ? g.minAge : (parsed?.minAge ?? null),
      maxAge: typeof g.maxAge === 'number' ? g.maxAge : (parsed?.maxAge ?? null),
      stage: toLocalized(g.stage, { en: '', fr: '' }),
    };
  });

  const rawFormat: Partial<ClassFormat> = raw.classFormat ?? {};
  const defaultFormat = DEFAULT_CONTENT.classFormat;
  const positive = (value: unknown, fallback: number) =>
    typeof value === 'number' && value > 0 ? value : fallback;
  const classFormat: ClassFormat = {
    sessionsPerWeek: positive(rawFormat.sessionsPerWeek, defaultFormat.sessionsPerWeek),
    sessionHours: positive(rawFormat.sessionHours, defaultFormat.sessionHours),
    maxGroupSize: positive(rawFormat.maxGroupSize, defaultFormat.maxGroupSize),
  };

  const familyDiscountPercent =
    typeof raw.familyDiscountPercent === 'number' && raw.familyDiscountPercent >= 0 && raw.familyDiscountPercent <= 100
      ? raw.familyDiscountPercent
      : DEFAULT_CONTENT.familyDiscountPercent;

  const news: NewsPost[] = (raw.news ?? DEFAULT_CONTENT.news).map((n: any) => ({
    ...n,
    targetAgeGroups: Array.isArray(n.targetAgeGroups) ? n.targetAgeGroups : [],
    targetCourses: Array.isArray(n.targetCourses) ? n.targetCourses : [],
  }));

  const calendarEvents: CalendarEvent[] = (raw.calendarEvents ?? DEFAULT_CONTENT.calendarEvents).map((e: any) => ({
    ...e,
    targetAgeGroups: Array.isArray(e.targetAgeGroups) ? e.targetAgeGroups : [],
    targetCourses: Array.isArray(e.targetCourses) ? e.targetCourses : [],
  }));

  return { ...merged, stats, timeline, courses, ageGroups, news, calendarEvents, classFormat, familyDiscountPercent };
}

function ensureFile(): void {
  const dir = path.dirname(CONTENT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(CONTENT_PATH)) {
    fs.writeFileSync(CONTENT_PATH, JSON.stringify(DEFAULT_CONTENT, null, 2), 'utf-8');
  }
}

export function readContent(): SiteContent {
  ensureFile();
  const raw = fs.readFileSync(CONTENT_PATH, 'utf-8');
  // Merge over defaults so a partially-edited file (or a field added in a
  // later version of this file) never crashes a render with `undefined`.
  return normalize(JSON.parse(raw));
}

export function writeContent(content: SiteContent): void {
  ensureFile();
  fs.writeFileSync(CONTENT_PATH, JSON.stringify(content, null, 2), 'utf-8');
}
