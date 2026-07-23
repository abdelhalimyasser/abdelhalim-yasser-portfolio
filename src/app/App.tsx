import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Analytics } from "@vercel/analytics/react";
import { supabase } from "../lib/supabase";
import type { Profile, DbProject, DbBlogPost, DbBlogTranslation, DbCertificate, DbExperience, DbSkill } from "../lib/supabase";
import ThemeToggle, { useTheme, type Theme } from "./components/ThemeToggle";

type Language = "EN" | "DE" | "FR" | "ES" | "AR";
type Page = "home" | "about" | "skills" | "experience" | "certificates" | "projects" | "project-detail" | "blog" | "blog-detail" | "contact";

const SOCIALS = {
  github: "https://github.com/abdelhalimyasser",
  linkedin: "https://linkedin.com/in/abdelhalimyasser",
  email: "mailto:abdelhalimyasser88@gmail.com",
  instagram: "https://instagram.com/abdelhalimyasserr",
  x: "https://x.com/abdelhalimyass",
  discord: "https://discord.com",
};

const T: Record<Language, Record<string, string>> = {
  EN: {
    home: "Home", about: "About", skills: "Skills", experience: "Experience",
    certificates: "Certificates", projects: "Projects", blog: "Blog", contact: "Contact",
    heroRole: "AI & Data Engineer",
    heroTagline: "Building intelligent systems at the intersection of data and machine learning.",
    heroCTA: "View Projects", heroContact: "Get in Touch",
    yearsExp: "Years Experience", projectsDone: "Projects Shipped", certsEarned: "Certifications",
    featuredProjects: "Featured Projects", recentPosts: "Recent Posts",
    viewAll: "View all →", viewProject: "View project", readMore: "Read more →",
    downloadCV: "Download CV", contactTitle: "Let's Work Together",
    contactSub: "Have a project in mind? Send me a message.",
    titleLabel: "Title", firstNameLabel: "First Name", lastNameLabel: "Last Name",
    emailLabel: "Email Address", messageLabel: "Message",
    verifyLabel: "Slide to verify you're human", verified: "Verified",
    sendMessage: "Send Message", messageSent: "Message sent — I'll reply within 24 hours.",
    currentRole: "Present",
    viewCert: "Verify", close: "Close", architectureBlueprint: "Architecture Blueprint",
    techStack: "Tech Stack", liveDemo: "Live Demo", sourceCode: "Source Code",
    copyCode: "Copy", copied: "Copied!", tableOfContents: "Table of Contents",
    backToProjects: "← Back to Projects", backToBlog: "← Back to Blog",
    aboutBio: "I'm a Senior AI & Data Engineer based in Cairo, Egypt, with 8+ years building data-intensive systems that scale. I specialize in the full arc from raw data ingestion to production ML inference — designing the infrastructure that makes intelligent products possible.\n\nMy work spans real-time streaming pipelines, large-scale ETL, vector databases, LLM integration, and MLOps. I believe in building things that last: well-documented, observable, and maintainable systems that teams can confidently evolve.\n\nOutside of engineering I write about what I build, speak at data conferences, and contribute to open-source tooling.",
    values: "My Engineering Philosophy",
    v1title: "Bridging the Layers", v1body: "Whether it's fine-tuning backend logic or architecting AI agents, understanding the full stack—from underlying system calls to distributed processing—makes the difference between a system that just \"works\" and one that excels.",
    v2title: "Empathy for Future Engineers", v2body: "Infrastructure should outlive its initial developers. I care deeply about clean code, maintainable backends, and documentation that acts as a true guide.",
    v3title: "Correctness and Scale", v3body: "Speed means nothing without reliability. I focus on building observable, fault-tolerant architectures where data integrity is never compromised.",
    exploreSections: "Explore Sections", exploreAbout: "Learn more about me", exploreSkills: "Technical expertise",
    exploreExperience: "Work history", exploreCredentials: "Certifications", exploreProjects: "Recent work",
    exploreBlog: "Latest articles", exploreContact: "Get in touch",
  },
  AR: {
    home: "الرئيسية", about: "عني", skills: "المهارات", experience: "الخبرة",
    certificates: "الشهادات", projects: "المشاريع", blog: "المدونة", contact: "التواصل",
    heroRole: "مهندس ذكاء اصطناعي وبيانات",
    heroTagline: "بناء أنظمة ذكية عند تقاطع البيانات والتعلم الآلي.",
    heroCTA: "استعرض المشاريع", heroContact: "تواصل معي",
    yearsExp: "سنوات خبرة", projectsDone: "مشاريع منجزة", certsEarned: "شهادات احترافية",
    featuredProjects: "مشاريع مختارة", recentPosts: "أحدث المقالات",
    viewAll: "عرض الكل ←", viewProject: "عرض المشروع", readMore: "اقرأ المزيد ←",
    downloadCV: "تحميل السيرة الذاتية", contactTitle: "لنعمل معاً",
    contactSub: "هل لديك مشروع؟ أرسل لي رسالة.",
    titleLabel: "اللقب", firstNameLabel: "الاسم الأول", lastNameLabel: "اسم العائلة",
    emailLabel: "البريد الإلكتروني", messageLabel: "الرسالة",
    verifyLabel: "اسحب للتحقق من هويتك", verified: "تم التحقق",
    sendMessage: "إرسال الرسالة", messageSent: "تم الإرسال — سأرد خلال 24 ساعة.",
    currentRole: "حالياً",
    viewCert: "التحقق", close: "إغلاق", architectureBlueprint: "مخطط المعمارية",
    techStack: "التقنيات", liveDemo: "عرض مباشر", sourceCode: "الكود المصدري",
    copyCode: "نسخ", copied: "تم النسخ!", tableOfContents: "جدول المحتويات",
    backToProjects: "← العودة للمشاريع", backToBlog: "← العودة للمدونة",
    aboutBio: "مهندس بيانات وذكاء اصطناعي أقيم في القاهرة، مصر، بخبرة تزيد على 8 سنوات في بناء أنظمة بيانات ضخمة وقابلة للتوسع.",
    values: "ما أهتم به",
    v1title: "الصحة قبل السرعة", v1body: "الكود الخاطئ السريع أسوأ من الكود الصحيح البطيء.",
    v2title: "التوثيق كبنية تحتية", v2body: "أفضل كود كتبته هو ما يستطيع مهندس مستقبلي فهمه دون أن يسألني.",
    v3title: "الاتساع يمكّن العمق", v3body: "فهم النظام بالكامل يجعل كل طبقة أفضل.",
    exploreSections: "استكشف الأقسام", exploreAbout: "اعرف المزيد عني", exploreSkills: "المهارات التقنية",
    exploreExperience: "المسيرة المهنية", exploreCredentials: "الشهادات", exploreProjects: "المشاريع الأخيرة",
    exploreBlog: "أحدث المقالات", exploreContact: "تواصل معي",
  },
  DE: {
    home: "Start", about: "Über mich", skills: "Fähigkeiten", experience: "Erfahrung",
    certificates: "Zertifikate", projects: "Projekte", blog: "Blog", contact: "Kontakt",
    heroRole: "KI- & Dateningenieur",
    heroTagline: "Intelligente Systeme an der Schnittstelle von Daten und maschinellem Lernen.",
    heroCTA: "Projekte ansehen", heroContact: "Kontakt",
    yearsExp: "Jahre Erfahrung", projectsDone: "Projekte geliefert", certsEarned: "Zertifizierungen",
    featuredProjects: "Ausgewählte Projekte", recentPosts: "Aktuelle Beiträge",
    viewAll: "Alle ansehen →", viewProject: "Projekt ansehen", readMore: "Mehr lesen →",
    downloadCV: "Lebenslauf herunterladen", contactTitle: "Zusammenarbeiten",
    contactSub: "Haben Sie ein Projekt? Schreiben Sie mir.",
    titleLabel: "Anrede", firstNameLabel: "Vorname", lastNameLabel: "Nachname",
    emailLabel: "E-Mail-Adresse", messageLabel: "Nachricht",
    verifyLabel: "Zum Verifizieren schieben", verified: "Verifiziert",
    sendMessage: "Nachricht senden", messageSent: "Nachricht gesendet — ich melde mich bald.",
    currentRole: "Aktuell",
    viewCert: "Verifizieren", close: "Schließen", architectureBlueprint: "Architekturplan",
    techStack: "Tech-Stack", liveDemo: "Live-Demo", sourceCode: "Quellcode",
    copyCode: "Kopieren", copied: "Kopiert!", tableOfContents: "Inhaltsverzeichnis",
    backToProjects: "← Zurück zu Projekten", backToBlog: "← Zurück zum Blog",
    aboutBio: "Ich bin Senior KI- & Dateningenieur mit Sitz in Kairo mit über 8 Jahren Erfahrung im Aufbau datenintensiver Systeme.",
    values: "Werte", v1title: "Korrektheit vor Geschwindigkeit", v1body: "Falscher Code ist schlimmer als langsamer richtiger Code.",
    v2title: "Dokumentation als Infrastruktur", v2body: "Der beste Code ist derjenige, den ein zukünftiger Ingenieur ohne Rückfragen verstehen kann.",
    v3title: "Breite ermöglicht Tiefe", v3body: "Das gesamte System zu verstehen macht jede Schicht besser.",
    exploreSections: "Bereiche erkunden", exploreAbout: "Mehr über mich", exploreSkills: "Technische Fähigkeiten",
    exploreExperience: "Berufserfahrung", exploreCredentials: "Zertifikate", exploreProjects: "Aktuelle Projekte",
    exploreBlog: "Neueste Beiträge", exploreContact: "Kontakt aufnehmen",
  },
  FR: {
    home: "Accueil", about: "À propos", skills: "Compétences", experience: "Expérience",
    certificates: "Certifications", projects: "Projets", blog: "Blog", contact: "Contact",
    heroRole: "Ingénieur IA & Data",
    heroTagline: "Concevoir des systèmes intelligents à l'intersection des données et du ML.",
    heroCTA: "Voir les projets", heroContact: "Me contacter",
    yearsExp: "Années d'expérience", projectsDone: "Projets livrés", certsEarned: "Certifications",
    featuredProjects: "Projets en vedette", recentPosts: "Articles récents",
    viewAll: "Tout voir →", viewProject: "Voir le projet", readMore: "Lire plus →",
    downloadCV: "Télécharger le CV", contactTitle: "Travaillons ensemble",
    contactSub: "Vous avez un projet ? Envoyez-moi un message.",
    titleLabel: "Titre", firstNameLabel: "Prénom", lastNameLabel: "Nom de famille",
    emailLabel: "Adresse e-mail", messageLabel: "Message",
    verifyLabel: "Glissez pour vérifier", verified: "Vérifié",
    sendMessage: "Envoyer le message", messageSent: "Message envoyé — je vous répondrai bientôt.",
    currentRole: "Présent",
    viewCert: "Vérifier", close: "Fermer", architectureBlueprint: "Plan d'architecture",
    techStack: "Stack technique", liveDemo: "Démo en direct", sourceCode: "Code source",
    copyCode: "Copier", copied: "Copié!", tableOfContents: "Table des matières",
    backToProjects: "← Retour aux projets", backToBlog: "← Retour au blog",
    aboutBio: "Ingénieur senior en IA et données basé au Caire, avec plus de 8 ans d'expérience dans la construction de systèmes de données à grande échelle.",
    values: "Valeurs", v1title: "Exactitude avant vitesse", v1body: "Un code rapide mais erroné est pire qu'un code lent mais correct.",
    v2title: "Documentation comme infrastructure", v2body: "Le meilleur code que j'ai écrit est celui qu'un futur ingénieur peut comprendre sans me demander.",
    v3title: "La largeur permet la profondeur", v3body: "Comprendre l'ensemble du système rend chaque couche meilleure.",
    exploreSections: "Explorer les sections", exploreAbout: "En savoir plus sur moi", exploreSkills: "Compétences techniques",
    exploreExperience: "Parcours professionnel", exploreCredentials: "Certifications", exploreProjects: "Projets récents",
    exploreBlog: "Derniers articles", exploreContact: "Me contacter",
  },
  ES: {
    home: "Inicio", about: "Sobre mí", skills: "Habilidades", experience: "Experiencia",
    certificates: "Certificados", projects: "Proyectos", blog: "Blog", contact: "Contacto",
    heroRole: "Ingeniero de IA & Datos",
    heroTagline: "Construyendo sistemas inteligentes en la intersección de datos y ML.",
    heroCTA: "Ver proyectos", heroContact: "Contactarme",
    yearsExp: "Años de experiencia", projectsDone: "Proyectos entregados", certsEarned: "Certificaciones",
    featuredProjects: "Proyectos destacados", recentPosts: "Publicaciones recientes",
    viewAll: "Ver todo →", viewProject: "Ver proyecto", readMore: "Leer más →",
    downloadCV: "Descargar CV", contactTitle: "Trabajemos juntos",
    contactSub: "¿Tienes un proyecto? Envíame un mensaje.",
    titleLabel: "Título", firstNameLabel: "Nombre", lastNameLabel: "Apellido",
    emailLabel: "Correo electrónico", messageLabel: "Mensaje",
    verifyLabel: "Desliza para verificar", verified: "Verificado",
    sendMessage: "Enviar mensaje", messageSent: "Mensaje enviado — te responderé pronto.",
    currentRole: "Presente",
    viewCert: "Verificar", close: "Cerrar", architectureBlueprint: "Plano de arquitectura",
    techStack: "Stack tecnológico", liveDemo: "Demo en vivo", sourceCode: "Código fuente",
    copyCode: "Copiar", copied: "¡Copiado!", tableOfContents: "Tabla de contenidos",
    backToProjects: "← Volver a proyectos", backToBlog: "← Volver al blog",
    aboutBio: "Ingeniero senior de IA y datos con sede en El Cairo, con más de 8 años de experiencia construyendo sistemas de datos a escala.",
    values: "Valores", v1title: "Exactitud sobre velocidad", v1body: "El código rápido pero incorrecto es peor que el código lento pero correcto.",
    v2title: "Documentación como infraestructura", v2body: "El mejor código que he escrito es el que un ingeniero futuro puede entender sin preguntarme.",
    v3title: "La amplitud permite la profundidad", v3body: "Entender el sistema completo hace que cada capa sea mejor.",
    exploreSections: "Explorar secciones", exploreAbout: "Más sobre mí", exploreSkills: "Habilidades técnicas",
    exploreExperience: "Experiencia laboral", exploreCredentials: "Certificados", exploreProjects: "Proyectos recientes",
    exploreBlog: "Últimos artículos", exploreContact: "Ponte en contacto",
  },
};

// ─── ICONS ────────────────────────────────────────────────────────────────────
const IconMenu = () => (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 5h14M3 10h14M3 15h14"/></svg>);
const IconClose = () => (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>);
const IconGlobe = () => (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><circle cx="7.5" cy="7.5" r="6"/><path d="M7.5 1.5c-2 2.5-2 8 0 12M7.5 1.5c2 2.5 2 8 0 12M1.5 7.5h12"/></svg>);
const IconArrowRight = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg>);
const IconExternalLink = () => (<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M5.5 2H2v9h9V7.5M7.5 2H11v3.5M5.5 7.5L11 2"/></svg>);
const IconGithub = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M9 0C4.03 0 0 4.03 0 9c0 3.98 2.58 7.35 6.16 8.54.45.08.61-.2.61-.43v-1.5c-2.5.54-3.03-1.2-3.03-1.2-.41-1.04-1-1.32-1-1.32-.82-.56.06-.55.06-.55.9.06 1.37.93 1.37.93.8 1.37 2.1.97 2.61.74.08-.58.31-.97.57-1.19-2-.23-4.1-1-4.1-4.44 0-.98.35-1.78.93-2.41-.09-.23-.4-1.14.09-2.37 0 0 .75-.24 2.47.92a8.6 8.6 0 012.25-.3c.76 0 1.54.1 2.25.3 1.72-1.16 2.47-.92 2.47-.92.49 1.23.18 2.14.09 2.37.58.63.93 1.43.93 2.41 0 3.45-2.1 4.2-4.1 4.43.32.28.61.82.61 1.65v2.45c0 .24.16.52.62.43C15.42 16.35 18 12.98 18 9c0-4.97-4.03-9-9-9z"/></svg>);
const IconLinkedin = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M4.2 6.5H1.2V17h3V6.5zm-1.5-4.5C1.8 2 1 2.8 1 3.75c0 .96.8 1.75 1.7 1.75h.02c.97 0 1.76-.79 1.76-1.75C4.48 2.8 3.67 2 2.7 2zM17 11.15c0-2.48-1.35-3.63-3.15-3.63-1.46 0-2.1.8-2.47 1.36V6.5H8.28V17h3.1v-5.88c0-.28.02-.56.1-.76.23-.56.74-1.14 1.6-1.14 1.14 0 1.6.87 1.6 2.14V17H17v-5.85z"/></svg>);
const IconInstagram = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="1" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="3.5"/><circle cx="13.5" cy="4.5" r="0.8" fill="currentColor" stroke="none"/></svg>);
const IconXSocial = () => (<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/></svg>);
const IconDiscord = () => (<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M14.82 3.63a12.5 12.5 0 00-3.09-1.01.04.04 0 00-.05.02c-.13.24-.28.55-.38.8a11.58 11.58 0 00-3.5 0c-.1-.25-.26-.56-.39-.8a.04.04 0 00-.04-.02 12.46 12.46 0 00-3.09 1.01.04.04 0 00-.02.02C.67 7.28.18 10.84.42 14.36a.05.05 0 00.02.04 12.58 12.58 0 003.79 1.91.05.05 0 00.05-.02c.29-.4.55-.82.77-1.26a.04.04 0 00-.02-.06 8.25 8.25 0 01-1.18-.57.04.04 0 01-.01-.07c.08-.06.16-.12.23-.18a.04.04 0 01.05-.01c2.48 1.14 5.17 1.14 7.61 0a.04.04 0 01.04.01c.08.06.16.13.24.18a.04.04 0 01-.01.07c-.38.22-.77.41-1.18.57a.04.04 0 00-.02.07c.23.44.49.86.77 1.26a.04.04 0 00.05.02 12.53 12.53 0 003.8-1.91.04.04 0 00.02-.04c.28-3.86-.47-7.2-1.98-10.07a.04.04 0 00-.02-.02zM6.33 11.81c-1 0-1.83-.93-1.83-2.07 0-1.14.81-2.07 1.83-2.07 1.03 0 1.85.94 1.83 2.07 0 1.14-.81 2.07-1.83 2.07zm6.77 0c-1 0-1.83-.93-1.83-2.07 0-1.14.81-2.07 1.83-2.07 1.03 0 1.85.94 1.83 2.07 0 1.14-.8 2.07-1.83 2.07z"/></svg>);
const IconDownload = () => (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7.5 2v8M4.5 7l3 3 3-3M2 11.5v1a1 1 0 001 1h9a1 1 0 001-1v-1"/></svg>);
const IconCheck = () => (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M2.5 7.5l3.5 3.5 6.5-7"/></svg>);
const IconCopy = () => (<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="4.5" y="4.5" width="7" height="7" rx="0.5"/><path d="M8.5 4.5V2.5a.5.5 0 00-.5-.5H2a.5.5 0 00-.5.5V9a.5.5 0 00.5.5h2"/></svg>);
const IconZoomIn = () => (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M6.5 4.5v4M4.5 6.5h4M10 10l3 3"/></svg>);
const IconZoomOut = () => (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><circle cx="6.5" cy="6.5" r="4.5"/><path d="M4.5 6.5h4M10 10l3 3"/></svg>);
const IconReset = () => (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1.5 7.5a6 6 0 106-6H6M1.5 7.5V3.5M1.5 7.5H5.5"/></svg>);
const IconChevronDown = () => (<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2.5 4.5l4 4 4-4"/></svg>);
const IconChevronRight = () => (<svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4.5 2.5l4 4-4 4"/></svg>);
const IconTrash = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M2 3.5h10M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6.5v4M8.5 6.5v4M3.5 3.5l.5 8a.5.5 0 00.5.5h5a.5.5 0 00.5-.5l.5-8"/></svg>);
const IconEdit = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M9.5 2l2.5 2.5L4.5 12H2v-2.5L9.5 2z"/></svg>);
const IconPlus = () => (<svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7.5 2v11M2 7.5h11"/></svg>);
const IconUpload = () => (<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M10 13V5M7 8l3-3 3 3M4 15v1a1 1 0 001 1h10a1 1 0 001-1v-1"/></svg>);
const IconAbout = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1c0-3.3 2.7-6 6-6h4c3.3 0 6 2.7 6 6v1"/></svg>);
const IconSkillsIco = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>);
const IconExpIco = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>);
const IconCertIco = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="12" cy="10" r="6"/><path d="M8.5 14.5L7 22l5-3 5 3-1.5-7.5"/></svg>);
const IconProjIco = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zM22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>);
const IconBlogIco = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>);
const IconContactIco = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>);

function AnimatedName({ name }: { name: string }) {
  const [tick, setTick] = useState(0);
  useEffect(() => { const id = setInterval(() => setTick(t => t + 1), 120); return () => clearInterval(id); }, []);
  const chars = useMemo(() => {
    const now = Date.now();
    const words = name.split(" ");
    return words.map((word, wi) => (
      <span key={wi} className="block">
        {word.split("").map((ch, ci) => {
          if (ci === 0) return <span key={ci} className="text-primary">{ch}</span>;
          const globalIndex = words.slice(0, wi).join("").length + ci;
          const totalChars = words.join("").length;
          const wave = (now / 4000 + globalIndex / totalChars) % 1;
          const brightness = Math.max(0, Math.cos((wave - 0.5) * Math.PI * 2));
          const l = 42 + brightness * 28;
          return <span key={ci} style={{ color: brightness > 0.05 ? `hsl(110, 100%, ${l}%)` : undefined, transition: "color 0.3s ease" }}>{ch}</span>;
        })}
      </span>
    ));
  }, [name, tick]);
  return <>{chars}</>;
}

function Tag({ label }: { label: string }) {
  return <span className="font-mono-custom text-xs px-2 py-0.5 border border-border text-muted-foreground tracking-wide">{label}</span>;
}

function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="mb-10 sm:mb-12 md:mb-16">
      <p className="font-mono-custom text-xs text-primary tracking-[0.2em] uppercase mb-2 sm:mb-3">{label}</p>
      <h2 className="font-display text-3xl sm:text-5xl md:text-7xl font-bold uppercase tracking-tight text-foreground leading-none">{title}</h2>
    </div>
  );
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const steps = 40; const inc = target / steps; let cur = 0;
        const timer = setInterval(() => { cur = Math.min(cur + inc, target); setCount(Math.round(cur)); if (cur >= target) clearInterval(timer); }, 30);
      }
    }, { threshold: 0.5 });
    obs.observe(el); return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{count}{suffix}</span>;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); };
  const highlighted = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/(#[^\n]*)/g, '<span style="color:var(--muted-foreground)">$1</span>')
    .replace(/\b(def|class|return|import|from|if|else|elif|for|in|and|or|not|True|False|None|yield|async|await)\b/g, '<span style="color:#B06EFF">$1</span>')
    .replace(/\b(str|int|float|list|dict|bool|set|tuple)\b/g, '<span style="color:#00C8FF">$1</span>')
    .replace(/(["'])([^"']*)\1/g, '<span style="color:#FFD700">$1$2$1</span>')
    .replace(/\b(\d+)\b/g, '<span style="color:#FF6B35">$1</span>');
  return (
    <div className="my-6 border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        <span className="font-mono-custom text-xs text-muted-foreground">{language || "code"}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 font-mono-custom text-xs text-muted-foreground hover:text-primary transition-colors">
          {copied ? <><IconCheck /><span className="text-primary">Copied!</span></> : <><IconCopy /><span>Copy</span></>}
        </button>
      </div>
      <pre className="font-mono-custom text-sm p-4 overflow-x-auto leading-relaxed text-foreground/80">
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

function BlueprintViewer({ imageId, label }: { imageId: string; label: string }) {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const panStart = useRef({ x: 0, y: 0 });
  const onWheel = (e: React.WheelEvent) => { e.preventDefault(); setScale(s => Math.min(Math.max(0.4, s - e.deltaY * 0.001), 4)); };
  const onMouseDown = (e: React.MouseEvent) => { setDragging(true); dragStart.current = { x: e.clientX, y: e.clientY }; panStart.current = { ...pan }; };
  const onMouseMove = (e: React.MouseEvent) => { if (!dragging) return; setPan({ x: panStart.current.x + (e.clientX - dragStart.current.x), y: panStart.current.y + (e.clientY - dragStart.current.y) }); };
  const onMouseUp = () => setDragging(false);
  return (
    <div className="border border-border bg-muted overflow-hidden relative select-none" style={{ height: 400, cursor: dragging ? "grabbing" : "grab" }}
      onWheel={onWheel} onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      <img src={`https://images.unsplash.com/${imageId}?w=1200&h=800&fit=crop&auto=format`} alt={label} draggable={false}
        style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`, transformOrigin: "center", transition: dragging ? "none" : "transform 0.08s" }} className="w-full h-full object-cover" />
      <div className="absolute top-3 left-3 font-mono-custom text-xs text-muted-foreground bg-card/90 border border-border px-2 py-1">{Math.round(scale * 100)}%</div>
      <div className="absolute bottom-3 right-3 flex gap-1.5">
        {[{ icon: <IconZoomIn />, action: () => setScale(s => Math.min(s + 0.25, 4)) }, { icon: <IconZoomOut />, action: () => setScale(s => Math.max(s - 0.25, 0.4)) },
          { icon: <IconReset />, action: () => { setScale(1); setPan({ x: 0, y: 0 }); } }].map(({ icon, action }, i) => (
          <button key={i} onClick={action} className="w-8 h-8 bg-card/90 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors">{icon}</button>
        ))}
      </div>
    </div>
  );
}

function DragVerifySlider({ onVerified, label, verifiedLabel }: { onVerified: () => void; label: string; verifiedLabel: string }) {
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [done, setDone] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startProg = useRef(0);
  const getProgress = useCallback((clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    return Math.min(100, Math.max(0, startProg.current + ((clientX - startX.current) / (rect.width - 52)) * 100));
  }, []);
  const handleStart = (clientX: number) => { if (done) return; setDragging(true); startX.current = clientX; startProg.current = progress; };
  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent | TouchEvent) => { const x = "touches" in e ? e.touches[0].clientX : e.clientX; const p = getProgress(x); setProgress(p); if (p >= 98) { setProgress(100); setDone(true); setDragging(false); onVerified(); } };
    const up = () => { if (!done) setProgress(0); setDragging(false); };
    window.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", move, { passive: true }); window.addEventListener("touchend", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); window.removeEventListener("touchmove", move); window.removeEventListener("touchend", up); };
  }, [dragging, done, getProgress, onVerified]);
  return (
    <div ref={trackRef} className="relative border overflow-hidden select-none" style={{ height: 52, borderColor: done ? "var(--primary)" : "var(--border)" }}>
      <div className="absolute inset-y-0 left-0 transition-all duration-150" style={{ width: `${progress}%`, background: done ? "var(--primary)" : "color-mix(in srgb, var(--primary) 12%, transparent)" }} />
      <div className="absolute inset-0 flex items-center justify-center font-mono-custom text-sm pointer-events-none z-10" style={{ color: done ? "var(--primary-foreground)" : "var(--muted-foreground)" }}>
        {done ? <span className="flex items-center gap-2 font-semibold"><IconCheck /> {verifiedLabel}</span> : label}
      </div>
      {!done && (
        <div className="absolute top-0 bottom-0 z-20 flex items-center justify-center bg-secondary border-r border-border"
          style={{ width: 52, left: `calc(${progress / 100} * (100% - 52px))`, cursor: dragging ? "grabbing" : "grab", touchAction: "none" }}
          onMouseDown={e => { e.preventDefault(); handleStart(e.clientX); }} onTouchStart={e => { e.preventDefault(); handleStart(e.touches[0].clientX); }}>
          <span className="text-muted-foreground text-base">⇒</span>
        </div>
      )}
    </div>
  );
}

function CertificateModal({ cert, onClose, t }: { cert: DbCertificate; onClose: () => void; t: Record<string, string> }) {
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card border border-border max-w-lg w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-mono-custom text-xs text-primary tracking-widest uppercase mb-1">{cert.issuer}</p>
            <h3 className="font-display text-2xl font-bold uppercase tracking-wide">{cert.title}</h3>
            <p className="text-muted-foreground text-sm mt-1">{cert.issue_date}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-4 mt-1"><IconClose /></button>
        </div>
        <div className="aspect-video bg-secondary overflow-hidden mb-4">
          {cert.image_url ? <img src={cert.image_url} alt={cert.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>}
        </div>
        {cert.credential_url && <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 font-mono-custom text-sm text-primary hover:underline">{t.viewCert} <IconExternalLink /></a>}
      </div>
    </div>
  );
}

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const NAV_LINKS = ["home", "about", "skills", "experience", "certificates", "projects", "blog", "contact"];
const LANGUAGES: Language[] = ["EN", "DE", "FR", "ES", "AR"];

function Navbar({ page, setPage, lang, setLang, theme, setTheme }: {
  page: Page; setPage: (p: Page) => void; lang: Language; setLang: (l: Language) => void;
  theme: Theme; setTheme: (t: Theme) => void;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const t = T[lang];
  const isRTL = lang === "AR";
  useEffect(() => { const h = () => setScrolled(window.scrollY > 20); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  const nav = (p: Page) => { setPage(p); setMobileOpen(false); window.scrollTo(0, 0); };
  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? "bg-background/95 backdrop-blur-md border-b border-border" : ""}`}>
        <div className="max-w-7xl mx-auto px-5 md:px-8 h-16 flex items-center justify-between">
          <button onClick={() => nav("home")} className="font-display text-xl font-bold uppercase tracking-widest text-foreground hover:text-primary transition-colors">A·Y</button>
          <nav className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.map(key => (
              <button key={key} onClick={() => nav(key as Page)} className={`font-mono-custom text-xs tracking-widest uppercase px-3 py-2 transition-colors ${page === key ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>{t[key]}</button>
            ))}
          </nav>
          <div className={`flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
            <div className="relative">
              <button onClick={() => setLangOpen(o => !o)} className="flex items-center gap-1.5 font-mono-custom text-xs tracking-wider px-2.5 py-1.5 border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors">
                <IconGlobe />{lang}<IconChevronDown />
              </button>
              {langOpen && (
                <div className="absolute top-full mt-1 right-0 bg-card border border-border min-w-[80px] z-50">
                  {LANGUAGES.map(l => <button key={l} onClick={() => { setLang(l); setLangOpen(false); }} className={`w-full text-left px-3 py-2 font-mono-custom text-xs tracking-wider transition-colors ${l === lang ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>)}
                </div>
              )}
            </div>
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"><IconMenu /></button>
          </div>
        </div>
      </header>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-background" dir={isRTL ? "rtl" : "ltr"}>
          <div className="flex items-center justify-between px-5 h-16 border-b border-border">
            <span className="font-display text-xl font-bold uppercase tracking-widest">A·Y</span>
            <button onClick={() => setMobileOpen(false)} className="text-muted-foreground hover:text-foreground"><IconClose /></button>
          </div>
          <nav className="px-5 pt-8 flex flex-col gap-1">
            {NAV_LINKS.map(key => <button key={key} onClick={() => nav(key as Page)} className={`text-left font-display text-4xl font-bold uppercase tracking-wide py-2 transition-colors ${page === key ? "text-primary" : "text-foreground/40 hover:text-foreground"}`}>{t[key]}</button>)}
          </nav>
          <div className="px-5 pt-8 flex gap-2 flex-wrap">
            {LANGUAGES.map(l => <button key={l} onClick={() => { setLang(l); setMobileOpen(false); }} className={`font-mono-custom text-xs px-3 py-1.5 border transition-colors ${l === lang ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{l}</button>)}
          </div>
        </div>
      )}
    </>
  );
}

function Footer({ setPage, lang }: { setPage: (p: Page) => void; lang: Language }) {
  const t = T[lang];
  return (
    <footer className="border-t border-border mt-16 sm:mt-24">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 sm:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
        <div>
          <p className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-widest text-foreground mb-2">A·Y</p>
          <p className="font-mono-custom text-xs text-muted-foreground">{t.heroRole}</p>
        </div>
        <div className="flex flex-col gap-1">
          {["home", "about", "projects", "blog", "contact"].map(k => (
            <button key={k} onClick={() => setPage(k as Page)} className="text-left font-mono-custom text-xs text-muted-foreground hover:text-primary transition-colors w-fit tracking-wide uppercase">{t[k]}</button>
          ))}
        </div>
        <div>
          <div className="flex gap-4 mb-4 flex-wrap">
            {[
              { href: SOCIALS.github, icon: <IconGithub /> },
              { href: SOCIALS.linkedin, icon: <IconLinkedin /> },
              { href: SOCIALS.instagram, icon: <IconInstagram /> },
              { href: SOCIALS.x, icon: <IconXSocial /> },
              { href: SOCIALS.discord, icon: <IconDiscord /> },
            ].map(({ href, icon }, i) => (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">{icon}</a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="max-w-7xl mx-auto px-5 md:px-8 py-4 font-mono-custom text-xs text-muted-foreground">© 2025 Abdelhalim Yasser — Cairo, Egypt</p>
      </div>
    </footer>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
function HomePage({ setPage, lang, profile, projects, blogPosts, loading, experiences, certificates }: {
  setPage: (p: Page) => void; lang: Language; profile: Profile | null;
  projects: DbProject[]; blogPosts: (DbBlogPost & { translation?: DbBlogTranslation })[]; loading: boolean;
  experiences: DbExperience[]; certificates: DbCertificate[];
}) {
  const t = T[lang];
  const SECTION_LINKS: { page: Page; icon: React.ReactNode; label: string; desc: string }[] = [
    { page: "about", icon: <IconAbout />, label: t.about, desc: t.exploreAbout },
    { page: "skills", icon: <IconSkillsIco />, label: t.skills, desc: t.exploreSkills },
    { page: "experience", icon: <IconExpIco />, label: t.experience, desc: t.exploreExperience },
    { page: "certificates", icon: <IconCertIco />, label: t.certificates, desc: t.exploreCredentials },
    { page: "projects", icon: <IconProjIco />, label: t.projects, desc: t.exploreProjects },
    { page: "blog", icon: <IconBlogIco />, label: t.blog, desc: t.exploreBlog },
    { page: "contact", icon: <IconContactIco />, label: t.contact, desc: t.exploreContact },
  ];
  const displayName = profile?.full_name || "Abdelhalim Yasser";
  const role = profile?.headline || t.heroRole;
  return (
    <div>
      <section className="min-h-screen flex flex-col justify-center px-5 md:px-8 max-w-7xl mx-auto pt-16">
        <div className="max-w-4xl">
          <p className="font-mono-custom text-xs text-primary tracking-[0.3em] uppercase mb-6">{role}</p>
          <h1 className="font-display text-4xl text-[3.2rem] sm:text-7xl md:text-[7rem] lg:text-[9rem] font-bold uppercase leading-none tracking-tight mb-8">
            <AnimatedName name={displayName} />
          </h1>
          <p className="text-foreground/70 text-sm sm:text-lg md:text-xl leading-relaxed max-w-xl mb-8 sm:mb-10">{t.heroTagline}</p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <button onClick={() => setPage("projects")} className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono-custom text-xs sm:text-sm tracking-widest uppercase px-5 sm:px-6 py-3 hover:opacity-90 transition-opacity">{t.heroCTA} <IconArrowRight /></button>
            <button onClick={() => setPage("contact")} className="flex items-center justify-center gap-2 border border-border text-muted-foreground font-mono-custom text-xs sm:text-sm tracking-widest uppercase px-5 sm:px-6 py-3 hover:border-primary hover:text-primary transition-colors">{t.heroContact}</button>
          </div>
        </div>
      </section>
      <section className="px-5 md:px-8 max-w-7xl mx-auto py-12 md:py-16 border-t border-border">
        <div className="grid grid-cols-3 gap-4 md:gap-8">
          {[{
            label: t.yearsExp,
            value: experiences.length > 0 ? Math.ceil((Date.now() - new Date(experiences.reduce((min, e) => e.start_date < min ? e.start_date : min, experiences[0].start_date)).getTime()) / (365.25 * 86400000)) : 0,
            suffix: "+"
          }, {
            label: t.projectsDone, value: projects.length, suffix: ""
          }, {
            label: t.certsEarned, value: certificates.length, suffix: ""
          }].map(({ label, value, suffix }) => (
            <div key={label} className="border-l border-primary pl-3 md:pl-6">
              <div className="font-display text-3xl sm:text-4xl md:text-6xl font-bold text-primary leading-none mb-1 md:mb-2"><AnimatedCounter target={value} suffix={suffix} /></div>
              <p className="font-mono-custom text-[10px] sm:text-xs text-muted-foreground tracking-wide uppercase">{label}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="px-5 md:px-8 max-w-7xl mx-auto py-16 border-t border-border">
        <SectionHeader label="Navigate" title={t.exploreSections} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-px bg-border">
          {SECTION_LINKS.map(s => (
            <button key={s.page} onClick={() => { setPage(s.page); window.scrollTo(0, 0); }} className="group text-left bg-background p-4 sm:p-5 md:p-6 hover:bg-card transition-colors border border-transparent hover:border-primary/30 flex flex-col items-start gap-2 sm:gap-3">
              <span className="text-muted-foreground group-hover:text-primary transition-colors">{s.icon}</span>
              <div>
                <p className="font-display text-sm sm:text-base md:text-lg font-bold uppercase tracking-wide group-hover:text-primary transition-colors">{s.label}</p>
                <p className="font-mono-custom text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>
      <section className="px-5 md:px-8 max-w-7xl mx-auto py-16 border-t border-border">
        <div className="flex items-end justify-between mb-10">
          <SectionHeader label="01" title={t.featuredProjects} />
          <button onClick={() => setPage("projects")} className="font-mono-custom text-xs text-primary tracking-wider hover:underline self-start mt-auto mb-1 hidden md:block">{t.viewAll}</button>
        </div>
        {loading ? <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">{[1,2,3,4].map(i => <div key={i} className="bg-background p-5 md:p-8 animate-pulse"><div className="aspect-video mb-5 bg-muted"/><div className="h-6 bg-muted w-1/2 mb-2"/><div className="h-4 bg-muted w-3/4"/></div>)}</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
            {projects.slice(0, 4).map(p => (
              <button key={p.id} onClick={() => setPage("projects")} className="group text-left bg-background p-5 md:p-8 hover:bg-card transition-colors border border-transparent hover:border-primary/30">
                <div className="aspect-video mb-4 md:mb-5 overflow-hidden bg-secondary">
                  {p.image_url ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>}
                </div>
                <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-wide mb-2 group-hover:text-primary transition-colors">{p.title}</h3>
                <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-3 md:mb-4">{p.description}</p>
                <div className="flex flex-wrap gap-1 sm:gap-1.5">{p.tech_stack.slice(0, 4).map(s => <Tag key={s} label={s} />)}</div>
              </button>
            ))}
          </div>
        )}
      </section>
      <section className="px-5 md:px-8 max-w-7xl mx-auto py-16 border-t border-border">
        <div className="flex items-end justify-between mb-10">
          <SectionHeader label="02" title={t.recentPosts} />
          <button onClick={() => setPage("blog")} className="font-mono-custom text-xs text-primary tracking-wider hover:underline self-start mt-auto mb-1 hidden md:block">{t.viewAll}</button>
        </div>
        {loading ? <div className="flex flex-col gap-0 divide-y divide-border">{[1,2,3].map(i => <div key={i} className="py-6 animate-pulse"><div className="h-5 bg-muted w-2/3 mb-2"/><div className="h-4 bg-muted w-1/3"/></div>)}</div> : (
          <div className="flex flex-col gap-0 divide-y divide-border">
            {blogPosts.slice(0, 3).map((post, i) => (
              <button key={post.id} onClick={() => setPage("blog")} className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-5 sm:py-6 text-left hover:bg-card/50 transition-colors px-0 sm:px-2">
                <span className="font-mono-custom text-xs text-muted-foreground w-6">{String(i + 1).padStart(2, "0")}</span>
                <div className="flex-1">
                  <h4 className="font-display text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wide mb-1 group-hover:text-primary transition-colors">{post.translation?.title || post.title}</h4>
                  <p className="text-muted-foreground text-xs sm:text-sm hidden sm:block">{(post.translation?.excerpt || "").slice(0, 80)}…</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-mono-custom text-xs text-muted-foreground">{post.published_at ? new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
                  <span className="font-mono-custom text-xs text-muted-foreground">{post.read_time_minutes} min</span>
                  <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"><IconArrowRight /></span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
      <section className="px-5 md:px-8 max-w-7xl mx-auto py-12 md:py-16 border-t border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 md:gap-6">
          <h2 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold uppercase tracking-tight leading-none">{t.contactTitle}</h2>
          <button onClick={() => setPage("contact")} className="flex items-center gap-2 border border-border text-muted-foreground font-mono-custom text-sm tracking-widest uppercase px-6 py-3 hover:border-primary hover:text-primary transition-colors w-fit">{t.heroContact} <IconArrowRight /></button>
        </div>
      </section>
    </div>
  );
}

// ─── ABOUT PAGE ───────────────────────────────────────────────────────────────
function AboutPage({ lang, profile }: { lang: Language; profile: Profile | null }) {
  const t = T[lang];
  return (
    <div className="pt-20 sm:pt-24 px-5 md:px-8 max-w-7xl mx-auto pb-16 sm:pb-24">
      <SectionHeader label="About" title={t.about} />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10 sm:gap-12 md:gap-16">
        <div className="md:col-span-4 lg:col-span-3">
          <div className="aspect-square bg-secondary overflow-hidden mb-4">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">No photo</div>}
          </div>
          <p className="font-display text-lg sm:text-xl font-bold uppercase tracking-wide">{profile?.full_name || "Abdelhalim Yasser"}</p>
          <p className="font-mono-custom text-xs text-primary tracking-widest uppercase mt-1 mb-4">{profile?.headline || t.heroRole}</p>
          <p className="font-mono-custom text-[10px] sm:text-xs text-muted-foreground mb-2">Cairo, Egypt</p>
          <p className="font-mono-custom text-[10px] sm:text-xs text-muted-foreground mb-6 break-all sm:break-normal">{profile?.email || "abdelhalimyasser88@gmail.com"}</p>
          {profile?.resume_url && <a href={profile.resume_url} className="flex items-center gap-2 bg-primary text-primary-foreground font-mono-custom text-xs tracking-widest uppercase px-4 py-2.5 hover:opacity-90 transition-opacity w-fit"><IconDownload /> {t.downloadCV}</a>}
          <div className="flex gap-3 mt-4">
            {SOCIALS.github && <a href={SOCIALS.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><IconGithub /></a>}
            {SOCIALS.linkedin && <a href={SOCIALS.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><IconLinkedin /></a>}
            {SOCIALS.instagram && <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><IconInstagram /></a>}
            {SOCIALS.x && <a href={SOCIALS.x} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><IconXSocial /></a>}
          </div>
        </div>
        <div className="md:col-span-8 lg:col-span-9">
          <div className="mb-10">
            {(profile?.bio || t.aboutBio).split("\n\n").map((para, i) => <p key={i} className="text-foreground/80 leading-[1.8] mb-5 text-base md:text-lg">{para}</p>)}
          </div>
          <div className="border-t border-border pt-8">
            <p className="font-mono-custom text-xs text-primary tracking-[0.2em] uppercase mb-6">{t.values}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[{ title: t.v1title, body: t.v1body }, { title: t.v2title, body: t.v2body }, { title: t.v3title, body: t.v3body }].map(({ title, body }) => (
                <div key={title} className="border-l-2 border-primary pl-4">
                  <h4 className="font-display text-lg font-bold uppercase tracking-wide mb-2">{title}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SKILLS PAGE ──────────────────────────────────────────────────────────────
function SkillsPage({ lang, skills }: { lang: Language; skills: DbSkill[] }) {
  const t = T[lang];
  const categories = skills.reduce<Record<string, DbSkill[]>>((acc, s) => { (acc[s.category] = acc[s.category] || []).push(s); return acc; }, {});
  const cats = Object.entries(categories);
  return (
    <div className="pt-20 sm:pt-24 px-5 md:px-8 max-w-7xl mx-auto pb-16 sm:pb-24">
      <SectionHeader label="Skills" title={t.skills} />
      <div className="flex flex-col gap-10 sm:gap-12">
        {cats.map(([category, items]) => (
          <div key={category} className="border-t border-border pt-6 sm:pt-8">
            <p className="font-mono-custom text-xs text-primary tracking-[0.2em] uppercase mb-4 sm:mb-5">{category}</p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {items.map(item => <span key={item.id} className="font-mono-custom text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5 border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-default">{item.name}</span>)}
            </div>
          </div>
        ))}
        {cats.length === 0 && <p className="text-muted-foreground text-sm">No skills loaded yet.</p>}
      </div>
    </div>
  );
}

// ─── EXPERIENCE PAGE ──────────────────────────────────────────────────────────
function ExperiencePage({ lang, experiences }: { lang: Language; experiences: DbExperience[] }) {
  const t = T[lang];
  const fmtDate = (d: string) => { const dt = new Date(d); return dt.toLocaleDateString("en-US", { month: "short", year: "numeric" }); };
  return (
    <div className="pt-20 sm:pt-24 px-5 md:px-8 max-w-7xl mx-auto pb-16 sm:pb-24">
      <SectionHeader label="Experience" title={t.experience} />
      <div className="relative">
        <div className="absolute left-0 md:left-[200px] top-0 bottom-0 w-px bg-border" />
        {experiences.map((exp) => (
          <div key={exp.id} className="relative flex flex-col md:flex-row gap-0 md:gap-8 pb-10 sm:pb-12">
            <div className="md:w-[200px] md:text-right md:pr-8 mb-2 md:mb-0 flex md:flex-col gap-3 sm:gap-4 md:gap-1">
              <p className="font-mono-custom text-xs text-muted-foreground">{fmtDate(exp.start_date)}</p>
              <p className="font-mono-custom text-xs text-muted-foreground">—</p>
              <p className="font-mono-custom text-xs" style={{ color: exp.is_current ? "var(--primary)" : "var(--muted-foreground)" }}>{exp.end_date ? fmtDate(exp.end_date) : t.currentRole}</p>
            </div>
            <div className="absolute left-[-6px] md:left-[194px] top-1 w-3 h-3 border-2 bg-background" style={{ borderColor: exp.is_current ? "var(--primary)" : "rgba(128,128,128,0.3)" }} />
            <div className="pl-4 md:pl-8 flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                <h3 className="font-display text-xl sm:text-2xl md:text-3xl font-bold uppercase tracking-wide">{exp.company}</h3>
                {exp.is_current && <span className="font-mono-custom text-xs px-2 py-0.5 border border-primary text-primary tracking-wide uppercase">{t.currentRole}</span>}
              </div>
              <p className="font-mono-custom text-xs text-primary tracking-widest uppercase mb-3">{exp.position}</p>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">{exp.description}</p>
            </div>
          </div>
        ))}
        {experiences.length === 0 && <p className="text-muted-foreground text-sm">No experience loaded yet.</p>}
      </div>
    </div>
  );
}

// ─── CERTIFICATES PAGE ────────────────────────────────────────────────────────
function CertificatesPage({ lang, certificates }: { lang: Language; certificates: DbCertificate[] }) {
  const [selected, setSelected] = useState<DbCertificate | null>(null);
  const t = T[lang];
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return (
    <div className="pt-20 sm:pt-24 px-5 md:px-8 max-w-7xl mx-auto pb-16 sm:pb-24">
      <SectionHeader label="Credentials" title={t.certificates} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
        {certificates.map(cert => (
          <button key={cert.id} onClick={() => setSelected(cert)} className="group text-left bg-background p-5 sm:p-6 hover:bg-card transition-colors border border-transparent hover:border-primary/30">
            <div className="aspect-video bg-secondary mb-3 sm:mb-4 overflow-hidden">
              {cert.image_url ? <img src={cert.image_url} alt={cert.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>}
            </div>
            <p className="font-mono-custom text-[10px] sm:text-xs text-primary tracking-widest uppercase mb-1">{cert.issuer}</p>
            <h3 className="font-display text-base sm:text-xl font-bold uppercase tracking-wide mb-1 group-hover:text-primary transition-colors">{cert.title}</h3>
            <p className="font-mono-custom text-xs text-muted-foreground">{fmtDate(cert.issue_date)}</p>
            {cert.credential_url && <div className="flex items-center gap-1.5 mt-3 font-mono-custom text-xs text-muted-foreground group-hover:text-primary transition-colors">{t.viewCert} <IconExternalLink /></div>}
          </button>
        ))}
      </div>
      {selected && <CertificateModal cert={selected} onClose={() => setSelected(null)} t={t} />}
      {certificates.length === 0 && <p className="text-muted-foreground text-sm mt-8">No certificates loaded yet.</p>}
    </div>
  );
}

// ─── PROJECTS PAGE ────────────────────────────────────────────────────────────
function ProjectsPage({ setPage, setSelectedProject, lang, projects }: {
  setPage: (p: Page) => void; setSelectedProject: (p: DbProject) => void; lang: Language; projects: DbProject[];
}) {
  const t = T[lang];
  const open = (p: DbProject) => { setSelectedProject(p); setPage("project-detail"); window.scrollTo(0, 0); };
  return (
    <div className="pt-20 sm:pt-24 px-5 md:px-8 max-w-7xl mx-auto pb-16 sm:pb-24">
      <SectionHeader label="Work" title={t.projects} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
        {projects.map(p => (
          <button key={p.id} onClick={() => open(p)} className="group text-left bg-background hover:bg-card transition-colors border border-transparent hover:border-primary/30">
            <div className="aspect-video overflow-hidden bg-secondary">
              {p.image_url ? <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>}
            </div>
            <div className="p-5 sm:p-6 md:p-8">
              <h3 className="font-display text-2xl sm:text-3xl md:text-4xl font-bold uppercase tracking-wide mb-2 sm:mb-3 group-hover:text-primary transition-colors">{p.title}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 sm:mb-5">{p.description}</p>
              <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">{p.tech_stack.slice(0, 5).map(s => <Tag key={s} label={s} />)}</div>
              <div className="flex items-center gap-1.5 font-mono-custom text-xs text-primary">{t.viewProject} <IconArrowRight /></div>
            </div>
          </button>
        ))}
      </div>
      {projects.length === 0 && <p className="text-muted-foreground text-sm mt-8">No projects loaded yet.</p>}
    </div>
  );
}

function ProjectDetailPage({ project, setPage, lang }: { project: DbProject; setPage: (p: Page) => void; lang: Language }) {
  const t = T[lang];
  if (!project) return null;
  return (
    <div className="pt-20 sm:pt-24 px-5 md:px-8 max-w-7xl mx-auto pb-16 sm:pb-24">
      <button onClick={() => { setPage("projects"); window.scrollTo(0, 0); }} className="font-mono-custom text-xs text-muted-foreground hover:text-primary transition-colors mb-6 sm:mb-8 block tracking-wide">{t.backToProjects}</button>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12">
        <div className="lg:col-span-8">
          <p className="font-mono-custom text-xs text-primary tracking-[0.2em] uppercase mb-3">Project</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-tight leading-none mb-5 sm:mb-6">{project.title}</h1>
          <div className="aspect-video bg-secondary overflow-hidden mb-8">
            {project.image_url ? <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground">No image</div>}
          </div>
          {project.long_description && (
            <div className="prose-custom">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                h1: ({ children }) => <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-tight text-foreground mb-4 leading-none mt-10">{children}</h1>,
                h2: ({ children }) => <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide text-foreground mt-8 mb-3 leading-none">{children}</h2>,
                h3: ({ children }) => <h3 className="font-display text-xl md:text-2xl font-bold uppercase tracking-wide text-foreground mt-6 mb-2">{children}</h3>,
                p: ({ children }) => <p className="text-foreground/80 leading-[1.8] mb-5 text-base md:text-lg">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-5 mb-5 space-y-1.5 text-foreground/80">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-5 mb-5 space-y-1.5 text-foreground/80">{children}</ol>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
                strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
                em: ({ children }) => <em className="text-foreground/70 italic">{children}</em>,
                code: ({ className, children, ...props }) => {
                  const isBlock = className?.includes("language-");
                  if (isBlock) { return <code className={className} {...props}>{children}</code>; }
                  return <code className="bg-muted px-1.5 py-0.5 text-sm font-mono-custom" {...props}>{children}</code>;
                },
                pre: ({ children }) => {
                  const child = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
                  if (child?.props) {
                    const code = String(child.props.children || "").replace(/\n$/, "");
                    const lang = (child.props.className || "").replace("language-", "");
                    return <CodeBlock code={code} language={lang} />;
                  }
                  return <pre>{children}</pre>;
                },
                blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground my-6">{children}</blockquote>,
                hr: () => <hr className="border-border my-8" />,
                table: ({ children }) => <div className="overflow-x-auto my-6"><table className="w-full border-collapse">{children}</table></div>,
                thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
                tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
                th: ({ children }) => <th className="text-left px-4 py-2 font-mono-custom text-xs text-muted-foreground uppercase tracking-wider">{children}</th>,
                td: ({ children }) => <td className="px-4 py-2 text-foreground/80 text-sm">{children}</td>,
              }}>{project.long_description}</ReactMarkdown>
            </div>
          )}
          {project.architecture_image_url && (
            <div className="mt-10">
              <p className="font-mono-custom text-xs text-primary tracking-[0.2em] uppercase mb-4">{t.architectureBlueprint}</p>
              <BlueprintViewer imageId={project.architecture_image_url} label={`${project.title} Architecture`} />
            </div>
          )}
        </div>
        <div className="lg:col-span-4">
          <div className="sticky top-24 flex flex-col gap-6">
            <div className="border border-border p-5">
              <p className="font-mono-custom text-xs text-primary tracking-widest uppercase mb-4">{t.techStack}</p>
              <div className="flex flex-wrap gap-1.5">{project.tech_stack.map(s => <Tag key={s} label={s} />)}</div>
            </div>
            <div className="flex flex-col gap-2">
              {project.repo_url && <a href={project.repo_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 border border-border font-mono-custom text-xs tracking-widest uppercase px-4 py-3 text-muted-foreground hover:border-primary hover:text-primary transition-colors"><IconGithub /> {t.sourceCode}</a>}
              {project.demo_url && <a href={project.demo_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-mono-custom text-xs tracking-widest uppercase px-4 py-3 hover:opacity-90 transition-opacity"><IconExternalLink /> {t.liveDemo}</a>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── BLOG PAGE ────────────────────────────────────────────────────────────────
function BlogPage({ setPage, setSelectedPost, lang, blogPosts }: {
  setPage: (p: Page) => void; setSelectedPost: (p: DbBlogPost & { translation?: DbBlogTranslation }) => void;
  lang: Language; blogPosts: (DbBlogPost & { translation?: DbBlogTranslation })[];
}) {
  const t = T[lang];
  const open = (post: DbBlogPost & { translation?: DbBlogTranslation }) => { setSelectedPost(post); setPage("blog-detail"); window.scrollTo(0, 0); };
  return (
    <div className="pt-20 sm:pt-24 px-5 md:px-8 max-w-7xl mx-auto pb-16 sm:pb-24">
      <SectionHeader label="Writing" title={t.blog} />
      <div className="flex flex-col gap-0 divide-y divide-border">
        {blogPosts.map(post => (
          <button key={post.id} onClick={() => open(post)} className="group grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 py-6 sm:py-8 text-left hover:bg-card/30 transition-colors">
            <div className="md:col-span-3 aspect-video md:aspect-[4/3] bg-secondary overflow-hidden">
              {post.cover_image_url ? <img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">No image</div>}
            </div>
            <div className="md:col-span-9 flex flex-col justify-center">
              <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">{post.tags.map(tag => <Tag key={tag} label={tag} />)}</div>
              <h3 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold uppercase tracking-wide mb-2 sm:mb-3 group-hover:text-primary transition-colors">{post.translation?.title || post.title}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 line-clamp-2">{post.translation?.excerpt || ""}</p>
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span className="font-mono-custom text-xs text-muted-foreground">{post.published_at ? new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
                <span className="font-mono-custom text-xs text-muted-foreground">{post.read_time_minutes} min read</span>
                {lang !== "EN" && <span className="font-mono-custom text-xs text-muted-foreground border border-border px-2 py-0.5">AI Translated</span>}
                <span className="font-mono-custom text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">{t.readMore}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      {blogPosts.length === 0 && <p className="text-muted-foreground text-sm mt-8">No blog posts loaded yet.</p>}
    </div>
  );
}

function BlogDetailPage({ post, setPage, lang, profile }: {
  post: DbBlogPost & { translation?: DbBlogTranslation }; setPage: (p: Page) => void; lang: Language;
  profile: Profile | null;
}) {
  const t = T[lang];
  const [tocOpen, setTocOpen] = useState(false);
  if (!post) return null;
  const content = post.translation?.content || "";
  const headings = content.split("\n").filter(l => l.startsWith("## ")).map(l => l.slice(3));
  return (
    <div className="pt-20 sm:pt-24 pb-16 sm:pb-24">
      <div className="px-5 md:px-8 max-w-7xl mx-auto">
        <button onClick={() => { setPage("blog"); window.scrollTo(0, 0); }} className="font-mono-custom text-xs text-muted-foreground hover:text-primary transition-colors mb-6 sm:mb-8 block tracking-wide">{t.backToBlog}</button>
      </div>
      <div className="max-w-7xl mx-auto px-5 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12">
        <aside className="hidden lg:block lg:col-span-3">
          <div className="sticky top-24">
            <p className="font-mono-custom text-xs text-primary tracking-[0.2em] uppercase mb-4">{t.tableOfContents}</p>
            <nav className="flex flex-col gap-1">
              {headings.map(h => <a key={h} href={`#${h.toLowerCase().replace(/\s+/g, "-")}`} className="font-mono-custom text-xs text-muted-foreground hover:text-primary transition-colors py-1 border-l border-border pl-3 hover:border-primary">{h}</a>)}
            </nav>
          </div>
        </aside>
        <div className="lg:hidden col-span-full">
          <button onClick={() => setTocOpen(o => !o)} className="flex items-center gap-2 font-mono-custom text-xs text-muted-foreground border border-border px-3 py-2 hover:border-primary hover:text-primary transition-colors">
            {t.tableOfContents} {tocOpen ? <IconChevronDown /> : <IconChevronRight />}
          </button>
          {tocOpen && <nav className="mt-2 border border-border p-3 flex flex-col gap-1">{headings.map(h => <a key={h} href={`#${h.toLowerCase().replace(/\s+/g, "-")}`} className="font-mono-custom text-xs text-muted-foreground hover:text-primary transition-colors py-1">{h}</a>)}</nav>}
        </div>
        <article className="lg:col-span-9">
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3 sm:mb-4">{post.tags.map(tag => <Tag key={tag} label={tag} />)}</div>
          <h1 className="font-display text-3xl sm:text-4xl md:text-6xl font-bold uppercase tracking-tight leading-none mb-3 sm:mb-4">{post.translation?.title || post.title}</h1>
          <div className="flex items-center gap-4 mb-8 border-b border-border pb-6">
            <span className="font-mono-custom text-xs text-muted-foreground">{post.published_at ? new Date(post.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
            <span className="font-mono-custom text-xs text-muted-foreground">{post.read_time_minutes} min read</span>
            {lang !== "EN" && <span className="font-mono-custom text-xs text-muted-foreground border border-border px-2 py-0.5">AI Translated — please verify</span>}
          </div>
          {post.cover_image_url && <div className="aspect-video bg-secondary overflow-hidden mb-10"><img src={post.cover_image_url} alt={post.title} className="w-full h-full object-cover" /></div>}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              h1: ({ children }) => <h1 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tight text-foreground mb-6 leading-none mt-12">{children}</h1>,
              h2: ({ children, ...props }) => <h2 id={String(children).toLowerCase().replace(/\s+/g, "-")} className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wide text-foreground mt-12 mb-4 leading-none scroll-mt-24" {...props}>{children}</h2>,
              h3: ({ children }) => <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-foreground mt-8 mb-3">{children}</h3>,
              p: ({ children }) => <p className="text-foreground/80 leading-[1.75] mb-4">{children}</p>,
              ul: ({ children }) => <ul className="list-disc ml-4 mb-4 space-y-1 text-foreground/80">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal ml-4 mb-4 space-y-1 text-foreground/80">{children}</ol>,
              li: ({ children }) => <li className="leading-relaxed">{children}</li>,
              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{children}</a>,
              strong: ({ children }) => <strong className="text-foreground font-semibold">{children}</strong>,
              code: ({ className, children, ...props }) => {
                const isBlock = className?.includes("language-");
                if (isBlock) { return <code className={className} {...props}>{children}</code>; }
                return <code className="bg-muted px-1.5 py-0.5 text-sm font-mono-custom" {...props}>{children}</code>;
              },
              pre: ({ children }) => {
                const child = children as React.ReactElement<{ className?: string; children?: React.ReactNode }>;
                if (child?.props) {
                  const code = String(child.props.children || "").replace(/\n$/, "");
                  const lang = (child.props.className || "").replace("language-", "");
                  return <CodeBlock code={code} language={lang} />;
                }
                return <pre>{children}</pre>;
              },
              blockquote: ({ children }) => <blockquote className="border-l-2 border-primary pl-4 italic text-muted-foreground my-6">{children}</blockquote>,
              hr: () => <hr className="border-border my-8" />,
              table: ({ children }) => <div className="overflow-x-auto my-6"><table className="w-full border-collapse">{children}</table></div>,
              thead: ({ children }) => <thead className="border-b border-border">{children}</thead>,
              tbody: ({ children }) => <tbody className="divide-y divide-border">{children}</tbody>,
              th: ({ children }) => <th className="text-left px-4 py-2 font-mono-custom text-xs text-muted-foreground uppercase tracking-wider">{children}</th>,
              td: ({ children }) => <td className="px-4 py-2 text-foreground/80 text-sm">{children}</td>,
            }}>{content}</ReactMarkdown>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex items-center gap-4">
            <div className="w-10 h-10 bg-secondary overflow-hidden flex-shrink-0 rounded-full">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="Author" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No photo</div>}
            </div>
            <div>
              <p className="font-display text-base font-bold uppercase tracking-wide">Abdelhalim Yasser</p>
              <p className="font-mono-custom text-xs text-muted-foreground">{t.heroRole}</p>
            </div>
            <div className="ml-auto flex gap-3">
              <a href={SOCIALS.github} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><IconGithub /></a>
              <a href={SOCIALS.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors"><IconLinkedin /></a>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

// ─── CONTACT PAGE ─────────────────────────────────────────────────────────────
const EMAIL_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmlcFYl-qpEWuqQDrrtV9sSvy9exqbwqShH3u053N8rYGJMLIoT_cTYp0zseet6Qei/exec";
const OWNER_EMAIL = "abdelhalimyasser88@gmail.com";

function ContactPage({ lang }: { lang: Language }) {
  const t = T[lang];
  const [form, setForm] = useState({ title: "Mr", firstName: "", lastName: "", email: "", message: "" });
  const [verified, setVerified] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sendError, setSendError] = useState("");
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim()) e.lastName = "Required";
    if (!form.email.includes("@")) e.email = "Invalid email";
    if (form.message.trim().length < 10) e.message = "Too short (min 10 chars)";
    return e;
  };
  const sendEmail = async (to: string, subject: string, htmlBody: string) => {
    const res = await fetch(EMAIL_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify({ to, subject, htmlBody }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    if (!verified) return;
    setSending(true);
    setSendError("");
    try {
      const fullName = `${form.title} ${form.firstName} ${form.lastName}`;
      const ownerHtml = `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <div style="background:#059669;padding:24px 32px;">
            <h1 style="color:#fff;margin:0;font-size:20px;font-weight:600;">New Message from Portfolio</h1>
          </div>
          <div style="padding:32px;background:#fff;">
            <p style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">From</p>
            <p style="color:#1a1a2e;font-size:18px;font-weight:600;margin:0 0 16px;">${fullName}</p>
            <p style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Email</p>
            <p style="color:#059669;font-size:15px;margin:0 0 16px;"><a href="mailto:${form.email}">${form.email}</a></p>
            <p style="color:#6b7280;font-size:13px;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">Message</p>
            <div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:4px;padding:16px;color:#1a1a2e;font-size:15px;line-height:1.6;white-space:pre-wrap;">${form.message}</div>
          </div>
          <div style="padding:16px 32px;background:#f8f9fa;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">Sent from your portfolio contact form</p>
          </div>
        </div>`;
      const thankYouHtml = `
        <div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:600px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <div style="background:#059669;padding:24px 32px;">
            <h1 style="color:#fff;margin:0;font-size:20px;font-weight:600;">Thank You, ${form.firstName}!</h1>
          </div>
          <div style="padding:32px;background:#fff;">
            <p style="color:#1a1a2e;font-size:15px;line-height:1.7;margin:0 0 16px;">I've received your message and appreciate you reaching out. I'll review it and get back to you as soon as possible.</p>
            <p style="color:#1a1a2e;font-size:15px;line-height:1.7;margin:0 0 16px;">In the meantime, feel free to check out my work:</p>
            <p style="margin:0 0 24px;">
              <a href="https://github.com/abdelhalimyasser" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:10px 24px;border-radius:4px;font-size:13px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;">View GitHub</a>
            </p>
            <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0;">Best regards,<br/><strong>Abdelhalim Yasser</strong><br/>AI & Data Engineer</p>
          </div>
          <div style="padding:16px 32px;background:#f8f9fa;border-top:1px solid #e5e7eb;">
            <p style="color:#9ca3af;font-size:12px;margin:0;">This is an automated message — please do not reply directly.</p>
          </div>
        </div>`;
      await Promise.all([
        sendEmail(OWNER_EMAIL, `Portfolio Message: ${fullName} — ${form.message.slice(0, 50)}`, ownerHtml),
        sendEmail(form.email, "Thank you for reaching out!", thankYouHtml),
      ]);
      setSubmitted(true);
    } catch (err: any) {
      setSendError(err.message || "Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="pt-20 sm:pt-24 px-5 md:px-8 max-w-7xl mx-auto pb-16 sm:pb-24">
      <SectionHeader label="Contact" title={t.contact} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12">
        <div className="lg:col-span-4">
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-6 sm:mb-8">{t.contactSub}</p>
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <a href={SOCIALS.github} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-mono-custom text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors"><IconGithub /> <span className="break-all sm:break-normal">github.com/abdelhalimyasser</span></a>
            <a href={SOCIALS.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-mono-custom text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors"><IconLinkedin /> <span className="break-all sm:break-normal">linkedin.com/in/abdelhalimyasser</span></a>
            <a href={SOCIALS.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-mono-custom text-xs text-muted-foreground hover:text-primary transition-colors"><IconInstagram /> instagram.com/abdelhalimyasserr</a>
            <a href={SOCIALS.x} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 font-mono-custom text-xs text-muted-foreground hover:text-primary transition-colors"><IconXSocial /> x.com/abdelhalimyass</a>
            <a href={SOCIALS.email} className="flex items-center gap-3 font-mono-custom text-xs text-muted-foreground hover:text-primary transition-colors"><IconGlobe /> abdelhalimyasser88@gmail.com</a>
          </div>
        </div>
        <div className="lg:col-span-8">
          {submitted ? (
            <div className="border border-primary p-8 md:p-10">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-10 h-10 flex items-center justify-center border border-primary text-primary"><IconCheck /></span>
                <p className="font-display text-3xl font-bold uppercase tracking-wide text-primary">Sent</p>
              </div>
              <p className="text-muted-foreground font-mono-custom text-sm mb-2">{t.messageSent}</p>
              <p className="text-muted-foreground font-mono-custom text-xs">A confirmation email has been sent to your inbox.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4">
              <input name="website" type="text" tabIndex={-1} aria-hidden="true" style={{ display: "none" }} />
              <div>
                <label className="font-mono-custom text-xs text-muted-foreground tracking-wider uppercase block mb-2">{t.titleLabel}</label>
                <select value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full bg-secondary border border-border px-4 py-3 text-foreground font-mono-custom text-sm outline-none focus:border-primary transition-colors appearance-none">
                  <option value="Mr">Mr</option>
                  <option value="Mrs">Mrs</option>
                  <option value="Ms">Ms</option>
                  <option value="Dr">Dr</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono-custom text-xs text-muted-foreground tracking-wider uppercase block mb-2">{t.firstNameLabel}</label>
                  <input type="text" value={form.firstName} onChange={e => { setForm(f => ({ ...f, firstName: e.target.value })); setErrors(er => ({ ...er, firstName: "" })); }}
                    className={`w-full bg-secondary border px-4 py-3 text-foreground font-mono-custom text-sm outline-none focus:border-primary transition-colors ${errors.firstName ? "border-destructive" : "border-border"}`} />
                  {errors.firstName && <p className="font-mono-custom text-xs text-destructive mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="font-mono-custom text-xs text-muted-foreground tracking-wider uppercase block mb-2">{t.lastNameLabel}</label>
                  <input type="text" value={form.lastName} onChange={e => { setForm(f => ({ ...f, lastName: e.target.value })); setErrors(er => ({ ...er, lastName: "" })); }}
                    className={`w-full bg-secondary border px-4 py-3 text-foreground font-mono-custom text-sm outline-none focus:border-primary transition-colors ${errors.lastName ? "border-destructive" : "border-border"}`} />
                  {errors.lastName && <p className="font-mono-custom text-xs text-destructive mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <label className="font-mono-custom text-xs text-muted-foreground tracking-wider uppercase block mb-2">{t.emailLabel}</label>
                <input type="email" value={form.email} onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: "" })); }}
                  className={`w-full bg-secondary border px-4 py-3 text-foreground font-mono-custom text-sm outline-none focus:border-primary transition-colors ${errors.email ? "border-destructive" : "border-border"}`} />
                {errors.email && <p className="font-mono-custom text-xs text-destructive mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="font-mono-custom text-xs text-muted-foreground tracking-wider uppercase block mb-2">{t.messageLabel}</label>
                <textarea rows={5} value={form.message} onChange={e => { setForm(f => ({ ...f, message: e.target.value })); setErrors(er => ({ ...er, message: "" })); }}
                  className={`w-full bg-secondary border px-4 py-3 text-foreground font-mono-custom text-sm outline-none focus:border-primary transition-colors resize-none ${errors.message ? "border-destructive" : "border-border"}`} />
                {errors.message && <p className="font-mono-custom text-xs text-destructive mt-1">{errors.message}</p>}
              </div>
              <div>
                <label className="font-mono-custom text-xs text-muted-foreground tracking-wider uppercase block mb-2">Verification</label>
                <DragVerifySlider onVerified={() => setVerified(true)} label={t.verifyLabel} verifiedLabel={t.verified} />
              </div>
              {sendError && <p className="font-mono-custom text-xs text-destructive">{sendError}</p>}
              <button type="submit" disabled={!verified || sending} className="font-mono-custom text-sm tracking-widest uppercase px-6 py-3 transition-all duration-200 w-fit mt-2 flex items-center gap-2" style={{ background: verified && !sending ? "var(--primary)" : "var(--secondary)", color: verified && !sending ? "var(--primary-foreground)" : "var(--muted-foreground)", cursor: verified && !sending ? "pointer" : "not-allowed" }}>
                {sending && <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a10 10 0 019.95 9" /></svg>}
                {sending ? "Sending..." : t.sendMessage}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("lang");
    return (saved === "AR" || saved === "DE" || saved === "FR" || saved === "ES") ? saved as Language : "EN";
  });
  const handleLangChange = (l: Language) => { setLang(l); localStorage.setItem("lang", l); };
  const [theme, setTheme] = useTheme();
  const [selectedProject, setSelectedProject] = useState<DbProject | null>(null);
  const [selectedPost, setSelectedPost] = useState<(DbBlogPost & { translation?: DbBlogTranslation }) | null>(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<DbProject[]>([]);
  const [blogPosts, setBlogPosts] = useState<(DbBlogPost & { translation?: DbBlogTranslation })[]>([]);
  const [certificates, setCertificates] = useState<DbCertificate[]>([]);
  const [experiences, setExperiences] = useState<DbExperience[]>([]);
  const [skills, setSkills] = useState<DbSkill[]>([]);

  useEffect(() => {
    const langCode = lang === "EN" ? "en" : lang === "AR" ? "ar" : lang === "DE" ? "de" : lang === "FR" ? "fr" : "es";
    async function fetchData() {
      setLoading(true);
      const [profileRes, projectsRes, blogRes, certRes, expRes, skillRes] = await Promise.all([
        supabase.from("profiles").select("*").limit(1).maybeSingle(),
        supabase.from("projects").select("*").eq("status", "published").order("sort_order"),
        supabase.from("blog_posts").select("*, blog_translations(*)").eq("status", "published").eq("blog_translations.language", langCode).order("sort_order"),
        supabase.from("certificates").select("*").eq("status", "published").order("sort_order"),
        supabase.from("experience").select("*").eq("status", "published").order("sort_order", { ascending: false }),
        supabase.from("skills").select("*").eq("status", "published").order("sort_order"),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (blogRes.data) {
        const updated = blogRes.data.map((b: any) => ({ ...b, translation: b.blog_translations?.[0] || null }));
        setBlogPosts(updated);
        setSelectedPost(prev => {
          if (!prev) return null;
          return updated.find((p: any) => p.id === prev.id) || prev;
        });
      }
      if (certRes.data) setCertificates(certRes.data);
      if (expRes.data) setExperiences(expRes.data);
      if (skillRes.data) setSkills(skillRes.data);
      setLoading(false);
    }
    fetchData();
  }, [lang]);

  const isRTL = lang === "AR";
  const navigate = useCallback((p: Page) => { setPage(p); window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isRTL ? "rtl" : "ltr"} style={{ fontFamily: "'Inter', sans-serif" }}>
      <Navbar page={page} setPage={navigate} lang={lang} setLang={handleLangChange} theme={theme} setTheme={setTheme} />
      <div className="pt-0">
        {page === "home" && <HomePage setPage={navigate} lang={lang} profile={profile} projects={projects} blogPosts={blogPosts} loading={loading} experiences={experiences} certificates={certificates} />}
        {page === "about" && <AboutPage lang={lang} profile={profile} />}
        {page === "skills" && <SkillsPage lang={lang} skills={skills} />}
        {page === "experience" && <ExperiencePage lang={lang} experiences={experiences} />}
        {page === "certificates" && <CertificatesPage lang={lang} certificates={certificates} />}
        {page === "projects" && <ProjectsPage setPage={navigate} setSelectedProject={setSelectedProject} lang={lang} projects={projects} />}
        {page === "project-detail" && selectedProject && <ProjectDetailPage project={selectedProject} setPage={navigate} lang={lang} />}
        {page === "blog" && <BlogPage setPage={navigate} setSelectedPost={setSelectedPost} lang={lang} blogPosts={blogPosts} />}
        {page === "blog-detail" && selectedPost && <BlogDetailPage post={selectedPost} setPage={navigate} lang={lang} profile={profile} />}
        {page === "contact" && <ContactPage lang={lang} />}
      </div>
      <Footer setPage={navigate} lang={lang} />
      <Analytics />
    </div>
  );
}
