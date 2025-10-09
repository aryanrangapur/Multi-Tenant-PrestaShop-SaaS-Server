"use client";

import { useState, useEffect } from "react";

// Add this Highlight component
const Highlight = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-yellow-200 text-black px-1 rounded-sm">{children}</span>
);

// Animated loading dots
const LoadingDots = () => (
  <span className="inline-flex space-x-1">
    <span className="animate-bounce">.</span>
    <span className="animate-bounce" style={{ animationDelay: '0.1s' }}>.</span>
    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
  </span>
);

// Copy to clipboard component
const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1 text-sm bg-foreground text-background rounded hover:bg-foreground/90 transition-colors font-medium"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  
  // Progress tracking
  const [progress, setProgress] = useState({
    percent: 0,
    stage: '',
    message: '',
    status: 'idle' // idle, processing, completed, error
  });
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters long";
    }
    if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    }
    if (!/[a-zA-Z]/.test(password)) {
      return "Password must contain at least one letter";
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return "Password must contain at least one special character";
    }
    return "";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordError(validatePassword(newPassword));
  };

  // Reset deployment state when inputs change
  useEffect(() => {
    if ((email || password) && !loading && !result) {
      setError("");
      setTenantId(null);
      setProgress({
        percent: 0,
        stage: '',
        message: '',
        status: 'idle'
      });
      setPollingCount(0);
    }
  }, [email, password, loading, result]);

  // Poll for progress updates
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    if (tenantId && loading) {
      const pollProgress = async () => {
        try {
          console.log(`Polling progress for tenant: ${tenantId}`);
          const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/deployment-status/${tenantId}`);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch progress`);
          }
          
          const data = await response.json();
          console.log('Progress data received:', data);
          
          // Update progress state with received data
          setProgress(prev => ({
            ...prev,
            percent: data.percent !== undefined ? data.percent : prev.percent,
            stage: data.stage || prev.stage,
            message: data.message || prev.message,
            status: data.status || prev.status
          }));

          setPollingCount(prev => prev + 1);

          // If deployment is completed or errored, stop polling
          if (data.status === 'completed' || data.status === 'error') {
            console.log(`Deployment ${data.status}, stopping polling`);
            clearInterval(pollInterval);
            setLoading(false);
            
            if (data.status === 'completed' && data.result) {
              setResult(data.result);
            } else if (data.status === 'error') {
              setError(data.message || 'Deployment failed');
            }
          }
        } catch (err) {
          console.error('Error polling progress:', err);
          setPollingCount(prev => prev + 1);
        }
      };

      // Start polling immediately and then every 2 seconds
      pollProgress();
      pollInterval = setInterval(pollProgress, 2000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [tenantId, loading]);

  // Fallback progress simulation
  useEffect(() => {
    let fallbackInterval: NodeJS.Timeout;

    if (loading && progress.percent === 0 && pollingCount > 2) {
      fallbackInterval = setInterval(() => {
        setProgress(prev => {
          if (prev.percent >= 90 || prev.status === 'completed' || prev.status === 'error') {
            clearInterval(fallbackInterval);
            return prev;
          }
          return {
            ...prev,
            percent: Math.min(prev.percent + 5, 90)
          };
        });
      }, 5000);
    }

    return () => {
      if (fallbackInterval) {
        clearInterval(fallbackInterval);
      }
    };
  }, [loading, progress.percent, pollingCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password before submitting
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    // COMPLETE RESET - Clear all previous deployment data
    setLoading(true);
    setError("");
    setResult(null);
    setPasswordError("");
    setTenantId(null);
    setPollingCount(0);
    setProgress({
      percent: 0,
      stage: 'Starting deployment...',
      message: 'Preparing to create your store',
      status: 'processing'
    });

    try {
      console.log('Sending create-store request...');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/create-store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log('Create-store response:', data);

      if (!res.ok) {
        throw new Error(data.error || "Failed to create store");
      }

      // Store the NEW tenant ID for progress tracking
      if (data.tenant_id) {
        console.log('New Tenant ID received:', data.tenant_id);
        setTenantId(data.tenant_id);
      } else if (data.url) {
        // If we get URLs directly, set as result immediately
        console.log('Store created successfully!');
        setResult({
          url: data.url,
          admin_url: data.admin_url,
          admin_email: data.admin_email,
          admin_password: data.admin_password
        });
        setLoading(false);
      } else {
        throw new Error('No tenant ID or store URLs received from server');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setError(err.message);
      setLoading(false);
      setTenantId(null);
      setProgress({
        percent: 0,
        stage: 'Error',
        message: err.message,
        status: 'error'
      });
    }
  };


  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b border-border py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-serif mb-8 text-balance">
            PrestaShop <Highlight>Multi-Tenant</Highlight> SaaS Platform
          </h1>
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
              maintenance <Highlight>a time-consuming process</Highlight> that limits scalability for businesses wanting to offer e-commerce
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
            <Highlight>fully functional e-commerce instance</Highlight> in <Highlight>under a minute</Highlight>.
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
                  disabled={loading}
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
                  onChange={handlePasswordChange}
                  placeholder="Enter secure password (min 8 chars with letters, numbers & special chars)"
                  className={`w-full px-4 py-3 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                    passwordError ? "border-destructive" : password ? "border-green-500" : "border-border"
                  } ${loading ? 'opacity-50' : ''}`}
                  required
                  disabled={loading}
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-destructive">{passwordError}</p>
                )}
                {!passwordError && password && (
                  <p className="mt-2 text-sm text-green-600">✓ Password meets all security requirements</p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  Must be at least 8 characters with letters, numbers, and special characters
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !!passwordError}
                className="w-full md:w-auto px-8 py-3 bg-foreground text-background font-medium rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Deploying Store...
                  </span>
                ) : (
                  "Deploy Store"
                )}
              </button>
            </form>

            {/* Progress Section */}
            {loading && (
              <div className="mt-8 p-6 bg-muted/30 border border-border rounded-lg">
                <h3 className="text-lg font-medium text-foreground mb-4">
                  Deploying Your Store <LoadingDots />
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-foreground">{progress.stage}</span>
                  </div>

                  <p className="text-sm text-muted-foreground">{progress.message}</p>

                  <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                    <p>This usually takes 1-2 minutes. Please don't close this page.</p>
                    {progress.percent === 0 && pollingCount > 2 && (
                      <p className="text-amber-600 mt-1">
                        If progress stays at 0%, the backend might not be reporting progress correctly.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-8">
              {error && (
                <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-destructive font-medium">Error: {error}</p>
                </div>
              )}

              {result && (
                <div className="space-y-6 p-6 bg-background border border-border rounded-md">
                  <div className="flex items-center text-green-600 mb-2">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-medium text-lg">Store Successfully Deployed!</h3>
                  </div>

                  <div className="grid gap-4 text-sm">
                    {/* Store URL */}
                    <div className="p-4 bg-muted/30 rounded border border-border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="font-medium">Store Frontend</span>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-foreground hover:underline font-medium mt-1"
                          >
                            {result.url}
                          </a>
                          <p className="text-xs text-muted-foreground mt-1">Your live e-commerce store</p>
                        </div>
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 px-3 py-1 bg-foreground text-background rounded text-sm hover:bg-foreground/90 transition-colors font-medium"
                        >
                          Visit
                        </a>
                      </div>
                    </div>

                    {/* Admin URL */}
                    <div className="p-4 bg-muted/30 rounded border border-border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <span className="font-medium">Admin Dashboard</span>
                          <a
                            href={result.admin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-foreground hover:underline font-medium mt-1"
                          >
                            {result.admin_url}
                          </a>
                          <p className="text-xs text-muted-foreground mt-1">Manage your store settings and products</p>
                        </div>
                        <a
                          href={result.admin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-4 px-3 py-1 bg-foreground text-background rounded text-sm hover:bg-foreground/90 transition-colors font-medium"
                        >
                          Login
                        </a>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="p-4 bg-muted/30 rounded border border-border">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-medium">Admin Email</span>
                          <div className="flex items-center mt-1">
                            <span className="text-foreground font-mono">{result.admin_email}</span>
                          </div>
                        </div>
                        <CopyButton text={result.admin_email} label="Email" />
                      </div>
                    </div>

                    {/* Password */}
                    <div className="p-4 bg-muted/30 rounded border border-border">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <span className="font-medium">Admin Password</span>
                          <div className="flex items-center mt-1">
                            <span className="text-foreground font-mono">{result.admin_password}</span>
                          </div>
                        </div>
                        <CopyButton text={result.admin_password} label="Password" />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <button
                        onClick={() => {
                          setResult(null);
                          setEmail("");
                          setPassword("");
                          setTenantId(null);
                          setProgress({
                            percent: 0,
                            stage: '',
                            message: '',
                            status: 'idle'
                          });
                          setPollingCount(0);
                        }}
                        className="px-6 py-2 bg-foreground text-background rounded hover:bg-foreground/90 transition-colors font-medium"
                      >
                        Deploy Another Store
                      </button>

                      <div className="text-xs text-muted-foreground flex-1">
                        <p>Save these credentials in a secure place. You will need them to access your store admin.</p>
                      </div>
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
              <h3 className="text-2xl font-serif mb-4 text-foreground"><Highlight>Containerized Isolation</Highlight></h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Each store runs in its own Docker container with a dedicated MySQL database. This ensures complete data
                isolation, independent scaling, and zero cross-tenant interference. Containers are orchestrated using
                Docker Compose for reliable lifecycle management.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-serif mb-4 text-foreground"><Highlight>Dynamic Port Allocation</Highlight></h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                The system automatically discovers available ports starting from a base port (8081), preventing
                conflicts and enabling unlimited horizontal scaling. Each tenant is assigned a unique port, making the
                platform capable of hosting hundreds of stores on a single server.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-serif mb-4 text-foreground"><Highlight>Automated Provisioning</Highlight></h3>
              <p className="text-lg leading-relaxed text-muted-foreground">
                A Flask backend handles the entire deployment pipeline: generating Docker Compose configurations,
                initializing databases, configuring admin credentials, and health-checking the deployment. What
                traditionally takes hours is completed in under 60 seconds.
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-serif mb-4 text-foreground"><Highlight>Infrastructure as Code</Highlight></h3>
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
