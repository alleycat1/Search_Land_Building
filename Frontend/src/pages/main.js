import Head from 'next/head';

import dynamic from 'next/dynamic';

const MapWithNoSSR = dynamic(() => import('../components/Map'), {
  ssr: false,
});

export default function Home(props) {
  return (
    <div>
      <MapWithNoSSR props={props}/>
    </div>
  );
}



export async function getServerSideProps(context) {
  const res1 = await fetch(`http://localhost:5000/search1?type=1`)
  const data1 = await res1.json();
  const res2 = await fetch(`http://localhost:5000/search1?type=2`)
  const data2 = await res2.json();
  const res4 = await fetch(`http://localhost:5000/search1?type=3`)
  const data4 = await res4.json();
  return {
      props: { 
          prefNames:data1, cityNames:data2, houseTypes:data4,
      }
  }
}
