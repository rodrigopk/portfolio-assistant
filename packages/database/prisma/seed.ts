import { PrismaClient } from '../src/generated/client/index.js';

const prisma = new PrismaClient();

async function main() {
  // Create a sample profile
  const profile = await prisma.profile.upsert({
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
    // Add more projects as needed for testing...
  ];

  console.log('Creating projects...');
  for (const projectData of projects) {
    const project = await prisma.project.upsert({
      where: { slug: projectData.slug },
      update: {},
      create: projectData,
    });
    console.log(`Created project: ${project.title}`);
  }

  console.log('\nSeed data created successfully!');
  console.log(`- 1 Profile created`);
  console.log(`- ${projects.length} Projects created`);
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