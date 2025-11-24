// src/App.tsx
import { useEffect, useState } from 'react';
import './App.css';
import { WebContainer } from '@webcontainer/api';
import { getWebContainerInstance } from './Container/webcontainerInstance';
import { WebContainerDemo } from './Container/WebContainerDemo';
function App() {
    const [showWebContainer, setShowWebContainer] = useState(false);
    const [wcInstance, setWcInstance] = useState<WebContainer | null>(null);
    const [bootError, setBootError] = useState<string | null>(null);

    useEffect(() => {
        const initInstance = async () => {
            if (wcInstance) return; // Already have it

            try {
                const wc = await getWebContainerInstance(); // Use singleton—boots only once
                setWcInstance(wc);
            } catch (err: any) {
                setBootError(err.message || 'Failed to initialize WebContainer');
                console.error('WebContainer boot failed:', err);
            }
        };

        initInstance();
    }, [wcInstance]);

    if (bootError) {
        return <div style={{ color: 'red', padding: '2rem' }}>Boot Error: {bootError}</div>;
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>
                    Hello from <span className="highlight">WebContainer</span>
                </h1>

                <p>This React app is running completely in your browser!</p>

                <div className="card">
                    <button
                        onClick={() => setShowWebContainer((prev) => !prev)}
                        style={{ fontSize: '1.4rem', padding: '1rem 2rem' }}
                    >
                        {showWebContainer ? 'Hide WebContainer App' : 'Launch WebContainer App'}
                    </button>
                </div>

                {showWebContainer && wcInstance && (
                    <div style={{ marginTop: '2rem', width: '100%', maxWidth: '900px' }}>
                        <WebContainerDemo wc={wcInstance} />
                    </div>
                )}

                <p className="footer">
                    Built with <strong>Vite + React + TypeScript</strong>
                    <br />
                    Powered by <strong>WebContainer API</strong>
                </p>
            </header>
        </div>
    );
}

export default App;