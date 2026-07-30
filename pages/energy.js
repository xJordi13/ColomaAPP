export default function EnergyRedirect() {
  return null;
}

export function getServerSideProps() {
  return {
    redirect: {
      destination: '/dashboard',
      permanent: true,
    },
  };
}
