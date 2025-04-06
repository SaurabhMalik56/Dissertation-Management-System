import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { store } from './app/store';
import App from './App';
import './index.css';

console.log("Main.jsx executing...");

// Create a simpler debug component 
const DebugApp = () => (
  <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
    <h1 style={{ color: '#4f46e5', marginBottom: '1rem' }}>Disserto Debug Mode</h1>
    <p>This is a minimal version to test rendering.</p>
    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
      <a href="/login" style={{ 
        padding: '8px 16px', 
        backgroundColor: '#4f46e5', 
        color: 'white',
        borderRadius: '4px',
        textDecoration: 'none'
      }}>Sign in</a>
      <a href="/register" style={{ 
        padding: '8px 16px', 
        border: '1px solid #4f46e5', 
        color: '#4f46e5',
        borderRadius: '4px',
        textDecoration: 'none'
      }}>Register</a>
    </div>
  </div>
);

// Remove the loading spinner once React takes over
const removeLoadingSpinner = () => {
  const spinner = document.querySelector('.loading-spinner');
  if (spinner) {
    spinner.remove();
  }
};

// Check if root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found');
  document.body.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 2rem; text-align: center;">
      <h1 style="color: #ef4444; margin-bottom: 1rem;">Root Element Missing</h1>
      <p>Could not find element with id "root"</p>
      <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background-color: #4f46e5; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
        Reload Page
      </button>
    </div>
  `;
} else {
  console.log("Root element found, trying to render...");
  try {
    // Check if a root already exists
    let root = rootElement._reactRootContainer;
    if (!root) {
      root = ReactDOM.createRoot(rootElement);
      rootElement._reactRootContainer = root;
      console.log("New root created");
    } else {
      console.log("Using existing root");
    }
    
    const AppWithProviders = () => (
      <React.StrictMode>
        <Provider store={store}>
          <BrowserRouter future={{ v7_startTransition: true }}>
            <App />
            <ToastContainer position="top-right" autoClose={3000} />
          </BrowserRouter>
        </Provider>
      </React.StrictMode>
    );

    root.render(<AppWithProviders />);
    console.log("Render method called successfully");
    
    // Remove loading spinner after rendering
    removeLoadingSpinner();
  } catch (error) {
    console.error('Render error:', error);
    removeLoadingSpinner();
    rootElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; padding: 2rem; text-align: center;">
        <h1 style="color: #ef4444; margin-bottom: 1rem;">Application Error</h1>
        <p>${error?.message || 'An unknown error occurred'}</p>
        <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background-color: #4f46e5; color: white; border: none; border-radius: 0.25rem; cursor: pointer;">
          Reload Page
        </button>
      </div>
    `;
  }
}
