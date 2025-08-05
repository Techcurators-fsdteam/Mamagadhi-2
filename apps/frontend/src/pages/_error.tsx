export default function Error() {
  return (
    <html>
      <head>
        <title>Error</title>
      </head>
      <body>
        <div style={{ 
          fontFamily: 'system-ui, -apple-system, sans-serif',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa'
        }}>
          <h1 style={{ fontSize: '24px', margin: '0 0 16px 0' }}>
            Something went wrong
          </h1>
          <p style={{ color: '#666', margin: '0 0 24px 0' }}>
            An error occurred while loading this page.
          </p>
        </div>
      </body>
    </html>
  );
}

Error.getInitialProps = () => {
  return {};
};
