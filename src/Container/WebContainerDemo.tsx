// src/WebContainerDemo.tsx
import { useEffect, useRef, useState } from 'react';
import { WebContainerProcess, WebContainer } from '@webcontainer/api'; // Fixed: Import WebContainerProcess

interface Props {
    wc: WebContainer;
}

export const WebContainerDemo = ({ wc }: Props) => {
    const [iframeUrl, setIframeUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const devProcessRef = useRef<WebContainerProcess | null>(null); // Fixed: Use WebContainerProcess

    useEffect(() => {
        const startGuestApp = async () => {
            try {
                // Define nested FileSystemTree (fixed structure—no slashes in keys)
                const files = {
                    'package.json': {
                        file: {
                            contents: JSON.stringify(
                                {
                                    name: 'wc-guest',
                                    type: 'module',
                                    scripts: { dev: 'vite' },
                                    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
                                    devDependencies: { vite: '^5.4.8', '@vitejs/plugin-react': '^4.3.2' },
                                },
                                null,
                                2
                            ),
                        },
                    },
                    'vite.config.js': {
                        file: {
                            contents: `
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })
              `.trim(),
                        },
                    },
                    'index.html': {
                        file: {
                            contents: `
<!DOCTYPE html><html><body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body></html>
              `.trim(),
                        },
                    },
                    'src': {
                        directory: {
                            'main.jsx': {
                                file: {
                                    contents: `
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
                  `.trim(),
                                },
                            },
                            'App.jsx': {
                                file: {
                                    contents: `
import { useState } from 'react'
export default function App() {
  const [c, setC] = useState(0)
  return (
    <div style={{padding: '40px', fontFamily: 'system-ui', textAlign: 'center', background: '#1a1a1a', color: 'white', minHeight: '100vh'}}>
      <h1>Guest App in WebContainer!</h1>
      <p>React app installed and started in browser.</p>
      <button onClick={() => setC(c => c + 1)} style={{fontSize: '2rem', padding: '1rem 2rem', margin: '2rem'}}>
        Count: {c}
      </button>
      <p>No server needed—pure browser.</p>
    </div>
  )
}
                  `.trim(),
                                },
                            },
                        },
                    },
                };

                // Mount files (using passed wc instance)
                await wc.mount(files);

                // Install dependencies
                const installProcess = await wc.spawn('npm', ['install']);
                const installExit = await installProcess.exit;
                if (installExit !== 0) throw new Error('npm install failed');

                // Start dev server
                devProcessRef.current = await wc.spawn('npm', ['run', 'dev']);

                // Log output (optional)
                devProcessRef.current.output.pipeTo(
                    new WritableStream({
                        write(chunk) {
                            console.log('[WC Guest]:', chunk);
                        },
                    })
                );

                // Wait for server ready
                wc.on('server-ready', (_port: any, url) => {
                    setIframeUrl(url);
                    setLoading(false);
                });

                // Handle dev exit errors
                devProcessRef.current.exit.then((code) => {
                    if (code !== 0) setError(`Dev server exited with code ${code}`);
                });
            } catch (err: any) {
                setError(err.message || 'Failed to start guest app');
                setLoading(false);
            }
        };

        startGuestApp();

        return () => {
            // Kill dev process on unmount (but keep wc alive)
            if (devProcessRef.current) {
                devProcessRef.current.kill();
            }
            // Optional: wc.fs.rm('/') to clear FS if needed, but not necessary
        };
    }, [wc]);

    if (error) {
        return <div style={{ color: 'red', padding: '1rem' }}>Error: {error}</div>;
    }

    if (loading) {
        return (
            <div style={{ padding: '2rem', background: '#000', color: '#0f0', fontFamily: 'monospace', borderRadius: '12px' }}>
                Loading guest app in WebContainer... (10-20s first time)
            </div>
        );
    }

    return iframeUrl ? (
        <iframe
            src={iframeUrl}
            title="WebContainer Guest App"
            style={{ width: '100%', height: '600px', border: '2px solid #333', borderRadius: '12px' }}
            sandbox="allow-scripts allow-same-origin"
        />
    ) : null;
};