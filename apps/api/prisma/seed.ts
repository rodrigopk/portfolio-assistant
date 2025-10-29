import { PrismaClient } from '@prisma/client';

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
      hourlyRate: 120.00,
      resumeUrl: 'https://example.com/resume/rodrigo-vasconcelos.pdf'
    },
  });

  console.log('Profile created:', profile);
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
