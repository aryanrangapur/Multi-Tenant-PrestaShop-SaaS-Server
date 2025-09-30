"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  setResult(null);

  try {
    const res = await fetch("http://localhost:5000/create-store", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || "Failed to create store");
    }

    setResult(data);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b border-border py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif mb-8 text-balance">PrestaShop Multi-Tenant SaaS Platform</h1>
          <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed text-pretty">
            A scalable infrastructure that dynamically provisions isolated PrestaShop e-commerce instances with
            automated deployment, containerization, and database management.
          </p>
        </div>
      </section>

      {/* What is PrestaShop */}
      <section className="border-b border-border py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-serif mb-8">What is PrestaShop?</h2>
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground">
            <p>
              PrestaShop is an open-source e-commerce platform used by over 300,000 online stores worldwide. It provides
              comprehensive features for product management, payment processing, inventory tracking, and customer
              relationship management.
            </p>
            <p>
              Traditionally, deploying PrestaShop requires manual server configuration, database setup, and ongoing
              maintenance—a time-consuming process that limits scalability for businesses wanting to offer e-commerce
              solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="border-b border-border py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-serif mb-8">Create a Store Instance</h2>
          <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
            Experience the platform by provisioning a new PrestaShop store. Enter admin credentials below to deploy a
            fully functional e-commerce instance in under a minute.
          </p>

          <div className="border border-border rounded-lg p-8 md:p-12 bg-muted/30">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-3">
                  Admin Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-3">
                  Admin Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secure password"
                  className="w-full px-4 py-3 rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-foreground text-background font-medium rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Provisioning..." : "Deploy Store"}
              </button>
            </form>

            <div className="mt-8">
              {error && (
                <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-destructive font-medium">Error: {error}</p>
                </div>
              )}

              {result && (
                <div className="space-y-4 p-6 bg-background border border-border rounded-md">
                  <h3 className="font-medium text-lg text-foreground">Store Successfully Deployed</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Store URL:</span>
                      <a href={result.url} target="_blank" className="block text-foreground hover:underline font-medium mt-1">
                        {result.url}
                      </a>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Admin Panel:</span>
                      <a href={result.admin_url} target="_blank" className="block text-foreground hover:underline font-medium mt-1">
                        {result.admin_url}
                      </a>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <span className="block text-foreground font-medium mt-1">{result.admin_email}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Password:</span>
                      <span className="block text-foreground font-medium mt-1">{result.admin_password}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="border-b border-border py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <span className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
              Technical Architecture
            </span>
          </div>
          <h2 className="text-4xl font-serif mb-8">Multi-Tenant Architecture</h2>
          <div className="space-y-6 text-lg leading-relaxed text-muted-foreground mb-16">
            <p>
              This platform automates the entire deployment lifecycle, enabling instant provisioning of isolated
              PrestaShop instances. Each tenant receives a completely independent environment with dedicated resources,
              ensuring security and performance isolation.
            </p>
          </div>

          <div className="grid gap-16">
            <div>
              <h3 className="text-2xl font-serif mb-4 text-foreground">Containerized Isolation</h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Each store runs in its own Docker container with a dedicated MySQL database. This ensures complete data
                isolation, independent scaling, and zero cross-tenant interference. Containers are orchestrated using
                Docker Compose for reliable lifecycle management.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-serif mb-4 text-foreground">Dynamic Port Allocation</h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                The system automatically discovers available ports starting from a base port (8081), preventing
                conflicts and enabling unlimited horizontal scaling. Each tenant is assigned a unique port, making the
                platform capable of hosting hundreds of stores on a single server.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-serif mb-4 text-foreground">Automated Provisioning</h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                A Flask backend handles the entire deployment pipeline: generating Docker Compose configurations,
                initializing databases, configuring admin credentials, and health-checking the deployment. What
                traditionally takes hours is completed in under 60 seconds.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-serif mb-4 text-foreground">Infrastructure as Code</h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Each tenant's infrastructure is defined as code in dynamically generated docker-compose.yml files. This
                approach ensures reproducibility, version control compatibility, and easy disaster recovery.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-b border-border py-7 px-6">
        <div className="max-w-2xl mx-auto text-center text-sm text-muted-foreground">
            <p>Built by Aryan Rangapur, Making e-commerce simple for everyone</p>
        </div>
      </footer>
    </main>
  );
}