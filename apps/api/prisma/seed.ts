import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// Type assertion for Prisma client in seed file
// Note: This is needed because TypeScript may not correctly infer the generated Prisma client types
const prismaTyped = prisma as any;

async function main() {
  // Create a sample profile
  const profile = await prismaTyped.profile.upsert({
    where: { email: 'rodrigo@example.com' },
    update: {},
    create: {
      fullName: 'Rodrigo Vasconcelos de Barros',
      title: 'Senior Software Engineer',
      email: 'rodrigo@example.com',
      phone: '+1 (555) 123-4567',
      location: 'Toronto, Ontario, Canada',
      bio: 'Experienced full-stack engineer with 8+ years of experience building scalable web applications and leading development teams. Passionate about clean code, modern technologies, and mentoring junior developers.',
      shortBio: 'Senior Software Engineer with 8+ years of experience in full-stack development.',
      yearsExperience: 8,
      githubUrl: 'https://github.com/rodrigopk',
      linkedinUrl: 'https://linkedin.com/in/rodrigo-vasconcelos',
      twitterUrl: 'https://twitter.com/rodrigopk',
      availability: 'limited',
      hourlyRate: 120.0,
      resumeUrl: 'https://example.com/resume/rodrigo-vasconcelos.pdf',
    },
  });

  console.log('Profile created:', profile);

  // Create sample projects for testing
  const projects = [
    {
      title: 'E-commerce Platform',
      slug: 'ecommerce-platform',
      description: 'A full-stack e-commerce platform with payment integration',
      longDescription:
        'A comprehensive e-commerce solution built with React and Node.js. Features include user authentication, product catalog, shopping cart, payment processing with Stripe, order management, and admin dashboard. The platform supports multiple payment methods and provides real-time inventory tracking.',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'TypeScript', 'Express'],
      featured: true,
      category: 'web',
      githubUrl: 'https://github.com/rodrigopk/ecommerce-platform',
      liveUrl: 'https://ecommerce-demo.example.com',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      startDate: new Date('2023-01-15'),
      endDate: new Date('2023-06-30'),
      githubStars: 156,
      githubForks: 28,
      lastCommit: new Date('2024-01-15'),
      order: 1,
    },
    {
      title: 'Task Management Mobile App',
      slug: 'task-management-mobile',
      description: 'Cross-platform mobile app for team task management',
      longDescription:
        'A React Native mobile application for team collaboration and task management. Features include real-time synchronization, push notifications, offline support, file attachments, and team chat functionality. The app integrates with popular project management tools and supports both iOS and Android platforms.',
      technologies: ['React Native', 'Firebase', 'TypeScript', 'Redux', 'Expo'],
      featured: true,
      category: 'mobile',
      githubUrl: 'https://github.com/rodrigopk/task-manager-mobile',
      liveUrl: 'https://apps.apple.com/app/taskflow-pro',
      imageUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800',
      startDate: new Date('2023-03-01'),
      endDate: new Date('2023-08-15'),
      githubStars: 89,
      githubForks: 15,
      lastCommit: new Date('2024-02-20'),
      order: 2,
    },
    {
      title: 'AI-Powered Analytics Dashboard',
      slug: 'ai-analytics-dashboard',
      description: 'Business intelligence dashboard with machine learning insights',
      longDescription:
        'An advanced analytics dashboard that leverages AI and machine learning to provide business insights. Built with Python backend and React frontend, it processes large datasets, generates predictive analytics, and provides interactive visualizations. Features include automated report generation, anomaly detection, and custom KPI tracking.',
      technologies: ['Python', 'React', 'TensorFlow', 'PostgreSQL', 'Docker', 'FastAPI'],
      featured: true,
      category: 'web',
      githubUrl: 'https://github.com/rodrigopk/ai-analytics',
      liveUrl: 'https://analytics-ai.example.com',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      startDate: new Date('2023-07-01'),
      endDate: new Date('2023-12-20'),
      githubStars: 234,
      githubForks: 45,
      lastCommit: new Date('2024-03-10'),
      order: 0,
    },
    {
      title: 'Cryptocurrency Trading Bot',
      slug: 'crypto-trading-bot',
      description: 'Automated trading bot for cryptocurrency markets',
      longDescription:
        'A sophisticated trading bot that uses algorithmic trading strategies to automatically trade cryptocurrencies. Built with Node.js and integrates with multiple exchange APIs. Features include backtesting, risk management, real-time market analysis, and comprehensive logging. Supports multiple trading strategies and custom indicators.',
      technologies: ['Node.js', 'JavaScript', 'MongoDB', 'WebSocket', 'REST APIs'],
      featured: false,
      category: 'backend',
      githubUrl: 'https://github.com/rodrigopk/crypto-bot',
      liveUrl: null,
      imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
      startDate: new Date('2022-09-01'),
      endDate: new Date('2023-02-28'),
      githubStars: 67,
      githubForks: 12,
      lastCommit: new Date('2023-11-15'),
      order: 5,
    },
    {
      title: 'Social Media Aggregator',
      slug: 'social-media-aggregator',
      description: 'Unified dashboard for managing multiple social media accounts',
      longDescription:
        'A comprehensive social media management tool that aggregates content from multiple platforms. Built with Ruby on Rails backend and Vue.js frontend. Features include scheduled posting, analytics tracking, content curation, team collaboration, and engagement monitoring across Facebook, Twitter, Instagram, and LinkedIn.',
      technologies: ['Ruby on Rails', 'Vue.js', 'Redis', 'PostgreSQL', 'Sidekiq'],
      featured: false,
      category: 'web',
      githubUrl: 'https://github.com/rodrigopk/social-aggregator',
      liveUrl: 'https://social-hub.example.com',
      imageUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800',
      startDate: new Date('2022-11-01'),
      endDate: new Date('2023-04-30'),
      githubStars: 123,
      githubForks: 22,
      lastCommit: new Date('2023-12-05'),
      order: 4,
    },
    {
      title: 'Fitness Tracking PWA',
      slug: 'fitness-tracking-pwa',
      description: 'Progressive web app for personal fitness tracking',
      longDescription:
        'A progressive web application for tracking personal fitness goals, workouts, and nutrition. Built with Angular and implements service workers for offline functionality. Features include workout planning, progress tracking, nutrition logging, social sharing, and integration with wearable devices.',
      technologies: ['Angular', 'TypeScript', 'Service Workers', 'IndexedDB', 'Chart.js'],
      featured: false,
      category: 'web',
      githubUrl: 'https://github.com/rodrigopk/fitness-pwa',
      liveUrl: 'https://fittrack-pwa.example.com',
      imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800',
      startDate: new Date('2023-05-01'),
      endDate: new Date('2023-09-15'),
      githubStars: 45,
      githubForks: 8,
      lastCommit: new Date('2024-01-20'),
      order: 6,
    },
    {
      title: 'IoT Home Automation',
      slug: 'iot-home-automation',
      description: 'Smart home automation system with IoT device integration',
      longDescription:
        'A complete home automation solution that integrates various IoT devices for smart home control. Built with Python backend and React frontend, it supports device discovery, automation rules, voice control integration, and mobile app control. Compatible with popular smart home protocols like Zigbee and Z-Wave.',
      technologies: ['Python', 'React', 'MQTT', 'SQLite', 'Raspberry Pi', 'Docker'],
      featured: true,
      category: 'iot',
      githubUrl: 'https://github.com/rodrigopk/iot-automation',
      liveUrl: null,
      imageUrl: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800',
      startDate: new Date('2023-02-01'),
      endDate: new Date('2023-07-30'),
      githubStars: 178,
      githubForks: 34,
      lastCommit: new Date('2024-02-01'),
      order: 3,
    },
    {
      title: 'Video Streaming Platform',
      slug: 'video-streaming-platform',
      description: 'Netflix-like video streaming service with CDN integration',
      longDescription:
        'A scalable video streaming platform similar to Netflix, built with microservices architecture. Features include video encoding, adaptive bitrate streaming, content management, user subscriptions, recommendation engine, and global CDN integration. Supports multiple video formats and resolutions.',
      technologies: ['Go', 'React', 'FFmpeg', 'Kubernetes', 'Redis', 'PostgreSQL'],
      featured: false,
      category: 'web',
      githubUrl: 'https://github.com/rodrigopk/video-streaming',
      liveUrl: 'https://streamflix.example.com',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800',
      startDate: new Date('2022-08-01'),
      endDate: new Date('2023-01-31'),
      githubStars: 289,
      githubForks: 67,
      lastCommit: new Date('2023-10-22'),
      order: 7,
    },
    {
      title: 'Blockchain Voting System',
      slug: 'blockchain-voting-system',
      description: 'Secure voting system built on blockchain technology',
      longDescription:
        'A transparent and secure voting system leveraging blockchain technology to ensure vote integrity and transparency. Built with Solidity smart contracts and Web3 frontend. Features include voter authentication, anonymous voting, real-time results, and immutable vote records.',
      technologies: ['Solidity', 'Web3.js', 'Ethereum', 'React', 'Truffle', 'MetaMask'],
      featured: false,
      category: 'blockchain',
      githubUrl: 'https://github.com/rodrigopk/blockchain-voting',
      liveUrl: null,
      imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800',
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-01-15'),
      githubStars: 156,
      githubForks: 29,
      lastCommit: new Date('2024-03-01'),
      order: 8,
    },
    {
      title: 'Weather Forecast API',
      slug: 'weather-forecast-api',
      description: 'RESTful API service for weather data and forecasting',
      longDescription:
        'A comprehensive weather API service that aggregates data from multiple weather sources and provides accurate forecasts. Built with Node.js and Express, it features rate limiting, caching, historical weather data, and supports multiple data formats. Includes detailed documentation and SDK for easy integration.',
      technologies: ['Node.js', 'Express', 'MongoDB', 'Redis', 'Docker', 'Swagger'],
      featured: false,
      category: 'backend',
      githubUrl: 'https://github.com/rodrigopk/weather-api',
      liveUrl: 'https://api.weather-forecast.example.com',
      imageUrl: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800',
      startDate: new Date('2023-04-01'),
      endDate: new Date('2023-06-15'),
      githubStars: 78,
      githubForks: 16,
      lastCommit: new Date('2023-12-10'),
      order: 9,
    },
    {
      title: 'Language Learning Game',
      slug: 'language-learning-game',
      description: 'Gamified mobile app for learning foreign languages',
      longDescription:
        'An engaging mobile game that makes language learning fun and interactive. Built with Flutter for cross-platform compatibility. Features include adaptive learning algorithms, speech recognition, progress tracking, multiplayer challenges, and offline mode. Supports multiple languages with native speaker audio.',
      technologies: ['Flutter', 'Dart', 'Firebase', 'TensorFlow Lite', 'SQLite'],
      featured: true,
      category: 'mobile',
      githubUrl: 'https://github.com/rodrigopk/language-game',
      liveUrl: 'https://play.google.com/store/apps/details?id=com.langlearn',
      imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800',
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-11-30'),
      githubStars: 267,
      githubForks: 41,
      lastCommit: new Date('2024-02-15'),
      order: 2,
    },
    {
      title: 'DevOps Monitoring Suite',
      slug: 'devops-monitoring-suite',
      description: 'Comprehensive monitoring and alerting system for DevOps teams',
      longDescription:
        'A complete monitoring solution for DevOps teams featuring infrastructure monitoring, application performance tracking, log aggregation, and intelligent alerting. Built with Go backend and React dashboard. Integrates with popular tools like Prometheus, Grafana, and Kubernetes.',
      technologies: ['Go', 'React', 'Prometheus', 'Grafana', 'Docker', 'Kubernetes'],
      featured: false,
      category: 'devops',
      githubUrl: 'https://github.com/rodrigopk/devops-monitoring',
      liveUrl: null,
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
      startDate: new Date('2022-12-01'),
      endDate: new Date('2023-05-31'),
      githubStars: 145,
      githubForks: 31,
      lastCommit: new Date('2023-11-28'),
      order: 10,
    },
  ];

  console.log('Creating projects...');
  for (const projectData of projects) {
    const project = await prismaTyped.project.upsert({
      where: { slug: projectData.slug },
      update: {},
      create: projectData,
    });
    console.log(`Created project: ${project.title}`);
  }

  console.log('\nSeed data created successfully!');
  console.log(`- 1 Profile created`);
  console.log(`- ${projects.length} Projects created`);
  console.log('\nProject categories:', [...new Set(projects.map((p) => p.category))].join(', '));
  console.log('Featured projects:', projects.filter((p) => p.featured).length);
  console.log(
    'Technologies covered:',
    [...new Set(projects.flatMap((p) => p.technologies))].sort().join(', ')
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
