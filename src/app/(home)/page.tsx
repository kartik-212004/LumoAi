import { ProjectForm } from "@/modules/home/ui/components/project-form";
import ProjectsList from "@/modules/home/ui/components/projects-list";
import Image from "next/image";

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex flex-col max-w-4xl mx-auto w-full px-4">
        {/* Hero Section */}
        <section className="space-y-8 py-20 md:py-32">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <Image
                src="/logo.svg"
                alt="Lumo"
                width={60}
                height={60}
                className="drop-shadow-sm"
              />
            </div>
            
            <div className="text-center space-y-4 max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                Build with Lumo
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
                Create apps and websites by chatting with AI
              </p>
            </div>
            
            <div className="w-full max-w-2xl mt-8">
              <ProjectForm />
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section className="pb-16">
          <ProjectsList />
        </section>
      </div>
    </div>
  );
}
