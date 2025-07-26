import { Head, Link } from '@inertiajs/react'
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  Code,
  Database,
  FileText,
  FlaskConical,
  GitBranch,
  Globe,
  Lock,
  Puzzle,
  RotateCcw,
  ScrollText,
  Server,
  Settings,
  Shield,
  Terminal,
  TerminalSquare,
  Users,
  Wand2,
  Zap,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

import { Button } from '~/components/ui/core/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '~/components/ui/core/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/core/tabs'

// Animation variants for staggered children
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
    },
  },
}

// Code snippets for the code demonstration section
const codeSnippets = {
  controller: `// UserController.ts - Easily understood by AI
import { HttpContext } from '@adonisjs/core/http'
import UserService from '#services/user_service'

export default class UsersController {
  async store({ request, response }: HttpContext) {
    const userData = request.only(['name', 'email', 'password'])
    const user = await UserService.createUser(userData)
    return response.created(user)
  }
}`,
  service: `// UserService.ts - Strong typing helps AI generate better code
import User from '#models/user'
import type { CreateUserDto } from '#types/dto'

export default class UserService {
  static async createUser(data: CreateUserDto) {
    return await User.create(data)
  }

  static async findUserById(id: number) {
    return await User.findOrFail(id)
  }
}`,
  model: `// User.ts - Clear model definition for AI comprehension
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column({ serializeAs: null })
  declare password: string
}`,
}

export default function Home() {
  const [activeCodeTab, setActiveCodeTab] = useState<'controller' | 'service' | 'model'>(
    'controller'
  )

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">A</span>
              </div>
              <span className="text-lg font-semibold">AdonisKit</span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              <a
                href="#features"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#ai-first"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                AI-First
              </a>
              <a
                href="#tech-stack"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Tech Stack
              </a>
              <a
                href="https://github.com/gabrielmaialva33/base-web-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </nav>

            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" size="sm" className="hidden sm:flex">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5 z-0"></div>

        {/* Animated dots background */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/20 blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"></div>
          <div className="absolute top-2/3 right-1/3 w-64 h-64 rounded-full bg-green-500/10 blur-3xl"></div>
        </div>

        <div className="container mx-auto relative z-10">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center mb-6">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                AI-First Development Framework
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Build Better Apps <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                with AI + AdonisKit
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              A powerful full-stack starter kit engineered for seamless collaboration between
              <span className="text-primary font-medium"> humans and AI </span>
              with enterprise-grade features ready to use.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="gap-2 group">
                  Start Building
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a
                href="https://github.com/gabrielmaialva33/base-web-kit"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button size="lg" variant="outline" className="gap-2">
                  <GitBranch className="size-4" />
                  GitHub
                </Button>
              </a>
            </div>
          </motion.div>

          <motion.div
            className="mt-16 relative max-w-4xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <div className="bg-gradient-to-r from-background/80 to-muted/30 backdrop-blur border rounded-xl p-1 shadow-xl">
              <div className="rounded-lg overflow-hidden border bg-muted/30">
                <div className="flex items-center gap-1.5 bg-background/80 px-3 py-1.5 border-b">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="text-xs text-muted-foreground ml-2">AdonisKit Development</div>
                </div>
                <div className="p-4 font-mono text-xs sm:text-sm text-muted-foreground overflow-hidden">
                  <Tabs
                    value={activeCodeTab}
                    onValueChange={(value) => setActiveCodeTab(value as any)}
                  >
                    <div className="flex items-center mb-4 overflow-auto pb-1">
                      <TabsList className="bg-background/50">
                        <TabsTrigger value="controller">Controller</TabsTrigger>
                        <TabsTrigger value="service">Service</TabsTrigger>
                        <TabsTrigger value="model">Model</TabsTrigger>
                      </TabsList>
                      <div className="ml-auto text-xs opacity-70 px-2">
                        Type-safe full-stack development
                      </div>
                    </div>

                    <TabsContent value="controller" className="mt-0">
                      <pre className="overflow-auto">{codeSnippets.controller}</pre>
                    </TabsContent>
                    <TabsContent value="service" className="mt-0">
                      <pre className="overflow-auto">{codeSnippets.service}</pre>
                    </TabsContent>
                    <TabsContent value="model" className="mt-0">
                      <pre className="overflow-auto">{codeSnippets.model}</pre>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 bg-primary/10 backdrop-blur-sm border border-primary/20 rounded-lg px-3 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-primary h-5 w-5" />
                <span className="text-xs font-medium">AI understands your entire codebase</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI-First Development Section */}
      <section id="ai-first" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">
              What Makes This Starter <span className="text-primary">AI-First</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Designed from the ground up to maximize the effectiveness of AI-assisted development
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              className="space-y-8"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <motion.div variants={itemVariants} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Terminal className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Unified Context (Monorepo)</h3>
                  <p className="text-muted-foreground">
                    Backend and frontend in one repository gives AI tools complete context for
                    generating more accurate and cohesive code.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Strongly-Typed Foundation</h3>
                  <p className="text-muted-foreground">
                    End-to-end TypeScript creates a clear contract between components, reducing
                    ambiguity for AI-generated code.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Puzzle className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Modular Architecture</h3>
                  <p className="text-muted-foreground">
                    Clear separation of concerns makes it easy for AI to locate, understand, and
                    modify specific parts of the codebase.
                  </p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Wand2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Focus on Business Logic</h3>
                  <p className="text-muted-foreground">
                    With boilerplate for auth, permissions, and storage already handled, AI can
                    focus on solving business problems.
                  </p>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-3xl transform rotate-1"></div>
              <div className="relative bg-background/70 backdrop-blur border rounded-3xl p-6 shadow-lg">
                <h3 className="text-lg font-medium mb-6 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  AI-Human Collaboration Flow
                </h3>

                <div className="space-y-6">
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Human defines requirements</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        "Create an analytics dashboard for user activity"
                      </p>
                    </div>
                  </div>

                  <div className="w-0.5 h-6 bg-border mx-auto"></div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-medium">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">AI analyzes the codebase</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Understands models, controllers, services, and frontend components
                      </p>
                    </div>
                  </div>

                  <div className="w-0.5 h-6 bg-border mx-auto"></div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-medium">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">AI generates code</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Creates controllers, services, models, and UI components that follow the
                        project's patterns
                      </p>
                    </div>
                  </div>

                  <div className="w-0.5 h-6 bg-border mx-auto"></div>

                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-medium">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium">Human reviews and refines</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Reviews code, suggests improvements, and AI iterates based on feedback
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Enterprise-Ready Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build production-ready applications quickly
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants}>
              <Card className="border-0 bg-muted/30 shadow-sm hover:shadow-md transition-shadow h-full overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="pb-3">
                  <div className="h-20 w-20 rounded-xl icon-gradient-primary flex items-center justify-center mb-4 shadow-lg border border-primary/20 group-hover:shadow-primary/30 transition-all">
                    <Shield className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <CardTitle>Advanced RBAC</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-sm">
                    Role-based access control with permission inheritance, time-based permissions,
                    and granular access rules.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 bg-muted/30 shadow-sm hover:shadow-md transition-shadow h-full overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="pb-3">
                  <div className="h-20 w-20 rounded-xl icon-gradient-blue flex items-center justify-center mb-4 shadow-lg border border-blue-500/20 group-hover:shadow-blue-500/30 transition-all">
                    <Lock className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <CardTitle>Multi-Auth</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-sm">
                    JWT, API tokens, sessions, and basic auth strategies configured and ready to use
                    out of the box.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 bg-muted/30 shadow-sm hover:shadow-md transition-shadow h-full overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="pb-3">
                  <div className="h-20 w-20 rounded-xl icon-gradient-cyan flex items-center justify-center mb-4 shadow-lg border border-cyan-500/20 group-hover:shadow-cyan-500/30 transition-all">
                    <Database className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <CardTitle>Database Ready</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-sm">
                    PostgreSQL with Lucid ORM, migrations, seeders, and factories pre-configured for
                    rapid development.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 bg-muted/30 shadow-sm hover:shadow-md transition-shadow h-full overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="pb-3">
                  <div className="h-20 w-20 rounded-xl icon-gradient-yellow flex items-center justify-center mb-4 shadow-lg border border-yellow-500/20 group-hover:shadow-yellow-500/30 transition-all">
                    <Zap className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <CardTitle>Lightning Fast</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-sm">
                    Optimized build with Vite, React 19 features, and server-side rendering for
                    maximum performance.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 bg-muted/30 shadow-sm hover:shadow-md transition-shadow h-full overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="pb-3">
                  <div className="h-20 w-20 rounded-xl icon-gradient-blue flex items-center justify-center mb-4 shadow-lg border border-blue-500/20 group-hover:shadow-blue-500/30 transition-all">
                    <FileText className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <CardTitle>File Storage</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-sm">
                    Multi-provider file uploads with S3, Google Cloud Storage, and local storage
                    support built-in.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 bg-muted/30 shadow-sm hover:shadow-md transition-shadow h-full overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="pb-3">
                  <div className="h-20 w-20 rounded-xl icon-gradient-indigo flex items-center justify-center mb-4 shadow-lg border border-blue-600/20 group-hover:shadow-blue-600/30 transition-all">
                    <TerminalSquare className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <CardTitle>TypeScript First</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-sm">
                    Full TypeScript support with type-safe API calls, Inertia props, and end-to-end
                    type safety.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 bg-muted/30 shadow-sm hover:shadow-md transition-shadow h-full overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="pb-3">
                  <div className="h-20 w-20 rounded-xl icon-gradient-green flex items-center justify-center mb-4 shadow-lg border border-green-500/20 group-hover:shadow-green-500/30 transition-all">
                    <Users className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-sm">
                    Complete user CRUD operations with email verification, profile management, and
                    authentication flows.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 bg-muted/30 shadow-sm hover:shadow-md transition-shadow h-full overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="pb-3">
                  <div className="h-20 w-20 rounded-xl icon-gradient-orange flex items-center justify-center mb-4 shadow-lg border border-orange-500/20 group-hover:shadow-orange-500/30 transition-all">
                    <Settings className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <CardTitle>Admin Panel</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-sm">
                    Beautiful UI with dark mode support, responsive design, and interactive
                    components ready to use.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 bg-muted/30 shadow-sm hover:shadow-md transition-shadow h-full overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <CardHeader className="pb-3">
                  <div className="h-20 w-20 rounded-xl icon-gradient-teal flex items-center justify-center mb-4 shadow-lg border border-teal-500/20 group-hover:shadow-teal-500/30 transition-all">
                    <Globe className="h-10 w-10 text-white" strokeWidth={2.5} />
                  </div>
                  <CardTitle>Internationalization</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-muted-foreground text-sm">
                    Built-in i18n support for multi-language applications with easy translation
                    management.
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="tech-stack" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold mb-4">Built with Modern Technologies</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A carefully selected stack of powerful and developer-friendly technologies
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={itemVariants} className="text-center group cursor-pointer">
              <div className="h-28 w-28 bg-muted/50 dark:bg-muted/30 backdrop-blur border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative overflow-hidden group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-violet-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
                <div className="relative z-10 p-4">
                  <img
                    src="https://avatars.githubusercontent.com/u/13810373"
                    alt="AdonisJS"
                    className="h-16 w-16 rounded-lg"
                  />
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                AdonisJS v6
              </h3>
              <p className="text-sm text-muted-foreground">Full-Stack Framework</p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center group cursor-pointer">
              <div className="h-28 w-28 bg-muted/50 dark:bg-muted/30 backdrop-blur border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative overflow-hidden group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
                <div className="relative z-10 p-4">
                  <img
                    src="https://skillicons.dev/icons?i=react"
                    alt="React"
                    className="h-16 w-16"
                  />
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-blue-500 transition-colors">
                React 19
              </h3>
              <p className="text-sm text-muted-foreground">UI Library</p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center group cursor-pointer">
              <div className="h-28 w-28 bg-muted/50 dark:bg-muted/30 backdrop-blur border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative overflow-hidden group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-teal-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-teal-400 to-teal-600 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
                <div className="relative z-10 p-4">
                  <img
                    src="https://avatars.githubusercontent.com/u/47703742"
                    alt="Inertia.js"
                    className="h-16 w-16 rounded-lg border border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-teal-500 transition-colors">
                Inertia.js
              </h3>
              <p className="text-sm text-muted-foreground">SSR Bridge</p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center group cursor-pointer">
              <div className="h-28 w-28 bg-muted/50 dark:bg-muted/30 backdrop-blur border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative overflow-hidden group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-700 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
                <div className="relative z-10 p-4">
                  <img
                    src="https://skillicons.dev/icons?i=typescript"
                    alt="TypeScript"
                    className="h-16 w-16"
                  />
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition-colors">
                TypeScript
              </h3>
              <p className="text-sm text-muted-foreground">Type Safety</p>
            </motion.div>

            <motion.div variants={itemVariants} className="text-center group cursor-pointer">
              <div className="h-28 w-28 bg-muted/50 dark:bg-muted/30 backdrop-blur border border-border rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg relative overflow-hidden group-hover:scale-110 group-hover:shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
                <div className="relative z-10 p-4">
                  <img
                    src="https://skillicons.dev/icons?i=postgresql"
                    alt="PostgreSQL"
                    className="h-16 w-16"
                  />
                </div>
              </div>
              <h3 className="font-bold text-lg mb-1 group-hover:text-cyan-500 transition-colors">
                PostgreSQL
              </h3>
              <p className="text-sm text-muted-foreground">Database</p>
            </motion.div>
          </motion.div>

          {/* Additional Tech Stack */}
          <motion.div
            className="mt-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <p className="text-muted-foreground mb-6">And many more amazing tools...</p>
            <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="h-12 w-12 rounded-lg overflow-hidden shadow-md"
              >
                <img
                  src="https://skillicons.dev/icons?i=vite"
                  alt="Vite"
                  className="h-full w-full"
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="h-12 w-12 rounded-lg overflow-hidden shadow-md"
              >
                <img
                  src="https://skillicons.dev/icons?i=tailwind"
                  alt="Tailwind CSS"
                  className="h-full w-full"
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="h-12 w-12 rounded-lg overflow-hidden shadow-md"
              >
                <img
                  src="https://skillicons.dev/icons?i=redis"
                  alt="Redis"
                  className="h-full w-full"
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="h-12 w-12 rounded-lg overflow-hidden shadow-md"
              >
                <img
                  src="https://skillicons.dev/icons?i=docker"
                  alt="Docker"
                  className="h-full w-full"
                />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="h-12 w-12 rounded-lg overflow-hidden shadow-md"
              >
                <img src="https://skillicons.dev/icons?i=git" alt="Git" className="h-full w-full" />
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="h-12 w-12 rounded-lg overflow-hidden shadow-md"
              >
                <img
                  src="https://skillicons.dev/icons?i=github"
                  alt="GitHub"
                  className="h-full w-full"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-primary/20 to-slate-900">
        {/* Background Effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:30px_30px]"></div>
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-8"
            >
              <span className="px-4 py-2 rounded-full text-sm font-medium bg-primary/20 text-primary border border-primary/30 inline-block">
                Start Building Today
              </span>
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white">
              Ready to Build Something{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                Amazing?
              </span>
            </h2>

            <p className="text-xl mb-10 text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Get started with AdonisKit and launch your next AI-powered project
              <span className="text-white font-medium"> faster than ever before</span>.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-white hover:bg-gray-100 text-slate-900 font-semibold px-8 py-6 text-lg gap-2 shadow-xl"
                  >
                    Create Your Account
                    <ArrowRight className="size-5" />
                  </Button>
                </Link>
              </motion.div>

              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a
                  href="https://github.com/gabrielmaialva33/base-web-kit"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 bg-white/10 backdrop-blur hover:bg-white/20 text-white font-semibold px-8 py-6 text-lg"
                  >
                    <GitBranch className="size-5 mr-2" />
                    Star on GitHub
                  </Button>
                </a>
              </motion.div>
            </div>

            {/* Trust Indicators */}
            <motion.div
              className="mt-16 pt-16 border-t border-white/10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="text-sm text-gray-400 mb-4">Trusted by developers worldwide</p>
              <div className="flex justify-center items-center gap-8 flex-wrap">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">1000+</p>
                  <p className="text-sm text-gray-400">Active Projects</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">50k+</p>
                  <p className="text-sm text-gray-400">Downloads</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">⭐ 4.9</p>
                  <p className="text-sm text-gray-400">GitHub Rating</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">A</span>
              </div>
              <span className="text-lg font-semibold">AdonisKit</span>
            </div>

            <div className="flex flex-col md:flex-row gap-6 md:gap-12 mb-6 md:mb-0 text-center md:text-left">
              <div>
                <h4 className="font-medium mb-2">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="https://adonisjs.com"
                      className="hover:text-foreground transition-colors"
                    >
                      AdonisJS Docs
                    </a>
                  </li>
                  <li>
                    <a href="https://react.dev" className="hover:text-foreground transition-colors">
                      React Docs
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://inertiajs.com"
                      className="hover:text-foreground transition-colors"
                    >
                      Inertia.js
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Community</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="https://github.com/gabrielmaialva33/base-web-kit"
                      className="hover:text-foreground transition-colors"
                    >
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://discord.gg/adonisjs"
                      className="hover:text-foreground transition-colors"
                    >
                      Discord
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://twitter.com/adonisframework"
                      className="hover:text-foreground transition-colors"
                    >
                      Twitter
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>Built with ❤️ using AdonisJS and React. Open source and available on GitHub.</p>
          </div>
        </div>
      </footer>

      <Head title="AdonisKit - AI-First Full-Stack Development" />
    </div>
  )
}
