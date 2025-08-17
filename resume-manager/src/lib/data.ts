import type { DataBundle } from './types';

export const data: DataBundle = {
  personalInfo: {
    fullName: 'Aman Zaveri',
    email: 'a2zaveri@uwaterloo.ca',
    phone: '647-676-8981',
    location: 'Toronto, ON',
    linkedin: 'linkedin.com/in/aman-zaveri',
    github: 'github.com/azaveri7',
    website: '',
    summary: ''
  },
  experiences: [
    {
      id: 'ford-se-2025',
      title: 'Software Engineer',
      company: 'Ford Motor Company',
      date: 'May 2025 – Aug 2025',
      bullets: [
        'Spearheaded development of next-gen infotainment features (Trailer Tire Pressure Monitoring System, Gas Genie) in Kotlin/C++, delivering production-ready code for 10M+ vehicles globally.',
        'Enhanced 30+ property data status handler in service APIs, improving accuracy and strengthening reliability across critical subsystems and logging mechanisms.',
        'Built automation workflows with n8n, Python, and GitHub Actions, eliminating 150+ hours of manual work per quarter and enforcing CI/CD quality gates across all pull requests.',
        'Performed real-vehicle validation on Ford’s hybrid/electric fleet, uncovering 10+ high-priority defects and improving infotainment system stability.'
      ],
      tags: ['software', 'embedded', 'ai']
    },
    {
      id: 'ford-wlan-2024',
      title: 'WLAN Software Engineer',
      company: 'Ford Motor Company',
      date: 'Sep 2024 – Dec 2024',
      bullets: [
        'Developed and maintained 50+ automation scripts (Python, C++, Shell) in an Agile environment, integrating with Jenkins CI/CD to validate ECG, FNV2, and FNV4 systems.',
        'Resolved 40+ JIRA tickets per sprint, debugging in Linux with Git, ULT, Diagnostic Engineering Tool, and analyzing CAN/Ethernet network logs.',
        'Implemented Wi‑Fi performance benchmarking using Slash and MQTT, developing 10+ custom test scripts to measure latency, throughput, and signal integrity.'
      ],
      tags: ['networking', 'software']
    },
    {
      id: 'transpire-2024',
      title: 'Software Engineer',
      company: 'Transpire Technologies',
      date: 'Jan 2024 – Apr 2024',
      bullets: [
        'Developed a grade tracking app using Next.js 14, Flask, and Redis, improving performance with caching while optimizing database query execution with indexing strategies in MySQL.',
        'Cut event data collection time by 75% using Selenium and LLM-based event analysis.'
      ],
      tags: ['web', 'data']
    }
  ],
  projects: [
    {
      id: 'course-clutch',
      title: 'Course Clutch',
      link: 'courseclutch.com',
      bullets: [
        'Supports 1,000+ users, streamlining course selection for 80,000+ students.',
        'Reduced operational costs by 90% with Docker, AWS Lambda, and S3 deployment.',
        'Automated course data updates every 10 minutes with FastAPI, Selenium, and PostgreSQL plus Stripe webhooks.'
      ],
      tags: ['web', 'ops']
    },
    {
      id: 'letterly',
      title: 'LLM-Powered Job Application Assistant',
      link: 'github.com/Aman-Zaveri/letterly',
      bullets: [
        'Automated cover letter generation saving users 5+ hours/month with responses in <10 seconds.',
        'Increased ATS success rates by 90% by integrating G4F AI-based job parsing and keyword optimization.',
        'Built a serverless, scalable architecture using AWS Lambda and DynamoDB, processing thousands of requests daily.'
      ],
      tags: ['ai', 'serverless']
    },
    {
      id: 'autonomous-parking',
      title: 'Autonomous Parking System',
      bullets: [
        'Achieved 95% parking pathfinding accuracy via TRPO reinforcement learning (PyBullet, Gym) with LiDAR/OpenCV-based obstacle detection.',
        'Reduced training time by 30% with reward function tuning and episode length reduction.'
      ],
      tags: ['rl', 'robotics']
    }
  ],
  skills: [
    {
      id: 'langs',
      name: 'Languages & Frameworks',
      details: 'Python, C++, JavaScript, TypeScript, Next.js, React, SQL, TensorFlow, PyTorch'
    },
    {
      id: 'tools',
      name: 'Tools & Technologies',
      details: 'AWS, Docker, Git, FastAPI, Flask, Supabase, MySQL, Selenium, Playwright'
    },
    {
      id: 'devops',
      name: 'DevOps & Cloud',
      details: 'CI/CD (Jenkins), Redis, PostgreSQL, MongoDB, SQLite Studio, Vercel'
    }
  ],
  education: [
    {
      id: 'uw-ai',
      title: 'University of Waterloo — BASc in Software and Robotics Engineering, AI Specialization',
      details: 'Expected 2027 (co-op)'
    }
  ]
};