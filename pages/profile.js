export default function ProfileRedirect() {
  return null;
}

export function getServerSideProps() {
  return {
    redirect: {
      destination: '/validation',
      permanent: true,
    },
  };
}
