import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
  hasGetInitialProps?: boolean;
}

function Error({ statusCode }: ErrorProps) {
  return (
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
        {statusCode ? `${statusCode} - Server Error` : 'Client Error'}
      </h1>
      <p style={{ color: '#666', margin: 0 }}>
        {statusCode === 404
          ? 'This page could not be found.'
          : 'An error occurred on the server.'
        }
      </p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;
