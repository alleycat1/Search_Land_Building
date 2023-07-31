import Head from 'next/head';

import dynamic from 'next/dynamic';

const MapWithNoSSR2 = dynamic(() => import('./test2'), {
  ssr: false,
});

export default function test3() {
  
  return (
    <div>
      <MapWithNoSSR2 />
    </div>
  );
}
