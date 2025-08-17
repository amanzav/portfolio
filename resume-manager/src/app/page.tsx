'use client';

import Link from 'next/link';
import { useProfilesStore } from '@/lib/store';
import { Plus, FileText, Database, Target, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ModeToggle } from '@/components/mode-toggle';
import { motion } from 'framer-motion';

export default function Page() {
  const { profiles, createProfile, cloneProfile } = useProfilesStore();

  const features = [
    {
      icon: Target,
      title: "Single Source of Truth",
      description: "Centralize all your professional information"
    },
    {
      icon: Zap,
      title: "Multiple Profiles",
      description: "Create targeted resumes for any opportunity"
    },
    {
      icon: Sparkles,
      title: "Export Ready",
      description: "Professional PDFs in seconds"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Simplified Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/5 to-purple-600/8 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-purple-400/6 to-purple-500/4 rounded-full blur-3xl"
          animate={{
            scale: [1, 0.9, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3
          }}
        />
      </div>

      <motion.div 
        className="relative mx-auto p-6 max-w-6xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="space-y-16">
          {/* Hero Section */}
          <motion.section 
            className="text-center space-y-8 py-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Professional Resume Builder
              </span>
            </motion.div>
            
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent">
                  Build Perfect
                </span>
                <br />
                <span className="text-foreground">Resumes</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Create multiple targeted resumes from one comprehensive profile. 
                Manage experiences, projects, and skills efficiently.
              </p>
            </div>

            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-primary hover:opacity-90 transition-opacity text-white shadow-lg hover:shadow-xl"
                  onClick={() => createProfile()}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your Resume
                </Button>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <Button 
                  variant="outline" 
                  size="lg" 
                  asChild
                  className="border-2 hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                >
                  <Link href="/data">
                    <Database className="w-5 h-5 mr-2" />
                    Manage Data
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.section>

          {/* Features Grid */}
          <motion.section 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                className="hover-lift"
              >
                <Card className="glass shadow-glass border-0 text-center h-full">
                  <CardHeader>
                    <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-primary flex items-center justify-center">
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.section>

          {/* Profiles Section */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold text-center mb-3">Your Profiles</h2>
              <p className="text-muted-foreground text-center max-w-2xl mx-auto">
                {profiles.length === 0 
                  ? "Ready to create your first professional resume?" 
                  : `Manage your ${profiles.length} resume profile${profiles.length !== 1 ? 's' : ''}`
                }
              </p>
            </div>

            {profiles.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 1.6 }}
                className="max-w-md mx-auto"
              >
                <Card className="glass shadow-glass border-0 text-center p-8">
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-primary flex items-center justify-center">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">Get Started</h3>
                  <p className="text-muted-foreground mb-6">
                    Create your first resume profile and start building professional resumes.
                  </p>
                  <motion.div 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Button 
                      onClick={() => createProfile()}
                      className="bg-gradient-primary hover:opacity-90 transition-opacity text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Profile
                    </Button>
                  </motion.div>
                </Card>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {profiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 1.6 + index * 0.1 }}
                    className="hover-lift"
                  >
                    <Card className="group glass shadow-glass border-0 hover:shadow-hover transition-all duration-300">
                      <Link href={`/builder/${profile.id}`} className="absolute inset-0 z-10" />
                      <CardHeader className="relative">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-semibold">{profile.name}</CardTitle>
                          <motion.div
                            whileHover={{ rotate: 5, scale: 1.1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <FileText className="text-muted-foreground group-hover:text-purple-600 transition-colors" />
                          </motion.div>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {profile.personalInfo?.summary || 'Click to add a professional summary'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="flex items-center justify-between opacity-0 transition-all duration-300 group-hover:opacity-100">
                          <motion.div 
                            whileHover={{ scale: 1.05 }} 
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                cloneProfile?.(profile.id);
                              }}
                              className="z-20 bg-white/80 dark:bg-black/80 backdrop-blur-sm"
                            >
                              Clone
                            </Button>
                          </motion.div>
                          <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-0">
                            {profile.template || 'classic'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        </div>
        
        {/* Theme Toggle */}
        <motion.div 
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
        >
          <div className="glass rounded-full p-1 shadow-glass">
            <ModeToggle />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}